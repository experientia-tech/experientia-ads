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

export const getPresignedUrls = async (
  files: File[],
): Promise<{ uploadUrl: string; imageUrl: string }[]> => {
  const response = await fetch("/api/document/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: files.map(file => ({
        fileName: file.name,
        fileType: file.type,
        contentType: file.type,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get presigned URLs");
  }

  const data = await response.json();
  return data.urls;
};

export const uploadFilesToS3 = async (
  files: File[],
  maxRetries = 3,
): Promise<string[]> => {
  if (files.length === 0) return [];
  
  // Step 1: Get presigned URLs for all files in one request
  const urls = await getPresignedUrls(files);
  
  // Step 2: Upload all to S3 concurrently
  const uploadPromises = files.map(async (file, index) => {
    const { uploadUrl, imageUrl } = urls[index];
    
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
          signal: AbortSignal.timeout(30000),
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload file to S3: ${uploadResponse.status} ${errorText}`);
        }

        return imageUrl;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt === maxRetries) break;
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`Failed to upload to S3 after ${maxRetries} attempts: ${lastError?.message}`);
  });
  
  return Promise.all(uploadPromises);
};

export const dataURLtoFile = (dataurl: string, filename: string) => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
