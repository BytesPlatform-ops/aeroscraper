"""Debug stockmarket.aero search — compare diagnostic behavior to scraper."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from scrapers.base import open_page


async def main():
    async with open_page(headless=True) as page:
        await page.goto("https://www.stockmarket.aero/StockMarket/Welcome.do", timeout=60000)
        await page.wait_for_load_state("networkidle")

        await page.fill("input[name='partNumber']", "30FK1018")
        await page.keyboard.press("Enter")
        await page.wait_for_load_state("networkidle", timeout=45_000)
        await page.wait_for_timeout(5000)

        print(f"URL: {page.url}")
        print(f"Title: {await page.title()}")

        tables = await page.locator("table").count()
        all_trs = await page.locator("tr").count()
        print(f"tables={tables}, total <tr>={all_trs}")

        for i in range(min(tables, 30)):
            rc = await page.locator("table").nth(i).locator("tr").count()
            sample = ""
            if rc > 0:
                sample = (await page.locator("table").nth(i).locator("tr").first.inner_text())[:150]
            print(f"  table[{i}] rows={rc} sample={sample!r}")

        await page.screenshot(path="stockmarket_debug.png", full_page=True)
        print("Screenshot: stockmarket_debug.png")

        html = await page.content()
        Path("stockmarket_debug.html").write_text(html, encoding="utf-8")
        print("HTML: stockmarket_debug.html")


if __name__ == "__main__":
    asyncio.run(main())
