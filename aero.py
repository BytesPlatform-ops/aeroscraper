#StockMarket.aero

import asyncio
import re
from playwright.async_api import async_playwright

def normalize(text):
    """Part numbers se dashes, spaces aur special characters remove karne ke liye."""
    return re.sub(r'[^a-zA-Z0-9]', '', text).lower()

async def scrape_stockmarket_complete(part_number):
    print(f"🚀 Starting Search for: {part_number}")
    search_term_clean = normalize(part_number)
    
    async with async_playwright() as p:
        # Full Chrome channel use kar rahe hain stealth ke liye
        browser = await p.chromium.launch(headless=False, channel="chrome")
        page = await browser.new_page()
        
        try:
            # 1. Load Home Page
            print("👉 Loading StockMarket.aero...")
            await page.goto("https://www.stockmarket.aero/StockMarket/Welcome.do", timeout=60000)
            
            # 2. Search Execution
            search_input = page.locator("input[name='partNumber'], input#search") 
            await search_input.fill(part_number)
            await page.keyboard.press("Enter")
            
            print("⏳ Waiting for data table to render...")
            # Wait for the results table or the "No results" message
            await page.wait_for_load_state("networkidle")
            await page.wait_for_timeout(3000) # Buffer for JS rendering

            # 3. Targeted Data Extraction
            # Hum sirf un 'tr' (rows) ko target karenge jo 'ExpandAll' table ke andar hain
            rows = await page.locator("tr").all()
            final_results = []

            for row in rows:
                # Sirf un rows ko check karein jin mein data cells (td) hon
                cells = await row.locator("td").all()
                if len(cells) >= 5: # StockMarket table mein typically 5+ columns hote hain
                    row_text = await row.inner_text()
                    
                    # Fuzzy match normalization ke sath
                    if search_term_clean in normalize(row_text):
                        # Data Parsing: Column-wise extraction
                        vendor = (await cells[1].inner_text()).strip()
                        p_number = (await cells[2].inner_text()).strip()
                        qty = (await cells[3].inner_text()).strip()
                        location = (await cells[5].inner_text()).strip() if len(cells) > 5 else "N/A"
                        
                        result_item = {
                            "Vendor": vendor,
                            "Part Number": p_number,
                            "Quantity": qty,
                            "Location": location
                        }
                        final_results.append(result_item)

            # 4. Final Output Display
            if final_results:
                print(f"\n✅ SUCCESS: Found {len(final_results)} matching records:")
                print("-" * 70)
                print(f"{'Vendor Name':<30} | {'Part #':<15} | {'Qty':<6} | {'Location'}")
                print("-" * 70)
                for res in final_results[:10]: # Top 10 results show karein
                    print(f"{res['Vendor'][:28]:<30} | {res['Part Number']:<15} | {res['Quantity']:<6} | {res['Location']}")
            else:
                print(f"❌ No matching results found for '{part_number}' in the results table.")

            print("\n🛑 PROCESS FINISHED. Browser window is open for manual verification.")
            input("👉 Press ENTER in this terminal to close the browser...")
            
            return final_results

        except Exception as e:
            print(f"⚠️ Error during Scraping: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    # Test with your specific part number
    asyncio.run(scrape_stockmarket_complete("30FK1018"))