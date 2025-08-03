'use client';

import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { ParkLayer } from './ParkLayer';
import type { CommunityArea } from '@/types/communityArea';
import type { Park } from '@/types/park';

interface MapLayerManagerProps {
  communityAreas: CommunityArea[];
  selectedArea?: CommunityArea | null;
  hoveredArea?: CommunityArea | null;
  viewMode?: 'normal' | 'zoomed' | 'fullpage';
  onLocationUpdate?: (entityId: string, coordinates: [number, number], communityArea: CommunityArea) => void;
}

export const MapLayerManager: React.FC<MapLayerManagerProps> = ({
  communityAreas,
  selectedArea,
  hoveredArea,
  viewMode = 'normal',
  onLocationUpdate
}) => {
  const map = useMap();
  const [parks, setParks] = useState<Park[]>([]);
  const [loadingParks, setLoadingParks] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  // Load parks data
  useEffect(() => {
    const loadParks = async () => {
      if (loadingParks) return;
      
      setLoadingParks(true);
      try {
        // Import the chicagoParkService instance
        const { chicagoParkService } = await import('@/services/chicagoParkService');
        const parksData = await chicagoParkService.getAllParks();
        setParks(parksData);
      } catch (error) {
        console.error('Error loading parks:', error);
        // Fallback to empty parks array
        setParks([]);
      } finally {
        setLoadingParks(false);
      }
    };

    loadParks();
  }, [loadingParks]);

  // Track zoom level
  useEffect(() => {
    if (!map) return;

    const handleZoomEnd = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);
    
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // Determine which layers should be visible
  const shouldShowParks = currentZoom >= 13 || selectedArea !== null || viewMode === 'zoomed';

  return (
    <>
      {/* Park Layer */}
      {shouldShowParks && parks.length > 0 && (
        <ParkLayer
          parks={parks}
          selectedArea={selectedArea}
          visible={true}
          minZoomLevel={13}
          maxParksToShow={100}
        />
      )}
      
      {/* Future layers can be added here */}
      {/* <LandmarkLayer ... /> */}
      {/* <RoadLayer ... /> */}
      {/* <EntityLayer ... /> */}
    </>
  );
};