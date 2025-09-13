import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { topicId: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/lms/topics/${params.topicId}/subtopics`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching LMS subtopics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subtopics' },
      { status: 500 }
    );
  }
}
