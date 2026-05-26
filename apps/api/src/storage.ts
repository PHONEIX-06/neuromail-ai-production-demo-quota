import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export function s3Client(env: {
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
}) {
  return new S3Client({
    region: env.AWS_REGION ?? "ap-south-1",
    credentials: env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
  });
}

export async function createAttachmentUploadUrl(env: {
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_S3_BUCKET?: string;
}, input: { key: string; contentType: string }) {
  if (!env.AWS_S3_BUCKET) throw new Error("AWS_S3_BUCKET is not configured");
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
  });
  return getSignedUrl(s3Client(env), command, { expiresIn: 900 });
}

export async function createAttachmentDownloadUrl(env: {
  AWS_REGION?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_S3_BUCKET?: string;
}, key: string) {
  if (!env.AWS_S3_BUCKET) throw new Error("AWS_S3_BUCKET is not configured");
  return getSignedUrl(s3Client(env), new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  }), { expiresIn: 900 });
}
