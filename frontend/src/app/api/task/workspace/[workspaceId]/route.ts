import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
    const { workspaceId } = await params;

    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/workspace/${workspaceId}`, {
      method: 'GET',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Failed to get tasks' }, { status: res.status });
    }

    // Map statuses back to frontend format
    if (data.tasks) {
      data.tasks = data.tasks.map((task: any) => ({
        ...task,
        status: task.status === 'In Progress' ? 'in-progress' : task.status?.toLowerCase() || 'todo'
      }));
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred while fetching tasks' }, { status: 500 });
  }
}
