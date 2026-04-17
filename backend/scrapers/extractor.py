"""Heuristic table extraction.

Given a raw HTML table, detect which column means what (vendor, part number,
qty, price, condition, location) by inspecting header labels AND the shape
of the cell data itself. This is not AI — it's deterministic heuristics —
but it survives column reordering and label tweaks, which is what "reliable
scraping" really needs.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Iterable

# Patterns used when header labels don't match — we look at the cell values.
_PRICE_RE = re.compile(r"[$€£¥]\s*\d[\d,]*(?:\.\d+)?|\b(?:USD|EUR|GBP)\b|\bRFQ\b", re.I)
_NSN_RE = re.compile(r"\b\d{4}-\d{2}-\d{3}-\d{4}\b")
_QTY_RE = re.compile(r"^\s*\d{1,6}\s*$")
_CONDITION_CODES = {"NE", "NS", "OH", "SV", "AR", "RP", "FN", "NEW", "USED"}

# Header keyword → canonical field. Lowercased + stripped compared.
_HEADER_MAP: dict[str, str] = {
    "vendor": "vendor",
    "vendor name": "vendor",
    "company": "vendor",
    "seller": "vendor",
    "supplier": "vendor",
    "distributor": "vendor",
    "part": "part_number",
    "part #": "part_number",
    "part number": "part_number",
    "part no": "part_number",
    "part no.": "part_number",
    "p/n": "part_number",
    "pn": "part_number",
    "partno": "part_number",
    "qty": "qty",
    "quantity": "qty",
    "available": "qty",
    "stock": "qty",
    "price": "price",
    "unit price": "price",
    "cost": "price",
    "condition": "condition",
    "cond": "condition",
    "cond.": "condition",
    "location": "location",
    "origin": "location",
    "country": "location",
    "city": "location",
    "description": "description",
    "desc": "description",
    "nsn": "nsn",
    "nsn/niin": "nsn",
    "niin": "nsn",
    "capability": "capability",
}

CANONICAL_FIELDS = [
    "vendor",
    "part_number",
    "nsn",
    "description",
    "qty",
    "price",
    "condition",
    "location",
    "capability",
]


@dataclass
class ExtractedRow:
    vendor: str = ""
    part_number: str = ""
    nsn: str = ""
    description: str = ""
    qty: str = ""
    price: str = ""
    condition: str = ""
    location: str = ""
    capability: str = ""
    raw: list[str] = field(default_factory=list)

    def is_empty(self) -> bool:
        return not any(getattr(self, f) for f in CANONICAL_FIELDS)

    def to_dict(self) -> dict[str, str]:
        d = {f: getattr(self, f) for f in CANONICAL_FIELDS}
        d["raw"] = self.raw
        return d


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def _looks_like_price(cell: str) -> bool:
    return bool(_PRICE_RE.search(cell))


def _looks_like_qty(cell: str) -> bool:
    return bool(_QTY_RE.match(cell)) and cell.strip() != ""


def _looks_like_condition(cell: str) -> bool:
    cell = cell.strip().upper()
    return cell in _CONDITION_CODES


def _looks_like_nsn(cell: str) -> bool:
    return bool(_NSN_RE.search(cell))


def build_column_map(headers: list[str], sample_rows: list[list[str]]) -> dict[int, str]:
    """Return {column_index: canonical_field}.

    Priority:
      1. Header label exact/prefix match.
      2. If header unresolved, inspect sample rows to classify column.
    """
    col_map: dict[int, str] = {}
    used: set[str] = set()

    for idx, raw_header in enumerate(headers):
        h = _clean(raw_header).lower().rstrip(":").strip()
        if h in _HEADER_MAP:
            field_ = _HEADER_MAP[h]
            if field_ not in used:
                col_map[idx] = field_
                used.add(field_)
                continue
        for keyword, field_ in _HEADER_MAP.items():
            if keyword in h and field_ not in used:
                col_map[idx] = field_
                used.add(field_)
                break

    if not sample_rows:
        return col_map

    num_cols = max((len(r) for r in sample_rows), default=0)
    for col_idx in range(num_cols):
        if col_idx in col_map:
            continue
        samples = [r[col_idx] for r in sample_rows if col_idx < len(r)]
        samples = [_clean(s) for s in samples if _clean(s)]
        if not samples:
            continue

        if "price" not in used and sum(_looks_like_price(s) for s in samples) >= max(1, len(samples) // 2):
            col_map[col_idx] = "price"
            used.add("price")
            continue
        if "nsn" not in used and sum(_looks_like_nsn(s) for s in samples) >= max(1, len(samples) // 2):
            col_map[col_idx] = "nsn"
            used.add("nsn")
            continue
        if "condition" not in used and sum(_looks_like_condition(s) for s in samples) >= max(1, len(samples) // 2):
            col_map[col_idx] = "condition"
            used.add("condition")
            continue
        if "qty" not in used and sum(_looks_like_qty(s) for s in samples) >= max(1, len(samples) // 2):
            col_map[col_idx] = "qty"
            used.add("qty")
            continue

    return col_map


def extract_rows(headers: list[str], rows: Iterable[list[str]]) -> list[ExtractedRow]:
    """Main entry. headers + rows of strings → ExtractedRow list.

    Accepts sloppy input — empty rows, ragged lengths, whitespace noise.
    """
    rows_list = [list(r) for r in rows]
    rows_list = [[_clean(c) for c in r] for r in rows_list if any(_clean(c) for c in r)]
    if not rows_list:
        return []

    col_map = build_column_map(headers, rows_list[:10])
    out: list[ExtractedRow] = []
    for r in rows_list:
        er = ExtractedRow(raw=r)
        for idx, cell in enumerate(r):
            field_ = col_map.get(idx)
            if not field_:
                continue
            current = getattr(er, field_)
            if not current and cell:
                setattr(er, field_, cell)
        if not er.is_empty():
            out.append(er)
    return out
