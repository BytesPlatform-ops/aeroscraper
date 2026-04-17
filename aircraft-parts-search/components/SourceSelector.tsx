'use client';

interface SourceSelectorProps {
  sources: Record<string, boolean>;
  onChange: (sources: Record<string, boolean>) => void;
  disabled?: boolean;
}

const ACTIVE_SOURCES = new Set(['stockmarket', 'nsn']);

const SOURCE_INFO: Record<string, { label: string; note?: string }> = {
  stockmarket: { label: 'StockMarket.aero' },
  nsn: { label: 'NSN-NOW' },
  partsbase: { label: 'Partsbase', note: 'Phase 2' },
  ebay: { label: 'eBay', note: 'Phase 2' },
  locatory: { label: 'Locatory', note: 'Phase 2' },
  mcmaster: { label: 'McMaster-Carr', note: 'Phase 2' },
  inventory: { label: 'Internal Inventory', note: 'Phase 2' },
};

export default function SourceSelector({ sources, onChange, disabled = false }: SourceSelectorProps) {
  const toggleSource = (key: string) => {
    if (disabled || !ACTIVE_SOURCES.has(key)) return;
    onChange({ ...sources, [key]: !sources[key] });
  };

  const activeKeys = Object.keys(sources).filter((k) => ACTIVE_SOURCES.has(k));
  const phase2Keys = Object.keys(sources).filter((k) => !ACTIVE_SOURCES.has(k));
  const enabledCount = activeKeys.filter((k) => sources[k]).length;

  const renderCard = (key: string) => {
    const info = SOURCE_INFO[key] ?? { label: key };
    const isActive = ACTIVE_SOURCES.has(key);
    const isChecked = isActive && !!sources[key];
    return (
      <label
        key={key}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          disabled || !isActive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50'
        } ${isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => toggleSource(key)}
          disabled={disabled || !isActive}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:cursor-not-allowed"
        />
        <div className="flex flex-col">
          <span className={`text-sm ${isChecked ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
            {info.label}
          </span>
          {info.note && (
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">{info.note}</span>
          )}
        </div>
      </label>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Data Sources</h3>
        <span className="text-xs text-gray-500">
          {enabledCount} of {activeKeys.length} live sources
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {activeKeys.map(renderCard)}
        {phase2Keys.map(renderCard)}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Phase 2 sources plug into the same scraper engine — enabled after the engagement starts.
      </p>
    </div>
  );
}
