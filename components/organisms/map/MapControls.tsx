'use client';

import { ZoomIn, ZoomOut, Home } from 'lucide-react';
import L from 'leaflet';

interface MapControlsProps {
  map: L.Map | null;
  className?: string;
}

export function MapControls({ map, className = '' }: MapControlsProps) {
  if (!map) {
    return null;
  }

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleResetView = () => {
    // Chicago center coordinates and initial zoom
    map.setView([41.8781, -87.6298], 11);
  };

  return (
    <div className={`absolute top-4 right-4 z-[1000] flex flex-col gap-2 ${className}`}>
      {/* Zoom controls */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={handleZoomIn}
          className="block w-10 h-10 hover:bg-gray-100 transition-colors border-b border-gray-200 flex items-center justify-center"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="block w-10 h-10 hover:bg-gray-100 transition-colors flex items-center justify-center"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>

      {/* Reset view control */}
      <button
        onClick={handleResetView}
        className="w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
        title="Reset View to Chicago"
      >
        <Home className="h-4 w-4" />
      </button>
    </div>
  );
}