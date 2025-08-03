import { CommunityList } from '@/components/molecules/communities/CommunityList';
import { CommunityStats } from '@/components/molecules/communities/CommunityStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';

export default function CommunitiesPage() {
  return (
    <div className="gr-container py-phi-8">
      <div className="space-y-phi-8">
        {/* Header */}
        <div className="text-center space-y-phi-5">
          <h1 className="text-phi-4xl font-bold tracking-tight">
            Chicago Community Areas
          </h1>
          <p className="text-phi-lg text-gray-600 max-w-2xl mx-auto">
            Explore Chicago's 77 official community areas, each with its own unique character, 
            history, and boundaries established by the Social Science Research Committee at the 
            University of Chicago in the 1920s.
          </p>
        </div>

        {/* Stats Overview */}
        <CommunityStats />

        {/* Community List */}
        <Card>
          <CardHeader>
            <CardTitle>All Community Areas</CardTitle>
            <CardDescription>
              Browse the complete list of Chicago's community areas with detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CommunityList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}