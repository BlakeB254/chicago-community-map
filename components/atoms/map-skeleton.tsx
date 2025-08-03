import { Card } from './card';
import { Skeleton } from './skeleton';

export function MapSkeleton() {
  return (
    <div className="relative h-full w-full bg-gray-100/20">
      {/* Map loading skeleton */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23e5e7eb%22%20fill-opacity%3D%220.3%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      </div>

      {/* Loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="p-6 text-center">
          <div className="space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <div>
              <h3 className="font-semibold">Loading Chicago Community Map</h3>
              <p className="text-sm text-gray-600 mt-2">
                Preparing geospatial data...
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Skeleton controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Skeleton className="w-10 h-20 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>

      {/* Skeleton legend */}
      <div className="absolute bottom-4 left-4">
        <Card className="w-64 p-4">
          <Skeleton className="h-4 w-20 mb-3" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="w-4 h-4 rounded-sm" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-4 h-4 rounded-sm" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-2 w-12" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}