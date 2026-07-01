import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { taskId } = await params;
    console.log(`[Upload Proxy] Hit for task: ${taskId}`);
    const authHeader = request.headers.get('authorization');
    const formData = await request.formData();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    // 1. Upload the file to the backend
    const uploadRes = await fetch(`${backendUrl}/api/upload`, {
      method: 'POST',
      headers: {
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: formData,
    });

    const uploadText = await uploadRes.text();
    let uploadData;
    try {
      uploadData = JSON.parse(uploadText);
    } catch (e) {
      console.error('Backend returned non-JSON:', uploadText);
      return NextResponse.json({ message: 'Backend returned invalid response' }, { status: 500 });
    }

    if (!uploadRes.ok) {
      return NextResponse.json({ message: uploadData.message || 'Failed to upload files' }, { status: uploadRes.status });
    }

    // 2. Attach the uploaded file to the task
    const attachRes = await fetch(`${backendUrl}/api/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify({
        url: uploadData.file.url,
        filename: uploadData.file.name
      }),
    });

    const attachData = await attachRes.json();

    if (!attachRes.ok) {
      return NextResponse.json({ message: attachData.error || 'Failed to attach file to task' }, { status: attachRes.status });
    }

    return NextResponse.json({ success: true, message: 'File uploaded and attached successfully' });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ message: 'An error occurred while uploading files' }, { status: 500 });
  }
}
