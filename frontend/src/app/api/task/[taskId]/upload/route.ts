import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const { taskId } = await params;

    const authHeader = request.headers.get('authorization');

    // Get the form data from the request
    const formData = await request.formData();

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/task/${taskId}/upload`, {
      method: 'POST',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.message || 'Failed to upload files' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'An error occurred while uploading files' }, { status: 500 });
  }
}
