import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';
import { randomUUID } from 'crypto';

// Max file size: 25 MB
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'File exceeds 25 MB limit' }, { status: 413 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${file.type}` },
        { status: 415 }
      );
    }

    const sessionId = (formData.get('sessionId') as string | null)?.trim() || randomUUID();

    const buffer = Buffer.from(await file.arrayBuffer());

    const ext = file.type === 'image/jpeg' ? 'jpg'
               : file.type === 'image/png'  ? 'png'
               : file.type === 'image/webp' ? 'webp'
               : 'jpg';
    // All photos for one checkout session go into the same folder: orders/{sessionId}/
    const key = `orders/${sessionId}/${randomUUID()}.${ext}`;

    const url = await uploadToS3(buffer, key, file.type);

    return NextResponse.json({ success: true, url, key });
  } catch (error) {
    console.error('S3 upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
