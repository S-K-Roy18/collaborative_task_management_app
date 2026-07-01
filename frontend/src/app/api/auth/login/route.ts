import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      const text = await res.text().catch(() => '');
      console.error('Login proxy failed to parse JSON from backend:', text);
      return NextResponse.json({ message: 'Backend returned invalid response' }, { status: 502 });
    }

    if (!res.ok) {
      return NextResponse.json({ message: data.error || data.message || 'Login failed' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Login proxy error:', error);
    return NextResponse.json({ message: error.message || 'An error occurred during login' }, { status: 500 });
  }
}
