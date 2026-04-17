'use client';

import { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const EXAMPLES = [
  { label: 'Part #30FK1018', value: '30FK1018' },
  { label: 'NSN 9905-00-973-0705', value: '9905-00-973-0705' },
];

export default function SearchBar({
  onSearch,
  placeholder = 'Enter part number or NSN…',
  disabled = false,
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const submit = (val: string) => {
    const trimmed = val.trim();
    if (trimmed) onSearch(trimmed);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(query);
  };

  const handleExample = (val: string) => {
    if (disabled) return;
    setQuery(val);
    submit(val);
  };

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:bg-blue-300 disabled:cursor-not-allowed
                     transition-colors duration-200"
        >
          Search
        </button>
      </form>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.value}
            type="button"
            onClick={() => handleExample(ex.value)}
            disabled={disabled}
            className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
