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
}

const DEFAULT_SOURCES = {
  partsbase: true,
  stockmarket: true,
  ebay: true,
  locatory: true,
  mcmaster: true,
  inventory: true,
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, SearchResult[]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<{ query: string; terms: string[]; total: number } | null>(null);
  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>(DEFAULT_SOURCES);
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>({});

  const handleSearch = useCallback(async (query: string) => {
    // Check if at least one source is enabled
    const hasEnabledSource = Object.values(enabledSources).some(Boolean);
    if (!hasEnabledSource) {
      setError('Please select at least one data source');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResults(null);
    setSearchInfo(null);

    // Initialize source statuses
    const initialStatuses: Record<string, SourceStatus> = {};
    Object.entries(enabledSources).forEach(([key, enabled]) => {
      if (enabled) {
        initialStatuses[key] = 'searching';
      }
    });
    setSourceStatuses(initialStatuses);

    // Simulate individual source progress updates
    const sourceKeys = Object.keys(initialStatuses);
    const delays = [200, 350, 400, 450, 500, 600];
    
    sourceKeys.forEach((key, index) => {
      setTimeout(() => {
        setSourceStatuses(prev => ({
          ...prev,
          [key]: 'done'
        }));
      }, delays[index % delays.length]);
    });

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, sources: enabledSources }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Search failed with status ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      
      // Mark all as done
      const finalStatuses: Record<string, SourceStatus> = {};
      Object.entries(enabledSources).forEach(([key, enabled]) => {
        if (enabled) {
          finalStatuses[key] = 'done';
        }
      });
      setSourceStatuses(finalStatuses);
      
      setSearchResults(data.results);
      setSearchInfo({
        query: data.query,
        terms: data.searchTerms,
        total: data.totalResults,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      
      // Mark sources as error
      const errorStatuses: Record<string, SourceStatus> = {};
      Object.entries(enabledSources).forEach(([key, enabled]) => {
        if (enabled) {
          errorStatuses[key] = 'error';
        }
      });
      setSourceStatuses(errorStatuses);
    } finally {
      setIsLoading(false);
    }
  }, [enabledSources]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Aircraft Parts Search
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Search across multiple sources for aircraft parts
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Section */}
        <div className="flex justify-center mb-6">
          <SearchBar onSearch={handleSearch} disabled={isLoading} />
        </div>
        
        {/* Source Selection */}
        <div className="mb-6">
          <SourceSelector 
            sources={enabledSources} 
            onChange={setEnabledSources}
            disabled={isLoading}
          />
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Search Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Search Progress */}
        {isLoading && (
          <SearchProgress 
            sources={sourceStatuses} 
            isSearching={isLoading}
          />
        )}

        {/* Search Info */}
        {searchInfo && !isLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Searched for:</span> {searchInfo.query}
            </p>
            {searchInfo.terms.length > 1 && (
              <p className="text-sm text-blue-600 mt-1">
                <span className="font-medium">Expanded terms:</span> {searchInfo.terms.join(', ')}
              </p>
            )}
            <p className="text-sm text-blue-600 mt-1">
              <span className="font-medium">Total results:</span> {searchInfo.total}
            </p>
          </div>
        )}

        {/* Results */}
        {searchResults && !isLoading && (
          <ResultsTable results={searchResults} />
        )}

        {/* Initial State */}
        {!searchResults && !isLoading && !error && (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Search for Parts</h3>
            <p className="mt-2 text-gray-500">
              Enter a part number to search across Partsbase, eBay, StockMarket, McMaster-Carr, and your internal inventory.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
