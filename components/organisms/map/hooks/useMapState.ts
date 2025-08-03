'use client';

import { useState, useCallback } from 'react';
import type { CommunityArea } from '@/db/schema/spatial';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface VisibleLayers {
  communities: boolean;
  boundaries: boolean;
  roads: boolean;
  landmarks: boolean;
}

export interface MapState {
  selectedCommunity: CommunityArea | null;
  visibleLayers: VisibleLayers;
  zoom: number;
  bounds: MapBounds | null;
}

const DEFAULT_VISIBLE_LAYERS: VisibleLayers = {
  communities: true,
  boundaries: true,
  roads: false,
  landmarks: true,
};

export function useMapState() {
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityArea | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<VisibleLayers>(DEFAULT_VISIBLE_LAYERS);
  const [zoom, setZoom] = useState<number>(11);
  const [bounds, setBounds] = useState<MapBounds | null>(null);

  const handleCommunitySelect = useCallback((community: CommunityArea | null) => {
    setSelectedCommunity(community);
  }, []);

  const handleLayerToggle = useCallback((layer: keyof VisibleLayers, visible: boolean) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layer]: visible,
    }));
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
  }, []);

  return {
    selectedCommunity,
    visibleLayers,
    zoom,
    bounds,
    setSelectedCommunity: handleCommunitySelect,
    setVisibleLayers,
    setZoom: handleZoomChange,
    setBounds: handleBoundsChange,
    toggleLayer: handleLayerToggle,
  };
}