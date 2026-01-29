import { NextRequest, NextResponse } from "next/server";
import { generateUploadUrl } from "../generate-url/route";

export async function POST(request: NextRequest) {
  const { fileName, fileType, contentType } = await request.json();

  return await generateUploadUrl("executor-documents", fileType, contentType);
}
