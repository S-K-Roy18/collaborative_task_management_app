import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; attachmentId: string }> }
) {
  try {
    const { taskId, attachmentId } = await params;
    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ message: data.error || 'Failed to delete attachment' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Delete Attachment Error:', error);
    return NextResponse.json({ message: 'An error occurred while deleting attachment' }, { status: 500 });
  }
}
