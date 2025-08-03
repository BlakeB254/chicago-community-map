#!/usr/bin/env tsx

/**
 * Chicago Community Map Data Migration Script
 * 
 * This script imports geospatial data from the Chicago Data Portal
 * and migrates it to the Neon PostGIS database.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { communityAreas, cityBoundaries, roads, landmarks } from '../db/schema/spatial';
import { sql } from 'drizzle-orm';

// Environment setup
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const connection = neon(DATABASE_URL);
const db = drizzle(connection);

// Chicago Data Portal endpoints
const CHICAGO_DATA_ENDPOINTS = {
  communityAreas: 'https://data.cityofchicago.org/resource/igwz-8jzy.geojson',
  cityBoundaries: 'https://data.cityofchicago.org/resource/qqq9-ngh9.geojson',
  majorStreets: 'https://data.cityofchicago.org/resource/ueqs-5ydp.geojson',
  // Add more endpoints as needed
};

// Validation bounds for Chicago
const CHICAGO_BOUNDS = {
  north: 42.023,
  south: 41.644,
  east: -87.524,
  west: -87.940
};

/**
 * Validates if coordinates are within Chicago bounds
 */
function validateChicagoBounds(coordinates: number[]): boolean {
  const [lng, lat] = coordinates;
  return (
    lat >= CHICAGO_BOUNDS.south &&
    lat <= CHICAGO_BOUNDS.north &&
    lng >= CHICAGO_BOUNDS.west &&
    lng <= CHICAGO_BOUNDS.east
  );
}

/**
 * Normalizes GeoJSON to ensure consistent coordinate precision
 */
function normalizeGeoJSON(feature: any): any {
  const precision = 6;
  
  function roundCoordinates(coords: any): any {
    if (Array.isArray(coords[0])) {
      return coords.map(roundCoordinates);
    }
    return coords.map((coord: number) => Math.round(coord * Math.pow(10, precision)) / Math.pow(10, precision));
  }

  const normalized = { ...feature };
  if (normalized.geometry && normalized.geometry.coordinates) {
    normalized.geometry.coordinates = roundCoordinates(normalized.geometry.coordinates);
  }
  
  return normalized;
}

/**
 * Fetches data from Chicago Data Portal
 */
async function fetchChicagoData(url: string): Promise<any> {
  console.log(`Fetching data from: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✓ Fetched ${data.features?.length || 0} features`);
    return data;
  } catch (error) {
    console.error(`✗ Error fetching data from ${url}:`, error);
    throw error;
  }
}

/**
 * Imports community areas from Chicago Data Portal
 */
async function importCommunityAreas(): Promise<void> {
  console.log('\\n🏘️  Importing Community Areas...');
  
  const geojson = await fetchChicagoData(CHICAGO_DATA_ENDPOINTS.communityAreas);
  
  let imported = 0;
  let skipped = 0;
  
  for (const feature of geojson.features) {
    try {
      // Validate feature has required properties
      if (!feature.properties?.area_numbe || !feature.properties?.community) {
        console.warn(`Skipping feature missing required properties:`, feature.properties);
        skipped++;
        continue;
      }
      
      // Normalize and validate geometry
      const normalized = normalizeGeoJSON(feature);
      
      // Basic coordinate validation for first coordinate
      const firstCoord = normalized.geometry.coordinates[0][0];
      if (!validateChicagoBounds(firstCoord)) {
        console.warn(`Skipping feature with invalid coordinates:`, firstCoord);
        skipped++;
        continue;
      }
      
      // Insert with PostGIS functions
      await db.insert(communityAreas).values({
        areaNumber: parseInt(feature.properties.area_numbe),
        name: feature.properties.community,
        geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
        centroid: sql`ST_Centroid(ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)}))`,
        properties: feature.properties
      }).onConflictDoUpdate({
        target: communityAreas.areaNumber,
        set: {
          name: feature.properties.community,
          geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
          centroid: sql`ST_Centroid(ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)}))`,
          properties: feature.properties,
          updatedAt: sql`NOW()`
        }
      });
      
      imported++;
    } catch (error) {
      console.error(`Error importing community area ${feature.properties?.community}:`, error);
      skipped++;
    }
  }
  
  console.log(`✓ Community Areas: ${imported} imported, ${skipped} skipped`);
}

/**
 * Imports city boundaries from Chicago Data Portal
 */
async function importCityBoundaries(): Promise<void> {
  console.log('\\n🏛️  Importing City Boundaries...');
  
  const geojson = await fetchChicagoData(CHICAGO_DATA_ENDPOINTS.cityBoundaries);
  
  let imported = 0;
  let skipped = 0;
  
  for (const feature of geojson.features) {
    try {
      const normalized = normalizeGeoJSON(feature);
      
      await db.insert(cityBoundaries).values({
        name: feature.properties?.name || 'Chicago City Boundary',
        boundaryType: 'city',
        geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
        properties: feature.properties
      });
      
      imported++;
    } catch (error) {
      console.error(`Error importing city boundary:`, error);
      skipped++;
    }
  }
  
  console.log(`✓ City Boundaries: ${imported} imported, ${skipped} skipped`);
}

/**
 * Imports major streets from Chicago Data Portal
 */
async function importMajorStreets(): Promise<void> {
  console.log('\\n🛣️  Importing Major Streets...');
  
  const geojson = await fetchChicagoData(CHICAGO_DATA_ENDPOINTS.majorStreets);
  
  let imported = 0;
  let skipped = 0;
  let batch = [];
  const BATCH_SIZE = 100;
  
  for (const feature of geojson.features) {
    try {
      const normalized = normalizeGeoJSON(feature);
      
      batch.push({
        name: feature.properties?.street_nam || feature.properties?.full_name || 'Unnamed Street',
        roadType: feature.properties?.type_desc || 'major',
        geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
        properties: feature.properties
      });
      
      // Insert in batches for performance
      if (batch.length >= BATCH_SIZE) {
        await db.insert(roads).values(batch);
        imported += batch.length;
        batch = [];
        console.log(`  Processed ${imported} streets...`);
      }
    } catch (error) {
      console.error(`Error processing street:`, error);
      skipped++;
    }
  }
  
  // Insert remaining batch
  if (batch.length > 0) {
    await db.insert(roads).values(batch);
    imported += batch.length;
  }
  
  console.log(`✓ Major Streets: ${imported} imported, ${skipped} skipped`);
}

/**
 * Creates sample landmarks for demonstration
 */
async function createSampleLandmarks(): Promise<void> {
  console.log('\\n📍 Creating Sample Landmarks...');
  
  const sampleLandmarks = [
    {
      name: 'Millennium Park',
      category: 'park',
      location: [-87.6229, 41.8826],
      iconType: 'park'
    },
    {
      name: 'Navy Pier',
      category: 'attraction',
      location: [-87.6056, 41.8919],
      iconType: 'attraction'
    },
    {
      name: 'Willis Tower',
      category: 'landmark',
      location: [-87.6359, 41.8789],
      iconType: 'building'
    },
    {
      name: 'Lincoln Park Zoo',
      category: 'zoo',
      location: [-87.6339, 41.9212],
      iconType: 'zoo'
    },
    {
      name: 'Art Institute of Chicago',
      category: 'museum',
      location: [-87.6238, 41.8796],
      iconType: 'museum'
    }
  ];
  
  let imported = 0;
  
  for (const landmark of sampleLandmarks) {
    try {
      // Find the community area for this landmark
      const communityAreaResult = await db
        .select({ id: communityAreas.id })
        .from(communityAreas)
        .where(
          sql`ST_Contains(geometry, ST_Point(${landmark.location[0]}, ${landmark.location[1]}))`
        )
        .limit(1);
      
      await db.insert(landmarks).values({
        name: landmark.name,
        category: landmark.category,
        location: sql`ST_Point(${landmark.location[0]}, ${landmark.location[1]})`,
        communityAreaId: communityAreaResult[0]?.id || null,
        iconType: landmark.iconType,
        properties: { description: `Sample landmark: ${landmark.name}` }
      });
      
      imported++;
    } catch (error) {
      console.error(`Error creating landmark ${landmark.name}:`, error);
    }
  }
  
  console.log(`✓ Sample Landmarks: ${imported} created`);
}

/**
 * Validates data integrity after migration
 */
async function validateData(): Promise<void> {
  console.log('\\n🔍 Validating Data Integrity...');
  
  // Check community areas
  const communityCount = await db
    .select({ count: sql`count(*)` })
    .from(communityAreas);
  console.log(`Community Areas: ${communityCount[0].count}`);
  
  // Check city boundaries
  const boundaryCount = await db
    .select({ count: sql`count(*)` })
    .from(cityBoundaries);
  console.log(`City Boundaries: ${boundaryCount[0].count}`);
  
  // Check roads
  const roadCount = await db
    .select({ count: sql`count(*)` })
    .from(roads);
  console.log(`Roads: ${roadCount[0].count}`);
  
  // Check landmarks
  const landmarkCount = await db
    .select({ count: sql`count(*)` })
    .from(landmarks);
  console.log(`Landmarks: ${landmarkCount[0].count}`);
  
  // Validate spatial integrity
  console.log('\\nValidating spatial integrity...');
  
  // Check for invalid geometries
  const invalidGeoms = await db.execute(sql`
    SELECT 'community_areas' as table_name, count(*) as invalid_count
    FROM community_areas 
    WHERE NOT ST_IsValid(geometry)
    UNION ALL
    SELECT 'city_boundaries', count(*)
    FROM city_boundaries 
    WHERE NOT ST_IsValid(geometry)
    UNION ALL
    SELECT 'roads', count(*)
    FROM roads 
    WHERE NOT ST_IsValid(geometry)
  `);
  
  for (const result of invalidGeoms.rows) {
    if (parseInt(result.invalid_count as string) > 0) {
      console.warn(`⚠️  Found ${result.invalid_count} invalid geometries in ${result.table_name}`);
    } else {
      console.log(`✓ All geometries valid in ${result.table_name}`);
    }
  }
}

/**
 * Main migration function
 */
async function main(): Promise<void> {
  console.log('🗺️  Chicago Community Map Data Migration');
  console.log('==========================================\\n');
  
  try {
    // Import data in order
    await importCommunityAreas();
    await importCityBoundaries();
    await importMajorStreets();
    await createSampleLandmarks();
    
    // Validate results
    await validateData();
    
    console.log('\\n✅ Migration completed successfully!');
    console.log('\\n📍 Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Visit http://localhost:3000 to view the map');
    console.log('3. Navigate to /data to manage imported data');
    
  } catch (error) {
    console.error('\\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runMigration };