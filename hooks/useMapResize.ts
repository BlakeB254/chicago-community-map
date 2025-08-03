'use client';

import { useEffect, useRef } from 'react';
import { Map as LeafletMap } from 'leaflet';

export const useMapResize = (
  mapInstance: LeafletMap | null,
  sidebarOpen: boolean,
  isZoomTransitioning: boolean
) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Handle sidebar resize - proper invalidateSize
  useEffect(() => {
    if (mapInstance) {
      console.log('📏 Sidebar state changed, updating map size...', { sidebarOpen });
      
      // Immediate resize to start the transition
      mapInstance.invalidateSize();
      
      // Additional resize during transition for smoothness
      const timeouts = [
        setTimeout(() => {
          if (mapInstance && !isZoomTransitioning) {
            mapInstance.invalidateSize();
          }
        }, 150),
        setTimeout(() => {
          if (mapInstance && !isZoomTransitioning) {
            mapInstance.invalidateSize();
          }
        }, 300),
      ];
      
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [mapInstance, sidebarOpen, isZoomTransitioning]);

  // Auto-resize map when container size changes
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstance) return;

    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame for smoother animation
      if (!isZoomTransitioning) {
        requestAnimationFrame(() => {
          if (!isZoomTransitioning && mapInstance) {
            console.log('🔄 Container size changed, invalidating map...');
            mapInstance.invalidateSize();
          }
        });
      }
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapInstance, isZoomTransitioning]);

  return {
    mapContainerRef
  };
};