// Coordinate system constants and utilities for the Chicago Map application

export const COORDINATE_SYSTEMS = {
  WGS84: 'EPSG:4326',      // Standard lat/lng
  WEB_MERCATOR: 'EPSG:3857', // Web mapping standard
  ILLINOIS_STATE_PLANE: 'EPSG:3435' // Local projection
};

// Layer positioning and z-index management
export const LAYER_POSITIONING = {
  zIndex: {
    base_tiles: 100,
    community_boundaries: 200,
    community_fills: 150,
    parks: 300,
    landmarks: 400,
    roads: 350,
    entities: 500,
    overlays: 600,
    popups: 1000,
    controls: 1100
  },
  panes: {
    communityBoundaries: 'communityBoundaries',
    communityFills: 'communityFills',
    parks: 'parks',
    landmarks: 'landmarks',
    roads: 'roads',
    entities: 'entities',
    overlays: 'overlays'
  }
};

// Coordinate validation
export const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

// Chicago-specific coordinate validation
export const isWithinChicago = (lat: number, lng: number): boolean => {
  // Rough bounding box for Chicago area
  const CHICAGO_BOUNDS = {
    north: 42.1,
    south: 41.6,
    east: -87.5,
    west: -88.0
  };
  
  return (
    lat >= CHICAGO_BOUNDS.south &&
    lat <= CHICAGO_BOUNDS.north &&
    lng >= CHICAGO_BOUNDS.west &&
    lng <= CHICAGO_BOUNDS.east
  );
};

// Convert between coordinate formats
export const formatCoordinate = (
  value: number,
  type: 'lat' | 'lng',
  precision: number = 6
): string => {
  const formatted = value.toFixed(precision);
  const direction = type === 'lat' 
    ? (value >= 0 ? 'N' : 'S')
    : (value >= 0 ? 'E' : 'W');
  
  return `${Math.abs(parseFloat(formatted))}°${direction}`;
};

// Parse coordinate string
export const parseCoordinate = (coordString: string): { lat: number; lng: number } | null => {
  // Handle various formats: "41.8781,-87.6298" or "41.8781° N, 87.6298° W"
  const cleaned = coordString.replace(/[°NSEW]/g, '').trim();
  const parts = cleaned.split(/[,\s]+/);
  
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (isValidCoordinate(lat, lng)) {
    return { lat, lng };
  }
  
  return null;
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  unit: 'km' | 'mi' = 'mi'
): number => {
  const R = unit === 'km' ? 6371 : 3959; // Earth's radius
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Get center point of coordinates array
export const getCenterPoint = (coordinates: [number, number][]): [number, number] => {
  if (coordinates.length === 0) return [0, 0];
  
  const sum = coordinates.reduce(
    (acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng],
    [0, 0]
  );
  
  return [
    sum[0] / coordinates.length,
    sum[1] / coordinates.length
  ];
};

// Normalize geometry data
export const normalizeGeometry = (geometry: any): any => {
  if (!geometry) return null;
  
  // Handle different geometry formats
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return geometry;
  }
  
  // Try to parse if it's a string
  if (typeof geometry === 'string') {
    try {
      return JSON.parse(geometry);
    } catch (e) {
      console.error('Failed to parse geometry:', e);
      return null;
    }
  }
  
  return geometry;
};

export default {
  COORDINATE_SYSTEMS,
  LAYER_POSITIONING,
  isValidCoordinate,
  isWithinChicago,
  formatCoordinate,
  parseCoordinate,
  calculateDistance,
  getCenterPoint,
  normalizeGeometry
};