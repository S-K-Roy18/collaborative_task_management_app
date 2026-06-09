import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const searchParams = request.nextUrl.search;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const targetUrl = `${backendUrl}/api/chat/${path.join('/')}${searchParams}`;

    let authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const cookie = request.headers.get('cookie');
      if (cookie) {
        const match = cookie.match(/token=([^;]+)/);
        if (match) {
          authHeader = `Bearer ${match[1]}`;
        }
      }
    }

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Error fetching chat resource' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API Proxy GET error:', error);
    return NextResponse.json({ message: 'Internal Server Proxy Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const targetUrl = `${backendUrl}/api/chat/${path.join('/')}`;

    let authHeader = request.headers.get('authorization');
    if (!authHeader) {
      const cookie = request.headers.get('cookie');
      if (cookie) {
        const match = cookie.match(/token=([^;]+)/);
        if (match) {
          authHeader = `Bearer ${match[1]}`;
        }
      }
    }

    // Determine request Content-Type to handle file uploads vs JSON
    const contentType = request.headers.get('content-type') || '';
    let body: any;
    let headers: Record<string, string> = {
      ...(authHeader && { 'Authorization': authHeader }),
    };

    if (contentType.includes('multipart/form-data')) {
      // For file uploads, forward the formData directly
      body = await request.formData();
      // Let fetch handle boundary generation by not setting Content-Type manually
    } else {
      body = JSON.stringify(await request.json());
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body,
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Error processing chat resource' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API Proxy POST error:', error);
    return NextResponse.json({ message: 'Internal Server Proxy Error' }, { status: 500 });
  }
}
