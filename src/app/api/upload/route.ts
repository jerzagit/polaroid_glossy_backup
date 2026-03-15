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

    const buffer = Buffer.from(await file.arrayBuffer());

    // Organised by date so the bucket is easy to browse: orders/YYYY-MM-DD/uuid.ext
    const date = new Date().toISOString().slice(0, 10);
    const ext = file.type === 'image/jpeg' ? 'jpg'
               : file.type === 'image/png'  ? 'png'
               : file.type === 'image/webp' ? 'webp'
               : 'jpg';
    const key = `orders/${date}/${randomUUID()}.${ext}`;

    const url = await uploadToS3(buffer, key, file.type);

    return NextResponse.json({ success: true, url, key });
  } catch (error) {
    console.error('S3 upload error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
