'use client';

import React, { useCallback, useState, useRef, useEffect, memo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import our organized components
import { MapLegend } from './MapLegend';
import { MapControls } from './MapControls';
import { CommunityBaseLayer } from './CommunityBaseLayer';
import { MapLayerManager } from './MapLayerManager';
import { MapInitializer } from './MapInitializer';
import { calculateBoundsFromGeometry, calculateCentroidFromGeometry } from '@/utils/geoUtils';

// Import custom hooks
import { useMapData } from '@/hooks/useMapData';
import { useMapZoom } from '@/hooks/useMapZoom';
import { useMapResize } from '@/hooks/useMapResize';
import { useMapCleanup } from '@/hooks/useMapCleanup';

// Fix Leaflet default markers
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

// Stable map configuration - matches working original exactly
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

interface ChicagoMapProps {
  sidebarOpen?: boolean;
  selectedAreaFromSidebar?: string | null;
  onAreaSelectFromMap?: (areaNumber: string | null) => void;
}

export const ChicagoMap = memo(function ChicagoMap({ 
  sidebarOpen = true, 
  selectedAreaFromSidebar = null,
  onAreaSelectFromMap
}: ChicagoMapProps) {
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(CHICAGO_MAP_CONFIG.zoom);
  const [mapReady, setMapReady] = useState(false);
  
  // Create a stable reference for the map container that won't change
  const mapContainerKey = useRef(`chicago-map-${Math.random().toString(36).substr(2, 9)}`);
  
  // Prevent reinitialization by checking if map is already mounted
  const [hasMapMounted, setHasMapMounted] = useState(false);
  
  useEffect(() => {
    if (!hasMapMounted) {
      setHasMapMounted(true);
    }
  }, [hasMapMounted]);

  // Load map data using custom hook
  const { communityAreas, parks, dataLoaded, mapError } = useMapData();

  // Use custom hooks for map functionality
  const { isZoomTransitioning, setIsZoomTransitioning } = useMapZoom(
    mapInstance, 
    selectedAreaFromSidebar, 
    communityAreas
  );
  
  const { mapContainerRef } = useMapResize(mapInstance, sidebarOpen, isZoomTransitioning);
  
  useMapCleanup(mapInstance);

  // Event handlers
  const handleAreaClick = useCallback((areaNumber: string) => {
    console.log('🖱️ ChicagoMap handleAreaClick called with:', areaNumber);
    if (onAreaSelectFromMap) {
      onAreaSelectFromMap(areaNumber);
    }
  }, [onAreaSelectFromMap]);

  const handleAreaHover = useCallback((area: any) => {
    console.log('👆 Area hover:', area?.areaNumber);
  }, []);

  // Map initialization handlers
  const handleMapReady = useCallback((map: LeafletMap) => {
    setMapInstance(map);
    setMapReady(true);
    setCurrentZoom(map.getZoom());
  }, []);

  const handleZoomStart = useCallback(() => {
    setIsZoomTransitioning(true);
  }, [setIsZoomTransitioning]);

  const handleZoomEnd = useCallback(() => {
    setIsZoomTransitioning(false);
  }, [setIsZoomTransitioning]);

  // Clean up any existing map instances on unmount
  useEffect(() => {
    return () => {
      if (mapContainerRef.current) {
        // Clear any existing Leaflet map instances
        const container = mapContainerRef.current;
        if ((container as any)._leaflet_id) {
          delete (container as any)._leaflet_id;
        }
      }
    };
  }, []);

  return (
    <div ref={mapContainerRef} className="absolute inset-0 w-full h-full">
      {/* React Leaflet Map Container */}
      <MapContainer
        key={mapContainerKey.current}
        center={CHICAGO_MAP_CONFIG.center}
        zoom={CHICAGO_MAP_CONFIG.zoom}
        minZoom={CHICAGO_MAP_CONFIG.minZoom}
        maxZoom={CHICAGO_MAP_CONFIG.maxZoom}
        maxBounds={CHICAGO_MAP_CONFIG.maxBounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
        preferCanvas={true}
        doubleClickZoom={false}
        keyboard={true}
        zoomAnimation={true}
        fadeAnimation={true}
        markerZoomAnimation={true}
        touchZoom={true}
        scrollWheelZoom={true}
        boxZoom={false}
      >
        {/* Map Initializer */}
        <MapInitializer
          onMapReady={handleMapReady}
          onZoomStart={handleZoomStart}
          onZoomEnd={handleZoomEnd}
          onAreaSelectFromMap={onAreaSelectFromMap}
        />
        
        {/* Tile Layer - CartoDB Light like reference project */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={CHICAGO_MAP_CONFIG.maxZoom}
        />
        
        {/* Community boundaries as base layer */}
        <CommunityBaseLayer
          communityAreas={communityAreas.map(area => ({
            areaNumber: parseInt(area.area_numbe),
            communityName: area.community,
            geometry: area.the_geom,
            bounds: calculateBoundsFromGeometry(area.the_geom),
            centroid: calculateCentroidFromGeometry(area.the_geom)
          }))}
          selectedArea={selectedAreaFromSidebar ? (() => {
            const selectedCommunity = communityAreas.find(a => a.area_numbe === selectedAreaFromSidebar);
            return selectedCommunity ? {
              areaNumber: parseInt(selectedCommunity.area_numbe),
              communityName: selectedCommunity.community,
              geometry: selectedCommunity.the_geom,
              bounds: calculateBoundsFromGeometry(selectedCommunity.the_geom),
              centroid: calculateCentroidFromGeometry(selectedCommunity.the_geom)
            } : null;
          })() : null}
          hoveredArea={null}
          onAreaClick={(area) => handleAreaClick(area.areaNumber.toString())}
          onAreaMouseOver={handleAreaHover}
          onAreaMouseOut={() => {}}
        />

        {/* Enhanced map layer management */}
        {mapInstance && (
          <MapLayerManager
            communityAreas={communityAreas}
            selectedArea={communityAreas.find(a => a.area_numbe === selectedAreaFromSidebar) || null}
            viewMode="normal"
          />
        )}
      </MapContainer>
      
      {/* UI Components */}
      <MapLegend
        sidebarOpen={sidebarOpen}
        communityAreas={communityAreas}
      />
      
      <MapControls
        map={mapInstance}
      />
    </div>
  );
});