'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Park } from '@/types/park';
import { MapLoadingSkeleton } from '@/components/atoms/MapLoadingSkeleton';
import { CommunityDetailMap } from '@/components/organisms/map/CommunityDetailMap';
import { ExploreHeader } from '@/components/molecules/ExploreHeader';
import { ExploreSearchBar } from '@/components/molecules/ExploreSearchBar';
import { ExploreTabNavigation } from '@/components/molecules/ExploreTabNavigation';

// Community area interface
interface CommunityArea {
  the_geom: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][];
  };
  area_numbe: string;
  community: string;
  area_num_1: string;
  shape_area: string;
  shape_len: string;
  perimeter: string;
  area: string;
  comarea: string;
  comarea_id: string;
}

interface BusinessEntity {
  id: string;
  name: string;
  category: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  coordinates?: [number, number];
}

interface CommunityEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  description: string;
  category: 'community' | 'government' | 'cultural' | 'recreational' | 'educational';
  organizer?: string;
}

// Dynamically import the map component with better loading
const ChicagoMap = dynamic(
  () => import('@/components/organisms/map/ChicagoMap').then((mod) => ({ default: mod.ChicagoMap })),
  {
    ssr: false,
    loading: () => <MapLoadingSkeleton />,
  }
);

export default function ExplorePage() {
  const params = useParams();
  const router = useRouter();
  const areaNumber = params.areaNumber as string;
  
  const [community, setCommunity] = useState<CommunityArea | null>(null);
  const [communityParks, setCommunityParks] = useState<Park[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'businesses' | 'events' | 'parks'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showParks, setShowParks] = useState<boolean>(true);
  const [showEntities, setShowEntities] = useState<boolean>(true);
  const [showStreets, setShowStreets] = useState<boolean>(true);

  // Handle URL parameters for initial tab selection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['overview', 'businesses', 'events', 'parks'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
      
      // Handle hash fragments for backwards compatibility
      const hash = window.location.hash;
      if (hash === '#details') {
        setActiveTab('businesses');
      }
    }
  }, []);

  useEffect(() => {
    const loadCommunityData = async () => {
      if (!areaNumber) return;

      try {
        // Load community areas data from API
        const communitiesResponse = await fetch(`/api/communities?areaNumber=${areaNumber}`);
        if (!communitiesResponse.ok) {
          throw new Error('Failed to load community data');
        }
        
        const communitiesData = await communitiesResponse.json();
        const communityFeature = communitiesData.features?.[0];
        
        if (communityFeature) {
          // Convert API response to our interface format
          const communityData: CommunityArea = {
            the_geom: communityFeature.geometry,
            area_numbe: communityFeature.properties.areaNumber?.toString() || areaNumber,
            community: communityFeature.properties.name || 'Unknown Community',
            area_num_1: communityFeature.properties.areaNumber?.toString() || areaNumber,
            shape_area: communityFeature.properties.shape_area || '0',
            shape_len: communityFeature.properties.shape_len || '0',
            perimeter: communityFeature.properties.perimeter || '0',
            area: communityFeature.properties.area || '0',
            comarea: communityFeature.properties.areaNumber?.toString() || areaNumber,
            comarea_id: communityFeature.properties.id || areaNumber
          };
          
          setCommunity(communityData);
          
          // Load real parks data (fallback to mock if no API data)
          try {
            const parksResponse = await fetch(`/api/parks?areaNumber=${areaNumber}`);
            if (parksResponse.ok) {
              const parksData = await parksResponse.json();
              setCommunityParks(parksData.parks || []);
            } else {
              // Fallback to mock data
              const mockParks: Park[] = generateMockParks(communityData);
              setCommunityParks(mockParks);
            }
          } catch {
            const mockParks: Park[] = generateMockParks(communityData);
            setCommunityParks(mockParks);
          }

          // Load real business entities (fallback to mock if no API data)
          try {
            const entitiesResponse = await fetch(`/api/businesses?areaNumber=${areaNumber}`);
            if (entitiesResponse.ok) {
              const entitiesData = await entitiesResponse.json();
              setEntities(entitiesData.businesses || []);
            } else {
              // Fallback to mock data
              const mockEntities = generateMockEntities(communityData);
              setEntities(mockEntities);
            }
          } catch {
            const mockEntities = generateMockEntities(communityData);
            setEntities(mockEntities);
          }

          // Load real events (fallback to mock if no API data)
          try {
            const eventsResponse = await fetch(`/api/events?areaNumber=${areaNumber}`);
            if (eventsResponse.ok) {
              const eventsData = await eventsResponse.json();
              setEvents(eventsData.events || []);
            } else {
              // Fallback to mock data
              const mockEvents = generateMockEvents(communityData.community);
              setEvents(mockEvents);
            }
          } catch {
            const mockEvents = generateMockEvents(communityData.community);
            setEvents(mockEvents);
          }
        } else {
          // Fallback to static JSON file if API fails
          const response = await fetch('/geojson/chicago_community_areas.json');
          if (!response.ok) throw new Error('Failed to load community data');
          const communityAreas = await response.json();
          
          const communityData = communityAreas.find(
            (area: CommunityArea) => area.area_numbe === areaNumber
          );

          if (communityData) {
            setCommunity(communityData);
            const mockParks: Park[] = generateMockParks(communityData);
            setCommunityParks(mockParks);
            const mockEntities = generateMockEntities(communityData);
            setEntities(mockEntities);
            const mockEvents = generateMockEvents(communityData.community);
            setEvents(mockEvents);
          }
        }
      } catch (error) {
        console.error('Error loading community data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommunityData();
  }, [areaNumber]);

  const generateMockParks = (community: CommunityArea): Park[] => {
    // Generate 2-5 mock parks per community
    const parkCount = Math.floor(Math.random() * 4) + 2;
    const parks: Park[] = [];
    
    for (let i = 0; i < parkCount; i++) {
      parks.push({
        id: `park-${community.area_numbe}-${i}`,
        name: `${community.community} Park ${i + 1}`,
        address: `${100 + i * 50} Main St, Chicago, IL`,
        coordinates: [41.8781 + (Math.random() - 0.5) * 0.02, -87.6298 + (Math.random() - 0.5) * 0.02],
        communityArea: parseInt(community.area_numbe),
        amenities: ['Playground', 'Walking Path', 'Picnic Area'].slice(0, Math.floor(Math.random() * 3) + 1),
        description: `A beautiful park in ${community.community} with various amenities for the community.`,
        size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as 'small' | 'medium' | 'large'
      });
    }
    
    return parks;
  };

  const generateMockEntities = (community: CommunityArea): BusinessEntity[] => {
    const categories = ['food-beverage', 'retail', 'services', 'healthcare', 'education'];
    const entityCount = Math.floor(Math.random() * 8) + 3;
    const entities: BusinessEntity[] = [];
    
    for (let i = 0; i < entityCount; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      entities.push({
        id: `entity-${community.area_numbe}-${i}`,
        name: `${community.community} ${category.charAt(0).toUpperCase() + category.slice(1)} ${i + 1}`,
        category,
        address: `${200 + i * 75} Main St, Chicago, IL`,
        phone: `(312) 555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        description: `A local ${category.replace('-', ' ')} business serving the ${community.community} community.`,
        coordinates: [41.8781 + (Math.random() - 0.5) * 0.02, -87.6298 + (Math.random() - 0.5) * 0.02]
      });
    }
    
    return entities;
  };

  const generateMockEvents = (communityName: string): CommunityEvent[] => {
    return [
      {
        id: '1',
        title: `${communityName} Community Meeting`,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        time: '7:00 PM - 9:00 PM',
        location: 'Community Center',
        description: 'Monthly community meeting to discuss local issues and upcoming initiatives.',
        category: 'community',
        organizer: `${communityName} Community Association`
      },
      {
        id: '2',
        title: 'Summer Festival',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Two weeks
        time: '12:00 PM - 8:00 PM',
        location: 'Local Park',
        description: 'Annual summer festival with food, music, and family activities.',
        category: 'cultural',
        organizer: 'Parks & Recreation'
      }
    ];
  };

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entity.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredParks = communityParks.filter(park =>
    park.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    park.amenities?.some(amenity => amenity.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      'food-beverage': 'bg-red-100 text-red-800',
      'retail': 'bg-blue-100 text-blue-800',
      'services': 'bg-green-100 text-green-800',
      'healthcare': 'bg-orange-100 text-orange-800',
      'entertainment': 'bg-purple-100 text-purple-800',
      'education': 'bg-cyan-100 text-cyan-800',
      'community': 'bg-green-100 text-green-800',
      'cultural': 'bg-purple-100 text-purple-800',
      'recreational': 'bg-blue-100 text-blue-800',
      'educational': 'bg-cyan-100 text-cyan-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community details...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Community Not Found</h1>
          <p className="text-gray-600 mb-6">
            The community area you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Header */}
      <ExploreHeader 
        communityName={community.community}
        areaNumber={community.area_numbe}
      />

      {/* Tab Navigation */}
      <ExploreTabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          businesses: entities.length,
          events: events.length,
          parks: communityParks.length
        }}
      />

      {/* Search and Filter Bar */}
      <ExploreSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        activeTab={activeTab}
      />

      {/* Content - Enhanced responsive layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Enhanced Map View - Full Width at Top */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Area Overview</h2>
                <p className="text-sm text-gray-600 mt-1">Interactive map of {community.community}</p>
              </div>
              <div className="h-96 lg:h-[500px]">
                <Suspense fallback={<MapLoadingSkeleton />}>
                  <CommunityDetailMap 
                    community={community}
                    className="h-full w-full"
                  />
                </Suspense>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Description */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {community.community} is a vibrant community area in Chicago, offering a diverse mix of residential neighborhoods, local businesses, and recreational opportunities. This area serves as an important part of Chicago's urban landscape.
                  </p>
                </section>

              {/* Neighborhoods/Areas of Interest */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Points of Interest</h2>
                <div className="grid gap-4">
                  {communityParks.slice(0, 3).map((park, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">{park.name}</h3>
                      <p className="text-sm text-gray-600">{park.description || 'A beautiful park space serving the local community.'}</p>
                      {park.amenities && park.amenities.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {park.amenities.slice(0, 3).map((amenity, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Local Businesses */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Local Businesses</h2>
                <div className="grid gap-4">
                  {entities.slice(0, 3).map((entity, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">{entity.name}</h3>
                          <p className="text-sm text-gray-600">{entity.description}</p>
                          {entity.address && (
                            <p className="text-xs text-gray-500 mt-1">{entity.address}</p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {entity.category.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Facts */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Facts</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-sm text-gray-700">Community Area #{community.area_numbe}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm text-gray-700">{entities.length} registered businesses</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span className="text-sm text-gray-700">{communityParks.length} parks and recreational areas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span className="text-sm text-gray-700">{events.length} upcoming community events</span>
                  </li>
                </ul>
              </div>

              {/* Statistics */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 font-medium">Area:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {community.shape_area ? (Number(community.shape_area) / 43560).toFixed(1) + ' acres' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 font-medium">Perimeter:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {community.shape_len ? (Number(community.shape_len) / 5280).toFixed(2) + ' miles' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 font-medium">Parks:</span>
                    <span className="text-sm font-semibold text-gray-900">{communityParks.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 font-medium">Businesses:</span>
                    <span className="text-sm font-semibold text-gray-900">{entities.length}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const mainMapUrl = `/?area=${community.area_numbe}`;
                      window.open(mainMapUrl, '_blank');
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    View on Main Map
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Map
                  </button>
                </div>
              </div>

              </div>

            </div>
          </div>
        )}

        {/* Business Tab */}
        {activeTab === 'businesses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntities.length > 0 ? (
              filteredEntities.map(entity => (
                <div key={entity.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{entity.name}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryColor(entity.category)}`}>
                      {entity.category.replace('-', ' ')}
                    </span>
                  </div>
                  
                  {entity.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {entity.description}
                    </p>
                  )}
                  
                  <div className="space-y-3 text-sm">
                    {entity.address && (
                      <div className="flex items-start gap-3 text-gray-600">
                        <svg className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-2">{entity.address}</span>
                      </div>
                    )}
                    
                    {entity.phone && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${entity.phone}`} className="hover:text-blue-600 transition-colors">
                          {entity.phone}
                        </a>
                      </div>
                    )}
                    
                    {entity.website && (
                      <div className="flex items-center gap-3 text-gray-600">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <a 
                          href={entity.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors truncate"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="max-w-sm mx-auto">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try adjusting your search or filters.' : 'No businesses are registered in this area yet.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <div key={event.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {event.date.toLocaleDateString()} • {event.time}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                    
                    {event.organizer && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {event.organizer}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 text-sm">{event.description}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">
                  {searchTerm ? 'No events found matching your search.' : 'No upcoming events in this area.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Parks Tab */}
        {activeTab === 'parks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParks.length > 0 ? (
              filteredParks.map((park, index) => (
                <div key={park.id || index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{park.name}</h3>
                  
                  {park.address && (
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {park.address}
                    </div>
                  )}
                  
                  {park.amenities && park.amenities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-1">
                        {park.amenities.map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">
                  {searchTerm ? 'No parks found matching your search.' : 'No parks data available for this area.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}