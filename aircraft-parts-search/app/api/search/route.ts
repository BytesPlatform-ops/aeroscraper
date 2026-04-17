import { NextRequest, NextResponse } from 'next/server';
import { SearchResult } from '@/lib/types';

/**
 * POST /api/search
 *
 * Thin proxy to the FastAPI scraper backend. The backend actually hits
 * stockmarket.aero and nsn-now.com in real time; this route shapes the
 * response to match what the UI expects.
 *
 * Request:  { query: string, sources?: { stockmarket?: boolean, nsn?: boolean } }
 * Response: { query, searchTerms, results: Record<string, SearchResult[]>, totalResults }
 */

const BACKEND_URL = process.env.AEROSCRAPER_BACKEND_URL ?? 'http://127.0.0.1:8787';

type StockmarketRecord = {
  source: string;
  vendor: string;
  part_number: string;
  description: string;
  qty: string;
  condition: string;
  price: string;
  location: string;
  link: string;
};

type NsnRecord = {
  source: string;
  nsn: string;
  description: string;
  is_primary: boolean;
  link: string;
};

type BackendResponse = {
  query: string;
  elapsed_ms: number;
  results: Record<
    string,
    {
      source?: string;
      query?: string;
      _from_cache?: boolean;
      primary_nsn?: string;
      primary_description?: string;
      related_nsns?: string[];
      results: StockmarketRecord[] | NsnRecord[];
      error?: string;
    }
  >;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query: string = (body?.query ?? '').trim();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const sourceFlags = body?.sources ?? {};
    const sources: string[] = [];
    if (sourceFlags.stockmarket !== false) sources.push('stockmarket');
    if (sourceFlags.nsn !== false) sources.push('nsn');

    const backendRes = await fetch(`${BACKEND_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sources }),
      cache: 'no-store',
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: `Backend returned ${backendRes.status}` },
        { status: 502 },
      );
    }

    const backend: BackendResponse = await backendRes.json();

    const results: Record<string, SearchResult[]> = {};
    const searchTerms = new Set<string>([query]);

    const stockmarket = backend.results.stockmarket;
    if (stockmarket && !stockmarket.error) {
      const records = (stockmarket.results as StockmarketRecord[]) ?? [];
      results['StockMarket.aero'] = records.map((r) => ({
        partNumber: r.part_number,
        source: r.vendor || 'StockMarket.aero',
        qty: r.qty || 'N/A',
        condition: r.condition || 'N/A',
        price: r.price || 'RFQ',
        link: r.link,
        vendor: r.vendor,
        description: r.description,
        location: r.location,
      }));
    }

    const nsn = backend.results.nsn;
    if (nsn && !nsn.error) {
      const records = (nsn.results as NsnRecord[]) ?? [];
      (nsn.related_nsns ?? []).forEach((n) => searchTerms.add(n));
      results['NSN-NOW'] = records.map((r) => ({
        partNumber: r.nsn,
        source: r.is_primary ? 'NSN-NOW (primary)' : 'NSN-NOW (related)',
        qty: 'N/A',
        condition: '—',
        price: 'Subscribe for price',
        link: r.link,
        nsn: r.nsn,
        description: r.description || (r.is_primary ? nsn.primary_description ?? '' : ''),
        isPrimary: r.is_primary,
      }));
    }

    const totalResults = Object.values(results).reduce((acc, arr) => acc + arr.length, 0);

    return NextResponse.json({
      query,
      searchTerms: Array.from(searchTerms),
      results,
      totalResults,
      elapsedMs: backend.elapsed_ms,
    });
  } catch (err) {
    console.error('search proxy error', err);
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
