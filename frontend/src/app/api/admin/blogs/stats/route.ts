import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const response = await fetch(`${API_BASE_URL}/admin/blogs/stats`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ message: errorData.message || 'Failed to fetch blog stats' }, { status: response.status });
    }

    const stats = await response.json();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching blog stats:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
