"""FastAPI wrapper for the scrapers.

Endpoints:
  GET  /health                — liveness
  POST /search                — { query, sources: [stockmarket, nsn] }
  GET  /cache                 — list recent cached queries (DB demo)

The frontend calls /search. Results are cached in SQLite for 15 min so
Austin can rerun the same part during the demo without re-scraping.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scrapers import scrape_nsn_now, scrape_stockmarket
import db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("api")

SUPPORTED_SOURCES = {"stockmarket", "nsn"}

app = FastAPI(title="Aeroscraper API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchRequest(BaseModel):
    query: str
    sources: list[str] | None = None  # defaults to both


class SearchResponse(BaseModel):
    query: str
    elapsed_ms: int
    results: dict[str, Any]


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "sources": sorted(SUPPORTED_SOURCES)}


@app.get("/cache")
async def cache_list() -> dict[str, Any]:
    return {"entries": db.all_cached()}


async def _run_source(name: str, query: str) -> dict[str, Any]:
    cached = db.get(name, query)
    if cached:
        cached["_from_cache"] = True
        return cached
    if name == "stockmarket":
        payload = await scrape_stockmarket(query)
    elif name == "nsn":
        payload = await scrape_nsn_now(query)
    else:
        return {"error": f"unknown source: {name}"}
    payload["_from_cache"] = False
    db.put(name, query, payload)
    return payload


@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest) -> SearchResponse:
    query = req.query.strip()
    requested = [s for s in (req.sources or list(SUPPORTED_SOURCES)) if s in SUPPORTED_SOURCES]
    if not requested:
        requested = list(SUPPORTED_SOURCES)

    log.info("search query=%r sources=%s", query, requested)
    start = time.monotonic()

    coros = [_run_source(name, query) for name in requested]
    outcomes = await asyncio.gather(*coros, return_exceptions=True)

    results: dict[str, Any] = {}
    for name, outcome in zip(requested, outcomes):
        if isinstance(outcome, Exception):
            log.exception("source %s failed", name)
            results[name] = {"error": str(outcome), "results": []}
        else:
            results[name] = outcome

    elapsed_ms = int((time.monotonic() - start) * 1000)
    return SearchResponse(query=query, elapsed_ms=elapsed_ms, results=results)
