'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Skeleton } from '@/components/atoms/skeleton';
import { Database, HardDrive, Clock, CheckCircle } from 'lucide-react';

interface DatabaseStats {
  communityAreas: number;
  cityBoundaries: number;
  landmarks: number;
  roads: number;
}

export function DataStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-phi-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalRecords = stats ? 
    stats.communityAreas + stats.cityBoundaries + stats.landmarks + stats.roads : 0;

  const statCards = [
    {
      title: 'Total Records',
      value: totalRecords,
      description: 'Geospatial features',
      icon: Database,
      color: 'text-blue-600',
    },
    {
      title: 'Storage Used',
      value: `${Math.round(totalRecords * 0.5)}`,
      description: 'KB estimated',
      icon: HardDrive,
      color: 'text-purple-600',
      suffix: 'KB',
    },
    {
      title: 'Data Sources',
      value: 2,
      description: 'Connected APIs',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Last Updated',
      value: lastUpdated ? lastUpdated.toLocaleDateString() : 'Never',
      description: 'Data refresh',
      icon: Clock,
      color: 'text-orange-600',
      isDate: true,
    },
  ];

  return (
    <div className="space-y-phi-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-phi-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.isDate ? stat.value : `${typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}${stat.suffix || ''}`}
              </div>
              <p className="text-xs text-gray-600">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-phi-base">Data Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-phi-4">
              <div className="text-center p-phi-3 bg-gray-100/50 rounded-lg">
                <div className="text-phi-xl font-bold text-blue-600">
                  {stats.communityAreas}
                </div>
                <div className="text-phi-xs text-gray-600">
                  Community Areas
                </div>
              </div>
              <div className="text-center p-phi-3 bg-gray-100/50 rounded-lg">
                <div className="text-phi-xl font-bold text-red-600">
                  {stats.cityBoundaries}
                </div>
                <div className="text-phi-xs text-gray-600">
                  City Boundaries
                </div>
              </div>
              <div className="text-center p-phi-3 bg-gray-100/50 rounded-lg">
                <div className="text-phi-xl font-bold text-green-600">
                  {stats.landmarks}
                </div>
                <div className="text-phi-xs text-gray-600">
                  Landmarks
                </div>
              </div>
              <div className="text-center p-phi-3 bg-gray-100/50 rounded-lg">
                <div className="text-phi-xl font-bold text-purple-600">
                  {stats.roads}
                </div>
                <div className="text-phi-xs text-gray-600">
                  Roads
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}