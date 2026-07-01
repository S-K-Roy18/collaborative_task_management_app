import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;
    const authHeader = request.headers.get('authorization');

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    const res = await fetch(`${backendUrl}/api/analytics/workspace/${workspaceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Failed to fetch analytics data' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ message: 'An error occurred while fetching analytics' }, { status: 500 });
  }
}
