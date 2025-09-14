import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const category = searchParams.get('category');
    const stream = searchParams.get('stream');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    // Build query parameters
    const params = new URLSearchParams({
      page,
      limit,
      status: 'PUBLISHED',
      ...(category && { category }),
      ...(stream && { stream }),
      ...(search && { search }),
      ...(featured && { featured }),
    });

    const response = await fetch(`${BACKEND_URL}/blogs?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}
