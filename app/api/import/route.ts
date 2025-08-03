import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communityAreas, cityBoundaries, landmarks } from '@/db/schema/spatial';
import { normalizeGeoJSON, validateChicagoBounds } from '@/lib/geo-utils';
import { sql, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { dataType, source, data } = await request.json();

    switch (dataType) {
      case 'chicago-portal-communities':
        return await importChicagoPortalCommunities();
      
      case 'chicago-portal-boundaries':
        return await importChicagoPortalBoundaries();
      
      case 'local-geojson':
        return await importLocalGeoJSON(data, source);
      
      default:
        return NextResponse.json(
          { error: 'Unsupported data type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function importChicagoPortalCommunities() {
  try {
    // Fetch from Chicago Data Portal
    const response = await fetch(
      'https://data.cityofchicago.org/resource/igwz-8jzy.geojson'
    );
    
    if (!response.ok) {
      throw new Error(`Chicago Data Portal API error: ${response.status}`);
    }

    const geojson = await response.json();
    let imported = 0;
    let skipped = 0;
    const errors = [];

    // Process each community area
    for (const feature of geojson.features) {
      try {
        // Validate coordinates are within Chicago bounds
        if (!validateChicagoBounds(feature.geometry)) {
          skipped++;
          continue;
        }

        // Normalize GeoJSON
        const normalized = normalizeGeoJSON(feature);

        // Check if community area already exists
        const existing = await db
          .select({ id: communityAreas.id })
          .from(communityAreas)
          .where(eq(communityAreas.areaNumber, feature.properties.area_numbe))
          .limit(1);

        if (existing.length > 0) {
          // Update existing
          await db
            .update(communityAreas)
            .set({
              name: feature.properties.community,
              geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
              centroid: sql`ST_Centroid(ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)}))`,
              properties: feature.properties,
              updatedAt: sql`NOW()`,
            })
            .where(eq(communityAreas.areaNumber, feature.properties.area_numbe));
        } else {
          // Insert new
          await db.insert(communityAreas).values({
            areaNumber: feature.properties.area_numbe,
            name: feature.properties.community,
            geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
            centroid: sql`ST_Centroid(ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)}))`,
            properties: feature.properties,
          });
        }

        imported++;
      } catch (featureError) {
        errors.push({
          feature: feature.properties.community || 'Unknown',
          error: featureError instanceof Error ? featureError.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
      message: `Imported ${imported} community areas from Chicago Data Portal`,
    });
  } catch (error) {
    throw new Error(`Failed to import Chicago Portal communities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function importChicagoPortalBoundaries() {
  try {
    // Fetch city boundaries from Chicago Data Portal
    const response = await fetch(
      'https://data.cityofchicago.org/resource/qqq9-ngh9.geojson'
    );
    
    if (!response.ok) {
      throw new Error(`Chicago Data Portal API error: ${response.status}`);
    }

    const geojson = await response.json();
    let imported = 0;

    for (const feature of geojson.features) {
      const normalized = normalizeGeoJSON(feature);

      try {
        await db.insert(cityBoundaries).values({
          name: feature.properties.name || 'Chicago City Boundary',
          boundaryType: 'city',
          geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
          properties: feature.properties,
        });
      } catch (insertError) {
        // Skip if already exists (duplicate constraint error)
        if ((insertError instanceof Error && insertError.message?.includes('duplicate')) || 
            (insertError instanceof Error && insertError.message?.includes('unique'))) {
          continue;
        }
        throw insertError;
      }

      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      message: `Imported ${imported} city boundaries from Chicago Data Portal`,
    });
  } catch (error) {
    throw new Error(`Failed to import Chicago Portal boundaries: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function importLocalGeoJSON(data: any, source: string) {
  try {
    if (!data || !data.features) {
      throw new Error('Invalid GeoJSON format');
    }

    let imported = 0;
    const errors = [];

    for (const feature of data.features) {
      try {
        // Validate and normalize
        if (!validateChicagoBounds(feature.geometry)) {
          continue;
        }

        const normalized = normalizeGeoJSON(feature);

        // Determine what type of feature this is based on properties
        if (feature.properties.area_numbe || feature.properties.community) {
          // Community area
          await db.insert(communityAreas).values({
            areaNumber: feature.properties.area_numbe || imported + 1,
            name: feature.properties.community || feature.properties.name,
            geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
            centroid: sql`ST_Centroid(ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)}))`,
            properties: feature.properties,
          });
        } else if (feature.geometry.type === 'Point') {
          // Landmark
          await db.insert(landmarks).values({
            name: feature.properties.name || 'Unknown Landmark',
            category: feature.properties.category || 'general',
            location: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
            iconType: feature.properties.icon_type || 'marker',
            properties: feature.properties,
          });
        } else {
          // City boundary
          await db.insert(cityBoundaries).values({
            name: feature.properties.name || 'Boundary',
            boundaryType: feature.properties.boundary_type || 'district',
            geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
            properties: feature.properties,
          });
        }

        imported++;
      } catch (featureError) {
        errors.push({
          feature: feature.properties.name || 'Unknown',
          error: featureError instanceof Error ? featureError.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      message: `Imported ${imported} features from ${source}`,
    });
  } catch (error) {
    throw new Error(`Failed to import local GeoJSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}