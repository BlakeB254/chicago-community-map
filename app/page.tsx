'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapSkeleton } from '@/components/atoms/map-skeleton';
import { MapLoadingSkeleton } from '@/components/atoms/MapLoadingSkeleton';
import { AppLayout } from '@/components/templates/layout/AppLayout';
import { Sidebar } from '@/components/templates/layout/Sidebar';
import { TopNavBar } from '@/components/templates/layout/TopNavBar';
import { chicagoParkService } from '@/services/chicagoParkService';
import { Park } from '@/types/park';

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

// Dynamically import Chicago map component
const ChicagoMap = dynamic(
  () => import('@/components/organisms/map/ChicagoMap').then((mod) => ({ default: mod.ChicagoMap })),
  {
    ssr: false,
    loading: () => <MapLoadingSkeleton />,
  }
);

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [communityAreas, setCommunityAreas] = useState<CommunityArea[]>([]);
  const [parks, setParks] = useState<Park[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  // Handle URL parameters for area selection
  useEffect(() => {
    const areaParam = searchParams.get('area');
    if (areaParam) {
      console.log('📍 URL parameter detected, selecting area:', areaParam);
      setSelectedArea(areaParam);
    } else {
      console.log('🌆 No area parameter, clearing selection');
      setSelectedArea(null);
    }
  }, [searchParams]);

  // Clear URL parameters when component mounts (handles return from explore pages)
  useEffect(() => {
    // Check if we're coming from an explore page by checking the referrer
    if (typeof window !== 'undefined' && document.referrer.includes('/explore/')) {
      console.log('🔄 Returning from explore page, clearing URL parameters');
      const url = new URL(window.location.href);
      url.searchParams.delete('area');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Load community areas data
  useEffect(() => {
    const loadCommunityData = async () => {
      try {
        const response = await fetch('/geojson/chicago_community_areas.json');
        if (!response.ok) return;
        const data = await response.json();
        
        const normalizedData = data
          .filter((area: CommunityArea) => area.the_geom && area.area_numbe && area.community)
          .map((area: CommunityArea) => ({ ...area }));

        setCommunityAreas(normalizedData);
      } catch (error) {
        console.error('Error loading community data:', error);
      }
    };

    loadCommunityData();
  }, []);

  // Load parks data
  useEffect(() => {
    const loadParksData = async () => {
      try {
        const parksData = await chicagoParkService.getAllParks();
        setParks(parksData);
      } catch (error) {
        console.error('Error loading parks data:', error);
      }
    };

    loadParksData();
  }, []);

  // Update URL when area is selected/deselected
  const updateURL = (areaNumber: string | null) => {
    const url = new URL(window.location.href);
    if (areaNumber) {
      url.searchParams.set('area', areaNumber);
    } else {
      url.searchParams.delete('area');
    }
    window.history.pushState({}, '', url.toString());
  };

  const handleAreaSelect = (area: CommunityArea) => {
    console.log('🎯 Selecting area from sidebar:', area.community);
    setSelectedArea(area.area_numbe);
    updateURL(area.area_numbe);
  };

  const handleAreaDeselect = () => {
    console.log('❌ Deselecting area from sidebar');
    setSelectedArea(null);
    updateURL(null);
  };

  // Handle area selection from map clicks
  const handleAreaSelectFromMap = (areaNumber: string | null) => {
    console.log('🗺️ HomePage - Area selected from map:', areaNumber);
    console.log('🎯 HomePage - Setting selectedArea to:', areaNumber);
    setSelectedArea(areaNumber);
    updateURL(areaNumber);
  };

  const handleZoomToArea = (area: CommunityArea) => {
    // This will be handled by the map component through selectedArea prop
    console.log('🔍 Zoom to area requested:', area.community);
  };

  return (
    <AppLayout
      topBar={
        <TopNavBar
          showSidebarToggle={!sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
      }
      sidebar={
        sidebarOpen ? (
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            communityAreas={communityAreas}
            parks={parks}
            selectedArea={selectedArea}
            onAreaSelect={handleAreaSelect}
            onAreaDeselect={handleAreaDeselect}
            onZoomToArea={handleZoomToArea}
          />
        ) : null
      }
      mapArea={
        <div className="w-full h-full relative">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-4 left-4 z-30 bg-white shadow-lg border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors"
              aria-label="Open sidebar"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <Suspense fallback={<MapLoadingSkeleton />}>
            <ChicagoMap 
              sidebarOpen={sidebarOpen} 
              selectedAreaFromSidebar={selectedArea}
              onAreaSelectFromMap={handleAreaSelectFromMap}
            />
          </Suspense>
        </div>
      }
    />
  );
}