import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../../../utils/s3";
import { NextResponse } from "next/server";

export const generateUploadUrl = async (
  filePath: string,
  fileType: string,
  contentType: string,
) => {
  // Simplify key: gig-management/executor/uuid.jpg
  const extension = contentType.split("/")[1] || "jpg";
  const key = `${filePath}/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  // URL valid for 1 hour
  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  });

  const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;

  return NextResponse.json({ uploadUrl, imageUrl });
};
