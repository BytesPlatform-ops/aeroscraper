"""Run the real stockmarket parser against the saved HTML snapshot.

Lets us iterate while stockmarket.aero is rate-limiting us. The snapshot was
captured by debug_stockmarket.py and lives at ../stockmarket_debug.html.
"""
import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).parent))

from scrapers.stockmarket import (
    _split_row, _is_nav_row, _is_header_row, _pair_rows,
)


async def main():
    snapshot = Path(__file__).resolve().parents[1] / "stockmarket_debug.html"
    html = snapshot.read_text(encoding="utf-8")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_content(html)

        rows = await page.locator("tr").all()
        print(f"<tr> in snapshot: {len(rows)}")

        all_cells: list[list[str]] = []
        for row in rows:
            cells = _split_row(await row.inner_text())
            if not cells or _is_nav_row(cells) or _is_header_row(cells):
                continue
            all_cells.append(cells)

        print(f"Candidate rows after filter: {len(all_cells)}")
        for i, c in enumerate(all_cells):
            print(f"  [{i}] {c}")

        results = _pair_rows(all_cells, "30FK1018", "https://example/snapshot")
        print(f"\nFinal deduped results: {len(results)}")
        for r in results:
            print(json.dumps(r, indent=2))

        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
