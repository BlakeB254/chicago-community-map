'use client';

import React, { useEffect, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { CommunityArea } from '@/types/communityArea';
import type { Park } from '@/types/park';

interface ParkLayerProps {
  parks: Park[];
  selectedArea?: CommunityArea | null;
  visible?: boolean;
  minZoomLevel?: number;
  maxParksToShow?: number;
}

// Create a custom tree icon for parks
const createTreeIcon = (size: number = 24) => {
  return L.divIcon({
    html: `<div style="font-size: ${size}px;">🌳</div>`,
    className: 'park-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export const ParkLayer: React.FC<ParkLayerProps> = ({
  parks,
  selectedArea,
  visible = true,
  minZoomLevel = 13,
  maxParksToShow = 100
}) => {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [shouldShowParks, setShouldShowParks] = useState(false);

  useEffect(() => {
    if (!map) return;

    const handleZoom = () => {
      const zoom = map.getZoom();
      setCurrentZoom(zoom);
      // Show parks if zoom is sufficient OR if a specific area is selected
      setShouldShowParks(zoom >= minZoomLevel || selectedArea !== null);
    };

    // Set initial state
    handleZoom();

    // Listen for zoom changes
    map.on('zoom', handleZoom);
    map.on('zoomend', handleZoom);

    return () => {
      map.off('zoom', handleZoom);
      map.off('zoomend', handleZoom);
    };
  }, [map, minZoomLevel, selectedArea]);

  // Show parks if zoom is sufficient OR if a specific area is selected
  const shouldDisplay = shouldShowParks || selectedArea;

  if (!visible || !shouldDisplay || !parks || parks.length === 0) {
    return null;
  }

  // Filter parks and validate coordinates
  let filteredParks = parks.filter(park => {
    // Validate coordinates
    if (!park.coordinates || park.coordinates.length !== 2) {
      console.warn('Park has invalid coordinates:', park.name, park.coordinates);
      return false;
    }
    const [lat, lng] = park.coordinates;
    if (isNaN(lat) || isNaN(lng) || lat === undefined || lng === undefined) {
      console.warn('Park has NaN coordinates:', park.name, [lat, lng]);
      return false;
    }
    
    // Filter by community area if selected
    if (selectedArea && park.communityArea !== parseInt(selectedArea.area_numbe)) {
      return false;
    }
    
    return true;
  });

  // Performance optimization: limit parks shown based on zoom level
  if (!selectedArea && filteredParks.length > maxParksToShow) {
    // At lower zoom levels, show larger parks first
    if (currentZoom < 16) {
      filteredParks = filteredParks
        .filter(park => park.size === 'large' || park.size === 'medium')
        .slice(0, maxParksToShow / 2);
    } else {
      // At higher zoom levels, show more parks but still limit total
      filteredParks = filteredParks.slice(0, maxParksToShow);
    }
  }

  // Adjust icon size based on zoom level
  const iconSize = currentZoom >= 16 ? 28 : currentZoom >= 15 ? 24 : 20;

  return (
    <>
      {filteredParks.map((park) => (
        <Marker
          key={park.id}
          position={park.coordinates}
          icon={createTreeIcon(iconSize)}
        >
          <Popup className="park-popup">
            <div className="p-2">
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                🌳 {park.name}
              </h3>
              <p className="text-xs text-gray-600 mb-2">{park.address}</p>
              
              {park.description && (
                <p className="text-xs text-gray-700 mb-2">{park.description}</p>
              )}
              
              {park.amenities && park.amenities.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {park.amenities.slice(0, 5).map((amenity, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                    {park.amenities.length > 5 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        +{park.amenities.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {park.size && (
                <p className="text-xs text-gray-600 mt-2">
                  Size: <span className="font-medium">{park.size}</span>
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Community Area: #{park.communityArea}
              </p>
              
              {currentZoom < minZoomLevel && (
                <p className="text-xs text-orange-600 mt-2 italic">
                  Zoom in to see all parks
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};