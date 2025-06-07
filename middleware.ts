import { NextRequest, NextResponse } from "next/server";

// Extended list of public paths to fix 404/401 errors
const PUBLIC_PATHS = [
  "/",
  "/sign-in",
  "/sign-up",
  "/reset-password",
  "/verify-email",
  "/api/auth/session",
  "/quiz/join",
  "/join", // Explicitly add join path
  "/leaderboard", // Make leaderboard publicly accessible 
];

// More robust path checking with wildcard support
const pathStartsWith = (path: string, prefixes: string[]): boolean => {
  // Normalize path for consistent comparison
  const normalizedPath = path.toLowerCase();
  
  return prefixes.some((prefix) => {
    // Handle exact matches
    if (prefix === path) return true;
    
    // Handle prefix with wildcard matches
    if (prefix.endsWith('*')) {
      const cleanPrefix = prefix.slice(0, -1);
      return normalizedPath.startsWith(cleanPrefix);
    }
    
    // Handle standard prefix matches
    return normalizedPath.startsWith(prefix.toLowerCase());
  });
};

export async function middleware(request: NextRequest) {
  // Add request debugging for production troubleshooting
  const session = request.cookies.get("session")?.value;
  const userRole = request.cookies.get("user_role")?.value;
  const pathname = request.nextUrl.pathname;

  // Enhanced public path check with specific API paths that don't require auth
  const isPublicPath = 
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth/session") ||
    pathname.startsWith("/api/auth/user/public") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/quiz/join") ||
    pathname.startsWith("/leaderboard") ||
    // Add static assets paths to avoid auth checks
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".ico");

  // 1. Allow access to public paths without auth
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 2. Check if session exists
  if (!session) {
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith("/api/")) {
      // Only return 401 for API routes that aren't already marked as public
      if (!pathname.startsWith("/api/auth/session") && 
          !pathname.startsWith("/api/auth/user/public")) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }
    return redirectToSignIn(request);
  }

  // 3. Enhanced admin route protection
  const isAdminRoute = 
    pathname.startsWith("/admin") || 
    pathStartsWith(pathname, ["/(admin)"]) ||
    pathname.includes("/admin/");

  if (isAdminRoute && userRole !== "admin") {
    // For API routes, return 403 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    // Redirect non-admin users to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  // User is authenticated and authorized
  return NextResponse.next();
}

/**
 * Enhanced redirectToSignIn function that properly encodes redirect parameters
 * and preserves query parameters in complex URLs
 */
function redirectToSignIn(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  
  // Get original path with query parameters
  const fullPath = request.nextUrl.pathname + 
    (request.nextUrl.search ? request.nextUrl.search : "");
  
  // Properly encode the redirect path
  url.search = `redirectTo=${encodeURIComponent(fullPath)}`;
  
  // Return response with cache-control headers to prevent caching redirects
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  
  return response;
}

/**
 * Configure paths that require middleware with improved pattern matching
 * This ensures that static assets are never processed by middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones we want to exclude
     * 1. Public assets in /_next/static, /static/, and similar
     * 2. Next.js system files like /favicon.ico, /robots.txt, etc.
     * 3. Static files with known extensions (.svg, .jpg, etc.)
     * 4. Public files we know should always be publicly accessible
     */
    "/((?!_next/static|_next/image|_static|_vercel|favicon.ico|robots.txt|manifest.json|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff|woff2|eot|otf|css|js|json|map)).*)",
    
    // Explicitly include API routes that need authentication
    // We can't use negative lookahead (?!) in Next.js middleware matchers
    "/api/:path*"
  ],
};
