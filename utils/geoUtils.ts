import { LatLngBounds, LatLng } from 'leaflet';
import type { CommunityArea } from '@/types/communityArea';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const calculateBoundsFromGeometry = (geometry: any): [number, number, number, number] => {
  if (!geometry || !geometry.coordinates) {
    return [41.6444, -87.9400, 42.0233, -87.5240]; // Chicago default bounds
  }

  let allCoords: number[][] = [];

  try {
    if (geometry.type === 'Polygon') {
      allCoords = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
      // Flatten all coordinates from all polygons
      geometry.coordinates.forEach((polygon: any) => {
        allCoords = allCoords.concat(polygon[0]);
      });
    }

    if (allCoords.length === 0) {
      return [41.6444, -87.9400, 42.0233, -87.5240];
    }

    // Extract lats and lngs (coordinates are in [lng, lat] format)
    const lngs = allCoords.map(coord => coord[0]).filter(lng => !isNaN(lng) && isFinite(lng));
    const lats = allCoords.map(coord => coord[1]).filter(lat => !isNaN(lat) && isFinite(lat));

    if (lats.length === 0 || lngs.length === 0) {
      return [41.6444, -87.9400, 42.0233, -87.5240];
    }

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Validate bounds are reasonable
    if (!isFinite(minLat) || !isFinite(maxLat) || !isFinite(minLng) || !isFinite(maxLng) ||
        minLat >= maxLat || minLng >= maxLng ||
        Math.abs(maxLat - minLat) > 1 || Math.abs(maxLng - minLng) > 1) {
      return [41.6444, -87.9400, 42.0233, -87.5240];
    }

    return [minLat, minLng, maxLat, maxLng];
  } catch (error) {
    console.error('Error calculating bounds:', error);
    return [41.6444, -87.9400, 42.0233, -87.5240];
  }
};

export const calculateCentroidFromGeometry = (geometry: any): [number, number] => {
  if (!geometry || !geometry.coordinates) {
    return [41.8781, -87.6298]; // Chicago center
  }

  let allCoords: number[][] = [];

  try {
    if (geometry.type === 'Polygon') {
      allCoords = geometry.coordinates[0];
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon: any) => {
        allCoords = allCoords.concat(polygon[0]);
      });
    }

    if (allCoords.length === 0) {
      return [41.8781, -87.6298];
    }

    // Calculate centroid
    const sumLng = allCoords.reduce((sum, coord) => sum + coord[0], 0);
    const sumLat = allCoords.reduce((sum, coord) => sum + coord[1], 0);
    const centroidLng = sumLng / allCoords.length;
    const centroidLat = sumLat / allCoords.length;

    // Validate centroid
    if (!isFinite(centroidLat) || !isFinite(centroidLng)) {
      return [41.8781, -87.6298];
    }

    return [centroidLat, centroidLng];
  } catch (error) {
    console.error('Error calculating centroid:', error);
    return [41.8781, -87.6298];
  }
};

export const isValidChicagoCoordinate = (lat: number, lng: number): boolean => {
  // Chicago rough bounds
  return lat >= 41.6 && lat <= 42.1 && lng >= -88.0 && lng <= -87.5;
};

export const normalizeGeometry = (geometry: any): any => {
  if (!geometry) return null;

  // Ensure proper precision to avoid floating point issues
  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring: any) =>
        ring.map((coord: any) => [
          Math.round(coord[0] * 1000000) / 1000000,
          Math.round(coord[1] * 1000000) / 1000000
        ])
      )
    };
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon: any) =>
        polygon.map((ring: any) =>
          ring.map((coord: any) => [
            Math.round(coord[0] * 1000000) / 1000000,
            Math.round(coord[1] * 1000000) / 1000000
          ])
        )
      )
    };
  }

  return geometry;
};

export const createLatLngBounds = (bounds: [number, number, number, number]): LatLngBounds => {
  const [minLat, minLng, maxLat, maxLng] = bounds;
  return new LatLngBounds(
    new LatLng(minLat, minLng),
    new LatLng(maxLat, maxLng)
  );
};