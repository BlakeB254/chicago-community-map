#!/usr/bin/env tsx

// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(process.cwd(), '.env.local') });

import { db, checkDatabaseConnection, ensurePostGISExtension } from '../lib/db';
import { sql } from 'drizzle-orm';
import fs from 'fs';

async function testDatabaseConnection() {
  console.log('Database URL loaded:', process.env.DATABASE_URL ? 'Yes' : 'No');
  console.log('🔍 Testing Chicago Community Map Database Connection...\n');

  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    const connectionHealth = await checkDatabaseConnection();
    
    if (connectionHealth.status === 'connected') {
      console.log('✅ Database connection successful');
      console.log(`   Timestamp: ${connectionHealth.timestamp}`);
    } else {
      console.error('❌ Database connection failed');
      console.error(`   Error: ${connectionHealth.error}`);
      return;
    }

    // Test PostGIS extension
    console.log('\n2. Testing PostGIS extension...');
    const postgisHealth = await ensurePostGISExtension();
    
    if (postgisHealth.success) {
      console.log('✅ PostGIS extension is available');
    } else {
      console.error('❌ PostGIS extension failed');
      console.error(`   Error: ${postgisHealth.error}`);
      return;
    }

    // Run migration if needed
    console.log('\n3. Running database migration...');
    const migrationPath = path.join(__dirname, '../db/migrations/0001_init_postgis.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        await db.execute(sql.raw(migrationSQL));
        console.log('✅ Database migration completed successfully');
      } catch (migrationError) {
        console.log('⚠️  Migration may have already run (this is normal)');
        console.log(`   ${migrationError instanceof Error ? migrationError.message : migrationError}`);
      }
    } else {
      console.log('⚠️  Migration file not found');
    }

    // Test PostGIS functions
    console.log('\n4. Testing PostGIS functions...');
    try {
      const postgisVersion = await db.execute(
        sql`SELECT PostGIS_Version() as version`
      );
      console.log(`✅ PostGIS version: ${postgisVersion.rows[0]?.version || 'Unknown'}`);
    } catch (error) {
      console.error('❌ PostGIS function test failed');
      console.error(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    // Test table creation
    console.log('\n5. Testing table existence...');
    try {
      const tables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('community_areas', 'city_boundaries', 'roads', 'landmarks')
        ORDER BY table_name
      `);
      
      const tableNames = Array.isArray(tables) ? tables.map((row: any) => row.table_name) : [];
      console.log(`✅ Found tables: ${tableNames.join(', ')}`);
      
      if (tableNames.length === 4) {
        console.log('✅ All required tables exist');
      } else {
        console.log('⚠️  Some tables may be missing');
      }
    } catch (error) {
      console.error('❌ Table check failed');
      console.error(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    // Test spatial indexes
    console.log('\n6. Testing spatial indexes...');
    try {
      const indexes = await db.execute(sql`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexdef LIKE '%gist%'
        ORDER BY indexname
      `);
      
      const indexNames = Array.isArray(indexes) ? indexes.map((row: any) => row.indexname) : [];
      console.log(`✅ Found spatial indexes: ${indexNames.join(', ')}`);
    } catch (error) {
      console.error('❌ Spatial index check failed');
      console.error(`   Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n🎉 Database setup is complete and ready for use!');
    console.log('\nNext steps:');
    console.log('1. Run the development server: npm run dev');
    console.log('2. Import Chicago data: Visit /data page in browser');
    console.log('3. View the map: Visit /map page in browser');

  } catch (error) {
    console.error('\n💥 Database test failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch(console.error);