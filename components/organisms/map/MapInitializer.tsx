'use client';

import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';

const CHICAGO_MAP_CONFIG = {
  center: [41.8781, -87.6298] as [number, number],
  zoom: 11,
  minZoom: 10,
  maxZoom: 20,
  maxBounds: [
    [41.6444, -87.9073], // Southwest
    [42.0677, -87.5044], // Northeast
  ] as [[number, number], [number, number]],
};

interface MapInitializerProps {
  onMapReady: (map: LeafletMap) => void;
  onZoomStart: () => void;
  onZoomEnd: () => void;
  onAreaSelectFromMap?: (areaNumber: string | null) => void;
}

export const MapInitializer: React.FC<MapInitializerProps> = ({
  onMapReady,
  onZoomStart,
  onZoomEnd,
  onAreaSelectFromMap
}) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      console.log('✅ Map initializer - setting up map instance');
      onMapReady(map);
      
      // Set max bounds to restrict panning
      map.setMaxBounds(CHICAGO_MAP_CONFIG.maxBounds);
      
      // Configure zoom and pan constraints
      map.setMinZoom(CHICAGO_MAP_CONFIG.minZoom);
      map.setMaxZoom(CHICAGO_MAP_CONFIG.maxZoom);
      
      // Disable zoom on double click to prevent accidental zooming
      map.doubleClickZoom.disable();
      
      // Enable keyboard navigation
      map.keyboard.enable();
      
      // Smooth zoom animation
      map.options.zoomAnimation = true;
      map.options.markerZoomAnimation = true;
      
      // Track zoom level changes for parks display
      const updateZoomLevel = () => {
        const container = map.getContainer();
        container.setAttribute('data-zoom-level', map.getZoom().toString());
      };
      
      map.on('zoomend', updateZoomLevel);
      updateZoomLevel(); // Initial update
      
      // Zoom transition handling with layer synchronization
      map.on('zoomstart', () => {
        onZoomStart();
        const container = map.getContainer();
        container.classList.add('zoom-transitioning');
      });
      
      map.on('zoomend', () => {
        // Delay state update to ensure smooth transition end
        setTimeout(() => {
          onZoomEnd();
          const container = map.getContainer();
          container.classList.remove('zoom-transitioning');
        }, 100);
      });
      
      // Add click handler for deselecting areas
      const handleMapClick = (e: any) => {
        console.log('🗺️ Map container clicked', e);
        // Only deselect if clicking on the map itself, not on a layer
        if (!e.originalEvent._stopped) {
          console.log('🗺️ Map clicked (not on layer), deselecting area');
          if (onAreaSelectFromMap) {
            onAreaSelectFromMap(null);
          }
        }
      };
      
      map.on('click', handleMapClick);
      
      return () => {
        map.off('click', handleMapClick);
        map.off('zoomend', updateZoomLevel);
      };
    }
  }, [map, onMapReady, onZoomStart, onZoomEnd, onAreaSelectFromMap]);

  return null;
};