import { NextResponse } from 'next/server';

// Mock business data for demonstration
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const areaNumber = searchParams.get('areaNumber');
    const category = searchParams.get('category');
    
    if (!areaNumber) {
      return NextResponse.json(
        { error: 'Area number is required' },
        { status: 400 }
      );
    }

    // Mock business data - replace with actual database query
    const allBusinesses = [
      {
        id: `business-${areaNumber}-1`,
        name: `Local Cafe ${areaNumber}`,
        category: 'food-beverage',
        address: `789 Main St, Chicago, IL`,
        phone: '(312) 555-0123',
        website: 'https://example.com',
        description: 'A cozy neighborhood cafe serving fresh coffee and pastries.',
        coordinates: [41.8781 + (Math.random() - 0.5) * 0.02, -87.6298 + (Math.random() - 0.5) * 0.02] as [number, number]
      },
      {
        id: `business-${areaNumber}-2`,
        name: `Community Market`,
        category: 'retail',
        address: `321 Commerce Ave, Chicago, IL`,
        phone: '(312) 555-0456',
        description: 'Local grocery store with fresh produce and community favorites.',
        coordinates: [41.8781 + (Math.random() - 0.5) * 0.02, -87.6298 + (Math.random() - 0.5) * 0.02] as [number, number]
      },
      {
        id: `business-${areaNumber}-3`,
        name: `Neighborhood Clinic`,
        category: 'healthcare',
        address: `654 Health Blvd, Chicago, IL`,
        phone: '(312) 555-0789',
        description: 'Primary care clinic serving the local community.',
        coordinates: [41.8781 + (Math.random() - 0.5) * 0.02, -87.6298 + (Math.random() - 0.5) * 0.02] as [number, number]
      },
      {
        id: `business-${areaNumber}-4`,
        name: `Local Library Branch`,
        category: 'education',
        address: `987 Learning St, Chicago, IL`,
        phone: '(312) 555-0321',
        description: 'Public library branch with books, computers, and community programs.',
        coordinates: [41.8781 + (Math.random() - 0.5) * 0.02, -87.6298 + (Math.random() - 0.5) * 0.02] as [number, number]
      }
    ];

    // Filter by category if provided
    const filteredBusinesses = category && category !== 'all' 
      ? allBusinesses.filter(business => business.category === category)
      : allBusinesses;

    return NextResponse.json({
      success: true,
      businesses: filteredBusinesses,
      count: filteredBusinesses.length,
      totalCount: allBusinesses.length
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business data' },
      { status: 500 }
    );
  }
}