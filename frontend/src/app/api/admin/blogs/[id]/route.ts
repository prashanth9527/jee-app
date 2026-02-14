import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authorization = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/admin/blogs/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const blog = await response.json();
    return NextResponse.json(blog);
  } catch (error: any) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const authorization = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/admin/blogs/${id}`, {
      method: 'PUT',
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
    console.error('Error updating blog:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authorization = request.headers.get('authorization');
    
    const response = await fetch(`${API_BASE_URL}/admin/blogs/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization && { 'Authorization': authorization }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
