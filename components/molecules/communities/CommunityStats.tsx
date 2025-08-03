'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Skeleton } from '@/components/atoms/skeleton';
import { MapPin, Building, Users, BarChart3 } from 'lucide-react';

interface DatabaseStats {
  communityAreas: number;
  cityBoundaries: number;
  landmarks: number;
  roads: number;
}

export function CommunityStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
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

  const statCards = [
    {
      title: 'Community Areas',
      value: stats?.communityAreas || 77,
      description: 'Official neighborhoods',
      icon: MapPin,
      color: 'text-blue-600',
    },
    {
      title: 'City Boundaries',
      value: stats?.cityBoundaries || 1,
      description: 'Municipal limits',
      icon: Building,
      color: 'text-red-600',
    },
    {
      title: 'Landmarks',
      value: stats?.landmarks || 0,
      description: 'Points of interest',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Roads',
      value: stats?.roads || 0,
      description: 'Major roadways',
      icon: BarChart3,
      color: 'text-purple-600',
    },
  ];

  return (
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
              {stat.value.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}