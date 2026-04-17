'use client';

export type SourceStatus = 'pending' | 'searching' | 'done' | 'error';

interface SearchProgressProps {
  sourceStatuses: Record<string, SourceStatus>;
}

const SOURCE_LABELS: Record<string, string> = {
  partsbase: 'Partsbase',
  stockmarket: 'StockMarket',
  ebay: 'eBay',
  locatory: 'Locatory',
  mcmaster: 'McMaster-Carr',
  inventory: 'Internal Inventory',
};

export default function SearchProgress({ sourceStatuses }: SearchProgressProps) {
  const sources = Object.entries(sourceStatuses || {});
  const completed = sources.filter(([, status]) => status === 'done' || status === 'error').length;
  const total = sources.length;
  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  if (total === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Search Progress</h3>
        <span className="text-sm text-gray-500">{completed}/{total} complete</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Source Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {sources.map(([key, status]) => {
          const label = SOURCE_LABELS[key] || key;
          return (
            <div
              key={key}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                ${status === 'done' ? 'bg-green-50 text-green-800' : ''}
                ${status === 'searching' ? 'bg-blue-50 text-blue-800' : ''}
                ${status === 'pending' ? 'bg-gray-50 text-gray-500' : ''}
                ${status === 'error' ? 'bg-red-50 text-red-800' : ''}
              `}
            >
              {/* Status Icon */}
              {status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
              )}
              {status === 'searching' && (
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              )}
              {status === 'done' && (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {status === 'error' && (
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              
              <span className="truncate">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
