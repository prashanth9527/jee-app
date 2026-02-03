import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Force dynamic rendering to prevent static generation bailouts
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Log environment info for debugging
    console.log('Categories API - Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      BACKEND_URL: BACKEND_URL,
      hasBackendUrl: !!process.env.NEXT_PUBLIC_BACKEND_URL
    });

    const fullUrl = `${BACKEND_URL}/blogs/categories`;
    console.log('Categories API - Making request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Categories API - Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Categories API - Backend error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching blog categories:', {
      message: error?.message,
      stack: error?.stack,
      BACKEND_URL: BACKEND_URL
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch blog categories',
        details: error?.message || 'Unknown error',
        backendUrl: BACKEND_URL,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
