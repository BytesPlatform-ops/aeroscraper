'use client';

import { useState, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import SourceSelector from '@/components/SourceSelector';
import SearchProgress, { SourceStatus } from '@/components/SearchProgress';
import ResultsTable from '@/components/ResultsTable';
import { SearchResult } from '@/lib/types';

interface SearchResponse {
  query: string;
  searchTerms: string[];
  results: Record<string, SearchResult[]>;
  totalResults: number;
  elapsedMs?: number;
}

const DEFAULT_SOURCES = {
  stockmarket: true,
  nsn: true,
  partsbase: false,
  ebay: false,
  locatory: false,
  mcmaster: false,
  inventory: false,
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, SearchResult[]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<{
    query: string; terms: string[]; total: number; elapsedMs: number;
  } | null>(null);
  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>(DEFAULT_SOURCES);
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>({});
  const [searchStartedAt, setSearchStartedAt] = useState<number | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    const hasEnabledSource = Object.values(enabledSources).some(Boolean);
    if (!hasEnabledSource) {
      setError('Please select at least one data source');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults(null);
    setSearchInfo(null);
    setSearchStartedAt(Date.now());

    const initialStatuses: Record<string, SourceStatus> = {};
    Object.entries(enabledSources).forEach(([key, enabled]) => {
      if (enabled) initialStatuses[key] = 'searching';
    });
    setSourceStatuses(initialStatuses);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sources: enabledSources }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Search failed with status ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      // Mark each enabled source done or failed based on whether its results appeared.
      const finalStatuses: Record<string, SourceStatus> = {};
      const sourceKeyToLabel: Record<string, string> = {
        stockmarket: 'StockMarket.aero',
        nsn: 'NSN-NOW',
      };
      Object.entries(enabledSources).forEach(([key, enabled]) => {
        if (!enabled) return;
        const label = sourceKeyToLabel[key];
        const sourceArrived = label ? label in data.results : false;
        finalStatuses[key] = sourceArrived ? 'done' : 'error';
      });
      setSourceStatuses(finalStatuses);

      setSearchResults(data.results);
      setSearchInfo({
        query: data.query,
        terms: data.searchTerms,
        total: data.totalResults,
        elapsedMs: data.elapsedMs ?? 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      const errorStatuses: Record<string, SourceStatus> = {};
      Object.entries(enabledSources).forEach(([key, enabled]) => {
        if (enabled) errorStatuses[key] = 'error';
      });
      setSourceStatuses(errorStatuses);
    } finally {
      setIsLoading(false);
    }
  }, [enabledSources]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Aircraft Parts Search</h1>
              <p className="mt-1 text-sm text-gray-500">
                Live scraping across aviation parts marketplaces
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Backend live
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-6">
          <SearchBar onSearch={handleSearch} disabled={isLoading} />
        </div>

        <div className="mb-6">
          <SourceSelector
            sources={enabledSources}
            onChange={setEnabledSources}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Search Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {isLoading && (
          <SearchProgress sourceStatuses={sourceStatuses} startedAt={searchStartedAt} />
        )}

        {searchInfo && !isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Searched for:</span>{' '}
                <span className="font-mono">{searchInfo.query}</span>
              </p>
              <span className="text-xs text-blue-700 font-mono">
                {(searchInfo.elapsedMs / 1000).toFixed(1)}s · {searchInfo.total} results
              </span>
            </div>
            {searchInfo.terms.length > 1 && (
              <p className="text-xs text-blue-600 mt-2">
                <span className="font-medium">Expanded search terms (from NSN-NOW cross-references):</span>{' '}
                <span className="font-mono">{searchInfo.terms.join(', ')}</span>
              </p>
            )}
          </div>
        )}

        {searchResults && !isLoading && <ResultsTable results={searchResults} />}

        {!searchResults && !isLoading && !error && (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Search for Parts</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Enter a part number or NSN. We&apos;ll scrape StockMarket.aero and NSN-NOW in real time
              and return a unified, structured table.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
