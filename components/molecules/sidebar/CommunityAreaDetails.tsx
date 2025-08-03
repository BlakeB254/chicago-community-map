'use client';

import React from 'react';
import { Park } from '@/types/park';

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

interface CommunityAreaDetailsProps {
  selectedArea: CommunityArea;
  parks: Park[];
  onClose: () => void;
  onZoomToArea?: () => void;
}

export const CommunityAreaDetails: React.FC<CommunityAreaDetailsProps> = ({
  selectedArea,
  parks,
  onClose,
  onZoomToArea
}) => {
  // Filter parks for this community area
  const areaParts = parks.filter(park => 
    park.communityArea === parseInt(selectedArea.area_numbe)
  );

  const areaAcres = selectedArea.shape_area ? 
    (Number(selectedArea.shape_area) / 43560).toFixed(1) : 'N/A';
  
  const perimeterMiles = selectedArea.shape_len ? 
    (Number(selectedArea.shape_len) / 5280).toFixed(2) : 'N/A';

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg max-w-sm m-4">
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100/50">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {selectedArea.community}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Community Area #{selectedArea.area_numbe}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-colors"
            aria-label="Close focus view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Key Statistics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50/50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-medium">Area</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">
              {areaAcres} acres
            </div>
          </div>
          
          <div className="bg-gray-50/50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-medium">Parks 🌳</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">
              {areaParts.length}
            </div>
          </div>
          
          <div className="bg-gray-50/50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-medium">Perimeter</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">
              {perimeterMiles} mi
            </div>
          </div>
          
          <div className="bg-gray-50/50 rounded-lg p-3">
            <div className="text-xs text-gray-600 font-medium">ID</div>
            <div className="text-sm font-semibold text-gray-900 mt-1">
              #{selectedArea.area_numbe}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
            {selectedArea.community} is a vibrant community area offering diverse residential neighborhoods, local businesses, and recreational opportunities.
          </p>
        </div>
      </div>

      {/* Card Actions */}
      <div className="p-4 border-t border-gray-100/50 bg-gray-50/30">
        <div className="flex flex-col gap-2">
          {onZoomToArea && (
            <button
              onClick={onZoomToArea}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Focus Area
            </button>
          )}
          
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(`/explore/${selectedArea.area_numbe}`, '_blank');
              }
            }}
            className="px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Full Details
          </button>
          
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back to Map
          </button>
        </div>
      </div>

      {/* Parks List */}
      {areaParts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <span>🌳</span>
            Parks in {selectedArea.community}
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {areaParts.map((park) => (
              <div key={park.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="font-medium text-sm text-gray-900 mb-1">
                  {park.name}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {park.address}
                </div>
                {park.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {park.amenities.slice(0, 3).map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {park.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{park.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};