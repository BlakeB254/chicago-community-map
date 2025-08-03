import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { landmarks } from '@/db/schema/spatial';
import { sql, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bounds = searchParams.get('bounds');
    const zoom = parseInt(searchParams.get('zoom') || '11');
    const category = searchParams.get('category');

    // Validate zoom level
    if (isNaN(zoom) || zoom < 1 || zoom > 20) {
      return NextResponse.json(
        { error: 'Invalid zoom level. Must be between 1 and 20.' },
        { status: 400 }
      );
    }

    let query = db
      .select({
        id: landmarks.id,
        name: landmarks.name,
        category: landmarks.category,
        iconType: landmarks.iconType,
        properties: landmarks.properties,
        communityAreaId: landmarks.communityAreaId,
        location: sql<any>`ST_AsGeoJSON(${landmarks.location})::json`,
      })
      .from(landmarks);

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
        sql`ST_Within(
          ${landmarks.location},
          ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
        )`
      );
    }

    // Filter by category if specified
    if (category) {
      const validCategories = ['school', 'hospital', 'park', 'transit', 'library', 'government', 'restaurant', 'shopping'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
      query = query.where(eq(landmarks.category, category));
    }

    const landmarkData = await query;

    return NextResponse.json({
      type: 'FeatureCollection',
      features: landmarkData.map((landmark) => ({
        type: 'Feature',
        id: landmark.id,
        properties: {
          id: landmark.id,
          name: landmark.name,
          category: landmark.category,
          iconType: landmark.iconType,
          communityAreaId: landmark.communityAreaId,
          ...landmark.properties,
        },
        geometry: landmark.location,
      })),
    });
  } catch (error) {
    console.error('Error fetching landmarks:', error);
    
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
      { error: 'Failed to fetch landmarks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, location, communityAreaId, iconType, properties } = body;

    // Validate required fields
    if (!name || !category || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, and location are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['school', 'hospital', 'park', 'transit', 'library', 'government', 'restaurant', 'shopping'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate icon type if provided
    if (iconType) {
      const validIconTypes = ['marker', 'school', 'hospital', 'park', 'transit', 'library', 'government', 'restaurant', 'shopping'];
      if (!validIconTypes.includes(iconType)) {
        return NextResponse.json(
          { error: `Invalid icon type. Must be one of: ${validIconTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate GeoJSON geometry (should be Point)
    if (!location.type || location.type !== 'Point' || !location.coordinates) {
      return NextResponse.json(
        { error: 'Invalid GeoJSON Point geometry format' },
        { status: 400 }
      );
    }

    const result = await db
      .insert(landmarks)
      .values({
        name,
        category,
        location: sql`ST_GeomFromGeoJSON(${JSON.stringify(location)})`,
        communityAreaId,
        iconType: iconType || 'marker',
        properties,
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating landmark:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('invalid GeoJSON')) {
        return NextResponse.json(
          { error: 'Invalid GeoJSON geometry provided' },
          { status: 400 }
        );
      }
      if (error.message.includes('foreign key')) {
        return NextResponse.json(
          { error: 'Invalid community area ID provided' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create landmark' },
      { status: 500 }
    );
  }
}