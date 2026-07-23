import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// On Lambda, AWS injects the execution role's *temporary* credentials (access key,
// secret, AND session token) and the SDK's default provider chain picks them up.
// Rebuilding credentials from only ACCESS_KEY_AWS_ID/SECRET would drop the session
// token and break request signing — so on Lambda we pass `undefined` and let the
// chain resolve the role. Explicit keys are only used for local dev.
const onLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export const s3Client = new S3Client({
  region: process.env.REGION_AWS,
  // Newer @aws-sdk/client-s3 adds CRC32 checksum headers by default, which breaks
  // browser PUTs to presigned URLs (the client never sends the signed checksum),
  // causing 403 SignatureDoesNotMatch. Only compute a checksum when required.
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials:
    !onLambda && process.env.ACCESS_KEY_AWS_ID
      ? {
          accessKeyId: process.env.ACCESS_KEY_AWS_ID,
          secretAccessKey: process.env.SECRET_KEY_AWS!,
        }
      : undefined,
});

/**
 * Extract the S3 object key from a stored value that may be either a full
 * https URL (virtual-hosted or path-style) or an already-bare key.
 */
export function extractS3Key(urlOrKey: string): string | null {
  if (!urlOrKey) return null;
  if (!urlOrKey.startsWith("http")) return urlOrKey.replace(/^\/+/, "");
  try {
    const url = new URL(urlOrKey);
    let key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    // Path-style URLs (s3.<region>.amazonaws.com/<bucket>/<key>) include the
    // bucket as the first path segment — strip it if present.
    const bucket = process.env.S3_BUCKET_NAME;
    if (bucket && key.startsWith(`${bucket}/`)) {
      key = key.slice(bucket.length + 1);
    }
    return key;
  } catch {
    return null;
  }
}

/**
 * Generate a short-lived presigned GET URL for a private S3 object. Accepts a
 * full stored URL or a bare key. Returns null if S3 is not configured or the
 * key cannot be derived, so callers can fall back to the original value.
 */
export async function getPresignedGetUrl(
  urlOrKey: string,
  expiresIn = 3600,
): Promise<string | null> {
  const bucket = process.env.S3_BUCKET_NAME;
  const key = extractS3Key(urlOrKey);
  if (!bucket || !key) return null;
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Failed to presign GET URL for", key, error);
    return null;
  }
}
