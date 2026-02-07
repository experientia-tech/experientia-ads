export const getPresignedUrl = async (
  file: File,
): Promise<{ uploadUrl: string; imageUrl: string }> => {
  const response = await fetch("/api/document/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      contentType: file.type,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get presigned URL");
  }

  return await response.json();
};

export const uploadFileToS3 = async (
  file: File,
  maxRetries = 3,
): Promise<string> => {
  // Step 1: Get presigned URL
  const { uploadUrl, imageUrl } = await getPresignedUrl(file);

  // Step 2: Upload to S3 with retry logic
  console.log("Uploading to S3:", uploadUrl);
  console.log("File type:", file.type);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("S3 upload failed with status:", uploadResponse.status);
        console.error("S3 response:", errorText);
        throw new Error(
          `Failed to upload file to S3: ${uploadResponse.status} ${errorText}`,
        );
      }

      // Success!
      console.log(`S3 upload successful on attempt ${attempt}`);
      return imageUrl;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`S3 upload attempt ${attempt} failed:`, err);

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries failed
  throw new Error(
    `Failed to upload to S3 after ${maxRetries} attempts: ${lastError?.message}`,
  );
};
