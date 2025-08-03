import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communityAreas } from '@/db/schema/spatial';
import { sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bounds = searchParams.get('bounds');
    const zoom = parseInt(searchParams.get('zoom') || '11');

    // Validate zoom level
    if (isNaN(zoom) || zoom < 1 || zoom > 20) {
      return NextResponse.json(
        { error: 'Invalid zoom level. Must be between 1 and 20.' },
        { status: 400 }
      );
    }

    let query = db
      .select({
        id: communityAreas.id,
        areaNumber: communityAreas.areaNumber,
        name: communityAreas.name,
        properties: communityAreas.properties,
        // Return simplified geometry based on zoom level for better performance
        geometry: sql<any>`ST_AsGeoJSON(
          CASE 
            WHEN ${zoom} < 12 THEN ST_Simplify(${communityAreas.geometry}, 0.001)
            WHEN ${zoom} < 14 THEN ST_Simplify(${communityAreas.geometry}, 0.0005)
            ELSE ${communityAreas.geometry}
          END
        )::json`,
        // Always return centroid for labeling
        centroid: sql<any>`ST_AsGeoJSON(${communityAreas.centroid})::json`,
      })
      .from(communityAreas);

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
          ${communityAreas.geometry},
          ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
        )`
      );
    }

    const communities = await query;

    return NextResponse.json({
      type: 'FeatureCollection',
      features: communities.map((community) => ({
        type: 'Feature',
        id: community.id,
        properties: {
          id: community.id,
          areaNumber: community.areaNumber,
          name: community.name,
          centroid: community.centroid,
          ...community.properties,
        },
        geometry: community.geometry,
      })),
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    
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
      { error: 'Failed to fetch community areas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, areaNumber, geometry, properties } = body;

    // Validate required fields
    if (!name || !areaNumber || !geometry) {
      return NextResponse.json(
        { error: 'Missing required fields: name, areaNumber, and geometry are required' },
        { status: 400 }
      );
    }

    // Validate area number is unique
    const existingArea = await db
      .select({ id: communityAreas.id })
      .from(communityAreas)
      .where(sql`${communityAreas.areaNumber} = ${areaNumber}`)
      .limit(1);

    if (existingArea.length > 0) {
      return NextResponse.json(
        { error: `Community area with number ${areaNumber} already exists` },
        { status: 409 }
      );
    }

    // Validate GeoJSON geometry
    if (!geometry.type || !geometry.coordinates) {
      return NextResponse.json(
        { error: 'Invalid GeoJSON geometry format' },
        { status: 400 }
      );
    }

    const result = await db
      .insert(communityAreas)
      .values({
        name,
        areaNumber,
        geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(geometry)})`,
        centroid: sql`ST_Centroid(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}))`,
        properties,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating community area:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('invalid GeoJSON')) {
        return NextResponse.json(
          { error: 'Invalid GeoJSON geometry provided' },
          { status: 400 }
        );
      }
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'Community area with this number already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create community area' },
      { status: 500 }
    );
  }
}