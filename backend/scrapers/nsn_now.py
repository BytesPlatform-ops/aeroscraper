"""nsn-now.com scraper.

Public search without login. The site is ASP.NET and postbacks through Enter
work fine for us. It accepts two kinds of input: a full NSN (4-2-3-4 digits)
or a manufacturer part number. We hand it the right box based on the pattern.

Output includes the description (free tier) plus any related NSNs the site
surfaces — which is exactly the "expand one part number into the full family
of cross-references" capability Austin cares about.
"""
from __future__ import annotations

import logging
import re
from typing import Any

from .base import open_page, with_retries

log = logging.getLogger(__name__)

URL = "https://www.nsn-now.com/Indexing/PublicSearch.aspx"
NSN_RE = re.compile(r"\b\d{4}-\d{2}-\d{3}-\d{4}\b")


def _is_nsn(term: str) -> bool:
    return bool(NSN_RE.fullmatch(term.strip()))


async def _run(query: str) -> dict[str, Any]:
    async with open_page(headless=True) as page:
        log.info("nsn-now: loading %s", URL)
        await page.goto(URL, timeout=60_000)
        await page.wait_for_load_state("networkidle")

        if _is_nsn(query):
            await page.fill("#txtNSNSearch", query, timeout=15_000)
        else:
            await page.fill("#txtPartNumber", query, timeout=15_000)
        await page.keyboard.press("Enter")
        await page.wait_for_load_state("networkidle", timeout=45_000)
        await page.wait_for_timeout(4000)

        body = await page.inner_text("body")
        log.info("nsn-now: url=%s body_len=%d", page.url, len(body))

        related_nsns = sorted(set(NSN_RE.findall(body)))
        if _is_nsn(query) and query in related_nsns:
            related_nsns = [query] + [n for n in related_nsns if n != query]

        # Description line: "<NSN>\t<Description>\t<AssignDate>"
        # Reject descriptions that are themselves NSNs or reserved labels.
        primary_description = ""
        description_map: dict[str, str] = {}
        reserved = {"Description", "Detail", "Open Solicitations"}
        for line in body.splitlines():
            parts = [p.strip() for p in line.split("\t") if p.strip()]
            if len(parts) < 2 or not NSN_RE.fullmatch(parts[0]):
                continue
            description = parts[1]
            if description in reserved or NSN_RE.fullmatch(description):
                continue
            description_map[parts[0]] = description

        if _is_nsn(query) and query in description_map:
            primary_description = description_map[query]

        results = []
        for nsn in related_nsns:
            results.append(
                {
                    "source": "NSN-NOW",
                    "nsn": nsn,
                    "description": description_map.get(nsn, ""),
                    "is_primary": nsn == query,
                    "link": page.url,
                }
            )

        log.info("nsn-now: %d NSN matches for %s", len(results), query)
        return {
            "source": "NSN-NOW",
            "query": query,
            "primary_nsn": query if _is_nsn(query) else "",
            "primary_description": primary_description,
            "related_nsns": related_nsns,
            "results": results,
        }


async def scrape_nsn_now(query: str) -> dict[str, Any]:
    return await with_retries(lambda: _run(query), attempts=2, label="nsn-now")
