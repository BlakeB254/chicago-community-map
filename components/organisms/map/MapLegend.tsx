'use client';

interface CommunityArea {
  area_numbe: string;
  community: string;
}

interface MapLegendProps {
  sidebarOpen: boolean;
  communityAreas: CommunityArea[];
  className?: string;
}

export function MapLegend({ 
  sidebarOpen, 
  communityAreas, 
  className = '' 
}: MapLegendProps) {
  return (
    <div className={`absolute bottom-4 left-4 z-[1000] bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300 ${
      sidebarOpen ? 'p-4' : 'p-6 min-w-80'
    } ${className}`}>
      <h3 className="font-semibold text-gray-900 mb-2">
        {sidebarOpen ? 'Chicago Communities' : 'Chicago Community Areas'}
      </h3>
      <div className="text-sm text-gray-600">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-3 border border-gray-600 bg-blue-500" style={{ opacity: 0.4 }}></div>
          <span>Community Areas ({communityAreas.length} total)</span>
        </div>
        {!sidebarOpen && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-3 border-2 border-blue-800 bg-blue-500" style={{ opacity: 0.7 }}></div>
              <span className="text-sm">Selected area</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-3 border-2 border-gray-800 bg-blue-400" style={{ opacity: 0.6 }}></div>
              <span className="text-sm">Hovered area</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-0 border-t-2 border-dashed border-blue-700"></div>
              <span className="text-sm">City Boundary</span>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              <strong>Interactions:</strong>
              <br />• Click areas to select & view details
              <br />• Hover for quick area information
              <br />• Drag to pan around Chicago
              <br />• Scroll wheel to zoom in/out
            </div>
          </>
        )}
        {sidebarOpen && (
          <div className="text-xs text-gray-500 mt-2">
            Click areas on the map to explore Chicago's neighborhoods
          </div>
        )}
      </div>
    </div>
  );
}