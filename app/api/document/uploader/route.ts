import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../../../utils/s3";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function uploadToS3(
  fileBuffer: Buffer,
  mimeType: string,
  folder = "uploads",
) {
  const key = `${folder}/${randomUUID()}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: "private", // keep it secure
      ServerSideEncryption: "AES256", // or "aws:kms" if using KMS
    }),
  );

  return NextResponse.json(
    `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
  );
}
