"""Quick diagnostic — check what stockmarket.aero and nsn-now.com look like.
Answers: does login wall appear? what selectors actually exist? is there a results table?
"""
import asyncio
from playwright.async_api import async_playwright


async def diagnose_stockmarket():
    print("\n" + "=" * 70)
    print("DIAGNOSING: stockmarket.aero")
    print("=" * 70)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        try:
            await page.goto("https://www.stockmarket.aero/StockMarket/Welcome.do", timeout=60000)
            await page.wait_for_load_state("networkidle", timeout=30000)

            print(f"Final URL: {page.url}")
            print(f"Title: {await page.title()}")

            login_hints = await page.locator(
                "input[type='password'], input[name*='password' i], "
                "input[name*='login' i], a:has-text('Login'), a:has-text('Sign in')"
            ).count()
            print(f"Login-like elements found: {login_hints}")

            search_input_count = await page.locator(
                "input[name='partNumber'], input#search, input[type='search']"
            ).count()
            print(f"Search input candidates: {search_input_count}")

            body_sample = (await page.inner_text("body"))[:500]
            print(f"First 500 chars of body:\n{body_sample!r}")

            try:
                await page.fill("input[name='partNumber']", "30FK1018", timeout=5000)
                await page.keyboard.press("Enter")
                await page.wait_for_load_state("networkidle", timeout=30000)
                print(f"After search URL: {page.url}")
                table_rows = await page.locator("table tr").count()
                print(f"Table rows after search: {table_rows}")
            except Exception as e:
                print(f"Search attempt failed: {e}")

        except Exception as e:
            print(f"Navigation error: {e}")
        finally:
            await browser.close()


async def diagnose_nsn():
    print("\n" + "=" * 70)
    print("DIAGNOSING: nsn-now.com")
    print("=" * 70)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto("https://www.nsn-now.com/Indexing/PublicSearch.aspx", timeout=60000)
            await page.wait_for_load_state("networkidle", timeout=30000)

            print(f"Final URL: {page.url}")
            print(f"Title: {await page.title()}")

            nsn_box = await page.locator("#txtNSNSearch").count()
            part_box = await page.locator("#txtPartNumber").count()
            print(f"#txtNSNSearch exists: {nsn_box}, #txtPartNumber exists: {part_box}")

            try:
                await page.fill("#txtPartNumber", "30FK1018", timeout=5000)
                await page.keyboard.press("Enter")
                await page.wait_for_load_state("networkidle", timeout=30000)
                print(f"After search URL: {page.url}")
                body_text = await page.inner_text("body")
                import re
                nsn_hits = re.findall(r"\d{4}-\d{2}-\d{3}-\d{4}", body_text)
                print(f"NSN patterns found in page: {len(nsn_hits)} (sample: {nsn_hits[:3]})")
                table_rows = await page.locator("table tr").count()
                print(f"Table rows: {table_rows}")
            except Exception as e:
                print(f"Search attempt failed: {e}")

        except Exception as e:
            print(f"Navigation error: {e}")
        finally:
            await browser.close()


async def main():
    await diagnose_stockmarket()
    await diagnose_nsn()


if __name__ == "__main__":
    asyncio.run(main())
