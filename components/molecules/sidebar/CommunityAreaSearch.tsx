'use client';

import React, { useState, useMemo } from 'react';

interface CommunityArea {
  the_geom: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][];
  };
  area_numbe: string;
  community: string;
  area_num_1: string;
  shape_area: string;
  shape_len: string;
  perimeter: string;
  area: string;
  comarea: string;
  comarea_id: string;
}

interface CommunityAreaSearchProps {
  communityAreas: CommunityArea[];
  onAreaSelect: (area: CommunityArea) => void;
  selectedArea?: string | null;
}

export const CommunityAreaSearch: React.FC<CommunityAreaSearchProps> = ({
  communityAreas,
  onAreaSelect,
  selectedArea
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter community areas based on search
  const filteredAreas = useMemo(() => {
    if (!searchTerm.trim()) return communityAreas;
    
    const term = searchTerm.toLowerCase();
    return communityAreas.filter(area =>
      area.community.toLowerCase().includes(term) ||
      area.area_numbe.includes(term)
    );
  }, [communityAreas, searchTerm]);

  return (
    <div className="p-4 border-b border-gray-200">
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search communities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Stats */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">
          {filteredAreas.length} of {communityAreas.length} communities
        </span>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Community Areas List */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filteredAreas.map((area) => (
          <button
            key={area.area_numbe}
            onClick={() => onAreaSelect(area)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedArea === area.area_numbe
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">
                  {area.community}
                </div>
                <div className="text-xs text-gray-500">
                  Community Area #{area.area_numbe}
                </div>
              </div>
              {selectedArea === area.area_numbe && (
                <div className="text-blue-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {filteredAreas.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">No communities found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};