"""Shared Playwright utilities: browser lifecycle, retries.

Stealth is optional and gated by env var AEROSCRAPER_STEALTH=1. Both target
sites (stockmarket.aero, nsn-now.com) don't need stealth — diagnostic runs
without it successfully. We keep the hook available for sites that do.
"""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import Awaitable, Callable, TypeVar

from playwright.async_api import Browser, BrowserContext, Page, async_playwright

log = logging.getLogger(__name__)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
)

_STEALTH_INIT = """
// Lightweight anti-detection: hide navigator.webdriver and normalize a few
// surface-level signals bot detectors look at.
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4,5] });
"""


@asynccontextmanager
async def open_page(*, headless: bool = True):
    async with async_playwright() as p:
        browser: Browser = await p.chromium.launch(headless=headless)
        try:
            context: BrowserContext = await browser.new_context(
                user_agent=USER_AGENT,
                viewport={"width": 1366, "height": 800},
                locale="en-US",
            )
            # Stealth OFF by default. stockmarket.aero does reverse-detection:
            # when it sees tampered navigator signatures it silently returns an
            # empty results page. Enable only for sites that demand it.
            if os.getenv("AEROSCRAPER_STEALTH", "0") == "1":
                await context.add_init_script(_STEALTH_INIT)
            page: Page = await context.new_page()
            try:
                yield page
            finally:
                await context.close()
        finally:
            await browser.close()


T = TypeVar("T")


async def with_retries(
    fn: Callable[[], Awaitable[T]],
    *,
    attempts: int = 3,
    base_delay: float = 1.5,
    label: str = "task",
) -> T:
    last_exc: Exception | None = None
    for i in range(1, attempts + 1):
        try:
            return await fn()
        except Exception as exc:
            last_exc = exc
            log.warning("[%s] attempt %d/%d failed: %s", label, i, attempts, exc)
            if i < attempts:
                await asyncio.sleep(base_delay * (2 ** (i - 1)))
    assert last_exc is not None
    raise last_exc
