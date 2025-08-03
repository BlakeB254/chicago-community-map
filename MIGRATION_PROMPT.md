# Chicago Community Map - Next.js 15 Migration Project

## Project Overview
Rebuild the Chicago Community Map application from `/Users/codexmetatron/Documents/GitHub/Projects/internal/chicago-community-map` using Next.js 15, TypeScript, Tailwind CSS v4, and Neon DB, following the cdx-starter template structure.

## Agent Usage
Use `claude code --agent frontend-next15` for UI components and `claude code --agent neon-integration` for database setup.

## Core Requirements

### 1. Technology Stack
- Next.js 15 with App Router
- TypeScript with strict typing
- Tailwind CSS v4
- shadcn/ui components
- React Leaflet for mapping
- Neon DB with Drizzle ORM
- PostGIS for geospatial data

### 2. Project Structure (following cdx-starter)
```
chicago-community-map-next15/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── api/
│   │   ├── communities/
│   │   ├── boundaries/
│   │   └── import/
│   └── (routes)/
│       ├── map/
│       ├── communities/
│       └── data/
├── components/
│   ├── map/
│   │   ├── ChicagoMap.tsx
│   │   ├── CommunityLayer.tsx
│   │   ├── BoundaryLayer.tsx
│   │   ├── RoadLayer.tsx
│   │   ├── LandmarkLayer.tsx
│   │   └── CustomMarker.tsx
│   ├── ui/
│   └── layout/
├── lib/
│   ├── db.ts
│   ├── geo-utils.ts
│   └── chicago-data.ts
├── db/
│   ├── schema/
│   │   ├── communities.ts
│   │   ├── boundaries.ts
│   │   ├── landmarks.ts
│   │   └── spatial.ts
│   └── queries/
└── public/
    └── geojson/
```
### 3. Database Schema Design

```typescript
// db/schema/spatial.ts
import { pgTable, text, jsonb, geometry, index } from 'drizzle-orm/pg-core';

// Enable PostGIS extension
// CREATE EXTENSION IF NOT EXISTS postgis;

export const communityAreas = pgTable('community_areas', {
  id: uuid('id').defaultRandom().primaryKey(),
  areaNumber: integer('area_number').notNull().unique(),
  name: text('name').notNull(),
  // Store GeoJSON geometry with PostGIS
  geometry: geometry('geometry', { type: 'Polygon', srid: 4326 }).notNull(),
  // Store additional properties
  properties: jsonb('properties'),
  // Computed centroid for label placement
  centroid: geometry('centroid', { type: 'Point', srid: 4326 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  spatialIdx: index('spatial_idx').using('gist', table.geometry),
  nameIdx: index('name_idx').on(table.name)
}));

export const cityBoundaries = pgTable('city_boundaries', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  boundaryType: text('boundary_type').notNull(), // 'city', 'ward', 'district'
  geometry: geometry('geometry', { type: 'MultiPolygon', srid: 4326 }).notNull(),
  properties: jsonb('properties'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  spatialIdx: index('boundary_spatial_idx').using('gist', table.geometry)
}));

export const roads = pgTable('roads', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  roadType: text('road_type'), // 'highway', 'major', 'minor'
  geometry: geometry('geometry', { type: 'LineString', srid: 4326 }).notNull(),
  properties: jsonb('properties')
}, (table) => ({
  spatialIdx: index('road_spatial_idx').using('gist', table.geometry)
}));

export const landmarks = pgTable('landmarks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  location: geometry('location', { type: 'Point', srid: 4326 }).notNull(),
  communityAreaId: uuid('community_area_id').references(() => communityAreas.id),
  iconType: text('icon_type'),
  properties: jsonb('properties')
}, (table) => ({
  spatialIdx: index('landmark_spatial_idx').using('gist', table.location),
  categoryIdx: index('category_idx').on(table.category)
}));
```
### 4. Geospatial Data Alignment Strategy

**CRITICAL: All spatial data MUST use the same coordinate system and projection**

```typescript
// lib/geo-utils.ts
export const GEO_CONFIG = {
  // Use WGS84 (EPSG:4326) for storage
  SRID: 4326,
  // Chicago bounds for validation
  CHICAGO_BOUNDS: {
    north: 42.023,
    south: 41.644,
    east: -87.524,
    west: -87.940
  },
  // Map projection for display
  MAP_PROJECTION: 'EPSG:3857', // Web Mercator for Leaflet
  // Precision for coordinate storage
  COORDINATE_PRECISION: 6
};

// Validate and normalize GeoJSON
export function normalizeGeoJSON(geojson: any): GeoJSON.Feature {
  // Ensure consistent coordinate precision
  // Validate bounds
  // Fix polygon winding order
  // Return normalized GeoJSON
}

// Convert between projections if needed
export function projectToWebMercator(coords: [number, number]): [number, number] {
  // Transform from EPSG:4326 to EPSG:3857
}
```
### 5. Data Import Strategy

```typescript
// app/api/import/route.ts
import { db } from '@/lib/db';
import { communityAreas, cityBoundaries } from '@/db/schema/spatial';

export async function POST(request: Request) {
  const { dataType, source } = await request.json();
  
  switch (dataType) {
    case 'chicago-portal':
      // Import from Chicago Data Portal API
      const response = await fetch('https://data.cityofchicago.org/resource/igwz-8jzy.geojson');
      const geojson = await response.json();
      
      // Process and validate each feature
      for (const feature of geojson.features) {
        const normalized = normalizeGeoJSON(feature);
        
        // Insert with PostGIS
        await db.insert(communityAreas).values({
          areaNumber: feature.properties.area_numbe,
          name: feature.properties.community,
          geometry: sql`ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)})`,
          centroid: sql`ST_Centroid(ST_GeomFromGeoJSON(${JSON.stringify(normalized.geometry)}))`,
          properties: feature.properties
        });
      }
      break;
      
    case 'local-file':
      // Handle local file upload
      break;
  }
}
```
### 6. Map Component Architecture

```typescript
// components/map/ChicagoMap.tsx
'use client';

import { MapContainer, TileLayer, LayersControl } from 'react-leaflet';
import { CommunityLayer } from './CommunityLayer';
import { BoundaryLayer } from './BoundaryLayer';
import { RoadLayer } from './RoadLayer';
import { LandmarkLayer } from './LandmarkLayer';

const CHICAGO_CENTER: [number, number] = [41.8781, -87.6298];
const INITIAL_ZOOM = 11;

export function ChicagoMap() {
  // Use React context for shared map state
  // Implement zoom-based layer visibility
  // Handle click events consistently across layers
  
  return (
    <MapContainer
      center={CHICAGO_CENTER}
      zoom={INITIAL_ZOOM}
      className="h-full w-full"
      maxBounds={[
        [41.644, -87.940],
        [42.023, -87.524]
      ]}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <LayersControl position="topright">
        <LayersControl.Overlay checked name="City Boundaries">
          <BoundaryLayer />
        </LayersControl.Overlay>
        
        <LayersControl.Overlay checked name="Community Areas">
          <CommunityLayer />
        </LayersControl.Overlay>
        
        <LayersControl.Overlay name="Roads">
          <RoadLayer />
        </LayersControl.Overlay>
        
        <LayersControl.Overlay checked name="Landmarks">
          <LandmarkLayer />
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
}
```
### 7. Sacred Geometry Spacing for UI

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Golden ratio based spacing */
  --spacing-phi-1: 2px;   /* Fibonacci */
  --spacing-phi-2: 3px;
  --spacing-phi-3: 5px;
  --spacing-phi-4: 8px;
  --spacing-phi-5: 13px;
  --spacing-phi-6: 21px;
  --spacing-phi-7: 34px;
  --spacing-phi-8: 55px;
  --spacing-phi-9: 89px;
  
  /* Map container proportions */
  --map-ratio: 1.618;
  --sidebar-width: 377px; /* 610 / 1.618 */
  --header-height: 55px;  /* Fibonacci */
}
```

### 8. Data Accuracy Requirements

1. **Coordinate System Consistency**
   - All data stored in EPSG:4326 (WGS84)
   - Display projection: Web Mercator (EPSG:3857)
   - Validate all coordinates within Chicago bounds

2. **Layer Alignment**
   - Use PostGIS ST_SnapToGrid for coordinate alignment
   - Implement topology validation
   - Ensure polygon boundaries match exactly

3. **Zoom Level Optimization**
   - Simplify geometries for different zoom levels
   - Use ST_Simplify with tolerance based on zoom
   - Cache simplified versions in database

4. **Icon Positioning**
   - Calculate exact positions using ST_Centroid
   - Offset icons based on zoom level
   - Maintain consistent anchor points
### 9. Performance Optimizations

```typescript
// db/queries/spatial.ts
export async function getCommunityAreasForBounds(bounds: LatLngBounds) {
  return db
    .select()
    .from(communityAreas)
    .where(
      sql`ST_Intersects(
        geometry,
        ST_MakeEnvelope(${bounds.west}, ${bounds.south}, ${bounds.east}, ${bounds.north}, 4326)
      )`
    );
}

// Use read replicas for map data
export async function getMapData(bounds: LatLngBounds, zoom: number) {
  const simplifyTolerance = getSimplifyTolerance(zoom);
  
  return dbRead
    .select({
      id: communityAreas.id,
      name: communityAreas.name,
      geometry: sql`ST_AsGeoJSON(ST_Simplify(geometry, ${simplifyTolerance}))::json`
    })
    .from(communityAreas)
    .where(/* bounds check */);
}
```

### 10. File Organization (400 line limit)

Split large components:
- `ChicagoMap.tsx` → Main container (< 100 lines)
- `useMapState.ts` → State management hook
- `useMapLayers.ts` → Layer control logic
- `MapControls.tsx` → UI controls
- `MapLegend.tsx` → Legend component
## Implementation Steps

1. **Set up project structure**
   ```bash
   npx create-next-app@latest chicago-community-map-next15 --typescript --tailwind --app
   cd chicago-community-map-next15
   npm install @neondatabase/serverless drizzle-orm react-leaflet leaflet
   npm install -D @types/leaflet drizzle-kit
   ```

2. **Configure Neon DB**
   - Enable PostGIS extension
   - Set up read replica
   - Configure connection pooling

3. **Import Chicago Data**
   - Fetch from Chicago Data Portal
   - Validate and normalize GeoJSON
   - Store in PostGIS tables

4. **Build map components**
   - Start with base map
   - Add layers incrementally
   - Test alignment at each step

5. **Implement zoom-based features**
   - Dynamic simplification
   - Layer visibility
   - Icon scaling

6. **Add interactivity**
   - Click handlers
   - Hover effects
   - Info panels
## Sacred Geometry UI Examples

```tsx
// Sidebar with golden ratio proportions
<aside className="w-[377px] h-[610px]"> {/* 610 / 1.618 = 377 */}
  <div className="p-phi-7"> {/* 34px padding */}
    <h2 className="text-[34px] leading-[55px]"> {/* Fibonacci sizes */}
      Chicago Communities
    </h2>
    <div className="mt-phi-6 space-y-phi-5"> {/* 21px margin, 13px spacing */}
      {/* Content */}
    </div>
  </div>
</aside>
```

## Key Chicago Data Portal Resources

1. **Community Areas Boundaries**
   - API: `https://data.cityofchicago.org/resource/igwz-8jzy.geojson`
   - Contains 77 community areas with names and boundaries

2. **City Boundaries**
   - API: `https://data.cityofchicago.org/resource/qqq9-ngh9.geojson`
   - Chicago city limits

3. **Major Streets**
   - API: `https://data.cityofchicago.org/resource/ueqs-5ydp.geojson`
   - Major roadways for reference

## Critical Alignment Rules

1. **Always use PostGIS functions for spatial operations**
2. **Store all geometries in EPSG:4326**
3. **Validate coordinates are within Chicago bounds**
4. **Use ST_SnapToGrid to align overlapping boundaries**
5. **Test zoom levels 10-18 for visual accuracy**

Remember:
- Keep all files under 400 lines
- Separate logic from presentation
- Use PostGIS for spatial operations
- Validate all coordinate data
- Apply golden ratio proportions
- Test layer alignment thoroughly