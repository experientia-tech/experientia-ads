import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("URL parameter is required", { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch image from remote, status: ${res.status}`);
    }
    const blob = await res.blob();
    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("Content-Type") || "image/jpeg");
    headers.set("Access-Control-Allow-Origin", "*");
    return new NextResponse(blob, { headers });
  } catch (err: any) {
    console.error("Error proxying image:", err);
    return new NextResponse(err.message || "Failed to fetch image", { status: 500 });
  }
}
