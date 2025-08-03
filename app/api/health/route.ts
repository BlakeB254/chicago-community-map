import { NextResponse } from 'next/server';
import { checkDatabaseConnection, ensurePostGISExtension } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    const dbHealth = await checkDatabaseConnection();
    
    // Check PostGIS extension
    const postgisHealth = await ensurePostGISExtension();
    
    // Overall health status
    const isHealthy = dbHealth.status === 'connected' && postgisHealth.success;

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: dbHealth,
      postgis: postgisHealth,
      timestamp: new Date().toISOString(),
    }, {
      status: isHealthy ? 200 : 503
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 503
    });
  }
}