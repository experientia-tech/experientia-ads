import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/utils/s3";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Fail fast with a clear message if S3 is not configured, instead of a generic 500.
    const bucket = process.env.S3_BUCKET_NAME;
    const region = process.env.REGION_AWS;
    if (!bucket || !region || !process.env.ACCESS_KEY_AWS_ID) {
      console.error(
        "S3 is not configured (missing bucket/region/credentials).",
      );
      return NextResponse.json(
        { error: "File uploads are temporarily unavailable" },
        { status: 503 },
      );
    }

    // Get data from request
    const { fileName, fileType, contentType } = await request.json();

    // Validate required fields
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "Missing required fields: fileName and contentType" },
        { status: 400 },
      );
    }

    // Extract file extension
    const extension =
      fileName.split(".").pop() || contentType.split("/")[1] || "jpg";

    // Generate unique filename with folder path
    const key = `gig-management/executor/${randomUUID()}.${extension}`;

    // Create S3 command
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    // Generate pre-signed URL (valid for 1 hour)
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Generate the final image URL that will be accessible after upload
    const imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    // Return both URLs
    return NextResponse.json({
      uploadUrl, // Temporary URL for uploading
      imageUrl, // Permanent URL for accessing the file
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 },
    );
  }
}
