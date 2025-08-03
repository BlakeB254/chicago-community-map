import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { CommunityAreaSearch } from '../sidebar/CommunityAreaSearch';
import { CommunityAreaDetails } from '../sidebar/CommunityAreaDetails';
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

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  communityAreas: CommunityArea[];
  parks: Park[];
  selectedArea: string | null;
  onAreaSelect: (area: CommunityArea) => void;
  onAreaDeselect: () => void;
  onZoomToArea?: (area: CommunityArea) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  communityAreas,
  parks,
  selectedArea,
  onAreaSelect,
  onAreaDeselect,
  onZoomToArea,
  className = ''
}) => {
  const selectedCommunity = selectedArea ? 
    communityAreas.find(area => area.area_numbe === selectedArea) : null;

  return (
    <>
      {/* Sidebar */}
      <div 
        className={`
          sidebar bg-white shadow-xl border-r border-gray-200 overflow-y-auto transition-transform duration-300 ease-in-out h-full
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
        style={{ width: '400px' }}
      >
        {/* Sidebar Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              🏙️ Chicago Communities
            </h2>
            <p className="text-sm text-gray-600">
              Explore the 77 community areas of Chicago
            </p>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1">
          {selectedCommunity ? (
            <CommunityAreaDetails
              selectedArea={selectedCommunity}
              parks={parks}
              onClose={onAreaDeselect}
              onZoomToArea={() => onZoomToArea?.(selectedCommunity)}
            />
          ) : (
            <CommunityAreaSearch
              communityAreas={communityAreas}
              onAreaSelect={onAreaSelect}
              selectedArea={selectedArea}
            />
          )}
        </div>
      </div>
    </>
  );
};