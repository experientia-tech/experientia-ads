/// <reference path="./.sst/platform/config.d.ts" />

// SST v3 config — deploys this Next.js app to AWS Lambda + CloudFront + S3 via
// OpenNext (used internally by the Nextjs component). Region is Mumbai (ap-south-1).
//
// First-time setup:
//   npm install
//   npx sst secret set DatabaseUrl   "postgresql://user:pass@host:5432/postgres"
//   npx sst secret set JwtSecret     "<long-random-string>"
//   npx sst secret set AuthOtp       "000000"
//   npx sst secret set MapboxToken   "pk.xxx"
//   npx sst secret set S3BucketName  "your-existing-bucket"
//   npx sst deploy --stage production
export default $config({
  app(input) {
    return {
      name: "experientia-ads",
      // Keep the CloudFront/S3/Lambda stack on `sst remove` for production.
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: { aws: { region: "ap-south-1" } },
    };
  },
  async run() {
    // Server-side secrets — set once with `sst secret set <Name> <value>`.
    const databaseUrl = new sst.Secret("DatabaseUrl");
    const jwtSecret = new sst.Secret("JwtSecret");
    const authOtp = new sst.Secret("AuthOtp");
    const mapboxToken = new sst.Secret("MapboxToken");
    const s3BucketName = new sst.Secret("S3BucketName");

    new sst.aws.Nextjs("Web", {
      // Injected as Lambda env vars AND made available during `next build`
      // (NEXT_PUBLIC_* must exist at build time to be baked into the client bundle).
      environment: {
        DATABASE_URL: databaseUrl.value,
        JWT_SECRET: jwtSecret.value,
        AUTH_OTP: authOtp.value,
        REGION_AWS: "ap-south-1",
        S3_BUCKET_NAME: s3BucketName.value,
        NEXT_PUBLIC_MAPBOX_TOKEN: mapboxToken.value,
      },
      // Grant the server Lambda's execution role access to the uploads bucket so
      // we don't ship long-lived AWS keys. The SDK uses the role automatically.
      transform: {
        server: (args) => {
          args.permissions = [
            ...(args.permissions ?? []),
            {
              actions: ["s3:PutObject", "s3:GetObject"],
              resources: [
                $interpolate`arn:aws:s3:::${s3BucketName.value}`,
                $interpolate`arn:aws:s3:::${s3BucketName.value}/*`,
              ],
            },
          ];
        },
      },
    });
  },
});
