#!/usr/bin/env node

/**
 * Simple script to import Chicago Community Areas data
 * Can be run with: node scripts/import-community-areas.js
 */

const https = require('https');
const { Client } = require('pg');

// Database connection
const DATABASE_URL = "postgresql://neondb_owner:npg_bKCFR0P9hDZJ@ep-proud-haze-aeslxfnm-pooler.c-2.us-east-2.aws.neon.tech/Map?sslmode=require&channel_binding=require";

// Chicago Data Portal endpoint for community areas
const COMMUNITY_AREAS_URL = 'https://data.cityofchicago.org/resource/igwz-8jzy.geojson';

async function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function importCommunityAreas() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('📡 Fetching community areas data...');
    const geojson = await fetchData(COMMUNITY_AREAS_URL);
    
    console.log(`📊 Found ${geojson.features.length} community areas`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const feature of geojson.features) {
      try {
        const props = feature.properties;
        
        // Skip if missing required properties
        if (!props.area_numbe || !props.community) {
          console.warn(`⚠️  Skipping feature missing required properties`);
          skipped++;
          continue;
        }
        
        // Insert using PostGIS
        const query = `
          INSERT INTO community_areas (area_number, name, geometry, centroid, properties)
          VALUES ($1, $2, ST_GeomFromGeoJSON($3), ST_Centroid(ST_GeomFromGeoJSON($3)), $4)
          ON CONFLICT (area_number) 
          DO UPDATE SET 
            name = EXCLUDED.name,
            geometry = EXCLUDED.geometry,
            centroid = EXCLUDED.centroid,
            properties = EXCLUDED.properties,
            updated_at = NOW()
        `;
        
        await client.query(query, [
          parseInt(props.area_numbe),
          props.community,
          JSON.stringify(feature.geometry),
          JSON.stringify(props)
        ]);
        
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`  📍 Imported ${imported} community areas...`);
        }
        
      } catch (error) {
        console.error(`❌ Error importing ${feature.properties?.community}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\\n✅ Import completed!`);
    console.log(`   📊 Imported: ${imported}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    
    // Validate results
    const countResult = await client.query('SELECT COUNT(*) FROM community_areas');
    console.log(`   📈 Total in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the import
if (require.main === module) {
  console.log('🗺️  Chicago Community Areas Import');
  console.log('===================================\\n');
  importCommunityAreas().catch(console.error);
}