"""stockmarket.aero scraper.

Public search, no login required. Results page contains nested tables: one
outer "summary" row per vendor followed by a "detail" row with description
and condition. We walk rows sequentially, classify each by content shape,
and pair them. Pattern-based classification means a column reorder on their
side does not break extraction — we find the vendor by CAPS letters, the
part number by the alphanumeric pattern, the state by the US state code,
the condition by membership in the known set.
"""
from __future__ import annotations

import logging
import re
from typing import Any

from .base import open_page, with_retries

log = logging.getLogger(__name__)

URL = "https://www.stockmarket.aero/StockMarket/Welcome.do"

CONDITION_CODES = {"NE", "NS", "OH", "SV", "AR", "RP", "FN", "NA", "RE"}
US_STATE_RE = re.compile(r"\b[A-Z]{2}(?:,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?\b")
QTY_RE = re.compile(r"^\d{1,6}$")
PART_RE = re.compile(r"^[A-Z0-9][A-Z0-9\-./]{2,}$", re.I)


class EmptyResultsError(RuntimeError):
    """Server returned search shell with no rendered results — retryable."""


def _split_row(text: str) -> list[str]:
    """Playwright row inner_text → clean cells."""
    normalized = text.replace("\xa0", " ")
    parts = re.split(r"[\t\n]+", normalized)
    return [p.strip() for p in parts if p.strip()]


_NAV_PHRASES = re.compile(
    r"\b(?:profile|my activity|my inventory|about us|additional services|"
    r"featured message|welcome to stockmarket|learn more|aircraft parts emarketplace)\b",
    re.I,
)
_NAV_TOKENS = {"home", "login", "register"}


def _is_nav_row(cells: list[str]) -> bool:
    if len(cells) == 1 and cells[0].strip().lower() in _NAV_TOKENS:
        return True
    joined = " ".join(cells)
    if _NAV_PHRASES.search(joined):
        return True
    return False


def _is_header_row(cells: list[str]) -> bool:
    joined = " ".join(c.lower() for c in cells)
    return "vendor name" in joined or ("part number" in joined and "description" in joined)


def _looks_like_summary(cells: list[str]) -> bool:
    """Summary row: vendor + part + qty + location.

    Normal form is 4 cells: [vendor, part, qty, location].
    Alt form is 5 cells: [vendor, 'Alt', part, qty, location].
    Key signal: last cell has state/country; a cell 1-2 positions before end is
    a numeric qty; first cell is a non-part vendor name.
    """
    if len(cells) not in (4, 5):
        return False
    if not (US_STATE_RE.search(cells[-1]) or "," in cells[-1]):
        return False
    # qty is second-to-last
    if not QTY_RE.match(cells[-2]):
        return False
    if not cells[0] or cells[0].lower().startswith(("send", "part ")):
        return False
    return True


def _summary_fields(cells: list[str]) -> tuple[str, str, str, str]:
    """Pull (vendor, part, qty, location) from 4- or 5-cell summary."""
    if len(cells) == 4:
        return cells[0], cells[1], cells[2], cells[3]
    # 5-cell: [vendor, 'Alt', part, qty, location]
    return cells[0], cells[2], cells[3], cells[4]


def _looks_like_detail(cells: list[str]) -> bool:
    """Detail row contains qty plus at least one of (condition, Send button)."""
    if len(cells) < 4:
        return False
    has_send = any(c.lower() == "send" for c in cells)
    has_qty = any(QTY_RE.match(c) for c in cells)
    has_condition = any(c.upper() in CONDITION_CODES for c in cells)
    return has_qty and (has_send or has_condition)


def _extract_detail_fields(cells: list[str], known_part: str = "") -> dict[str, str]:
    """Pull condition, description, qty from a detail row by pattern.

    Detail row typically reads: [part_number, description, qty, condition, Send, Send].
    Description is the cell that is NOT a part number, NOT numeric qty, NOT a
    condition code, NOT 'Send'. This works even if the columns are reordered.
    """
    out = {"description": "", "condition": "", "qty": ""}
    remaining = [c for c in cells if c.lower() != "send"]
    for c in remaining:
        if not out["condition"] and c.upper() in CONDITION_CODES:
            out["condition"] = c.upper()
        elif not out["qty"] and QTY_RE.match(c):
            out["qty"] = c

    used_values = {out["condition"], out["qty"]}
    for c in remaining:
        if not c or c in used_values:
            continue
        if c.upper() in CONDITION_CODES or QTY_RE.match(c):
            continue
        # Skip anything that looks like a part number — especially the known
        # one from the summary row. Description is the human-readable text.
        norm = c.upper().replace("-", "").replace(" ", "")
        known_norm = known_part.upper().replace("-", "").replace(" ", "") if known_part else ""
        if known_norm and norm == known_norm:
            continue
        if PART_RE.match(c) and not any(ch.islower() for ch in c) and len(c) < 15:
            # Pure-uppercase short alphanumeric = likely another part number
            continue
        if not out["description"]:
            out["description"] = c
            break
    return out


async def _run(part_number: str) -> dict[str, Any]:
    async with open_page(headless=True) as page:
        log.info("stockmarket: loading %s", URL)
        await page.goto(URL, timeout=60_000)
        await page.wait_for_load_state("networkidle")

        await page.fill("input[name='partNumber']", part_number, timeout=15_000)
        await page.keyboard.press("Enter")
        await page.wait_for_load_state("networkidle", timeout=45_000)
        await page.wait_for_timeout(4000)

        rows = await page.locator("tr").all()
        has_results_table = await page.locator("text=Vendor Name").count() > 0
        body_text = (await page.inner_text("body")).lower()
        no_results_text = any(
            phrase in body_text
            for phrase in (
                "search returned '0' results",
                "no matches", "no records", "0 records found", "no items found",
            )
        )
        log.info(
            "stockmarket: url=%s rows=%d header=%s no_results=%s",
            page.url, len(rows), has_results_table, no_results_text,
        )

        # Three states:
        #   1. Results table header present → search executed (may be empty or full)
        #   2. "No results" message present  → legitimate empty match, don't retry
        #   3. Neither                       → page was blocked / rate-limited, retry
        if not has_results_table and not no_results_text:
            raise EmptyResultsError(f"shell-only page ({len(rows)} rows)")
        if no_results_text and not has_results_table:
            log.info("stockmarket: legit empty result for %s", part_number)
            return {"source": "StockMarket.aero", "query": part_number, "results": []}

        all_cells: list[list[str]] = []
        for row in rows:
            cells = _split_row(await row.inner_text())
            if not cells or _is_nav_row(cells) or _is_header_row(cells):
                continue
            all_cells.append(cells)

        return {"source": "StockMarket.aero", "query": part_number,
                "results": _pair_rows(all_cells, part_number, page.url)}


def _pair_rows(all_cells: list[list[str]], query: str, page_url: str) -> list[dict[str, str]]:
    """Walk rows, pair each summary with the nearest following detail row.

    Detail rows are not always immediately after the summary — the site wraps
    the data in nested tables which produce duplicate fragment rows in between.
    We search ahead up to the next summary row.
    """
    # First pass: locate summary indices.
    summary_indices = [i for i, c in enumerate(all_cells) if _looks_like_summary(c)]

    results: list[dict[str, str]] = []
    for idx, s_i in enumerate(summary_indices):
        vendor, part_number, qty, location = _summary_fields(all_cells[s_i])
        next_summary = summary_indices[idx + 1] if idx + 1 < len(summary_indices) else len(all_cells)

        detail = {"description": "", "condition": "", "qty": ""}
        for j in range(s_i + 1, next_summary):
            if _looks_like_detail(all_cells[j]):
                detail = _extract_detail_fields(all_cells[j], known_part=part_number)
                break

        results.append({
            "source": "StockMarket.aero",
            "vendor": vendor,
            "part_number": part_number,
            "description": detail["description"],
            "qty": detail["qty"] or qty,
            "condition": detail["condition"],
            "price": "RFQ",
            "location": location,
            "link": page_url,
        })

    seen: set[tuple[str, str, str]] = set()
    deduped = []
    for r in results:
        key = (r["vendor"], r["part_number"], r["location"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)
    log.info("stockmarket: %d vendors for %s", len(deduped), query)
    return deduped


async def scrape_stockmarket(part_number: str) -> dict[str, Any]:
    return await with_retries(lambda: _run(part_number), attempts=3, label="stockmarket")
