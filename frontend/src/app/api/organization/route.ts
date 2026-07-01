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

// POST /api/organization  →  backend POST /api/organizations  (Create organization)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${BACKEND}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader(request) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Organization root proxy POST error:', error);
    return NextResponse.json({ success: false, message: 'Proxy error' }, { status: 500 });
  }
}

// GET /api/organization  →  backend GET /api/organizations  (if ever needed)
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.search;
    const res = await fetch(`${BACKEND}/api/organizations${search}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader(request) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Organization root proxy GET error:', error);
    return NextResponse.json({ success: false, message: 'Proxy error' }, { status: 500 });
  }
}
