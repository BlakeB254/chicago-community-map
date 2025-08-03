import L from 'leaflet';

// Chicago theme colors with Next.js 15 compatibility
const CHICAGO_COLORS = {
  primary: '#003f7f',      // Chicago Blue
  secondary: '#009639',    // Chicago Green  
  accent: '#c8102e',       // Chicago Red
  warning: '#ffd100',      // Chicago Gold
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
};

export interface LayerStyleConfig {
  fillColor: string;
  fillOpacity: number;
  color: string;
  weight: number;
  opacity: number;
  dashArray?: string;
}

export interface AreaStyleOptions {
  selectedAreaNumber?: number;
  hoveredAreaNumber?: number;
  highlightedAreas?: number[];
  zoomedAreaNumber?: number;
  viewMode?: 'normal' | 'zoomed' | 'fullpage';
  customStyles?: Partial<LayerStyleConfig>;
}

// Base styles for different states
const BASE_STYLE: LayerStyleConfig = {
  fillColor: CHICAGO_COLORS.primary,
  fillOpacity: 0.15,
  color: CHICAGO_COLORS.primary,
  weight: 1.5,
  opacity: 0.8
};

const HOVER_STYLE: LayerStyleConfig = {
  fillColor: CHICAGO_COLORS.secondary,
  fillOpacity: 0.35,
  color: CHICAGO_COLORS.secondary,
  weight: 2.5,
  opacity: 1.0
};

const SELECTED_STYLE: LayerStyleConfig = {
  fillColor: CHICAGO_COLORS.accent,
  fillOpacity: 0.4,
  color: CHICAGO_COLORS.accent,
  weight: 3,
  opacity: 1.0
};

const HIGHLIGHTED_STYLE: LayerStyleConfig = {
  fillColor: CHICAGO_COLORS.warning,
  fillOpacity: 0.3,
  color: CHICAGO_COLORS.warning,
  weight: 2,
  opacity: 0.9
};

const FOCUSED_STYLE: LayerStyleConfig = {
  fillColor: CHICAGO_COLORS.primary,
  fillOpacity: 0.05,
  color: CHICAGO_COLORS.neutral[400],
  weight: 1,
  opacity: 0.5
};

export const getAreaStyle = (
  areaNumber: number,
  options: AreaStyleOptions
): LayerStyleConfig => {
  const {
    selectedAreaNumber,
    hoveredAreaNumber,
    highlightedAreas = [],
    zoomedAreaNumber,
    viewMode = 'normal',
    customStyles = {}
  } = options;

  let style = { ...BASE_STYLE };

  // Apply state-based styling in order of priority
  if (viewMode === 'zoomed' && areaNumber !== zoomedAreaNumber) {
    // In zoom mode, de-emphasize other areas
    style = { ...FOCUSED_STYLE };
  } else if (areaNumber === selectedAreaNumber) {
    style = { ...SELECTED_STYLE };
  } else if (areaNumber === hoveredAreaNumber) {
    style = { ...HOVER_STYLE };
  } else if (highlightedAreas.includes(areaNumber)) {
    style = { ...HIGHLIGHTED_STYLE };
  }

  // Apply custom styles if provided
  return { ...style, ...customStyles };
};

export const toLeafletStyle = (style: LayerStyleConfig): L.PathOptions => {
  return {
    fillColor: style.fillColor,
    fillOpacity: style.fillOpacity,
    color: style.color,
    weight: style.weight,
    opacity: style.opacity,
    dashArray: style.dashArray,
    // Ensure interactive styling
    interactive: true,
    bubblingMouseEvents: false
  };
};

export const getZoomAdjustedStyle = (
  baseStyle: LayerStyleConfig,
  zoom: number
): LayerStyleConfig => {
  const style = { ...baseStyle };

  // Adjust weight based on zoom level
  if (zoom < 11) {
    style.weight = Math.max(baseStyle.weight * 0.7, 1);
  } else if (zoom > 14) {
    style.weight = Math.min(baseStyle.weight * 1.3, 5);
  }

  // Adjust opacity at different zoom levels
  if (zoom < 10) {
    style.fillOpacity = Math.max(baseStyle.fillOpacity * 0.8, 0.1);
  } else if (zoom > 15) {
    style.fillOpacity = Math.min(baseStyle.fillOpacity * 1.1, 0.5);
  }

  return style;
};

export const getResponsiveStyles = (
  isMobile: boolean,
  isTablet: boolean
): Partial<LayerStyleConfig> => {
  if (isMobile) {
    return {
      weight: 2,
      fillOpacity: 0.2
    };
  } else if (isTablet) {
    return {
      weight: 2.5,
      fillOpacity: 0.18
    };
  }
  return {};
};

export const createTransitionStyle = (
  fromStyle: LayerStyleConfig,
  toStyle: LayerStyleConfig,
  progress: number
): LayerStyleConfig => {
  const interpolate = (from: number, to: number) => from + (to - from) * progress;

  return {
    fillColor: toStyle.fillColor, // Color transitions don't interpolate well
    fillOpacity: interpolate(fromStyle.fillOpacity, toStyle.fillOpacity),
    color: toStyle.color,
    weight: interpolate(fromStyle.weight, toStyle.weight),
    opacity: interpolate(fromStyle.opacity, toStyle.opacity),
    dashArray: toStyle.dashArray
  };
};

export const getViewModeStyles = (viewMode: 'normal' | 'zoomed' | 'fullpage'): Partial<LayerStyleConfig> => {
  switch (viewMode) {
    case 'zoomed':
      return {
        weight: 2,
        fillOpacity: 0.1
      };
    case 'fullpage':
      return {
        weight: 3,
        fillOpacity: 0.25
      };
    default:
      return {};
  }
};