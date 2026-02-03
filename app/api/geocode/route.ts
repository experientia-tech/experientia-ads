import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const provider = searchParams.get('provider') || 'geocode-maps';

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  try {
    let url: string;
    let timeout = 10000;

    switch (provider) {
      case 'mapbox':
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!mapboxToken) {
          return NextResponse.json(
            { error: 'Mapbox access token not configured' },
            { status: 500 }
          );
        }
        url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}&types=address,place,postcode,locality,neighborhood,district,country`;
        break;
      case 'geocode-maps':
        url = `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}`;
        break;
      case 'bigdatacloud':
        url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        break;
      case 'photon':
        url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
        break;
      case 'opencage':
        const opencageKey = process.env.OPENCAGE_API_KEY;
        if (!opencageKey) {
          return NextResponse.json(
            { error: 'OpenCage API key not configured' },
            { status: 500 }
          );
        }
        url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${opencageKey}&limit=1`;
        break;
      case 'locationiq':
        const locationiqKey = process.env.LOCATIONIQ_API_KEY;
        if (!locationiqKey) {
          return NextResponse.json(
            { error: 'LocationIQ API key not configured' },
            { status: 500 }
          );
        }
        url = `https://us1.locationiq.com/v1/reverse.php?key=${locationiqKey}&lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid provider specified' },
          { status: 400 }
        );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NextJS-Geocoding-Proxy/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Add CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error(`Geocoding error for ${provider}:`, error);
    
    let errorMessage = 'Geocoding request failed';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
