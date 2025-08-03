'use client';

import { useState, useCallback, useEffect } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { GEO_CONFIG } from '@/lib/geo-utils';
import { getViewportInfo, getOptimizedZoomForArea } from '@/utils/zoomOptimizer';

// Helper function to calculate bounds from geometry
const getBoundsFromGeometry = (geometry: any): [[number, number], [number, number]] | null => {
  try {
    if (!geometry || !geometry.coordinates) return null;

    let allLats: number[] = [];
    let allLngs: number[] = [];

    if (geometry.type === 'Polygon') {
      const coordinates = geometry.coordinates[0];
      coordinates.forEach((coord: number[]) => {
        if (coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
          allLngs.push(coord[0]);
          allLats.push(coord[1]);
        }
      });
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon: number[][][]) => {
        polygon.forEach((ring: number[][]) => {
          ring.forEach((coord: number[]) => {
            if (coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
              allLngs.push(coord[0]);
              allLats.push(coord[1]);
            }
          });
        });
      });
    }

    if (allLats.length === 0 || allLngs.length === 0) return null;

    const bounds: [[number, number], [number, number]] = [
      [Math.min(...allLats), Math.min(...allLngs)],
      [Math.max(...allLats), Math.max(...allLngs)]
    ];

    return bounds;
  } catch (error) {
    console.error('Error calculating bounds from geometry:', error);
    return null;
  }
};

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

interface UseMapInteractionsProps {
  mapInstance: LeafletMap | null;
  communityAreas: CommunityArea[];
  onAreaSelectFromMap?: (areaNumber: string | null) => void;
  sidebarOpen?: boolean;
}

const CHICAGO_CENTER = GEO_CONFIG.CHICAGO_CENTER;
const INITIAL_ZOOM = GEO_CONFIG.INITIAL_ZOOM;

export const useMapInteractions = ({ 
  mapInstance, 
  communityAreas, 
  onAreaSelectFromMap,
  sidebarOpen = true
}: UseMapInteractionsProps) => {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  // Calculate center point of geometry
  const calculateGeometryCenter = useCallback((geometry: any): [number, number] | null => {
    try {
      if (!geometry || !geometry.coordinates) return null;

      let allLats: number[] = [];
      let allLngs: number[] = [];

      if (geometry.type === 'Polygon') {
        const coordinates = geometry.coordinates[0];
        coordinates.forEach((coord: number[]) => {
          if (coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
            allLngs.push(coord[0]);
            allLats.push(coord[1]);
          }
        });
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygon: number[][][]) => {
          polygon.forEach((ring: number[][]) => {
            ring.forEach((coord: number[]) => {
              if (coord.length >= 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
                allLngs.push(coord[0]);
                allLats.push(coord[1]);
              }
            });
          });
        });
      }

      if (allLats.length === 0 || allLngs.length === 0) return null;

      const centerLat = (Math.min(...allLats) + Math.max(...allLats)) / 2;
      const centerLng = (Math.min(...allLngs) + Math.max(...allLngs)) / 2;

      return [centerLat, centerLng];
    } catch (error) {
      console.error('Error calculating center:', error);
      return null;
    }
  }, []);

  // Proper zoom implementation based on reference project
  const zoomToArea = useCallback((areaData: CommunityArea) => {
    if (!mapInstance || !areaData.the_geom) return;

    console.log('🔍 Zooming to area:', areaData.community);
    
    // Get viewport and map container information
    const viewport = getViewportInfo();
    const mapContainer = {
      width: mapInstance.getContainer().clientWidth,
      height: mapInstance.getContainer().clientHeight
    };
    
    // Get optimized zoom calculation with sidebar awareness
    const zoomCalc = getOptimizedZoomForArea(
      areaData,
      viewport,
      mapContainer,
      sidebarOpen,
      400 // Default sidebar width
    );
    
    console.log('Optimized zoom calculation:', {
      area: areaData.community,
      viewport: `${viewport.width}x${viewport.height}`,
      device: viewport.isMobile ? 'mobile' : viewport.isTablet ? 'tablet' : 'desktop',
      ...zoomCalc
    });
    
    // Reset map constraints for zoom operation
    mapInstance.setMaxBounds(undefined);
    mapInstance.setMinZoom(10);
    mapInstance.setMaxZoom(20);
    
    // Calculate bounds from geometry
    const bounds = getBoundsFromGeometry(areaData.the_geom);
    if (bounds) {
      console.log('Using calculated bounds:', bounds);
      
      // Apply optimized zoom with responsive padding
      const fitBoundsOptions: any = {
        maxZoom: zoomCalc.maxZoom,
        animate: zoomCalc.animate,
        duration: zoomCalc.duration,
        easeLinearity: 0.25 // Leaflet default - prevents timing issues
      };
      
      // Use asymmetric padding if available (for sidebar compensation)
      if (zoomCalc.paddingTopLeft && zoomCalc.paddingBottomRight) {
        fitBoundsOptions.paddingTopLeft = zoomCalc.paddingTopLeft;
        fitBoundsOptions.paddingBottomRight = zoomCalc.paddingBottomRight;
      } else {
        fitBoundsOptions.padding = zoomCalc.padding;
      }
      
      mapInstance.fitBounds(bounds, fitBoundsOptions);
      
      // Set exploration bounds after animation - wait for actual animation completion
      mapInstance.once('zoomend', () => {
        // Use the same bounds as our GEO_CONFIG to match reference behavior
        mapInstance.setMaxBounds(GEO_CONFIG.LEAFLET_MAX_BOUNDS);
      });
      
    } else {
      // Fallback to center calculation
      const center = calculateGeometryCenter(areaData.the_geom);
      if (center) {
        console.log('Using calculated center:', center);
        mapInstance.setView(center, zoomCalc.zoomLevel, {
          animate: true,
          duration: zoomCalc.duration
        });
        
        // Set exploration bounds after animation for setView too
        mapInstance.once('zoomend', () => {
          mapInstance.setMaxBounds(GEO_CONFIG.LEAFLET_MAX_BOUNDS);
        });
      } else {
        console.warn('❌ Could not calculate center for:', areaData.community);
        return;
      }
    }
    
    console.log('Zoom completed for:', areaData.community);
  }, [mapInstance, calculateGeometryCenter, sidebarOpen]);

  // Handle area click with smooth transitions between areas
  const handleAreaClick = useCallback((areaNumber: string) => {
    console.log('🖱️ Area clicked:', areaNumber, 'Currently selected:', selectedArea);
    
    // Always select the new area (no toggling for better UX)
    const newSelection = areaNumber;
    console.log('🎯 New selection will be:', newSelection);
    
    setSelectedArea(newSelection);
    
    // Notify parent component of selection change
    if (onAreaSelectFromMap) {
      onAreaSelectFromMap(newSelection);
    }
    
    // Smooth transition to new area
    const areaData = communityAreas.find(area => area.area_numbe === newSelection);
    if (areaData) {
      console.log('🔍 Smoothly transitioning to area:', areaData.community);
      zoomToArea(areaData);
    }
  }, [selectedArea, onAreaSelectFromMap, communityAreas, zoomToArea]);

  // Handle area hover
  const handleAreaHover = useCallback((areaNumber: string | null) => {
    setHoveredArea(areaNumber);
  }, []);

  return {
    selectedArea,
    hoveredArea,
    setSelectedArea,
    handleAreaClick,
    handleAreaHover,
    zoomToArea
  };
};