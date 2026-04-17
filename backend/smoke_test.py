"""Quick end-to-end check: both scrapers run, return non-empty results."""
import asyncio
import json
import logging

from scrapers import scrape_stockmarket, scrape_nsn_now

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


async def main():
    print("\n--- stockmarket.aero ---")
    sm = await scrape_stockmarket("30FK1018")
    print(f"count: {len(sm['results'])}")
    for r in sm["results"][:5]:
        print(json.dumps(r, indent=2))

    print("\n--- nsn-now.com (NSN) ---")
    nsn1 = await scrape_nsn_now("9905-00-973-0705")
    print(f"primary: {nsn1.get('primary_description')!r}")
    print(f"related NSNs: {nsn1.get('related_nsns')}")
    for r in nsn1["results"][:5]:
        print(json.dumps(r, indent=2))

    print("\n--- nsn-now.com (part number) ---")
    nsn2 = await scrape_nsn_now("30FK1018")
    print(f"related NSNs: {nsn2.get('related_nsns')}")


if __name__ == "__main__":
    asyncio.run(main())
