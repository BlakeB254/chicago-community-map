import React from 'react';

interface AppLayoutProps {
  sidebar?: React.ReactNode;
  topBar?: React.ReactNode;
  mapArea: React.ReactNode;
  overlays?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  sidebar,
  topBar,
  mapArea,
  overlays
}) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* Top Navigation Bar */}
      {topBar && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
          {topBar}
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex h-full" style={{ paddingTop: topBar ? '60px' : '0' }}>
        {/* Sidebar */}
        {sidebar && (
          <div className="relative z-20 flex-shrink-0">
            {sidebar}
          </div>
        )}
        
        {/* Map Container */}
        <div className="flex-1 relative">
          {mapArea}
        </div>
      </div>
      
      {/* Overlays */}
      {overlays && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {overlays}
        </div>
      )}
    </div>
  );
};