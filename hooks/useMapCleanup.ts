'use client';

import { useEffect } from 'react';
import { Map as LeafletMap } from 'leaflet';

export const useMapCleanup = (mapInstance: LeafletMap | null) => {
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstance) {
        console.log('🧹 Cleaning up map instance...');
        try {
          // Remove all event listeners first
          mapInstance.off();
          
          // Clear all layers
          mapInstance.eachLayer((layer) => {
            try {
              mapInstance.removeLayer(layer);
            } catch (e) {
              // Layer might already be removed
            }
          });
          
          // Remove custom panes if they exist
          ['boundaryPane', 'parkPane'].forEach(paneName => {
            if (mapInstance.getPane(paneName)) {
              try {
                const pane = mapInstance.getPane(paneName);
                if (pane && pane.parentNode) {
                  pane.parentNode.removeChild(pane);
                }
              } catch (e) {
                // Pane might already be removed
              }
            }
          });
          
          // Finally remove the map
          mapInstance.remove();
        } catch (e) {
          console.warn('Error during map cleanup:', e);
        }
      }
    };
  }, [mapInstance]);
};