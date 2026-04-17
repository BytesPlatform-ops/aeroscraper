'use client';

import { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = 'Enter part number...', 
  disabled = false 
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      onSearch(trimmedQuery);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl gap-3">
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
  );
}
