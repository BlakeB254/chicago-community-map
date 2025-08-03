'use client';

import { useState, useEffect } from 'react';
import { chicagoParkService } from '@/services/chicagoParkService';
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

export const useMapData = () => {
  const [communityAreas, setCommunityAreas] = useState<CommunityArea[]>([]);
  const [parks, setParks] = useState<Park[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load all data together to prevent flash
  useEffect(() => {
    const loadAllData = async () => {
      try {
        console.log('🗺️ Loading Chicago map data...');
        
        // Load community areas and parks in parallel
        const [communityResponse, parksData] = await Promise.all([
          fetch('/geojson/chicago_community_areas.json'),
          chicagoParkService.getAllParks()
        ]);
        
        if (!communityResponse.ok) {
          throw new Error(`Failed to load community data: ${communityResponse.statusText}`);
        }
        
        const communityData = await communityResponse.json();
        
        // Normalize community areas data
        const normalizedCommunityData = communityData
          .filter((area: CommunityArea) => {
            return area.the_geom && area.area_numbe && area.community;
          })
          .map((area: CommunityArea) => ({
            ...area,
            the_geom: {
              ...area.the_geom,
              coordinates: area.the_geom.coordinates
            }
          }));

        // Set all data at once
        setCommunityAreas(normalizedCommunityData);
        setParks(parksData);
        setDataLoaded(true);
        
        console.log(`✅ Loaded ${normalizedCommunityData.length} community areas and ${parksData.length} parks`);
      } catch (error) {
        console.error('❌ Error loading map data:', error);
        setMapError('Failed to load map data');
        setDataLoaded(true); // Still show map even if data fails
      }
    };

    loadAllData();
  }, []);

  return {
    communityAreas,
    parks,
    dataLoaded,
    mapError
  };
};