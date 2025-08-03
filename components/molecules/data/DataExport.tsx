'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Download, FileText, Map, Database } from 'lucide-react';

export function DataExport() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (dataType: string, format: string) => {
    setExporting(`${dataType}-${format}`);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would trigger a download
      console.log(`Exporting ${dataType} as ${format}`);
      
      // Create a download link (placeholder)
      const blob = new Blob(['Exported data would go here'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chicago-${dataType}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'communities',
      title: 'Community Areas',
      description: 'All 77 community areas with geometries and properties',
      icon: Map,
      formats: ['GeoJSON', 'KML', 'Shapefile'],
    },
    {
      id: 'boundaries',
      title: 'City Boundaries',
      description: 'Chicago city limits and municipal boundaries',
      icon: Database,
      formats: ['GeoJSON', 'KML'],
    },
    {
      id: 'landmarks',
      title: 'Landmarks',
      description: 'Points of interest throughout Chicago',
      icon: FileText,
      formats: ['GeoJSON', 'CSV'],
    },
  ];

  return (
    <div className="space-y-phi-6">
      <div>
        <p className="text-sm text-gray-600">
          Export geospatial data in various formats for use in GIS applications, 
          mapping software, or data analysis tools.
        </p>
      </div>

      <div className="grid gap-phi-4">
        {exportOptions.map((option) => (
          <Card key={option.id}>
            <CardHeader>
              <div className="flex items-center gap-phi-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center">
                  <option.icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-phi-base">{option.title}</CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-phi-2">
                {option.formats.map((format) => {
                  const exportKey = `${option.id}-${format}`;
                  const isExporting = exporting === exportKey;
                  
                  return (
                    <Button
                      key={format}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(option.id, format)}
                      disabled={isExporting}
                      className="flex items-center gap-phi-2"
                    >
                      <Download className="w-3 h-3" />
                      {format}
                      {isExporting && (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-phi-base">Export Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-phi-3 text-sm">
          <div>
            <strong>GeoJSON:</strong> Standard format for web mapping and JavaScript applications
          </div>
          <div>
            <strong>KML:</strong> Compatible with Google Earth and other mapping applications
          </div>
          <div>
            <strong>Shapefile:</strong> Industry standard for GIS applications (ArcGIS, QGIS)
          </div>
          <div>
            <strong>CSV:</strong> Tabular format for spreadsheet applications (coordinates included)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}