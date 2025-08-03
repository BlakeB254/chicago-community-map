'use client';

import { useEffect, useState } from 'react';
import { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import { calculateBoundsFromGeometry } from '@/utils/geoUtils';

const CHICAGO_MAP_CONFIG = {
  center: [41.8781, -87.6298] as [number, number],
  zoom: 11,
};

interface CommunityArea {
  area_numbe: string;
  community: string;
  the_geom: any;
}

export const useMapZoom = (
  mapInstance: LeafletMap | null,
  selectedAreaFromSidebar: string | null,
  communityAreas: CommunityArea[]
) => {
  const [isZoomTransitioning, setIsZoomTransitioning] = useState(false);

  // Stable zoom handling using fitBounds for better synchronization
  useEffect(() => {
    if (selectedAreaFromSidebar && mapInstance && communityAreas.length > 0) {
      console.log('🔍 Zooming to area:', selectedAreaFromSidebar);
      
      const areaData = communityAreas.find(area => area.area_numbe === selectedAreaFromSidebar);
      if (areaData) {
        const bounds = calculateBoundsFromGeometry(areaData.the_geom);
        const leafletBounds = L.latLngBounds(
          [bounds[0], bounds[1]], // SW corner
          [bounds[2], bounds[3]]  // NE corner
        );
        
        setIsZoomTransitioning(true);
        
        // Use fitBounds with smoother animation settings
        mapInstance.fitBounds(leafletBounds, {
          padding: [30, 30], // Reduced padding for closer zoom
          maxZoom: 14, // Increased from 13 to 14 for one level closer
          animate: true,
          duration: 1.0, // Slightly longer for smoother animation
          easeLinearity: 0.25 // More gradual easing curve
        });
        
        // Clear transition state after animation completes
        setTimeout(() => setIsZoomTransitioning(false), 1100);
      }
    } else if (!selectedAreaFromSidebar && mapInstance) {
      // Reset to Chicago overview
      console.log('🌆 Resetting to Chicago overview');
      setIsZoomTransitioning(true);
      
      // Use setView with matching animation settings
      mapInstance.setView(CHICAGO_MAP_CONFIG.center, CHICAGO_MAP_CONFIG.zoom, {
        animate: true,
        duration: 1.0,
        easeLinearity: 0.25
      });
      
      // Clear transition state after animation completes
      setTimeout(() => setIsZoomTransitioning(false), 1100);
    }
  }, [selectedAreaFromSidebar, mapInstance, communityAreas]);

  return {
    isZoomTransitioning,
    setIsZoomTransitioning
  };
};