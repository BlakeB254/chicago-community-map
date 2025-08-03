'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Badge } from '@/components/atoms/badge';
import { Upload, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface ImportResult {
  success: boolean;
  imported: number;
  skipped?: number;
  errors?: Array<{ feature: string; error: string }>;
  message: string;
}

export function DataImport() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleChicagoPortalImport = async (dataType: string) => {
    setImporting(true);
    setResult(null);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataType,
          source: 'Chicago Data Portal',
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setImporting(false);
    }
  };

  const importSources = [
    {
      id: 'chicago-portal-communities',
      title: 'Community Areas',
      description: 'Import all 77 Chicago community areas from the official Chicago Data Portal',
      url: 'https://data.cityofchicago.org/resource/igwz-8jzy.geojson',
      recommended: true,
    },
    {
      id: 'chicago-portal-boundaries',
      title: 'City Boundaries',
      description: 'Import Chicago city limits and municipal boundaries',
      url: 'https://data.cityofchicago.org/resource/qqq9-ngh9.geojson',
      recommended: true,
    },
  ];

  return (
    <div className="space-y-phi-6">
      {/* Import from Chicago Data Portal */}
      <div className="space-y-phi-4">
        <div>
          <h3 className="text-phi-lg font-semibold mb-phi-2">Chicago Data Portal</h3>
          <p className="text-sm text-gray-600">
            Import official geospatial data directly from the City of Chicago's open data portal
          </p>
        </div>

        <div className="grid gap-phi-4">
          {importSources.map((source) => (
            <Card key={source.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-phi-base flex items-center gap-phi-2">
                      {source.title}
                      {source.recommended && (
                        <Badge variant="secondary">Recommended</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{source.description}</CardDescription>
                  </div>
                  <Button
                    onClick={() => handleChicagoPortalImport(source.id)}
                    disabled={importing}
                    size="sm"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Import
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-600">
                  Source: {source.url}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-phi-4">
        <div>
          <h3 className="text-phi-lg font-semibold mb-phi-2">Upload GeoJSON File</h3>
          <p className="text-sm text-gray-600">
            Upload your own GeoJSON files with community areas, boundaries, or landmarks
          </p>
        </div>

        <Card>
          <CardContent className="p-phi-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-phi-8 text-center">
              <Upload className="w-8 h-8 text-gray-600 mx-auto mb-phi-4" />
              <p className="text-sm text-gray-600 mb-phi-2">
                Drag and drop a GeoJSON file here, or click to browse
              </p>
              <p className="text-xs text-gray-600">
                Supported formats: .geojson, .json
              </p>
              <Button variant="outline" className="mt-phi-4" disabled>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Result */}
      {result && (
        <Card className={result.success ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-phi-2 text-phi-base">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Import {result.success ? 'Completed' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-phi-2">
              <p className="text-sm">{result.message}</p>
              
              {result.success && (
                <div className="flex gap-phi-4 text-sm">
                  <span className="text-green-600">
                    ✓ {result.imported} imported
                  </span>
                  {result.skipped && result.skipped > 0 && (
                    <span className="text-yellow-600">
                      ⚠ {result.skipped} skipped
                    </span>
                  )}
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-phi-3">
                  <p className="text-sm font-medium text-red-600 mb-phi-2">
                    Errors encountered:
                  </p>
                  <div className="space-y-1 text-xs text-red-600 max-h-32 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index}>
                        {error.feature}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}