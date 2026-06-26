import { S3Client } from "@aws-sdk/client-s3";

// On Lambda, AWS injects the execution role's *temporary* credentials (access key,
// secret, AND session token) and the SDK's default provider chain picks them up.
// Rebuilding credentials from only ACCESS_KEY_AWS_ID/SECRET would drop the session
// token and break request signing — so on Lambda we pass `undefined` and let the
// chain resolve the role. Explicit keys are only used for local dev.
const onLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export const s3Client = new S3Client({
  region: process.env.REGION_AWS,
  credentials:
    !onLambda && process.env.ACCESS_KEY_AWS_ID
      ? {
          accessKeyId: process.env.ACCESS_KEY_AWS_ID,
          secretAccessKey: process.env.SECRET_KEY_AWS!,
        }
      : undefined,
});
