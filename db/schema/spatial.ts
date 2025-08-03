import { pgTable, text, jsonb, integer, timestamp, uuid, index, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom geometry type for PostGIS
const geometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry';
  },
});

// Enable PostGIS extension
// CREATE EXTENSION IF NOT EXISTS postgis;

export const communityAreas = pgTable('community_areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  areaNumber: integer('area_number').notNull().unique(),
  name: text('name').notNull(),
  // Store PostGIS geometry (Polygon/MultiPolygon type, SRID 4326)
  geometry: geometry('geometry').notNull(),
  // Store additional properties from Chicago Data Portal
  properties: jsonb('properties'),
  // Computed centroid for label placement (Point type, SRID 4326)
  centroid: geometry('centroid'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  // Regular B-tree indexes for other columns
  nameIdx: index('community_name_idx').on(table.name),
  areaNumberIdx: index('community_area_number_idx').on(table.areaNumber)
}));

export const cityBoundaries = pgTable('city_boundaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  boundaryType: text('boundary_type').notNull(), // 'city', 'ward', 'district'
  // Store PostGIS geometry (MultiPolygon type, SRID 4326)
  geometry: geometry('geometry').notNull(),
  properties: jsonb('properties'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  typeIdx: index('boundary_type_idx').on(table.boundaryType)
}));

export const roads = pgTable('roads', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  roadType: text('road_type'), // 'highway', 'major', 'minor'
  // Store PostGIS geometry (LineString/MultiLineString type, SRID 4326)
  geometry: geometry('geometry').notNull(),
  properties: jsonb('properties'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  typeIdx: index('road_type_idx').on(table.roadType)
}));

export const landmarks = pgTable('landmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'school', 'hospital', 'park', 'transit', etc.
  // Store PostGIS geometry (Point type, SRID 4326)
  location: geometry('location').notNull(),
  communityAreaId: uuid('community_area_id').references(() => communityAreas.id),
  iconType: text('icon_type').default('marker'), // 'marker', 'school', 'hospital', etc.
  properties: jsonb('properties'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  categoryIdx: index('landmark_category_idx').on(table.category),
  communityIdx: index('landmark_community_idx').on(table.communityAreaId)
}));

// Type definitions for TypeScript
export type CommunityArea = typeof communityAreas.$inferSelect;
export type NewCommunityArea = typeof communityAreas.$inferInsert;

export type CityBoundary = typeof cityBoundaries.$inferSelect;
export type NewCityBoundary = typeof cityBoundaries.$inferInsert;

export type Road = typeof roads.$inferSelect;
export type NewRoad = typeof roads.$inferInsert;

export type Landmark = typeof landmarks.$inferSelect;
export type NewLandmark = typeof landmarks.$inferInsert;