import { NextResponse } from 'next/server';

// Mock events data for demonstration
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

    // Mock events data - replace with actual database query
    const allEvents = [
      {
        id: `event-${areaNumber}-1`,
        title: `Community Area ${areaNumber} Town Hall`,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        time: '7:00 PM - 9:00 PM',
        location: 'Community Center',
        description: 'Monthly community meeting to discuss local issues and upcoming initiatives.',
        category: 'community' as const,
        organizer: `Community Area ${areaNumber} Association`
      },
      {
        id: `event-${areaNumber}-2`,
        title: 'Summer Block Party',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // Three weeks
        time: '12:00 PM - 8:00 PM',
        location: 'Local Park',
        description: 'Annual summer celebration with food, music, and family activities.',
        category: 'cultural' as const,
        organizer: 'Neighborhood Committee'
      },
      {
        id: `event-${areaNumber}-3`,
        title: 'Youth Basketball League',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Two weeks
        time: '10:00 AM - 12:00 PM',
        location: 'Community Basketball Court',
        description: 'Weekly youth basketball games for ages 8-16.',
        category: 'recreational' as const,
        organizer: 'Parks & Recreation'
      },
      {
        id: `event-${areaNumber}-4`,
        title: 'Senior Center Computer Classes',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Ten days
        time: '2:00 PM - 4:00 PM',
        location: 'Senior Center',
        description: 'Free computer literacy classes for seniors.',
        category: 'educational' as const,
        organizer: 'Senior Services'
      }
    ];

    // Filter by category if provided
    const filteredEvents = category && category !== 'all'
      ? allEvents.filter(event => event.category === category)
      : allEvents;

    // Sort by date
    filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    return NextResponse.json({
      success: true,
      events: filteredEvents,
      count: filteredEvents.length,
      totalCount: allEvents.length
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events data' },
      { status: 500 }
    );
  }
}