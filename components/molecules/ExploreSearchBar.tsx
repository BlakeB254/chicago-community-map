import React from 'react';

interface ExploreSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  activeTab: string;
}

export function ExploreSearchBar({ 
  searchTerm, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange,
  activeTab 
}: ExploreSearchBarProps) {
  const getPlaceholderText = () => {
    switch (activeTab) {
      case 'businesses':
        return 'Search businesses...';
      case 'parks':
        return 'Search parks and amenities...';
      case 'events':
        return 'Search events...';
      default:
        return 'Search businesses, parks, events...';
    }
  };

  const getCategoryOptions = () => {
    if (activeTab === 'businesses') {
      return [
        { value: 'all', label: 'All Categories' },
        { value: 'food-beverage', label: 'Food & Beverage' },
        { value: 'retail', label: 'Retail' },
        { value: 'services', label: 'Services' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'education', label: 'Education' },
      ];
    } else if (activeTab === 'events') {
      return [
        { value: 'all', label: 'All Categories' },
        { value: 'community', label: 'Community' },
        { value: 'cultural', label: 'Cultural' },
        { value: 'recreational', label: 'Recreational' },
        { value: 'educational', label: 'Educational' },
        { value: 'government', label: 'Government' },
      ];
    }
    return [
      { value: 'all', label: 'All Categories' }
    ];
  };

  const shouldShowFilters = activeTab !== 'overview';

  if (!shouldShowFilters) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={getPlaceholderText()}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {getCategoryOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}