#nsn
import asyncio
import re
from playwright.async_api import async_playwright

async def run_niin_test():
    # Adding the specific NIIN you mentioned to the list
    test_parts = ["30FK1018", "9905-00-973-0705"]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        for search_term in test_parts:
            print(f"\n🚀 SEARCHING: {search_term}")
            print("-" * 30)
            
            try:
                await page.goto(f"https://www.nsn-now.com/Indexing/PublicSearch.aspx", timeout=60000)
                
                # Check if the input is an NSN/NIIN or a Part Number
                # NSN-NOW has two separate boxes; we need to pick the right one
                if re.match(r"\d{4}-\d{2}-\d{3}-\d{4}", search_term):
                    print("   👉 Input recognized as NSN/NIIN. Using left box...")
                    await page.fill("#txtNSNSearch", search_term)
                else:
                    print("   👉 Input recognized as Part Number. Using right box...")
                    await page.fill("#txtPartNumber", search_term)
                
                await page.keyboard.press("Enter")
                await page.wait_for_load_state("networkidle")
                
                body_text = await page.inner_text("body")
                
                # Extract all unique NSN/NIIN patterns found on the results page
                all_matches = re.findall(r"\d{4}-\d{2}-\d{3}-\d{4}", body_text)
                
                # Deduplicate and remove the search term itself if it's in the results
                expanded_set = set(all_matches)
                expanded_set.add(search_term)
                
                final_list = list(expanded_set)

                print(f"✅ SUCCESS: Found {len(final_list)} unique identifiers.")
                print(f"✅ EXPANDED LIST: {final_list}")

            except Exception as e:
                print(f"⚠️ Error: {e}")
            
            await page.wait_for_timeout(2000)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_niin_test())