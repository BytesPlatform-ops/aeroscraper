'use client';

import { SearchResult } from '@/lib/types';

interface ResultsTableProps {
  results: Record<string, SearchResult[]>;
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const sources = Object.keys(results);

  if (sources.length === 0 || sources.every((s) => results[s].length === 0)) {
    return (
      <div className="text-center py-12 text-gray-500">
        No results found. Try a different part number or NSN.
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {sources.map((source) => {
        const sourceResults = results[source];
        if (sourceResults.length === 0) return null;
        const isNsn = source.toUpperCase().includes('NSN');
        return isNsn ? (
          <NsnSection key={source} source={source} rows={sourceResults} />
        ) : (
          <StockmarketSection key={source} source={source} rows={sourceResults} />
        );
      })}
    </div>
  );
}

function SectionShell({
  source,
  count,
  children,
}: {
  source: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg shadow-md overflow-hidden bg-white">
      <div className="px-6 py-4 border-b bg-gray-50 border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
          {source}
          <span className="ml-auto text-sm font-normal text-gray-500">
            ({count} {count === 1 ? 'result' : 'results'})
          </span>
        </h2>
      </div>
      {children}
    </section>
  );
}

function StockmarketSection({ source, rows }: { source: string; rows: SearchResult[] }) {
  return (
    <SectionShell source={source} count={rows.length}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <Th>Vendor</Th>
              <Th>Part #</Th>
              <Th>Description</Th>
              <Th>Qty</Th>
              <Th>Condition</Th>
              <Th>Location</Th>
              <Th>Price</Th>
              <Th>Link</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((r, i) => (
              <tr key={`${r.vendor ?? r.source}-${i}`} className="hover:bg-gray-50">
                <Td className="font-medium">{r.vendor ?? r.source}</Td>
                <Td>{r.partNumber}</Td>
                <Td className="text-gray-600">{r.description || '—'}</Td>
                <Td>{String(r.qty)}</Td>
                <Td>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getConditionStyle(r.condition)}`}>
                    {r.condition || '—'}
                  </span>
                </Td>
                <Td className="text-gray-600">{r.location ?? '—'}</Td>
                <Td>{r.price}</Td>
                <Td>
                  {r.link ? (
                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionShell>
  );
}

function NsnSection({ source, rows }: { source: string; rows: SearchResult[] }) {
  const primary = rows.find((r) => r.isPrimary);
  const others = rows.filter((r) => !r.isPrimary);
  return (
    <SectionShell source={source} count={rows.length}>
      {primary && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
            Primary NSN
          </p>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-mono font-semibold text-gray-900">{primary.nsn ?? primary.partNumber}</p>
              <p className="text-sm text-gray-700 mt-1">{primary.description || 'No description available'}</p>
            </div>
            <NsnLinks nsn={primary.nsn ?? primary.partNumber} sourceLink={primary.link} />
          </div>
        </div>
      )}
      {others.length > 0 && (
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            {primary ? `Related NSNs (${others.length})` : `Matched NSNs (${others.length})`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {others.map((r, i) => (
              <div key={i} className="px-3 py-2 rounded border border-gray-200 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-gray-900">{r.nsn ?? r.partNumber}</p>
                    {r.description && <p className="text-xs text-gray-500 mt-1">{r.description}</p>}
                  </div>
                  <NsnLinks nsn={r.nsn ?? r.partNumber} sourceLink={r.link} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SectionShell>
  );
}

function NsnLinks({ nsn, sourceLink, compact = false }: { nsn: string; sourceLink: string; compact?: boolean }) {
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent('NSN ' + nsn)}`;
  const cls = compact ? 'text-xs text-blue-600 hover:underline whitespace-nowrap' : 'text-sm text-blue-600 hover:underline';
  return (
    <div className={`flex ${compact ? 'flex-col items-end' : 'flex-row gap-3'} shrink-0`}>
      <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={cls}>
        Search web
      </a>
      {sourceLink && (
        <a href={sourceLink} target="_blank" rel="noopener noreferrer" className={cls}>
          NSN-NOW
        </a>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 ${className}`}>{children}</td>;
}

function getConditionStyle(condition: string): string {
  const c = (condition || '').toUpperCase();
  if (['NEW', 'NE', 'NS'].includes(c)) return 'bg-green-100 text-green-800';
  if (['OH', 'OVERHAUL', 'OVERHAULED'].includes(c)) return 'bg-blue-100 text-blue-800';
  if (['SV', 'SERVICEABLE'].includes(c)) return 'bg-yellow-100 text-yellow-800';
  if (['AR', 'AS REMOVED'].includes(c)) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-600';
}
