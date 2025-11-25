import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;

    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/task/${taskId}`, {
      method: 'GET',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Failed to get task' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred while fetching task' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    const body = await request.json();

    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/task/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Failed to update task' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred while updating task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;

    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/task/${taskId}`, {
      method: 'DELETE',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Failed to delete task' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred while deleting task' }, { status: 500 });
  }
}
