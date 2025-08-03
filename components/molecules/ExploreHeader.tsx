import React from 'react';
import { useRouter } from 'next/navigation';

interface ExploreHeaderProps {
  communityName: string;
  areaNumber: string;
}

export function ExploreHeader({ communityName, areaNumber }: ExploreHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-160 flex items-center gap-2"
              aria-label="Back to main map"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline text-gray-700">Back to Map</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {communityName}
              </h1>
              <p className="text-sm text-gray-600">
                Community Area #{areaNumber}
              </p>
            </div>
          </div>
          
          {/* Add export/share buttons in the future */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}