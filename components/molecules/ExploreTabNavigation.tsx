import React from 'react';

interface ExploreTabNavigationProps {
  activeTab: 'overview' | 'businesses' | 'events' | 'parks';
  onTabChange: (tab: 'overview' | 'businesses' | 'events' | 'parks') => void;
  counts: {
    businesses: number;
    events: number;
    parks: number;
  };
}

export function ExploreTabNavigation({ activeTab, onTabChange, counts }: ExploreTabNavigationProps) {
  const tabs = [
    { key: 'overview' as const, label: 'Overview', count: null, icon: '🏠' },
    { key: 'businesses' as const, label: 'Businesses', count: counts.businesses, icon: '🏢' },
    { key: 'events' as const, label: 'Events', count: counts.events, icon: '📅' },
    { key: 'parks' as const, label: 'Parks', count: counts.parks, icon: '🏞️' }
  ];

  const handleTabClick = (tabKey: typeof activeTab) => {
    onTabChange(tabKey);
    
    // Update URL to reflect tab change without causing a page reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tabKey === 'overview') {
        url.search = '';
        url.hash = '';
      } else {
        url.searchParams.set('tab', tabKey);
        url.hash = '';
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 py-1 px-2 text-xs rounded-full ${
                  activeTab === tab.key 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}