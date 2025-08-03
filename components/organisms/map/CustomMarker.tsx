'use client';

import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { ReactNode, useMemo } from 'react';

interface CustomMarkerProps {
  position: [number, number];
  iconName: string;
  category: string;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// Color mapping for different categories
const CATEGORY_COLORS = {
  education: '#3b82f6',
  healthcare: '#ef4444',
  parks: '#22c55e',
  transit: '#8b5cf6',
  government: '#f59e0b',
  culture: '#ec4899',
  shopping: '#06b6d4',
  dining: '#f97316',
  housing: '#6366f1',
  business: '#64748b',
  religious: '#84cc16',
  sports: '#10b981',
} as const;

// Size mapping
const SIZES = {
  sm: { width: 20, height: 20, fontSize: 12 },
  md: { width: 30, height: 30, fontSize: 16 },
  lg: { width: 40, height: 40, fontSize: 20 },
} as const;

export function CustomMarker({
  position,
  iconName,
  category,
  children,
  size = 'md',
}: CustomMarkerProps) {
  // Create custom icon based on category and size
  const customIcon = useMemo(() => {
    const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280';
    const { width, height, fontSize } = SIZES[size];
    
    // Create SVG icon
    const svgIcon = `
      <svg 
        width="${width}" 
        height="${height}" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          fill="${color}" 
          stroke="white" 
          stroke-width="2"
        />
        <text 
          x="12" 
          y="16" 
          text-anchor="middle" 
          fill="white" 
          font-size="${fontSize - 4}" 
          font-weight="bold"
        >
          ${getIconSymbol(iconName)}
        </text>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [width, height],
      iconAnchor: [width / 2, height / 2],
      popupAnchor: [0, -height / 2],
    });
  }, [iconName, category, size]);

  return (
    <Marker 
      position={position} 
      icon={customIcon}
    >
      {children}
    </Marker>
  );
}

// Map icon names to symbols/emojis
function getIconSymbol(iconName: string): string {
  const iconMap: Record<string, string> = {
    school: '🎓',
    hospital: '🏥',
    'tree-pine': '🌲',
    train: '🚊',
    'building-2': '🏛️',
    palette: '🎨',
    'shopping-bag': '🛍️',
    utensils: '🍽️',
    home: '🏠',
    briefcase: '💼',
    church: '⛪',
    trophy: '🏆',
    'map-pin': '📍',
    marker: '📍',
  };

  return iconMap[iconName] || '📍';
}