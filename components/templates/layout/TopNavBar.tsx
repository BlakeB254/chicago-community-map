import React from 'react';
import { Menu } from 'lucide-react';

interface TopNavBarProps {
  showSidebarToggle?: boolean;
  onToggleSidebar?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  showSidebarToggle = false,
  onToggleSidebar
}) => {
  return (
    <div className="h-15 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">
          Chicago Community Map
        </h1>
      </div>

      {/* Right side - can add controls here later */}
      <div className="flex items-center gap-2">
        {/* Future: search, settings, etc. */}
      </div>
    </div>
  );
};