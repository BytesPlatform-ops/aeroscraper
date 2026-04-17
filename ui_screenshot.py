"""Screenshot the UI with live data for both search types."""
import asyncio
from playwright.async_api import async_playwright


async def run_query(query: str, out_path: str, only: str | None = None):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1400, "height": 1400})
        await page.goto("http://127.0.0.1:3000", timeout=30000)
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_timeout(2000)

        # Optionally disable one source by unchecking it before searching.
        if only == "nsn":
            await page.locator("label:has-text('StockMarket.aero') input[type='checkbox']").click()
        elif only == "stockmarket":
            await page.locator("label:has-text('NSN-NOW') input[type='checkbox']").click()
        await page.wait_for_timeout(500)

        await page.fill("input[type='text'], input[type='search']", query)
        await page.keyboard.press("Enter")

        await page.wait_for_selector("text=Total results", timeout=90000)
        await page.wait_for_timeout(1500)

        await page.screenshot(path=out_path, full_page=True)
        print(f"Saved {out_path}")
        await browser.close()


async def main():
    await run_query("30FK1018", "ui_part_number.png")
    await run_query("9905-00-973-0705", "ui_nsn.png", only="nsn")


if __name__ == "__main__":
    asyncio.run(main())
