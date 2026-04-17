'use client';

import { useEffect, useState } from 'react';

export type SourceStatus = 'pending' | 'searching' | 'done' | 'error';

interface SearchProgressProps {
  sourceStatuses: Record<string, SourceStatus>;
  startedAt: number | null;
}

const SOURCE_LABELS: Record<string, string> = {
  stockmarket: 'StockMarket.aero',
  nsn: 'NSN-NOW',
  partsbase: 'Partsbase',
  ebay: 'eBay',
  locatory: 'Locatory',
  mcmaster: 'McMaster-Carr',
  inventory: 'Internal Inventory',
};

export default function SearchProgress({ sourceStatuses, startedAt }: SearchProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.round((Date.now() - startedAt) / 100) / 10);
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startedAt]);

  const sources = Object.entries(sourceStatuses || {});
  if (sources.length === 0) return null;
  const completed = sources.filter(([, s]) => s === 'done' || s === 'error').length;
  const total = sources.length;
  const percent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <h3 className="text-sm font-semibold text-gray-700">Scraping live data</h3>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{completed}/{total} sources done</span>
          <span className="font-mono text-gray-600 tabular-nums">{elapsed.toFixed(1)}s</span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sources.map(([key, status]) => {
          const label = SOURCE_LABELS[key] ?? key;
          return (
            <div
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                status === 'done'
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : status === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              <StatusIcon status={status} />
              <span className="truncate font-medium">{label}</span>
              <span className="ml-auto text-xs opacity-70">
                {status === 'searching' && 'querying live site…'}
                {status === 'done' && 'complete'}
                {status === 'error' && 'failed'}
                {status === 'pending' && 'queued'}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Live web scraping typically takes 5–30 seconds depending on source response time.
      </p>
    </div>
  );
}

function StatusIcon({ status }: { status: SourceStatus }) {
  if (status === 'searching' || status === 'pending') {
    return <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />;
  }
  if (status === 'done') {
    return (
      <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
