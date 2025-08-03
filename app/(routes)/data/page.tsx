import { DataImport } from '@/components/molecules/data/DataImport';
import { DataExport } from '@/components/molecules/data/DataExport';
import { DataStats } from '@/components/molecules/data/DataStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/atoms/tabs';

export default function DataPage() {
  return (
    <div className="gr-container py-phi-8">
      <div className="space-y-phi-8">
        {/* Header */}
        <div className="text-center space-y-phi-5">
          <h1 className="text-phi-4xl font-bold tracking-tight">
            Data Management
          </h1>
          <p className="text-phi-lg text-gray-600 max-w-2xl mx-auto">
            Import, export, and manage geospatial data for Chicago community areas, 
            boundaries, and landmarks. All data is validated and stored with PostGIS.
          </p>
        </div>

        {/* Data Overview */}
        <DataStats />

        {/* Import/Export Interface */}
        <Tabs defaultValue="import" className="space-y-phi-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="export">Export Data</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-phi-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Geospatial Data</CardTitle>
                <CardDescription>
                  Import community areas, boundaries, and landmarks from various sources. 
                  All data is validated for Chicago bounds and coordinate consistency.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataImport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-phi-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>
                  Export your geospatial data in various formats including GeoJSON, 
                  KML, and Shapefile for use in other applications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataExport />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}