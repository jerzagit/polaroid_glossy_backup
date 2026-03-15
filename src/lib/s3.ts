import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET ?? '';
export const S3_REGION = process.env.AWS_REGION ?? 'ap-southeast-1';

/**
 * Upload a buffer to S3.
 * Returns the public HTTPS URL.
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,            // e.g. "orders/2026-03-15/abc123.jpg"
  contentType: string     // e.g. "image/jpeg"
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}
