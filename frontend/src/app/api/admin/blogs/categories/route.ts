import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const response = await fetch(`${API_BASE_URL}/admin/blogs/categories`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ message: errorData.message || 'Failed to fetch categories' }, { status: response.status });
    }

    const categories = await response.json();
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorization = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/admin/blogs/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const category = await response.json();
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error creating blog category:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

