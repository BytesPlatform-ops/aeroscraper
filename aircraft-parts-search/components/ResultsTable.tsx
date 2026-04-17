'use client';

import { SearchResult } from '@/lib/types';

interface ResultsTableProps {
  results: Record<string, SearchResult[]>;
}

export default function ResultsTable({ results }: ResultsTableProps) {
  // Sort sources to prioritize Internal Inventory at the top
  const sources = Object.keys(results).sort((a, b) => {
    const aIsInternal = a.toLowerCase().includes('internal inventory');
    const bIsInternal = b.toLowerCase().includes('internal inventory');
    
    if (aIsInternal && !bIsInternal) return -1;
    if (!aIsInternal && bIsInternal) return 1;
    return 0;
  });

  if (sources.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No results found. Try a different search term.
      </div>
    );
  }

  // Helper to check if source is Internal Inventory
  const isInternalInventory = (source: string) => 
    source.toLowerCase().includes('internal inventory');

  return (
    <div className="w-full space-y-8">
      {sources.map((source) => {
        const sourceResults = results[source];
        const isInternal = isInternalInventory(source);
        
        if (sourceResults.length === 0) return null;

        return (
          <section 
            key={source} 
            className={`rounded-lg shadow-md overflow-hidden ${
              isInternal 
                ? 'bg-green-50 border-2 border-green-500' 
                : 'bg-white'
            }`}
          >
            <div className={`px-6 py-4 border-b ${
              isInternal 
                ? 'bg-green-100 border-green-300' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
                {source} Results
                {isInternal && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-600 text-white">
                    ⭐ Preferred Source
                  </span>
                )}
                <span className="ml-auto text-sm font-normal text-gray-500">
                  ({sourceResults.length} {sourceResults.length === 1 ? 'item' : 'items'})
                </span>
              </h2>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Part Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Condition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sourceResults.map((result, index) => (
                    <tr 
                      key={`${result.partNumber}-${index}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.partNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {result.qty > 0 ? result.qty : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getConditionStyle(result.condition)}`}>
                          {result.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {result.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {result.link ? (
                          <a
                            href={result.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {sourceResults.map((result, index) => (
                <div 
                  key={`${result.partNumber}-${index}-mobile`}
                  className="p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900">{result.partNumber}</span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getConditionStyle(result.condition)}`}>
                      {result.condition}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Qty: {result.qty > 0 ? result.qty : 'N/A'}</span>
                    <span>{result.price}</span>
                  </div>
                  {result.link && (
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      View Details →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Returns Tailwind classes for condition badge styling
 */
function getConditionStyle(condition: string): string {
  const condUpper = condition.toUpperCase();
  
  if (condUpper === 'NEW' || condUpper === 'NE' || condUpper === 'NS') {
    return 'bg-green-100 text-green-800';
  }
  if (condUpper === 'OH' || condUpper === 'OVERHAUL' || condUpper === 'OVERHAULED') {
    return 'bg-blue-100 text-blue-800';
  }
  if (condUpper === 'SV' || condUpper === 'SVR' || condUpper === 'SERVICEABLE') {
    return 'bg-yellow-100 text-yellow-800';
  }
  if (condUpper === 'AR' || condUpper === 'AS REMOVED') {
    return 'bg-orange-100 text-orange-800';
  }
  if (condUpper === 'N/A' || condUpper === 'UNKNOWN') {
    return 'bg-gray-100 text-gray-600';
  }
  
  return 'bg-gray-100 text-gray-800';
}
