import { db, dbRead } from '@/lib/db';
import { communityAreas, cityBoundaries, landmarks, roads } from '@/db/schema/spatial';
import { sql, eq, and, or } from 'drizzle-orm';

// Define bounds type for geographic queries
export interface LatLngBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Get community areas within specified bounds with zoom-based simplification
 */
export async function getCommunityAreasForBounds(bounds: LatLngBounds, zoom: number = 11) {
  const simplifyTolerance = getSimplifyTolerance(zoom);
  
  return dbRead
    .select({
      id: communityAreas.id,
      areaNumber: communityAreas.areaNumber,
      name: communityAreas.name,
      properties: communityAreas.properties,
      geometry: sql<any>`ST_AsGeoJSON(
        ST_Simplify(
          ${communityAreas.geometry}, 
          ${simplifyTolerance}
        )
      )::json`,
      centroid: sql<any>`ST_AsGeoJSON(${communityAreas.centroid})::json`,
    })
    .from(communityAreas)
    .where(
      sql`ST_Intersects(
        ${communityAreas.geometry},
        ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326)
      )`
    );
}

/**
 * Get city boundaries within specified bounds
 */
export async function getCityBoundariesForBounds(
  bounds: LatLngBounds, 
  boundaryType?: string,
  zoom: number = 11
) {
  const simplifyTolerance = getSimplifyTolerance(zoom);
  
  let query = dbRead
    .select({
      id: cityBoundaries.id,
      name: cityBoundaries.name,
      boundaryType: cityBoundaries.boundaryType,
      properties: cityBoundaries.properties,
      geometry: sql<any>`ST_AsGeoJSON(
        ST_Simplify(
          ${cityBoundaries.geometry}, 
          ${simplifyTolerance}
        )
      )::json`,
    })
    .from(cityBoundaries)
    .where(
      sql`ST_Intersects(
        ${cityBoundaries.geometry},
        ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326)
      )`
    );

  if (boundaryType) {
    query = query.where(eq(cityBoundaries.boundaryType, boundaryType));
  }

  return query;
}

/**
 * Get landmarks within specified bounds
 */
export async function getLandmarksForBounds(bounds: LatLngBounds, category?: string) {
  let query = dbRead
    .select({
      id: landmarks.id,
      name: landmarks.name,
      category: landmarks.category,
      iconType: landmarks.iconType,
      properties: landmarks.properties,
      communityAreaId: landmarks.communityAreaId,
      location: sql<any>`ST_AsGeoJSON(${landmarks.location})::json`,
    })
    .from(landmarks)
    .where(
      sql`ST_Within(
        ${landmarks.location},
        ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326)
      )`
    );

  if (category) {
    query = query.where(eq(landmarks.category, category));
  }

  return query;
}

/**
 * Get roads within specified bounds
 */
export async function getRoadsForBounds(
  bounds: LatLngBounds, 
  roadType?: string,
  zoom: number = 11
) {
  const simplifyTolerance = getSimplifyTolerance(zoom);
  
  let query = dbRead
    .select({
      id: roads.id,
      name: roads.name,
      roadType: roads.roadType,
      properties: roads.properties,
      geometry: sql<any>`ST_AsGeoJSON(
        ST_Simplify(
          ${roads.geometry}, 
          ${simplifyTolerance}
        )
      )::json`,
    })
    .from(roads)
    .where(
      sql`ST_Intersects(
        ${roads.geometry},
        ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326)
      )`
    );

  if (roadType) {
    query = query.where(eq(roads.roadType, roadType));
  }

  return query;
}

/**
 * Get community area by area number
 */
export async function getCommunityAreaByNumber(areaNumber: number) {
  const result = await dbRead
    .select({
      id: communityAreas.id,
      areaNumber: communityAreas.areaNumber,
      name: communityAreas.name,
      properties: communityAreas.properties,
      geometry: sql<any>`ST_AsGeoJSON(${communityAreas.geometry})::json`,
      centroid: sql<any>`ST_AsGeoJSON(${communityAreas.centroid})::json`,
    })
    .from(communityAreas)
    .where(eq(communityAreas.areaNumber, areaNumber))
    .limit(1);

  return result[0] || null;
}

/**
 * Get landmarks within a specific community area
 */
export async function getLandmarksInCommunityArea(communityAreaId: string) {
  return dbRead
    .select({
      id: landmarks.id,
      name: landmarks.name,
      category: landmarks.category,
      iconType: landmarks.iconType,
      properties: landmarks.properties,
      location: sql<any>`ST_AsGeoJSON(${landmarks.location})::json`,
    })
    .from(landmarks)
    .where(eq(landmarks.communityAreaId, communityAreaId));
}

/**
 * Search community areas by name
 */
export async function searchCommunityAreas(searchTerm: string) {
  return dbRead
    .select({
      id: communityAreas.id,
      areaNumber: communityAreas.areaNumber,
      name: communityAreas.name,
      properties: communityAreas.properties,
      centroid: sql<any>`ST_AsGeoJSON(${communityAreas.centroid})::json`,
    })
    .from(communityAreas)
    .where(
      sql`${communityAreas.name} ILIKE ${'%' + searchTerm + '%'}`
    )
    .orderBy(communityAreas.name);
}

/**
 * Calculate simplification tolerance based on zoom level
 */
function getSimplifyTolerance(zoom: number): number {
  if (zoom < 10) return 0.01;   // Very simplified for overview
  if (zoom < 12) return 0.001;  // Simplified for city level
  if (zoom < 14) return 0.0005; // Moderate detail for neighborhood level
  if (zoom < 16) return 0.0001; // High detail for street level
  return 0.00005; // Maximum detail for close zoom
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [communityCount] = await dbRead
    .select({ count: sql`COUNT(*)`.as('count') })
    .from(communityAreas);

  const [boundaryCount] = await dbRead
    .select({ count: sql`COUNT(*)`.as('count') })
    .from(cityBoundaries);

  const [landmarkCount] = await dbRead
    .select({ count: sql`COUNT(*)`.as('count') })
    .from(landmarks);

  const [roadCount] = await dbRead
    .select({ count: sql`COUNT(*)`.as('count') })
    .from(roads);

  return {
    communityAreas: Number(communityCount.count),
    cityBoundaries: Number(boundaryCount.count),
    landmarks: Number(landmarkCount.count),
    roads: Number(roadCount.count),
  };
}