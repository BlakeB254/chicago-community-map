#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';

// Import our database schema
import { communityAreas } from '../db/schema/spatial';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Initialize database connection
const sql = neon(databaseUrl);
const db = drizzle(sql);

interface CommunityAreaGeoJSON {
  type: 'Feature';
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    area_numbe: string;
    community: string;
    area_num_1: string;
    shape_area: string;
    shape_len: string;
  };
}

async function importChicagoCommunities() {
  console.log('🗺️  Starting Chicago Community Areas import...');
  
  try {
    // Read the GeoJSON file
    const geoJsonPath = join(process.cwd(), 'public', 'geojson', 'chicago_community_areas.json');
    console.log(`📖 Reading GeoJSON from: ${geoJsonPath}`);
    
    const geoJsonData = JSON.parse(readFileSync(geoJsonPath, 'utf-8')) as CommunityAreaGeoJSON[];
    console.log(`📊 Found ${geoJsonData.length} community areas`);

    // Process each community area
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const feature of geoJsonData) {
      const { properties, geometry } = feature;
      
      // Validate required properties
      if (!properties.area_numbe || !properties.community) {
        console.warn(`⚠️  Skipping invalid feature: ${JSON.stringify(properties)}`);
        skipped++;
        continue;
      }

      const areaNumber = parseInt(properties.area_numbe, 10);
      const communityName = properties.community.trim();
      const shapeArea = parseFloat(properties.shape_area) || 0;
      const shapeLength = parseFloat(properties.shape_len) || 0;

      // Create the community record
      const communityData = {
        areaNumber,
        name: communityName,
        geometry: JSON.stringify(geometry),
        shapeArea,
        shapeLength,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        // Check if community already exists
        const existing = await db
          .select({ id: communityAreas.id })
          .from(communityAreas)
          .where(eq(communityAreas.areaNumber, areaNumber))
          .limit(1);

        if (existing.length > 0) {
          // Update existing record
          await db
            .update(communityAreas)
            .set({
              name: communityData.name,
              geometry: communityData.geometry,
              properties: communityData
            })
            .where(eq(communityAreas.areaNumber, areaNumber));
          
          updated++;
          console.log(`✅ Updated: ${communityName} (Area #${areaNumber})`);
        } else {
          // Insert new record
          await db
            .insert(communityAreas)
            .values({
              areaNumber,
              name: communityData.name,
              geometry: communityData.geometry,
              properties: communityData
            });
          
          imported++;
          console.log(`🆕 Imported: ${communityName} (Area #${areaNumber})`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${communityName} (Area #${areaNumber}):`, error);
        skipped++;
      }
    }

    console.log('\n📈 Import Summary:');
    console.log(`   🆕 New communityAreas imported: ${imported}`);
    console.log(`   ✅ Existing communityAreas updated: ${updated}`);
    console.log(`   ⚠️  Communities skipped: ${skipped}`);
    console.log(`   📊 Total processed: ${imported + updated + skipped}`);
    
    if (imported + updated > 0) {
      console.log('\n🎉 Chicago community areas successfully imported into Neon database!');
    }

  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  importChicagoCommunities()
    .then(() => {
      console.log('✨ Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import failed:', error);
      process.exit(1);
    });
}

export { importChicagoCommunities };