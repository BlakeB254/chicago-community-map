import { Park, ChicagoParkAPIResponse } from '../types/park';
import { geospatialService } from './geospatialService';

// Chicago Parks API configuration
const CHICAGO_PARKS_API_URL = 'https://data.cityofchicago.org/resource/ejsh-fztr.json';
const API_LIMIT = 1000;

export class ChicagoParkService {
  private parksCache: Park[] = [];
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  async getAllParks(): Promise<Park[]> {
    if (this.shouldRefreshCache()) {
      await this.loadParksFromAPI();
    }
    return this.parksCache;
  }

  async getParksForArea(areaNumber: string): Promise<Park[]> {
    const allParks = await this.getAllParks();
    return allParks.filter(park => park.communityArea === parseInt(areaNumber));
  }

  async validateAndCorrectParkLocations(): Promise<Park[]> {
    console.log('🔍 Validating and correcting park community area assignments...');
    const allParks = await this.getAllParks();
    const correctedParks: Park[] = [];
    
    for (const park of allParks) {
      const correctedPark = await geospatialService.correctParkCommunityArea(park);
      correctedParks.push(correctedPark);
    }
    
    // Update cache with corrected parks
    this.parksCache = correctedParks;
    console.log('✅ Park location validation complete');
    
    return correctedParks;
  }

  private shouldRefreshCache(): boolean {
    return Date.now() - this.lastFetchTime > this.CACHE_DURATION || this.parksCache.length === 0;
  }

  private async loadParksFromAPI(): Promise<void> {
    try {
      console.log('🌳 Loading parks from Chicago Data Portal...');
      
      const response = await fetch(`${CHICAGO_PARKS_API_URL}?$limit=${API_LIMIT}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const apiData: ChicagoParkAPIResponse[] = await response.json();
      console.log(`📥 Received ${apiData.length} park records from API`);
      
      const parkPromises = apiData.map(apiPark => this.convertAPIToPark(apiPark));
      const convertedParks = await Promise.all(parkPromises);
      this.parksCache = convertedParks.filter(park => park !== null) as Park[];
      
      this.lastFetchTime = Date.now();
      console.log(`✅ Successfully processed ${this.parksCache.length} parks`);
      
      // Log community area distribution
      const areaDistribution: Record<number, number> = {};
      this.parksCache.forEach(park => {
        areaDistribution[park.communityArea] = (areaDistribution[park.communityArea] || 0) + 1;
      });
      console.log('🏞️ Parks by community area:', Object.keys(areaDistribution).length, 'areas covered');
      
    } catch (error) {
      console.error('❌ Failed to load parks from API:', error);
      // Keep existing cache on error
    }
  }

  private async convertAPIToPark(apiPark: ChicagoParkAPIResponse): Promise<Park | null> {
    try {
      // Extract coordinates from geometry
      const coordinates = this.extractCoordinates(apiPark.the_geom);
      if (!coordinates || !this.isValidCoordinates(coordinates)) {
        console.warn(`⚠️ Skipping park ${apiPark.park}: invalid coordinates`, coordinates);
        return null;
      }

      // Determine community area using precise spatial lookup
      const communityArea = await geospatialService.getCommunityAreaForCoordinates(coordinates[0], coordinates[1]);
      if (!communityArea) {
        console.warn(`⚠️ Skipping park ${apiPark.park}: could not determine community area for coordinates ${coordinates}`);
        return null;
      }

      // Extract amenities
      const amenities = this.extractAmenities(apiPark);

      return {
        id: `chicago-park-${apiPark.park_no}`,
        name: apiPark.park || 'Unknown Park',
        address: apiPark.location || `Chicago, IL ${apiPark.zip}`,
        coordinates,
        communityArea,
        amenities,
        description: `${apiPark.acres} acre ${apiPark.park_class?.toLowerCase() || 'park'} in Ward ${apiPark.ward}`,
        size: this.determineParkSize(parseFloat(apiPark.acres) || 0)
      };
    } catch (error) {
      console.warn('⚠️ Failed to convert park:', apiPark.park, error);
      return null;
    }
  }

  private extractCoordinates(geometry: any): [number, number] | null {
    try {
      if (!geometry?.coordinates?.length) return null;

      let coords: [number, number][];
      
      if (geometry.type === 'MultiPolygon') {
        coords = geometry.coordinates[0]?.[0];
      } else if (geometry.type === 'Polygon') {
        coords = geometry.coordinates[0];
      } else {
        return null;
      }

      if (!coords?.length) return null;

      // Calculate centroid
      const avgLng = coords.reduce((sum, point) => sum + point[0], 0) / coords.length;
      const avgLat = coords.reduce((sum, point) => sum + point[1], 0) / coords.length;

      return [avgLat, avgLng]; // [latitude, longitude]
    } catch {
      return null;
    }
  }


  private extractAmenities(apiPark: ChicagoParkAPIResponse): string[] {
    const amenities: string[] = [];
    
    if (apiPark.basketball === 'Yes') amenities.push('Basketball');
    if (apiPark.playground === 'Yes') amenities.push('Playground');
    if (apiPark.tennis_cou === 'Yes') amenities.push('Tennis');
    if (apiPark.baseball_f === 'Yes') amenities.push('Baseball');
    if (apiPark.soccer_fie === 'Yes') amenities.push('Soccer');
    if (apiPark.football_f === 'Yes') amenities.push('Football');
    if (apiPark.swimming_p === 'Yes') amenities.push('Swimming Pool');
    if (apiPark.beach === 'Yes') amenities.push('Beach');
    if (apiPark.dog_friend === 'Yes') amenities.push('Dog Friendly');
    if (apiPark.golf_cours === 'Yes') amenities.push('Golf');
    if (apiPark.nature_bir === 'Yes') amenities.push('Nature Area');
    if (apiPark.wheelchr_a === 'Yes') amenities.push('Wheelchair Accessible');
    
    return amenities;
  }

  private determineParkSize(acres: number): 'small' | 'medium' | 'large' {
    if (acres <= 2) return 'small';
    if (acres <= 10) return 'medium';
    return 'large';
  }

  private isValidCoordinates(coordinates: [number, number]): boolean {
    const [lat, lng] = coordinates;
    return (
      !isNaN(lat) && !isNaN(lng) &&
      lat !== null && lng !== null &&
      lat !== undefined && lng !== undefined &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      geospatialService.isValidChicagoCoordinates(lat, lng)
    );
  }
}

// Export singleton instance
export const chicagoParkService = new ChicagoParkService();