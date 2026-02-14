import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    const authorization = request.headers.get('authorization');
    const response = await fetch(`${API_BASE_URL}/admin/blogs?${queryString}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ message: errorData.message || 'Failed to fetch blogs' }, { status: response.status });
    }

    const blogs = await response.json();
    return NextResponse.json(blogs);
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorization = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/admin/blogs`, {
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

    const blog = await response.json();
    return NextResponse.json(blog);
  } catch (error: any) {
    console.error('Error creating blog:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
