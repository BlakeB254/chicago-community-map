/**
 * Chicago Data Portal API utilities and constants
 */

// Chicago Data Portal API endpoints
export const CHICAGO_DATA_ENDPOINTS = {
  // Community Areas (77 official areas)
  COMMUNITY_AREAS: 'https://data.cityofchicago.org/resource/igwz-8jzy.geojson',
  
  // City Boundaries
  CITY_BOUNDARIES: 'https://data.cityofchicago.org/resource/qqq9-ngh9.geojson',
  
  // Major Streets
  MAJOR_STREETS: 'https://data.cityofchicago.org/resource/ueqs-5ydp.geojson',
  
  // Wards (50 political divisions)
  WARDS: 'https://data.cityofchicago.org/resource/k9yb-bpqx.geojson',
  
  // Police Districts
  POLICE_DISTRICTS: 'https://data.cityofchicago.org/resource/fthy-xz3r.geojson',
  
  // Public Schools
  PUBLIC_SCHOOLS: 'https://data.cityofchicago.org/resource/kh4p-bqrm.geojson',
  
  // Parks
  PARKS: 'https://data.cityofchicago.org/resource/nej4-ba65.geojson',
  
  // CTA Bus Stops
  BUS_STOPS: 'https://data.cityofchicago.org/resource/mq3i-nnqe.geojson',
  
  // CTA Train Stations
  TRAIN_STATIONS: 'https://data.cityofchicago.org/resource/8pix-ypme.geojson',
};

// Chicago community area names and numbers (official mapping)
export const COMMUNITY_AREAS = {
  1: 'Rogers Park',
  2: 'West Ridge',
  3: 'Uptown',
  4: 'Lincoln Square',
  5: 'North Center',
  6: 'Lake View',
  7: 'Lincoln Park',
  8: 'Near North Side',
  9: 'Edison Park',
  10: 'Norwood Park',
  11: 'Jefferson Park',
  12: 'Forest Glen',
  13: 'North Park',
  14: 'Albany Park',
  15: 'Portage Park',
  16: 'Irving Park',
  17: 'Dunning',
  18: 'Montclare',
  19: 'Belmont Cragin',
  20: 'Hermosa',
  21: 'Avondale',
  22: 'Logan Square',
  23: 'Humboldt Park',
  24: 'West Town',
  25: 'Austin',
  26: 'West Garfield Park',
  27: 'East Garfield Park',
  28: 'Near West Side',
  29: 'North Lawndale',
  30: 'South Lawndale',
  31: 'Lower West Side',
  32: 'Loop',
  33: 'Near South Side',
  34: 'Armour Square',
  35: 'Douglas',
  36: 'Oakland',
  37: 'Fuller Park',
  38: 'Grand Boulevard',
  39: 'Kenwood',
  40: 'Washington Park',
  41: 'Hyde Park',
  42: 'Woodlawn',
  43: 'South Shore',
  44: 'Chatham',
  45: 'Avalon Park',
  46: 'South Chicago',
  47: 'Burnside',
  48: 'Calumet Heights',
  49: 'Roseland',
  50: 'Pullman',
  51: 'South Deering',
  52: 'East Side',
  53: 'West Pullman',
  54: 'Riverdale',
  55: 'Hegewisch',
  56: 'Garfield Ridge',
  57: 'Archer Heights',
  58: 'Brighton Park',
  59: 'McKinley Park',
  60: 'Bridgeport',
  61: 'New City',
  62: 'West Elsdon',
  63: 'Gage Park',
  64: 'Clearing',
  65: 'West Lawn',
  66: 'Chicago Lawn',
  67: 'West Englewood',
  68: 'Englewood',
  69: 'Greater Grand Crossing',
  70: 'Ashburn',
  71: 'Auburn Gresham',
  72: 'Beverly',
  73: 'Washington Heights',
  74: 'Mount Greenwood',
  75: 'Morgan Park',
  76: 'O\'Hare',
  77: 'Edgewater',
} as const;

// Landmark categories for consistent classification
export const LANDMARK_CATEGORIES = {
  EDUCATION: 'education',
  HEALTHCARE: 'healthcare',
  PARKS: 'parks',
  TRANSIT: 'transit',
  GOVERNMENT: 'government',
  CULTURE: 'culture',
  SHOPPING: 'shopping',
  DINING: 'dining',
  HOUSING: 'housing',
  BUSINESS: 'business',
  RELIGIOUS: 'religious',
  SPORTS: 'sports',
} as const;

// Icon mapping for different landmark types
export const LANDMARK_ICONS = {
  [LANDMARK_CATEGORIES.EDUCATION]: 'school',
  [LANDMARK_CATEGORIES.HEALTHCARE]: 'hospital',
  [LANDMARK_CATEGORIES.PARKS]: 'tree-pine',
  [LANDMARK_CATEGORIES.TRANSIT]: 'train',
  [LANDMARK_CATEGORIES.GOVERNMENT]: 'building-2',
  [LANDMARK_CATEGORIES.CULTURE]: 'palette',
  [LANDMARK_CATEGORIES.SHOPPING]: 'shopping-bag',
  [LANDMARK_CATEGORIES.DINING]: 'utensils',
  [LANDMARK_CATEGORIES.HOUSING]: 'home',
  [LANDMARK_CATEGORIES.BUSINESS]: 'briefcase',
  [LANDMARK_CATEGORIES.RELIGIOUS]: 'church',
  [LANDMARK_CATEGORIES.SPORTS]: 'trophy',
} as const;

// Colors for different map layers
export const MAP_COLORS = {
  COMMUNITY_AREAS: {
    fill: 'rgba(59, 130, 246, 0.1)',
    stroke: 'rgb(59, 130, 246)',
    strokeWidth: 2,
  },
  CITY_BOUNDARIES: {
    fill: 'rgba(239, 68, 68, 0.05)',
    stroke: 'rgb(239, 68, 68)',
    strokeWidth: 3,
  },
  WARDS: {
    fill: 'rgba(34, 197, 94, 0.1)',
    stroke: 'rgb(34, 197, 94)',
    strokeWidth: 1,
  },
  MAJOR_STREETS: {
    stroke: 'rgb(107, 114, 128)',
    strokeWidth: 2,
  },
} as const;

/**
 * Fetch data from Chicago Data Portal
 */
export async function fetchChicagoData(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Chicago Data Portal API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Chicago data:', error);
    throw error;
  }
}

/**
 * Get community area name by number
 */
export function getCommunityAreaName(areaNumber: number): string {
  return COMMUNITY_AREAS[areaNumber as keyof typeof COMMUNITY_AREAS] || `Area ${areaNumber}`;
}

/**
 * Get community area number by name (case-insensitive)
 */
export function getCommunityAreaNumber(name: string): number | null {
  const normalizedName = name.toLowerCase().trim();
  
  for (const [number, areaName] of Object.entries(COMMUNITY_AREAS)) {
    if (areaName.toLowerCase() === normalizedName) {
      return parseInt(number);
    }
  }
  
  return null;
}

/**
 * Get icon for landmark category
 */
export function getLandmarkIcon(category: string): string {
  const categoryKey = category.toLowerCase() as keyof typeof LANDMARK_ICONS;
  return LANDMARK_ICONS[categoryKey] || 'map-pin';
}

/**
 * Parse Chicago Data Portal GeoJSON properties
 */
export function parseChicagoProperties(properties: any, dataType: 'community' | 'boundary' | 'landmark') {
  switch (dataType) {
    case 'community':
      return {
        areaNumber: properties.area_numbe || properties.area_number,
        name: properties.community || properties.pri_neigh,
        shape_area: properties.shape_area,
        shape_len: properties.shape_len,
        perimeter: properties.perimeter,
      };
    
    case 'boundary':
      return {
        name: properties.name || properties.objectid,
        boundaryType: properties.type || 'boundary',
        ward: properties.ward,
        district: properties.district,
      };
    
    case 'landmark':
      return {
        name: properties.name || properties.school_nm || properties.park_name,
        address: properties.address || properties.school_add,
        category: properties.category || 'general',
        phone: properties.phone,
        website: properties.website,
      };
    
    default:
      return properties;
  }
}