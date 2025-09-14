import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // Log environment info for debugging
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      BACKEND_URL: BACKEND_URL,
      hasBackendUrl: !!process.env.NEXT_PUBLIC_BACKEND_URL
    });

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

    const fullUrl = `${BACKEND_URL}/blogs?${params}`;
    console.log('Making request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching blogs:', {
      message: error.message,
      stack: error.stack,
      BACKEND_URL: BACKEND_URL
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch blogs',
        details: error.message,
        backendUrl: BACKEND_URL,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
