'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { MapSkeleton } from '@/components/atoms/map-skeleton';

// Dynamically import map component to avoid SSR issues with Leaflet
const ChicagoMap = dynamic(
  () => import('@/components/organisms/map/ChicagoMap').then((mod) => mod.ChicagoMap),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  }
);

export default function MapPage() {
  return (
    <div className="h-screen w-full">
      <Suspense fallback={<MapSkeleton />}>
        <ChicagoMap />
      </Suspense>
    </div>
  );
}