'use client';

import { useState } from 'react';

interface FilterSidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export default function FilterSidebarToggle({ isOpen, onToggle, className = '' }: FilterSidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`fixed top-20 left-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-all duration-200 ${className}`}
      title={isOpen ? 'Hide Filters' : 'Show Filters'}
    >
      <div className="flex items-center space-x-2">
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          {isOpen ? 'Hide' : 'Show'} Filters
        </span>
      </div>
    </button>
  );
}
