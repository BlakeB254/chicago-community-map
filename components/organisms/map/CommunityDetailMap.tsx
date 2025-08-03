'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import { getViewportInfo, getOptimizedZoomForArea, calculateBoundsFromGeometry } from '@/utils/zoomOptimizer';
import { CommunityArea } from '@/types/communityArea';
import 'leaflet/dist/leaflet.css';

interface CommunityDetailMapProps {
  community: CommunityArea;
  className?: string;
}

// Enhanced styling for the detailed community view
const DETAIL_BOUNDARY_STYLE = {
  fillColor: '#3b82f6',
  weight: 3,
  opacity: 0.9,
  color: '#1d4ed8',
  fillOpacity: 0.2,
  interactive: false,
  smoothFactor: 0.5,
};

export const CommunityDetailMap: React.FC<CommunityDetailMapProps> = ({
  community,
  className = ''
}) => {
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Initialize map and zoom to community area
  useEffect(() => {
    if (!mapInstance || !mapReady || !community) return;

    console.log('📍 Setting up community detail map for:', community.community);

    // Get viewport and calculate optimal zoom
    const viewport = getViewportInfo();
    const mapContainer = {
      width: mapInstance.getContainer().clientWidth,
      height: mapInstance.getContainer().clientHeight
    };

    // Get optimized zoom calculation for this area
    const zoomCalc = getOptimizedZoomForArea(
      community,
      viewport,
      mapContainer,
      false, // No sidebar in detail view
      0
    );

    console.log('🔍 Detail map zoom calculation:', zoomCalc);

    // Reset map constraints
    mapInstance.setMaxBounds(undefined);
    mapInstance.setMinZoom(10);
    mapInstance.setMaxZoom(18);

    // Use bounds from zoom calculation
    if (zoomCalc.customBounds) {
      try {
        const [[minLat, minLng], [maxLat, maxLng]] = zoomCalc.customBounds;
        
        // Validate bounds
        if (isFinite(minLat) && isFinite(minLng) && isFinite(maxLat) && isFinite(maxLng) &&
            minLat < maxLat && minLng < maxLng) {
          
          const bounds = [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]];
          
          const fitBoundsOptions = {
            maxZoom: Math.min(zoomCalc.maxZoom, 15), // Reasonable max for detail view
            animate: false, // Immediate positioning for detail view
            padding: [20, 20] as [number, number]
          };
          
          mapInstance.fitBounds(bounds, fitBoundsOptions);
          
          console.log('✅ Detail map positioned to bounds:', bounds);
        }
      } catch (error) {
        console.warn('❌ Error positioning detail map:', error);
      }
    }

    // Set permissive bounds for the area
    const areaBounds = calculateBoundsFromGeometry(community);
    const [[s, w], [n, e]] = areaBounds;
    const expandedBounds = [
      [s - 0.01, w - 0.01], // Add small buffer
      [n + 0.01, e + 0.01]
    ] as [[number, number], [number, number]];
    
    setTimeout(() => {
      mapInstance.setMaxBounds(expandedBounds);
    }, 100);

  }, [mapInstance, mapReady, community]);

  // Handle container resize
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstance) return;

    const resizeObserver = new ResizeObserver(() => {
      // Don't invalidate size during zoom animations
      if (mapInstance.getContainer().classList.contains('leaflet-zoom-anim')) {
        console.log('⏳ Skipping resize invalidation during animation');
        return;
      }
      mapInstance.invalidateSize();
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapInstance]);

  // Create GeoJSON feature for the community
  const geoJsonFeature = React.useMemo(() => {
    if (!community) return null;

    return {
      type: 'Feature' as const,
      geometry: community.the_geom,
      properties: {
        areaNumber: community.area_numbe,
        communityName: community.community,
        area_numbe: community.area_numbe,
        community: community.community,
      }
    };
  }, [community]);

  return (
    <div ref={mapContainerRef} className={`relative w-full ${className}`}>
      <MapContainer
        center={[41.8781, -87.6298]} // Default Chicago center
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
        preferCanvas={true}
        className="community-detail-map"
        whenReady={(mapEvent) => {
          console.log('🗺️ Community detail map ready');
          const map = mapEvent.target;
          setMapInstance(map);
          setMapReady(true);
        }}
      >
        {/* Tile Layer - matching main map */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={18}
        />
        
        {/* Community Area Boundary */}
        {geoJsonFeature && (
          <GeoJSON
            key={`detail-${community.area_numbe}`}
            data={geoJsonFeature}
            style={() => DETAIL_BOUNDARY_STYLE}
            interactive={false}
          />
        )}
      </MapContainer>
      
      {/* Map overlay with community info */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-10">
        <h3 className="font-semibold text-gray-900 text-sm">
          {community.community}
        </h3>
        <p className="text-xs text-gray-600">
          Community Area #{community.area_numbe}
        </p>
      </div>
    </div>
  );
};