import { NextResponse } from 'next/server';

// Mock parks data for demonstration
// In a real application, this would connect to your database
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const areaNumber = searchParams.get('areaNumber');
    
    if (!areaNumber) {
      return NextResponse.json(
        { error: 'Area number is required' },
        { status: 400 }
      );
    }

    // Mock data - replace with actual database query
    const mockParks = [
      {
        id: `park-${areaNumber}-1`,
        name: `Community Park ${areaNumber}`,
        address: `123 Park St, Chicago, IL`,
        coordinates: [41.8781 + (Math.random() - 0.5) * 0.02, -87.6298 + (Math.random() - 0.5) * 0.02] as [number, number],
        communityArea: parseInt(areaNumber),
        amenities: ['Playground', 'Walking Path', 'Picnic Area'],
        description: `A beautiful park in community area ${areaNumber} with various amenities for the community.`,
        size: 'medium' as const
      },
      {
        id: `park-${areaNumber}-2`,
        name: `Neighborhood Green Space`,
        address: `456 Green Ave, Chicago, IL`,
        coordinates: [41.8781 + (Math.random() - 0.5) * 0.02, -87.6298 + (Math.random() - 0.5) * 0.02] as [number, number],
        communityArea: parseInt(areaNumber),
        amenities: ['Basketball Court', 'Dog Park'],
        description: `A local green space serving the community with recreational facilities.`,
        size: 'small' as const
      }
    ];

    return NextResponse.json({
      success: true,
      parks: mockParks,
      count: mockParks.length
    });
  } catch (error) {
    console.error('Error fetching parks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parks data' },
      { status: 500 }
    );
  }
}