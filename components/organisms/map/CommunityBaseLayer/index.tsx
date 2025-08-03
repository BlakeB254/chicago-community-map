'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { LAYER_POSITIONING } from '@/utils/coordinateSystem';
import { calculateBoundsFromGeometry, calculateCentroidFromGeometry, normalizeGeometry } from '@/utils/geoUtils';
import { 
  createCommunityLayer, 
  updateLayerStyles,
  type LayerStyleConfig 
} from './layerUtils';
import { 
  getAreaStyle, 
  type AreaStyleOptions 
} from './styleUtils';

export interface CommunityData {
  areaNumber: number;
  communityName: string;
  geometry: any;
  bounds: [number, number, number, number];
  centroid: [number, number];
  population?: number;
}

export interface CommunityBaseLayerProps {
  communityAreas: CommunityData[];
  selectedArea: CommunityData | null;
  hoveredArea: CommunityData | null;
  onAreaClick?: (area: CommunityData) => void;
  onAreaMouseOver?: (area: CommunityData) => void;
  onAreaMouseOut?: () => void;
  highlightedAreas?: number[];
  zoomedArea?: CommunityData | null;
  viewMode?: 'normal' | 'zoomed' | 'fullpage';
  interactive?: boolean;
  showPopups?: boolean;
  customStyles?: Partial<LayerStyleConfig>;
}

export const CommunityBaseLayer: React.FC<CommunityBaseLayerProps> = ({
  communityAreas,
  selectedArea,
  hoveredArea,
  onAreaClick,
  onAreaMouseOver,
  onAreaMouseOut,
  highlightedAreas = [],
  zoomedArea,
  viewMode = 'normal',
  interactive = true,
  showPopups = true,
  customStyles = {}
}) => {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const layersMapRef = useRef<Map<number, L.GeoJSON>>(new Map());

  // Memoize style options for performance
  const styleOptions = useMemo<AreaStyleOptions>(() => ({
    selectedAreaNumber: selectedArea?.areaNumber,
    hoveredAreaNumber: hoveredArea?.areaNumber,
    highlightedAreas,
    zoomedAreaNumber: zoomedArea?.areaNumber,
    viewMode,
    customStyles
  }), [selectedArea, hoveredArea, highlightedAreas, zoomedArea, viewMode, customStyles]);

  // Create custom pane for community boundaries with proper synchronization
  useEffect(() => {
    if (!map) return;

    if (!map.getPane('communityBoundaries')) {
      const boundaryPane = map.createPane('communityBoundaries');
      boundaryPane.style.zIndex = LAYER_POSITIONING.zIndex.community_boundaries.toString();
      boundaryPane.style.pointerEvents = interactive ? 'auto' : 'none';
      
      // Critical: Ensure pane renders in same context as tiles to prevent displacement
      boundaryPane.style.transform = 'translate3d(0,0,0)';
      boundaryPane.style.backfaceVisibility = 'hidden';
      boundaryPane.style.transformOrigin = '0 0';
      boundaryPane.style.willChange = 'transform';
      boundaryPane.style.position = 'absolute';
      boundaryPane.style.top = '0';
      boundaryPane.style.left = '0';
    } else {
      // Update pointer events if pane already exists
      const boundaryPane = map.getPane('communityBoundaries');
      if (boundaryPane) {
        boundaryPane.style.pointerEvents = interactive ? 'auto' : 'none';
      }
    }

    return () => {
      // Cleanup is handled in the main effect
    };
  }, [map, interactive]);

  // Handle area interaction callbacks
  const handleAreaClick = useCallback((area: CommunityData) => {
    if (interactive && onAreaClick) {
      onAreaClick(area);
    }
  }, [interactive, onAreaClick]);

  const handleAreaMouseOver = useCallback((area: CommunityData) => {
    if (interactive && onAreaMouseOver) {
      onAreaMouseOver(area);
    }
  }, [interactive, onAreaMouseOver]);

  const handleAreaMouseOut = useCallback(() => {
    if (interactive && onAreaMouseOut) {
      onAreaMouseOut();
    }
  }, [interactive, onAreaMouseOut]);

  // Main effect for creating layers - only run when necessary
  useEffect(() => {
    if (!map || communityAreas.length === 0) return;

    // Only create layers if they don't exist
    if (layerGroupRef.current && layersMapRef.current.size === communityAreas.length) {
      return; // Layers already exist, just update styles
    }

    // Clear existing layers
    if (layerGroupRef.current) {
      map.removeLayer(layerGroupRef.current);
      layersMapRef.current.clear();
    }

    // Create new layer group
    const layerGroup = L.layerGroup();
    layerGroupRef.current = layerGroup;

    // Process community areas with proper bounds and geometry
    const processedAreas = communityAreas.map(area => {
      const normalizedGeometry = normalizeGeometry(area.geometry);
      const bounds = area.bounds[0] === 0 ? calculateBoundsFromGeometry(normalizedGeometry) : area.bounds;
      const centroid = area.centroid[0] === 0 ? calculateCentroidFromGeometry(normalizedGeometry) : area.centroid;
      
      return {
        ...area,
        geometry: normalizedGeometry,
        bounds,
        centroid
      };
    });

    // Create layers for each community area
    processedAreas.forEach(area => {
      if (!area.geometry) return;

      const layer = createCommunityLayer(area, {
        style: getAreaStyle(area.areaNumber, styleOptions),
        pane: 'communityBoundaries',
        interactive,
        showPopup: showPopups,
        onAreaClick: handleAreaClick,
        onAreaMouseOver: handleAreaMouseOver,
        onAreaMouseOut: handleAreaMouseOut,
        getStyle: (areaNumber: number) => getAreaStyle(areaNumber, styleOptions)
      });

      if (layer) {
        layersMapRef.current.set(area.areaNumber, layer);
        layerGroup.addLayer(layer);
      }
    });

    // Add layer group to map
    map.addLayer(layerGroup);

    // Cleanup function
    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
        layersMapRef.current.clear();
      }
    };
  }, [
    map, 
    communityAreas.length, // Only recreate if number of areas changes
    interactive, 
    showPopups
  ]);

  // Separate effect for updating styles without recreating layers
  useEffect(() => {
    if (!layerGroupRef.current || layersMapRef.current.size === 0) return;

    // Update styles for all layers
    updateLayerStyles(layersMapRef.current, styleOptions);
  }, [styleOptions]);

  // Handle viewport changes for responsive styling
  useEffect(() => {
    if (!map) return;

    const handleViewportChange = () => {
      // Force style update on viewport change
      if (layersMapRef.current.size > 0) {
        updateLayerStyles(layersMapRef.current, styleOptions);
      }
    };

    map.on('resize', handleViewportChange);
    map.on('zoomend', handleViewportChange);

    return () => {
      map.off('resize', handleViewportChange);
      map.off('zoomend', handleViewportChange);
    };
  }, [map, styleOptions]);

  return null;
};

export default CommunityBaseLayer;