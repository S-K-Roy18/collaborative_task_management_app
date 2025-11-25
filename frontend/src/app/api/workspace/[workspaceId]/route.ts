import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;

    // Get authorization header from the request
    let authHeader = request.headers.get('authorization');

    // If no auth header, try to get token from cookies (for SSR or client requests)
    if (!authHeader) {
      const cookie = request.headers.get('cookie');
      if (cookie) {
        const match = cookie.match(/token=([^;]+)/);
        if (match) {
          authHeader = `Bearer ${match[1]}`;
        }
      }
    }

    // Call backend API to get workspace details
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workspace/${workspaceId}`, {
      method: 'GET',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Failed to get workspace' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;

    // Get authorization header from the request
    let authHeader = request.headers.get('authorization');

    // If no auth header, try to get token from cookies (for SSR or client requests)
    if (!authHeader) {
      const cookie = request.headers.get('cookie');
      if (cookie) {
        const match = cookie.match(/token=([^;]+)/);
        if (match) {
          authHeader = `Bearer ${match[1]}`;
        }
      }
    }

    // Call backend API to delete workspace
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workspace/${workspaceId}`, {
      method: 'DELETE',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Failed to delete workspace' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
