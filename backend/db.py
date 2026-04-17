"""SQLite cache for scraper results.

Two-part demo value:
  1. Survives page reload — Austin types same part, instant response.
  2. Acts as the "database" deliverable he asked about, without building a
     relational schema yet.
"""
from __future__ import annotations

import json
import sqlite3
import time
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).with_name("cache.db")
TTL_SECONDS = 15 * 60  # 15 min — long enough to survive demo re-runs


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS cache (
            source TEXT NOT NULL,
            query TEXT NOT NULL,
            fetched_at INTEGER NOT NULL,
            payload TEXT NOT NULL,
            PRIMARY KEY (source, query)
        )"""
    )
    return conn


def get(source: str, query: str) -> dict[str, Any] | None:
    with _connect() as c:
        row = c.execute(
            "SELECT fetched_at, payload FROM cache WHERE source=? AND query=?",
            (source, query.upper()),
        ).fetchone()
    if not row:
        return None
    fetched_at, payload = row
    if time.time() - fetched_at > TTL_SECONDS:
        return None
    data = json.loads(payload)
    data["_cached_at"] = fetched_at
    return data


def put(source: str, query: str, payload: dict[str, Any]) -> None:
    with _connect() as c:
        c.execute(
            "REPLACE INTO cache (source, query, fetched_at, payload) VALUES (?,?,?,?)",
            (source, query.upper(), int(time.time()), json.dumps(payload)),
        )


def all_cached() -> list[dict[str, Any]]:
    with _connect() as c:
        rows = c.execute(
            "SELECT source, query, fetched_at FROM cache ORDER BY fetched_at DESC LIMIT 50"
        ).fetchall()
    return [{"source": s, "query": q, "fetched_at": t} for s, q, t in rows]
