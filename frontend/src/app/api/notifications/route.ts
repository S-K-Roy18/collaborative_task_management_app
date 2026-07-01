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

export async function GET(request: NextRequest) {
  try {
    const url = `${BACKEND}/api/notifications${request.nextUrl.search}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { ...getAuthHeader(request) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ message: 'Proxy error' }, { status: 500 });
  }
}
