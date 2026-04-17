"""Deeper diagnostic — what's actually in the result rows?"""
import asyncio
import re
from playwright.async_api import async_playwright


async def deep_stockmarket():
    print("\n" + "=" * 70)
    print("STOCKMARKET.AERO — deep inspection")
    print("=" * 70)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        await page.goto("https://www.stockmarket.aero/StockMarket/Welcome.do", timeout=60000)
        await page.wait_for_load_state("networkidle")

        await page.fill("input[name='partNumber']", "30FK1018")
        await page.keyboard.press("Enter")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(4000)

        print(f"URL: {page.url}")
        print(f"Title: {await page.title()}")

        tables = await page.locator("table").count()
        print(f"Total tables: {tables}")

        for i in range(tables):
            rows = await page.locator(f"table").nth(i).locator("tr").count()
            first_row_text = ""
            if rows > 0:
                first_row_text = (await page.locator("table").nth(i).locator("tr").first.inner_text())[:200]
            print(f"  Table {i}: {rows} rows | first row: {first_row_text!r}")

        print("\nAll rows globally:")
        rows = await page.locator("tr").all()
        for i, row in enumerate(rows[:15]):
            text = (await row.inner_text())[:250]
            print(f"  row {i}: {text!r}")


async def deep_nsn():
    print("\n" + "=" * 70)
    print("NSN-NOW.COM — deep inspection with real NSN and postback handling")
    print("=" * 70)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("https://www.nsn-now.com/Indexing/PublicSearch.aspx", timeout=60000)
        await page.wait_for_load_state("networkidle")

        buttons = await page.locator("input[type='submit'], button, input[type='button']").all()
        print(f"Submit/button elements: {len(buttons)}")
        for b in buttons[:10]:
            val = await b.get_attribute("value")
            id_ = await b.get_attribute("id")
            print(f"  id={id_!r} value={val!r}")

        print("\nTrying a real NSN: 9905-00-973-0705")
        await page.fill("#txtNSNSearch", "9905-00-973-0705")

        clicked = False
        for sel in [
            "#btnNSNSearch", "input[id*='NSN'][type='submit']",
            "input[type='submit'][value*='Search' i]",
            "input[type='submit']",
        ]:
            try:
                if await page.locator(sel).count():
                    await page.locator(sel).first.click()
                    print(f"Clicked: {sel}")
                    clicked = True
                    break
            except Exception as e:
                print(f"  click {sel} failed: {e}")

        if not clicked:
            print("No button clicked — pressing Enter")
            await page.keyboard.press("Enter")

        await page.wait_for_load_state("networkidle", timeout=30000)
        await page.wait_for_timeout(4000)

        print(f"URL after search: {page.url}")
        body = await page.inner_text("body")
        print(f"Body length: {len(body)}")
        nsn_hits = re.findall(r"\d{4}-\d{2}-\d{3}-\d{4}", body)
        print(f"NSN patterns: {len(nsn_hits)} unique: {len(set(nsn_hits))}")
        print(f"Sample: {list(set(nsn_hits))[:5]}")
        print(f"Body first 600 chars: {body[:600]!r}")

        tables = await page.locator("table").count()
        print(f"Tables on page: {tables}")


async def main():
    await deep_stockmarket()
    await deep_nsn()


if __name__ == "__main__":
    asyncio.run(main())
