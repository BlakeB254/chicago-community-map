import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cityBoundaries } from '@/db/schema/spatial';
import { sql, eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const boundaryType = searchParams.get('type');
    const bounds = searchParams.get('bounds');
    const zoom = parseInt(searchParams.get('zoom') || '11');

    // Validate zoom level
    if (isNaN(zoom) || zoom < 1 || zoom > 20) {
      return NextResponse.json(
        { error: 'Invalid zoom level. Must be between 1 and 20.' },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = [];
    
    if (boundaryType) {
      const validTypes = ['city', 'ward', 'district'];
      if (!validTypes.includes(boundaryType)) {
        return NextResponse.json(
          { error: 'Invalid boundary type. Must be one of: city, ward, district' },
          { status: 400 }
        );
      }
      conditions.push(eq(cityBoundaries.boundaryType, boundaryType));
    }

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

      conditions.push(sql`ST_Intersects(
        ${cityBoundaries.geometry},
        ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
      )`);
    }

    // Execute query with all conditions  
    const baseQuery = db.select({
      id: cityBoundaries.id,
      name: cityBoundaries.name,
      boundaryType: cityBoundaries.boundaryType,
      properties: cityBoundaries.properties,
      // Return simplified geometry based on zoom level
      geometry: sql<any>`ST_AsGeoJSON(
        CASE 
          WHEN ${zoom} < 12 THEN ST_Simplify(${cityBoundaries.geometry}, 0.001)
          WHEN ${zoom} < 14 THEN ST_Simplify(${cityBoundaries.geometry}, 0.0005)
          ELSE ${cityBoundaries.geometry}
        END
      )::json`,
    }).from(cityBoundaries) as any;

    // Apply conditions and execute query
    const boundaries = conditions.length > 0 
      ? await baseQuery.where(and(...conditions))
      : await baseQuery;

    return NextResponse.json({
      type: 'FeatureCollection',
      features: boundaries.map((boundary: any) => ({
        type: 'Feature',
        id: boundary.id,
        properties: {
          id: boundary.id,
          name: boundary.name,
          boundaryType: boundary.boundaryType,
          ...(boundary.properties || {}),
        },
        geometry: boundary.geometry,
      })),
    });
  } catch (error) {
    console.error('Error fetching boundaries:', error);
    
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
      { error: 'Failed to fetch city boundaries' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, boundaryType, geometry, properties } = body;

    // Validate required fields
    if (!name || !boundaryType || !geometry) {
      return NextResponse.json(
        { error: 'Missing required fields: name, boundaryType, and geometry are required' },
        { status: 400 }
      );
    }

    // Validate boundary type
    const validTypes = ['city', 'ward', 'district'];
    if (!validTypes.includes(boundaryType)) {
      return NextResponse.json(
        { error: 'Invalid boundary type. Must be one of: city, ward, district' },
        { status: 400 }
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
      .insert(cityBoundaries)
      .values({
        name,
        boundaryType,
        geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(geometry)})`,
        properties,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating city boundary:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('invalid GeoJSON')) {
        return NextResponse.json(
          { error: 'Invalid GeoJSON geometry provided' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create city boundary' },
      { status: 500 }
    );
  }
}