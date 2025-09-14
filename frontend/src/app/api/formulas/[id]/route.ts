import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await fetch(`${BACKEND_URL}/formulas/${id}`, {
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
    console.error('Error fetching formula:', {
      message: error?.message,
      stack: error?.stack,
      BACKEND_URL: BACKEND_URL,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch formula',
        details: error?.message || 'Unknown error',
        backendUrl: BACKEND_URL,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/formulas/admin/${id}`, {
      method: 'PATCH',
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
    console.error('Error updating formula:', {
      message: error?.message,
      stack: error?.stack,
      BACKEND_URL: BACKEND_URL,
    });
    return NextResponse.json(
      { 
        error: 'Failed to update formula',
        details: error?.message || 'Unknown error',
        backendUrl: BACKEND_URL,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await fetch(`${BACKEND_URL}/formulas/admin/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting formula:', {
      message: error?.message,
      stack: error?.stack,
      BACKEND_URL: BACKEND_URL,
    });
    return NextResponse.json(
      { 
        error: 'Failed to delete formula',
        details: error?.message || 'Unknown error',
        backendUrl: BACKEND_URL,
      },
      { status: 500 }
    );
  }
}
