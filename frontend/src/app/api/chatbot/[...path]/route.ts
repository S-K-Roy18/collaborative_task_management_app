import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

function getAuthHeader(request: NextRequest): Record<string, string> {
  let authHeader = request.headers.get('authorization');
  if (!authHeader) {
    const cookie = request.headers.get('cookie');
    if (cookie) {
      const match = cookie.match(/token=([^;]+)/);
      if (match) authHeader = `Bearer ${match[1]}`;
    }
  }
  return authHeader ? { Authorization: authHeader } : {};
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const url = `${BACKEND}/api/chatbot/${path.join('/')}`;
    const body = await request.json().catch(() => ({}));
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader(request) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Chatbot proxy POST error:', error);
    return NextResponse.json({ message: 'Proxy error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const search = request.nextUrl.search;
    const url = `${BACKEND}/api/chatbot/${path.join('/')}${search}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader(request) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Chatbot proxy GET error:', error);
    return NextResponse.json({ message: 'Proxy error' }, { status: 500 });
  }
}
