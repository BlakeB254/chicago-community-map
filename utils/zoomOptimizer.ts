import type { CommunityArea } from '@/types/communityArea';
import { GEO_CONFIG } from '@/lib/geo-utils';
import { LatLngBounds } from 'leaflet';

/**
 * Enhanced zoom optimization system for responsive and accurate community area viewing
 * Based on the reference chicago-community-map implementation
 */

export interface ViewportInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface ZoomCalculation {
  zoomLevel: number;
  padding: [number, number];
  maxZoom: number;
  animate: boolean;
  duration: number;
  customBounds?: [[number, number], [number, number]];
  offsetX?: number;
  offsetY?: number;
  paddingTopLeft?: [number, number];
  paddingBottomRight?: [number, number];
}

export interface AreaZoomProfile {
  name: string;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  paddingMultiplier: number;
  boundsExpansion?: number;
  customOffset?: { x: number; y: number };
}

// Special area zoom profiles for irregular or problematic areas - smoother zooms
const SPECIAL_AREA_PROFILES: Record<string, AreaZoomProfile> = {
  'ohare': {
    name: 'O\'Hare',
    defaultZoom: 11,
    minZoom: 10,
    maxZoom: 11.5, // Less aggressive
    paddingMultiplier: 2.5, // Reduced padding
    boundsExpansion: 0.25, // Less expansion
    customOffset: { x: 0.08, y: 0.03 } // Smaller offset
  },
  'austin': {
    name: 'Austin',
    defaultZoom: 12.5,
    minZoom: 11,
    maxZoom: 13,
    paddingMultiplier: 1.2,
    boundsExpansion: 0.03
  },
  'lincoln park': {
    name: 'Lincoln Park',
    defaultZoom: 12.5,
    minZoom: 11,
    maxZoom: 13,
    paddingMultiplier: 1.3,
    boundsExpansion: 0.05,
    customOffset: { x: 0, y: -0.01 }
  },
  'near north side': {
    name: 'Near North Side',
    defaultZoom: 13,
    minZoom: 12,
    maxZoom: 13.5,
    paddingMultiplier: 1.1,
    boundsExpansion: 0.03
  },
  'hyde park': {
    name: 'Hyde Park',
    defaultZoom: 12.5,
    minZoom: 11,
    maxZoom: 13,
    paddingMultiplier: 1.2,
    boundsExpansion: 0.04
  },
  'south shore': {
    name: 'South Shore',
    defaultZoom: 12.5,
    minZoom: 11,
    maxZoom: 13,
    paddingMultiplier: 1.3,
    boundsExpansion: 0.05,
    customOffset: { x: -0.005, y: 0 }
  }
};

/**
 * Get device viewport information
 */
export const getViewportInfo = (): ViewportInfo => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  
  return {
    width,
    height,
    devicePixelRatio,
    isMobile,
    isTablet,
    isDesktop
  };
};

/**
 * Calculate the optimal zoom level for a given bounds and viewport
 */
export const calculateOptimalZoom = (
  bounds: [[number, number], [number, number]],
  viewport: ViewportInfo,
  mapContainer?: { width: number; height: number }
): number => {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 20;
  
  const mapWidth = mapContainer?.width || viewport.width;
  const mapHeight = mapContainer?.height || viewport.height;
  
  const [[south, west], [north, east]] = bounds;
  
  function latRad(lat: number) {
    const sin = Math.sin(lat * Math.PI / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }
  
  function zoom(mapPx: number, worldPx: number, fraction: number) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }
  
  const latFraction = (latRad(north) - latRad(south)) / Math.PI;
  const lngDiff = east - west;
  const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;
  
  const latZoom = zoom(mapHeight, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(mapWidth, WORLD_DIM.width, lngFraction);
  
  let deviceAdjustment = -0.75; // More conservative baseline
  if (viewport.isMobile) {
    deviceAdjustment = -1.25; // Even more conservative on mobile
  } else if (viewport.isTablet) {
    deviceAdjustment = -1.0; // More conservative on tablet
  }
  
  const calculatedZoom = Math.min(latZoom, lngZoom, ZOOM_MAX) + deviceAdjustment;
  
  return Math.max(Math.floor(calculatedZoom), 10);
};

/**
 * Get responsive padding based on viewport
 */
export const getResponsivePadding = (
  viewport: ViewportInfo,
  baseMultiplier: number = 1
): [number, number] => {
  let basePadding: [number, number];
  
  if (viewport.isMobile) {
    basePadding = [20, 20];
  } else if (viewport.isTablet) {
    basePadding = [40, 40];
  } else {
    basePadding = [60, 60];
  }
  
  return [
    Math.round(basePadding[0] * baseMultiplier),
    Math.round(basePadding[1] * baseMultiplier)
  ];
};

/**
 * Calculate bounds from community area geometry
 */
export const calculateBoundsFromGeometry = (area: CommunityArea): [[number, number], [number, number]] => {
  try {
    let allCoords: number[][] = [];
    
    if (area.the_geom.type === 'Polygon') {
      allCoords = area.the_geom.coordinates[0];
    } else if (area.the_geom.type === 'MultiPolygon') {
      // Flatten all coordinates from all polygons
      area.the_geom.coordinates.forEach(polygon => {
        allCoords = allCoords.concat(polygon[0]);
      });
    }
    
    if (allCoords.length === 0) {
      console.warn('No coordinates found for area:', area.community);
      // Return default Chicago bounds as fallback
      return [[41.6444, -87.9400], [42.0233, -87.5240]];
    }
    
    const lats = allCoords.map(coord => coord[1]).filter(lat => !isNaN(lat) && isFinite(lat));
    const lngs = allCoords.map(coord => coord[0]).filter(lng => !isNaN(lng) && isFinite(lng));
    
    if (lats.length === 0 || lngs.length === 0) {
      console.warn('Invalid coordinates for area:', area.community);
      // Return default Chicago bounds as fallback
      return [[41.6444, -87.9400], [42.0233, -87.5240]];
    }
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Validate bounds are reasonable
    if (!isFinite(minLat) || !isFinite(maxLat) || !isFinite(minLng) || !isFinite(maxLng) ||
        minLat >= maxLat || minLng >= maxLng ||
        Math.abs(maxLat - minLat) > 1 || Math.abs(maxLng - minLng) > 1) {
      console.warn('Invalid bounds calculated for area:', area.community, { minLat, maxLat, minLng, maxLng });
      // Return default Chicago bounds as fallback
      return [[41.6444, -87.9400], [42.0233, -87.5240]];
    }
    
    return [[minLat, minLng], [maxLat, maxLng]];
  } catch (error) {
    console.error('Error calculating bounds for area:', area.community, error);
    // Return default Chicago bounds as fallback
    return [[41.6444, -87.9400], [42.0233, -87.5240]];
  }
};

/**
 * Calculate custom bounds with expansion for better centering
 */
export const calculateExpandedBounds = (
  originalBounds: [[number, number], [number, number]],
  expansionFactor: number,
  offset?: { x: number; y: number }
): [[number, number], [number, number]] => {
  const [[south, west], [north, east]] = originalBounds;
  
  // Validate original bounds
  if (!isFinite(south) || !isFinite(west) || !isFinite(north) || !isFinite(east) ||
      south >= north || west >= east) {
    console.warn('Invalid original bounds for expansion:', originalBounds);
    return originalBounds;
  }
  
  const latRange = north - south;
  const lngRange = east - west;
  
  // Clamp expansion factor to reasonable values
  const clampedExpansion = Math.max(0, Math.min(expansionFactor, 0.5));
  
  const latExpansion = latRange * clampedExpansion;
  const lngExpansion = lngRange * clampedExpansion;
  
  let newBounds: [[number, number], [number, number]] = [
    [south - latExpansion / 2, west - lngExpansion / 2],
    [north + latExpansion / 2, east + lngExpansion / 2]
  ];
  
  // Apply offset if provided (but clamp to reasonable values)
  if (offset) {
    const clampedOffsetX = Math.max(-0.1, Math.min(offset.x, 0.1));
    const clampedOffsetY = Math.max(-0.1, Math.min(offset.y, 0.1));
    
    newBounds = [
      [newBounds[0][0] + clampedOffsetY, newBounds[0][1] + clampedOffsetX],
      [newBounds[1][0] + clampedOffsetY, newBounds[1][1] + clampedOffsetX]
    ];
  }
  
  // Ensure bounds are still within reasonable Chicago area
  const chicagoBounds = {
    south: 41.6,
    north: 42.1,
    west: -88.0,
    east: -87.5
  };
  
  newBounds = [
    [
      Math.max(newBounds[0][0], chicagoBounds.south),
      Math.max(newBounds[0][1], chicagoBounds.west)
    ],
    [
      Math.min(newBounds[1][0], chicagoBounds.north),
      Math.min(newBounds[1][1], chicagoBounds.east)
    ]
  ];
  
  // Final validation
  if (newBounds[0][0] >= newBounds[1][0] || newBounds[0][1] >= newBounds[1][1]) {
    console.warn('Expanded bounds are invalid, using original:', newBounds);
    return originalBounds;
  }
  
  return newBounds;
};

/**
 * Get optimized zoom calculation for a community area
 */
export const getOptimizedZoomForArea = (
  area: CommunityArea,
  viewport: ViewportInfo,
  mapContainer?: { width: number; height: number },
  sidebarOpen: boolean = false,
  sidebarWidth: number = 400
): ZoomCalculation => {
  const areaNameLower = area.community.toLowerCase();
  
  const specialProfile = Object.entries(SPECIAL_AREA_PROFILES).find(
    ([key]) => areaNameLower.includes(key)
  )?.[1];
  
  let bounds = calculateBoundsFromGeometry(area);
  let zoomLevel: number;
  let padding: [number, number];
  let paddingTopLeft: [number, number] | undefined;
  let paddingBottomRight: [number, number] | undefined;
  let maxZoom: number;
  
  const effectiveMapWidth = mapContainer ? 
    (sidebarOpen ? mapContainer.width - sidebarWidth : mapContainer.width) : 
    (sidebarOpen ? viewport.width - sidebarWidth : viewport.width);
  
  const needsAsymmetricPadding = areaNameLower.includes('ohare') || 
                                areaNameLower.includes('jefferson park') ||
                                areaNameLower.includes('forest glen');
  
  if (specialProfile) {
    if (specialProfile.boundsExpansion) {
      bounds = calculateExpandedBounds(
        bounds,
        specialProfile.boundsExpansion,
        specialProfile.customOffset
      );
    }
    
    const calculatedZoom = calculateOptimalZoom(bounds, viewport, { 
      width: effectiveMapWidth, 
      height: mapContainer?.height || viewport.height 
    });
    
    zoomLevel = Math.min(
      Math.max(calculatedZoom, specialProfile.minZoom),
      specialProfile.maxZoom
    );
    
    padding = getResponsivePadding(viewport, specialProfile.paddingMultiplier);
    maxZoom = specialProfile.maxZoom;
    
    if (needsAsymmetricPadding && sidebarOpen) {
      paddingTopLeft = [padding[0], padding[1] + sidebarWidth / 2];
      paddingBottomRight = [padding[0], padding[1]];
      
      if (areaNameLower.includes('ohare')) {
        paddingTopLeft = [padding[0], padding[1] + sidebarWidth * 0.8];
        paddingBottomRight = [padding[0], padding[1] * 0.5];
      }
    }
  } else {
    zoomLevel = calculateOptimalZoom(bounds, viewport, {
      width: effectiveMapWidth,
      height: mapContainer?.height || viewport.height
    });
    
    if (viewport.isMobile) {
      zoomLevel = Math.min(zoomLevel, 12); // More conservative on mobile
      maxZoom = 13;
    } else if (viewport.isTablet) {
      zoomLevel = Math.min(zoomLevel, 12.5); // More conservative on tablet
      maxZoom = 13.5;
    } else {
      zoomLevel = Math.min(zoomLevel, 13); // More conservative on desktop
      maxZoom = 14;
    }
    
    padding = getResponsivePadding(viewport, 1.0);
    
    if (sidebarOpen) {
      paddingTopLeft = [padding[0], padding[1] + sidebarWidth / 4];
      paddingBottomRight = [padding[0], padding[1]];
    }
  }
  
  // Ensure reasonable zoom level range - more conservative
  zoomLevel = Math.max(zoomLevel, 11);
  zoomLevel = Math.min(zoomLevel, 13); // Much more conservative maximum
  
  // Final bounds validation
  const [[boundsS, boundsW], [boundsN, boundsE]] = bounds;
  if (!isFinite(boundsS) || !isFinite(boundsW) || !isFinite(boundsN) || !isFinite(boundsE) ||
      boundsS >= boundsN || boundsW >= boundsE) {
    console.error('Invalid final bounds for zoom calculation:', bounds);
    // Use area's original bounds without modification
    bounds = calculateBoundsFromGeometry(area);
  }
  
  return {
    zoomLevel,
    padding,
    paddingTopLeft,
    paddingBottomRight,
    maxZoom: Math.min(maxZoom, 13), // Conservative max zoom
    animate: true,
    duration: 0.8, // Shorter, smoother duration
    customBounds: bounds
  };
};