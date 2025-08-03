import type { GeoJSON } from 'geojson';

// Geographic configuration constants matching reference project
export const GEO_CONFIG = {
  // Use WGS84 (EPSG:4326) for storage
  SRID: 4326,
  // Chicago bounds for validation - expanded south for better coverage
  CHICAGO_BOUNDS: {
    north: 42.0677,
    south: 41.6200, // Expanded south boundary to show more of Chicago
    east: -87.5044,
    west: -87.9073
  },
  // Map projection for display
  MAP_PROJECTION: 'EPSG:3857', // Web Mercator for Leaflet
  // Precision for coordinate storage (6 decimal places ≈ 0.1m accuracy)
  COORDINATE_PRECISION: 6,
  // Default map center and zoom (matching reference project)
  CHICAGO_CENTER: [41.8781, -87.6298] as [number, number],
  INITIAL_ZOOM: 10,  // Zoomed out more to show whole city
  MIN_ZOOM: 9,
  MAX_ZOOM: 20,
  // Map bounds for Leaflet maxBounds (Southwest, Northeast)
  LEAFLET_MAX_BOUNDS: [
    [41.6200, -87.9073], // Southwest - expanded south
    [42.0677, -87.5044], // Northeast
  ] as [[number, number], [number, number]],
  // Map interaction settings
  MAX_BOUNDS_VISCOSITY: 1.0,
};

/**
 * Validate that coordinates are within Chicago bounds
 */
export function validateChicagoBounds(geometry: GeoJSON.Geometry): boolean {
  const bounds = GEO_CONFIG.CHICAGO_BOUNDS;
  
  function checkCoordinate([lng, lat]: [number, number]): boolean {
    return lng >= bounds.west && lng <= bounds.east && 
           lat >= bounds.south && lat <= bounds.north;
  }

  function checkCoordinates(coords: any): boolean {
    if (typeof coords[0] === 'number') {
      // Single coordinate pair
      return checkCoordinate(coords as [number, number]);
    } else if (Array.isArray(coords[0])) {
      // Array of coordinates
      return coords.every(checkCoordinates);
    }
    return false;
  }

  try {
    switch (geometry.type) {
      case 'Point':
        return checkCoordinate(geometry.coordinates as [number, number]);
      
      case 'LineString':
      case 'MultiPoint':
        return checkCoordinates(geometry.coordinates);
      
      case 'Polygon':
      case 'MultiLineString':
        return geometry.coordinates.every(checkCoordinates);
      
      case 'MultiPolygon':
        return geometry.coordinates.every(polygon => 
          polygon.every(checkCoordinates)
        );
      
      case 'GeometryCollection':
        return geometry.geometries.every(validateChicagoBounds);
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error validating Chicago bounds:', error);
    return false;
  }
}

/**
 * Normalize GeoJSON coordinates to specified precision
 */
export function normalizeCoordinates(coords: any, precision: number = GEO_CONFIG.COORDINATE_PRECISION): any {
  if (typeof coords[0] === 'number') {
    // Single coordinate pair
    return [
      Number(coords[0].toFixed(precision)),
      Number(coords[1].toFixed(precision))
    ];
  } else if (Array.isArray(coords)) {
    // Array of coordinates
    return coords.map(coord => normalizeCoordinates(coord, precision));
  }
  return coords;
}

/**
 * Validate and normalize GeoJSON feature
 */
export function normalizeGeoJSON(feature: GeoJSON.Feature): GeoJSON.Feature {
  try {
    // Validate geometry exists
    if (!feature.geometry) {
      throw new Error('Feature missing geometry');
    }

    // Normalize coordinates precision
    const normalizedGeometry = {
      ...feature.geometry,
      coordinates: normalizeCoordinates(feature.geometry.coordinates)
    };

    // Fix polygon winding order (exterior ring counterclockwise, holes clockwise)
    if (normalizedGeometry.type === 'Polygon') {
      normalizedGeometry.coordinates = fixPolygonWinding(normalizedGeometry.coordinates);
    } else if (normalizedGeometry.type === 'MultiPolygon') {
      normalizedGeometry.coordinates = normalizedGeometry.coordinates.map(fixPolygonWinding);
    }

    return {
      type: 'Feature',
      geometry: normalizedGeometry,
      properties: feature.properties || {},
    };
  } catch (error) {
    console.error('Error normalizing GeoJSON:', error);
    throw new Error(`Failed to normalize GeoJSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fix polygon winding order (exterior counterclockwise, holes clockwise)
 */
function fixPolygonWinding(coordinates: number[][][]): number[][][] {
  return coordinates.map((ring, index) => {
    const isClockwise = calculateRingArea(ring) < 0;
    const shouldBeClockwise = index > 0; // First ring is exterior (CCW), others are holes (CW)
    
    if (isClockwise !== shouldBeClockwise) {
      return ring.slice().reverse();
    }
    return ring;
  });
}

/**
 * Calculate the signed area of a ring (positive = counterclockwise, negative = clockwise)
 */
function calculateRingArea(ring: number[][]): number {
  let area = 0;
  const n = ring.length - 1; // Exclude duplicate closing point
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  
  return area / 2;
}

/**
 * Convert between Web Mercator and WGS84 projections
 */
export function projectToWebMercator(coords: [number, number]): [number, number] {
  const [lng, lat] = coords;
  const x = lng * 20037508.34 / 180;
  const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
  return [x, y * 20037508.34 / 180];
}

export function projectFromWebMercator(coords: [number, number]): [number, number] {
  const [x, y] = coords;
  const lng = x * 180 / 20037508.34;
  const lat = Math.atan(Math.exp(y * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
  return [lng, lat];
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  point1: [number, number], 
  point2: [number, number]
): number {
  const [lng1, lat1] = point1;
  const [lng2, lat2] = point2;
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

/**
 * Get bounding box for a geometry
 */
export function getBoundingBox(geometry: GeoJSON.Geometry): [number, number, number, number] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

  function processBounds(coords: any) {
    if (typeof coords[0] === 'number') {
      // Single coordinate pair
      const [lng, lat] = coords;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    } else if (Array.isArray(coords)) {
      // Array of coordinates
      coords.forEach(processBounds);
    }
  }

  switch (geometry.type) {
    case 'Point':
      processBounds(geometry.coordinates);
      break;
    case 'LineString':
    case 'MultiPoint':
      processBounds(geometry.coordinates);
      break;
    case 'Polygon':
    case 'MultiLineString':
      geometry.coordinates.forEach(processBounds);
      break;
    case 'MultiPolygon':
      geometry.coordinates.forEach(polygon => 
        polygon.forEach(processBounds)
      );
      break;
    case 'GeometryCollection':
      geometry.geometries.forEach(g => {
        const [w, s, e, n] = getBoundingBox(g);
        minLng = Math.min(minLng, w);
        minLat = Math.min(minLat, s);
        maxLng = Math.max(maxLng, e);
        maxLat = Math.max(maxLat, n);
      });
      break;
  }

  return [minLng, minLat, maxLng, maxLat]; // [west, south, east, north]
}

/**
 * Convert bounds to Leaflet LatLngBounds format
 */
export function boundsToLeaflet(bounds: [number, number, number, number]) {
  const [west, south, east, north] = bounds;
  return [[south, west], [north, east]] as [[number, number], [number, number]];
}