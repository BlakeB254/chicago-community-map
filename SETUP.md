# Chicago Community Map - Setup Guide

A modern, interactive mapping application showcasing Chicago's 77 community areas, built with Next.js 15, React Leaflet, PostGIS, and Neon Database.

## Features Completed ✅

### Database & Backend
- **PostGIS Integration**: Full spatial database with geometry columns and spatial indexes
- **Neon Database**: Cloud PostgreSQL with PostGIS extension
- **Proper Schema**: Community areas, city boundaries, roads, and landmarks tables
- **Spatial Queries**: Optimized PostGIS queries with zoom-based simplification
- **API Routes**: RESTful endpoints with proper validation and error handling

### Frontend & UI
- **Next.js 15**: Latest React Server Components and App Router
- **React Leaflet**: Interactive map with custom layers and controls
- **Golden Ratio Design**: Consistent spacing and typography based on φ (1.618)
- **Chicago Theme**: City-branded colors and styling
- **Responsive Design**: Mobile-first approach with proper breakpoints

### Map Features
- **Interactive Layers**: Community areas, boundaries, roads, and landmarks
- **Dynamic Loading**: Zoom-based data fetching and geometry simplification
- **Hover Effects**: Contextual information on map interaction
- **Custom Styling**: Chicago-themed colors and proper visual hierarchy
- **Performance Optimized**: Canvas rendering and efficient data loading

### Data Import
- **Chicago Data Portal Integration**: Direct import from official city data
- **GeoJSON Processing**: Validation, normalization, and coordinate precision
- **Error Handling**: Comprehensive error reporting and recovery
- **Batch Processing**: Efficient handling of large datasets

## Quick Start

### 1. Environment Setup

Create `.env.local` file (already exists):
```bash
# Neon Database Connection
DATABASE_URL="postgresql://neondb_owner:npg_bKCFR0P9hDZJ@ep-proud-haze-aeslxfnm-pooler.c-2.us-east-2.aws.neon.tech/Map?sslmode=require&channel_binding=require"

# Map Configuration
NEXT_PUBLIC_MAP_DEFAULT_CENTER_LAT=41.8781
NEXT_PUBLIC_MAP_DEFAULT_CENTER_LNG=-87.6298
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=11
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Test the database connection and run migrations:

```bash
npm run db:setup
```

This will:
- Test Neon database connectivity
- Enable PostGIS extension
- Create all required tables with spatial indexes
- Verify PostGIS functions

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 5. Import Chicago Data

1. Navigate to `/data` in the browser
2. Click "Import" for Community Areas and City Boundaries
3. Data will be fetched from Chicago Data Portal and stored in PostGIS

## API Endpoints

### Health Check
- `GET /api/health` - Database and PostGIS health status

### Spatial Data
- `GET /api/communities` - Community areas with bounds filtering
- `GET /api/boundaries` - City boundaries by type
- `GET /api/landmarks` - Points of interest
- `GET /api/roads` - Street network data
- `GET /api/stats` - Database statistics

### Data Import
- `POST /api/import` - Import from Chicago Data Portal or upload GeoJSON

## Database Schema

### Tables Created
- `community_areas` - Chicago's 77 community areas (MultiPolygon)
- `city_boundaries` - Municipal boundaries (MultiPolygon)  
- `roads` - Street network (MultiLineString)
- `landmarks` - Points of interest (Point)

### Spatial Features
- GIST spatial indexes on all geometry columns
- PostGIS functions for efficient spatial queries
- Automatic centroid calculation for community areas
- Geometry validation and normalization

## Architecture

### Frontend
```
components/
├── map/           # Interactive map components
├── data/          # Data import interfaces  
├── layout/        # App layout components
└── ui/            # Reusable UI components

app/
├── api/           # API routes
├── (routes)/      # App pages
└── layout.tsx     # Root layout
```

### Database
```
db/
├── schema/        # Drizzle ORM schemas
├── queries/       # Spatial query functions
└── migrations/    # Database migrations

lib/
├── db.ts          # Database connection
├── geo-utils.ts   # Spatial utilities
└── utils.ts       # General utilities
```

## Design System

### Golden Ratio Spacing
Based on φ = 1.618, using Fibonacci sequence:
- `phi-1` (2px) through `phi-13` (610px)
- Typography scale: 10px → 68px
- Container widths: 618px, 1000px, 1618px

### Chicago Color Theme
- Blue: `#003f7f` (Chicago flag blue)
- Red: `#c8102e` (Chicago flag red)  
- Gold: `#ffd100` (Chicago flag star)
- Green: `#009639` (Chicago parks)

## Performance Features

### Map Optimization
- Canvas rendering for better performance
- Zoom-based geometry simplification
- Lazy loading of map components
- Bounds-based data fetching

### Database Optimization
- Spatial indexes (GIST) on all geometry columns
- Read replica support for scaling
- Connection pooling with Neon
- Prepared statements for security

## Development Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:setup         # Setup database and run migrations
npm run db:test          # Test database connection
npm run db:studio        # Open Drizzle Studio
npm run db:generate      # Generate migrations
npm run db:push          # Push schema changes
```

## Next Steps

### Adding New Features
1. **Additional Layers**: Transit stops, bike lanes, zoning data
2. **Search**: Full-text search for community areas and landmarks
3. **Analytics**: Usage tracking and performance monitoring
4. **Authentication**: User accounts and saved maps

### Data Sources
- [Chicago Data Portal](https://data.cityofchicago.org/) - Official city data
- [Cook County GIS](https://datacatalog.cookcountyil.gov/) - Regional data
- [Census API](https://www.census.gov/data/developers/data-sets.html) - Demographics

## Support

For issues with:
- **Database**: Check Neon dashboard and connection string
- **Maps**: Verify Leaflet CSS is loading properly
- **Data Import**: Check Chicago Data Portal API status
- **PostGIS**: Ensure extension is enabled in database

All major features are now complete and the application is ready for production use!