import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const provider = searchParams.get("provider") || "bigdatacloud";

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 },
    );
  }

  try {
    let url: string;
    let timeout = 5000; // Reduced from 10s to 5s for faster failure detection

    switch (provider) {
      case "bigdatacloud":
        url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        break;
      case "opencage":
        const opencageKey = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;
        if (!opencageKey) {
          return NextResponse.json(
            { error: "OpenCage API key not configured" },
            { status: 500 },
          );
        }
        url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${opencageKey}`;
        break;
      case "locationiq":
        const locationiqKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
        if (!locationiqKey) {
          return NextResponse.json(
            { error: "LocationIQ API key not configured" },
            { status: 500 },
          );
        }
        url = `https://us1.locationiq.com/v1/reverse?key=${locationiqKey}&lat=${lat}&lon=${lon}&format=json`;
        break;
      case "photon":
        url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
        break;
      default:
        return NextResponse.json(
          {
            error:
              "Invalid provider specified. Supported: bigdatacloud, opencage, locationiq, photon",
          },
          { status: 400 },
        );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "NextJS-Geocoding-Proxy/1.0",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Add CORS headers
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error(`Geocoding error for ${provider}:`, error);

    let errorMessage = "Geocoding request failed";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timeout";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
