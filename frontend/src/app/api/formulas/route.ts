import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();
    
    // Forward all query parameters
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });

    const response = await fetch(`${BACKEND_URL}/formulas?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching formulas:', {
      message: error?.message,
      stack: error?.stack,
      BACKEND_URL: BACKEND_URL,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch formulas',
        details: error?.message || 'Unknown error',
        backendUrl: BACKEND_URL,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/formulas`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating formula:', {
      message: error?.message,
      stack: error?.stack,
      BACKEND_URL: BACKEND_URL,
    });
    return NextResponse.json(
      { 
        error: 'Failed to create formula',
        details: error?.message || 'Unknown error',
        backendUrl: BACKEND_URL,
      },
      { status: 500 }
    );
  }
}
