'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Skeleton } from '@/components/atoms/skeleton';
import { MapPin, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Community {
  id: string;
  areaNumber: number;
  name: string;
  properties?: any;
}

export function CommunityList() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const response = await fetch('/api/communities');
        if (!response.ok) {
          throw new Error('Failed to fetch communities');
        }
        const data = await response.json();
        setCommunities(data.features.map((feature: any) => ({
          id: feature.id,
          areaNumber: feature.properties.areaNumber,
          name: feature.properties.name,
          properties: feature.properties,
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, []);

  if (loading) {
    return (
      <div className="space-y-phi-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-phi-4">
              <div className="flex items-center justify-between">
                <div className="space-y-phi-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-phi-6 text-center">
          <p className="text-red-600">Error loading communities: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const sortedCommunities = communities.sort((a, b) => a.areaNumber - b.areaNumber);

  return (
    <div className="space-y-phi-4">
      {sortedCommunities.map((community) => (
        <Card key={community.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-phi-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-phi-4">
                <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {community.name}
                  </h3>
                  <div className="flex items-center gap-phi-2 mt-1">
                    <Badge variant="secondary">
                      Area #{community.areaNumber}
                    </Badge>
                  </div>
                </div>
              </div>
              <Link
                href={`/?community=${community.areaNumber}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={`View ${community.name} on map`}
              >
                <ExternalLink className="w-4 h-4 text-gray-600" />
              </Link>
            </div>
            
            {community.properties?.shape_area && (
              <div className="mt-phi-3 text-sm text-gray-600">
                Area: {Number(community.properties.shape_area).toLocaleString()} sq ft
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}