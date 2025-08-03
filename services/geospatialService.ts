import { Park } from '@/types/park';

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

interface GeocodeResult {
  latitude: number;
  longitude: number;
  communityArea: number | null;
  address: string;
}

export class GeospatialService {
  private communityAreasCache: CommunityArea[] = [];
  private lastCommunityLoadTime: number = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  async getCommunityAreaForCoordinates(lat: number, lng: number): Promise<number | null> {
    await this.ensureCommunityAreasLoaded();
    
    const point: [number, number] = [lng, lat]; // GeoJSON uses [longitude, latitude]
    
    for (const area of this.communityAreasCache) {
      if (this.isPointInGeometry(point, area.the_geom)) {
        return parseInt(area.area_numbe) || null;
      }
    }
    
    return null;
  }

  async getCommunityAreaForAddress(address: string): Promise<GeocodeResult | null> {
    try {
      // Use a geocoding service to convert address to coordinates
      const coordinates = await this.geocodeAddress(address);
      if (!coordinates) return null;

      const communityArea = await this.getCommunityAreaForCoordinates(
        coordinates.latitude, 
        coordinates.longitude
      );

      return {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        communityArea,
        address: coordinates.address || address
      };
    } catch (error) {
      console.error('❌ Error geocoding address:', error);
      return null;
    }
  }

  async validateParkLocation(park: Park): Promise<boolean> {
    const [lat, lng] = park.coordinates;
    const actualCommunityArea = await this.getCommunityAreaForCoordinates(lat, lng);
    
    if (actualCommunityArea !== park.communityArea) {
      console.warn(`⚠️ Park ${park.name} community area mismatch: 
        Stored: ${park.communityArea}, Actual: ${actualCommunityArea}`);
      return false;
    }
    
    return true;
  }

  async correctParkCommunityArea(park: Park): Promise<Park> {
    const [lat, lng] = park.coordinates;
    const actualCommunityArea = await this.getCommunityAreaForCoordinates(lat, lng);
    
    if (actualCommunityArea && actualCommunityArea !== park.communityArea) {
      console.log(`🔧 Correcting park ${park.name} community area: ${park.communityArea} → ${actualCommunityArea}`);
      return {
        ...park,
        communityArea: actualCommunityArea
      };
    }
    
    return park;
  }

  private async ensureCommunityAreasLoaded(): Promise<void> {
    if (this.shouldRefreshCommunityCache()) {
      await this.loadCommunityAreas();
    }
  }

  private shouldRefreshCommunityCache(): boolean {
    return Date.now() - this.lastCommunityLoadTime > this.CACHE_DURATION || 
           this.communityAreasCache.length === 0;
  }

  private async loadCommunityAreas(): Promise<void> {
    try {
      console.log('🗺️ Loading community areas for spatial lookup...');
      const response = await fetch('/geojson/chicago_community_areas.json');
      if (!response.ok) {
        throw new Error(`Failed to load community areas: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.communityAreasCache = data.filter((area: CommunityArea) => 
        area.the_geom && area.area_numbe && area.community
      );
      
      this.lastCommunityLoadTime = Date.now();
      console.log(`✅ Loaded ${this.communityAreasCache.length} community areas for spatial lookup`);
    } catch (error) {
      console.error('❌ Failed to load community areas:', error);
      throw error;
    }
  }

  private async geocodeAddress(address: string): Promise<{latitude: number, longitude: number, address?: string} | null> {
    try {
      // For production, use a proper geocoding service like Google Maps or MapBox
      // For now, we'll use a simple Chicago-focused approach
      
      // Check if it's already coordinates
      const coordMatch = address.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        return {
          latitude: parseFloat(coordMatch[1]),
          longitude: parseFloat(coordMatch[2])
        };
      }

      // Use Nominatim for basic geocoding (free, but has rate limits)
      const encodedAddress = encodeURIComponent(`${address}, Chicago, IL`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&bounded=1&viewbox=-88.3,41.6,-87.5,42.1`
      );
      
      if (!response.ok) throw new Error('Geocoding service unavailable');
      
      const results = await response.json();
      if (results.length === 0) return null;
      
      const result = results[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name
      };
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      return null;
    }
  }

  private isPointInGeometry(point: [number, number], geometry: any): boolean {
    try {
      if (!geometry || !geometry.coordinates) return false;
      
      if (geometry.type === 'Polygon') {
        return this.isPointInPolygon(point, geometry.coordinates);
      } else if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates.some((polygon: number[][][]) => 
          this.isPointInPolygon(point, polygon)
        );
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error in point-in-geometry check:', error);
      return false;
    }
  }

  private isPointInPolygon(point: [number, number], coordinates: number[][][]): boolean {
    // Check exterior ring (first ring)
    const exteriorRing = coordinates[0];
    if (!this.pointInRing(point, exteriorRing)) {
      return false;
    }
    
    // Check holes (subsequent rings) - point should NOT be in any hole
    for (let i = 1; i < coordinates.length; i++) {
      if (this.pointInRing(point, coordinates[i])) {
        return false; // Point is in a hole
      }
    }
    
    return true;
  }

  private pointInRing(point: [number, number], ring: number[][]): boolean {
    const [x, y] = point;
    let inside = false;
    const n = ring.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }

  // Utility method to validate coordinates are within Chicago bounds
  isValidChicagoCoordinates(lat: number, lng: number): boolean {
    return (
      lat >= 41.6 && lat <= 42.1 &&   // Chicago latitude range
      lng >= -88.3 && lng <= -87.5     // Chicago longitude range (including O'Hare)
    );
  }

  // Get community area info by number
  async getCommunityAreaInfo(areaNumber: number): Promise<CommunityArea | null> {
    await this.ensureCommunityAreasLoaded();
    return this.communityAreasCache.find(area => 
      parseInt(area.area_numbe) === areaNumber
    ) || null;
  }
}

// Export singleton instance
export const geospatialService = new GeospatialService();