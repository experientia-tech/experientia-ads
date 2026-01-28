import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../../../utils/s3";
import { NextResponse } from 'next/server';

export const generateUploadUrl = async (
  filePath: string,
  fileType: string,
  contentType: string,
) => {
    const key = `${filePath}/${randomUUID()}/${fileType}`;

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ uploadUrl, imageUrl });
};
