import asyncio
from playwright.async_api import async_playwright

async def run_mcmaster_human_search():
    print("🚀 Starting Human-Like Search on McMaster...")
    async with async_playwright() as p:
        # Actual Chrome channel use karein taake bot detection kam ho
        browser = await p.chromium.launch(headless=False, channel="chrome")
        
        # Ek clean context banayein with a real user agent
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        # Stealth Script taake 'navigator.webdriver' flag hide ho jaye
        await page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        try:
            # STEP 1: Go to Home Page first
            print("👉 Step 1: Loading Home Page...")
            await page.goto("https://www.mcmaster.com/", timeout=60000)
            
            # Wait for 2 seconds like a human reading the page
            await page.wait_for_timeout(2000)

            # STEP 2: Find and CLICK the search bar
            # Aapke previous debug logs ke mutabiq ID 'SrchEntryWebPart_InpBox' hai
            search_selector = "input[name='SrchEntryWebPart_InpBox']"
            print("👉 Step 2: Clicking search box...")
            await page.click(search_selector)

            # STEP 3: TYPE slowly (150ms delay per key)
            part_number = "94850A270"
            print(f"👉 Step 3: Typing {part_number} with human delay...")
            await page.keyboard.type(part_number, delay=150)

            # STEP 4: Press ENTER
            print("👉 Step 4: Pressing Enter to search...")
            await page.keyboard.press("Enter")

            # Wait to see the result
            print("⏳ Waiting for product page to load...")
            await page.wait_for_timeout(5000)

            if "login" in page.url:
                print("❌ Redirected to Login again. IP is likely flagged.")
            else:
                print(f"✅ Success! Current URL: {page.url}")

        except Exception as e:
            print(f"❌ Error: {e}")

        print("\n🛑 Demo Paused. Press ENTER in terminal to close.")
        input()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_mcmaster_human_search())