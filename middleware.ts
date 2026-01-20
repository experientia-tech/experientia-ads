import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // If already on /executor, /experientia, or /signin paths, let them through
  if (
    pathname.startsWith("/executor") ||
    pathname.startsWith("/experientia") ||
    pathname.startsWith("/signin")
  ) {
    return NextResponse.next();
  }

  // Executor domain routing
  if (
    hostname.includes("executor.cheqmate.com") ||
    hostname.includes("executor.local")
  ) {
    // Rewrite root to /executor
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/executor", request.url));
    }
    // Rewrite other paths to /executor/path
    return NextResponse.rewrite(new URL(`/executor${pathname}`, request.url));
  }

  // Experientia domain routing (default for localhost and experientia.tech)
  if (
    hostname.includes("experientia.tech") ||
    hostname.includes("experientia.local") ||
    hostname.includes("localhost")
  ) {
    // Rewrite root to /signin
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/signin", request.url));
    }
    // Rewrite other paths to /experientia/path
    return NextResponse.rewrite(
      new URL(`/experientia${pathname}`, request.url),
    );
  }

  // Default fallback to signin
  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/signin", request.url));
  }
  return NextResponse.rewrite(new URL(`/experientia${pathname}`, request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
