import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { roads } from '@/db/schema/spatial';
import { sql, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bounds = searchParams.get('bounds');
    const zoom = parseInt(searchParams.get('zoom') || '11');
    const roadType = searchParams.get('type');

    // Validate zoom level
    if (isNaN(zoom) || zoom < 1 || zoom > 20) {
      return NextResponse.json(
        { error: 'Invalid zoom level. Must be between 1 and 20.' },
        { status: 400 }
      );
    }

    // Only show roads at higher zoom levels for performance
    if (zoom < 12) {
      return NextResponse.json({
        type: 'FeatureCollection',
        features: [],
      });
    }

    let query = db
      .select({
        id: roads.id,
        name: roads.name,
        roadType: roads.roadType,
        properties: roads.properties,
        // Return simplified geometry based on zoom level
        geometry: sql<any>`ST_AsGeoJSON(
          CASE 
            WHEN ${zoom} < 14 THEN ST_Simplify(${roads.geometry}, 0.001)
            ELSE ${roads.geometry}
          END
        )::json`,
      })
      .from(roads);

    // Add bounds filtering if provided
    if (bounds) {
      const boundsArray = bounds.split(',').map(Number);
      if (boundsArray.length !== 4 || boundsArray.some(isNaN)) {
        return NextResponse.json(
          { error: 'Invalid bounds format. Expected: west,south,east,north' },
          { status: 400 }
        );
      }

      const [west, south, east, north] = boundsArray;
      
      // Validate coordinate ranges
      if (west < -180 || west > 180 || east < -180 || east > 180 ||
          south < -90 || south > 90 || north < -90 || north > 90) {
        return NextResponse.json(
          { error: 'Invalid coordinate values. Longitude must be -180 to 180, latitude must be -90 to 90.' },
          { status: 400 }
        );
      }

      query = query.where(
        sql`ST_Intersects(
          ${roads.geometry},
          ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
        )`
      );
    }

    // Filter by road type if specified
    if (roadType) {
      const validTypes = ['highway', 'major', 'minor'];
      if (!validTypes.includes(roadType)) {
        return NextResponse.json(
          { error: 'Invalid road type. Must be one of: highway, major, minor' },
          { status: 400 }
        );
      }
      query = query.where(eq(roads.roadType, roadType));
    }

    const roadData = await query;

    return NextResponse.json({
      type: 'FeatureCollection',
      features: roadData.map((road) => ({
        type: 'Feature',
        id: road.id,
        properties: {
          id: road.id,
          name: road.name,
          roadType: road.roadType,
          ...road.properties,
        },
        geometry: road.geometry,
      })),
    });
  } catch (error) {
    console.error('Error fetching roads:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('PostGIS')) {
        return NextResponse.json(
          { error: 'PostGIS extension is not properly configured' },
          { status: 500 }
        );
      }
      if (error.message.includes('geometry')) {
        return NextResponse.json(
          { error: 'Invalid geometry data in database' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch roads' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, roadType, geometry, properties } = body;

    // Validate required fields
    if (!geometry) {
      return NextResponse.json(
        { error: 'Missing required field: geometry is required' },
        { status: 400 }
      );
    }

    // Validate road type if provided
    if (roadType) {
      const validTypes = ['highway', 'major', 'minor'];
      if (!validTypes.includes(roadType)) {
        return NextResponse.json(
          { error: 'Invalid road type. Must be one of: highway, major, minor' },
          { status: 400 }
        );
      }
    }

    // Validate GeoJSON geometry
    if (!geometry.type || !geometry.coordinates) {
      return NextResponse.json(
        { error: 'Invalid GeoJSON geometry format' },
        { status: 400 }
      );
    }

    const result = await db
      .insert(roads)
      .values({
        name,
        roadType,
        geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(geometry)})`,
        properties,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating road:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('invalid GeoJSON')) {
        return NextResponse.json(
          { error: 'Invalid GeoJSON geometry provided' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create road' },
      { status: 500 }
    );
  }
}