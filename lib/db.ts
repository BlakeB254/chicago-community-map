import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

// Ensure environment variables are loaded
if (typeof window === 'undefined') {
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (e) {
    // dotenv might not be available in production
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please check your .env.local file.');
}

// Main database connection for writes
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Read replica connection for reads (if available)
const readSql = process.env.DATABASE_URL_READ 
  ? neon(process.env.DATABASE_URL_READ)
  : sql;
export const dbRead = drizzle(readSql, { schema });

// Database connection health check
export async function checkDatabaseConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    return {
      status: 'connected',
      timestamp: result[0].current_time,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// PostGIS extension setup
export async function ensurePostGISExtension() {
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS postgis`;
    await sql`CREATE EXTENSION IF NOT EXISTS postgis_topology`;
    return { success: true };
  } catch (error) {
    console.error('Failed to enable PostGIS extension:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}