'use client';

import React from 'react';

export const MapLoadingSkeleton: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-gray-50 animate-pulse">
      {/* Map container skeleton */}
      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 relative overflow-hidden">
        
        {/* Animated loading waves */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer transform -skew-x-12"></div>
        </div>
        
        {/* Loading boundaries placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <div className="text-gray-600 text-sm font-medium">
              Loading Chicago Community Areas
            </div>
            <div className="text-gray-400 text-xs">
              Preparing interactive map...
            </div>
          </div>
        </div>
        
        {/* Chicago outline skeleton */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-32 h-40 border-2 border-dashed border-blue-300 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Map controls placeholders */}
        <div className="absolute top-4 right-4 space-y-2">
          <div className="w-8 h-8 bg-white border border-gray-200 rounded shadow-sm animate-pulse"></div>
          <div className="w-8 h-8 bg-white border border-gray-200 rounded shadow-sm animate-pulse"></div>
        </div>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-400 h-1 rounded-full animate-pulse-width"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add custom animations to the CSS
export const MapLoadingStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }
  
  @keyframes pulse-width {
    0%, 100% { width: 20%; }
    50% { width: 80%; }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
  
  .animate-pulse-width {
    animation: pulse-width 2s ease-in-out infinite;
  }
`;