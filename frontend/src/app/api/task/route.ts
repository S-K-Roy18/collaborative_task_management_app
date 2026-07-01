import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const authHeader = request.headers.get('authorization');

    const { workspaceId, ...rest } = body;
    const taskPayload = { ...rest, workspace: workspaceId };

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(taskPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.error || data.message || 'Failed to create task' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred while creating task' }, { status: 500 });
  }
}
