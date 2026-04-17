'use client';

interface SourceSelectorProps {
  sources: Record<string, boolean>;
  onChange: (sources: Record<string, boolean>) => void;
  disabled?: boolean;
}

const SOURCE_INFO: Record<string, { label: string; color: string }> = {
  partsbase: { label: 'Partsbase', color: 'blue' },
  stockmarket: { label: 'StockMarket', color: 'purple' },
  ebay: { label: 'eBay', color: 'yellow' },
  locatory: { label: 'Locatory', color: 'cyan' },
  mcmaster: { label: 'McMaster-Carr', color: 'orange' },
  inventory: { label: 'Internal Inventory', color: 'green' },
};

export default function SourceSelector({ sources, onChange, disabled = false }: SourceSelectorProps) {
  const toggleSource = (key: string) => {
    if (disabled) return;
    onChange({
      ...sources,
      [key]: !sources[key],
    });
  };

  const toggleAll = (enabled: boolean) => {
    if (disabled) return;
    const newSources: Record<string, boolean> = {};
    Object.keys(sources).forEach(key => {
      newSources[key] = enabled;
    });
    onChange(newSources);
  };

  const enabledCount = Object.values(sources).filter(Boolean).length;
  const totalCount = Object.keys(sources).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Data Sources</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleAll(true)}
            disabled={disabled || enabledCount === totalCount}
            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded disabled:text-gray-400 disabled:hover:bg-transparent"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            disabled={disabled || enabledCount === 0}
            className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded disabled:text-gray-400 disabled:hover:bg-transparent"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {Object.entries(sources).map(([key, enabled]) => {
          const info = SOURCE_INFO[key] || { label: key, color: 'gray' };
          return (
            <label
              key={key}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}
                ${enabled 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white'
                }
              `}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => toggleSource(key)}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:cursor-not-allowed"
              />
              <span className={`text-sm ${enabled ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                {info.label}
              </span>
            </label>
          );
        })}
      </div>
      
      <p className="mt-2 text-xs text-gray-500">
        {enabledCount} of {totalCount} sources selected
      </p>
    </div>
  );
}
