import L from 'leaflet';
import { CommunityData } from './index';
import { 
  LayerStyleConfig, 
  AreaStyleOptions,
  getAreaStyle,
  toLeafletStyle,
  getZoomAdjustedStyle 
} from './styleUtils';

export interface LayerCreationOptions {
  style: LayerStyleConfig;
  pane: string;
  interactive: boolean;
  showPopup: boolean;
  onAreaClick: (area: CommunityData) => void;
  onAreaMouseOver: (area: CommunityData) => void;
  onAreaMouseOut: () => void;
  getStyle: (areaNumber: number) => LayerStyleConfig;
}

export const createCommunityLayer = (
  area: CommunityData,
  options: LayerCreationOptions
): L.GeoJSON | null => {
  if (!area.geometry) return null;

  const {
    style,
    pane,
    interactive,
    showPopup,
    onAreaClick,
    onAreaMouseOver,
    onAreaMouseOut,
    getStyle
  } = options;

  try {
    // Create GeoJSON with proper options to prevent displacement
    const geoJsonLayer = L.geoJSON(
      {
        type: 'Feature',
        geometry: area.geometry as any,
        properties: {
          areaNumber: area.areaNumber,
          communityName: area.communityName,
          population: area.population
        }
      } as any,
      {
        style: () => toLeafletStyle(style),
        pane: pane, // Ensure pane is set
        interactive: true, // Force interactive to true for debugging
        onEachFeature: (feature, layer) => {
          // Always add event handlers for debugging
          const pathLayer = layer as L.Path;
          
          // Store reference to area data
          (pathLayer as any)._areaData = area;
          (pathLayer as any)._getStyle = getStyle;
          
          // Add CSS class for styling
          if (pathLayer.getElement) {
            const element = pathLayer.getElement();
            if (element) {
              element.classList.add('community-area-polygon');
            }
          }

          // Add event handlers
          pathLayer.on({
            click: (e) => {
              console.log('🎯 Layer click event triggered for area:', area.areaNumber, area.communityName);
              // Set a flag to indicate a layer was clicked
              if (e.originalEvent) {
                (e.originalEvent as any)._stopped = true;
              }
              onAreaClick(area);
            },
            mouseover: (e) => {
              const newStyle = getStyle(area.areaNumber);
              pathLayer.setStyle(toLeafletStyle(newStyle));
              
              // Bring to front for better visibility
              if (typeof pathLayer.bringToFront === 'function') {
                pathLayer.bringToFront();
              }
              
              onAreaMouseOver(area);
            },
            mouseout: () => {
              const newStyle = getStyle(area.areaNumber);
              pathLayer.setStyle(toLeafletStyle(newStyle));
              onAreaMouseOut();
            }
          });

          // Tooltip disabled due to typo in method name
          // const tooltipContent = `${area.communityName} (Area #${area.areaNumber})`;
          // pathLayer.bindTooltip(tooltipContent, {
          //   permanent: false,
          //   direction: 'center',
          //   className: 'community-tooltip'
          // });
        }
      }
    );

    // Add click handler at the GeoJSON layer level for debugging
    geoJsonLayer.on('click', (e: any) => {
      console.log('🔴 GeoJSON layer click detected for area:', area.areaNumber);
    });

    return geoJsonLayer;
  } catch (error) {
    console.error(`Error creating layer for area ${area.areaNumber}:`, error);
    return null;
  }
};

export const updateLayerStyles = (
  layersMap: Map<number, L.GeoJSON>,
  styleOptions: AreaStyleOptions
): void => {
  const currentZoom = (layersMap.values().next().value as any)?._map?.getZoom() || 11;

  layersMap.forEach((layer, areaNumber) => {
    layer.eachLayer((subLayer: any) => {
      if (subLayer.setStyle) {
        const baseStyle = getAreaStyle(areaNumber, styleOptions);
        const adjustedStyle = getZoomAdjustedStyle(baseStyle, currentZoom);
        subLayer.setStyle(toLeafletStyle(adjustedStyle));
      }
    });
  });
};

export const createPopupContent = (area: CommunityData): string => {
  const sections: string[] = [];

  // Header
  sections.push(`
    <div class="community-popup-header">
      <h3>${area.communityName}</h3>
      <span class="area-number">Area #${area.areaNumber}</span>
    </div>
  `);

  // Demographics section
  if (area.population) {
    sections.push(`
      <div class="popup-section">
        <h4>Demographics</h4>
        <p><strong>Population:</strong> ${area.population.toLocaleString()}</p>
      </div>
    `);
  }

  // Additional data sections can be added here
  
  return `
    <div class="community-popup-content">
      ${sections.join('')}
    </div>
  `;
};

export const highlightArea = (
  layer: L.GeoJSON,
  highlight: boolean = true
): void => {
  layer.eachLayer((subLayer: any) => {
    if (subLayer.setStyle && subLayer._areaData && subLayer._getStyle) {
      const style = subLayer._getStyle(subLayer._areaData.areaNumber);
      
      if (highlight) {
        // Apply highlight effect
        subLayer.setStyle({
          ...toLeafletStyle(style),
          weight: style.weight * 1.5,
          fillOpacity: Math.min(style.fillOpacity * 1.3, 0.9)
        });
        
        if (typeof subLayer.bringToFront === 'function') {
          subLayer.bringToFront();
        }
      } else {
        // Reset to normal style
        subLayer.setStyle(toLeafletStyle(style));
      }
    }
  });
};

export const animateAreaSelection = (
  layer: L.GeoJSON,
  duration: number = 300
): Promise<void> => {
  return new Promise((resolve) => {
    layer.eachLayer((subLayer: any) => {
      if (subLayer.setStyle) {
        // Create pulse effect
        const originalStyle = { ...subLayer.options };
        let startTime: number;

        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Pulse effect
          const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
          subLayer.setStyle({
            weight: originalStyle.weight * scale,
            fillOpacity: originalStyle.fillOpacity * (1 + progress * 0.3)
          });

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(animate);
      }
    });
  });
};

export const getAreaCollectionBounds = (
  layersMap: Map<number, L.GeoJSON>,
  areaNumbers?: number[]
): L.LatLngBounds | null => {
  const bounds = L.latLngBounds([]);
  let hasAreas = false;

  layersMap.forEach((layer, areaNumber) => {
    if (!areaNumbers || areaNumbers.includes(areaNumber)) {
      const layerBounds = layer.getBounds();
      if (layerBounds.isValid()) {
        bounds.extend(layerBounds);
        hasAreas = true;
      }
    }
  });

  return hasAreas ? bounds : null;
};

export const getVisibleAreas = (
  layersMap: Map<number, L.GeoJSON>,
  mapBounds: L.LatLngBounds
): number[] => {
  const visibleAreas: number[] = [];

  layersMap.forEach((layer, areaNumber) => {
    const layerBounds = layer.getBounds();
    if (layerBounds.isValid() && mapBounds.intersects(layerBounds)) {
      visibleAreas.push(areaNumber);
    }
  });

  return visibleAreas;
};

export type { LayerStyleConfig };