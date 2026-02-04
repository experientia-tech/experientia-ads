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

export const uploadFileToS3 = async (file: File): Promise<string> => {
  // Step 1: Get presigned URL
  const { uploadUrl, imageUrl } = await getPresignedUrl(file);

  // Step 2: Upload to S3
  console.log("Uploading to S3:", uploadUrl);

  console.log("File type:", file.type);

  try {
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("S3 upload failed with status:", uploadResponse.status);
      console.error("S3 response:", errorText);
      throw new Error(
        `Failed to upload file to S3: ${uploadResponse.status} ${errorText}`,
      );
    }
  } catch (err) {
    console.error("Fetch error during S3 upload:", err);
    throw err;
  }

  return imageUrl;
};
