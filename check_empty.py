"""Capture what stockmarket.aero returns for a definitely-no-result query."""
import asyncio
from playwright.async_api import async_playwright


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("https://www.stockmarket.aero/StockMarket/Welcome.do", timeout=60000)
        await page.wait_for_load_state("networkidle")

        # Search for something that definitely won't exist
        await page.fill("input[name='partNumber']", "ZZZZZZ-NOTAREALPART-9999")
        await page.keyboard.press("Enter")
        await page.wait_for_load_state("networkidle", timeout=45000)
        await page.wait_for_timeout(4000)

        body = await page.inner_text("body")
        print(f"URL: {page.url}")
        print(f"Body length: {len(body)}")
        print(f"Has 'Vendor Name': {('Vendor Name' in body)}")
        print(f"Body sample (chars 200-1000):")
        print(repr(body[200:1000]))


if __name__ == "__main__":
    asyncio.run(main())
