import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/sign-in",
  "/sign-up",
  "/reset-password",
  "/verify-email",
  "/api/auth/session",
];

// Helper function to check if a path starts with one of the given prefixes
const pathStartsWith = (path: string, prefixes: string[]): boolean => {
  return prefixes.some((prefix) => path.startsWith(prefix));
};

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const userRole = request.cookies.get("user_role")?.value;
  const pathname = request.nextUrl.pathname;

  // Allow access to public paths without authentication
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/quiz/join")
  ) {
    return NextResponse.next();
  }

  // If session doesn't exist, redirect to sign-in
  if (!session) {
    return redirectToSignIn(request);
  }

  // Check admin routes access
  if (
    (pathname.startsWith("/admin") || pathStartsWith(pathname, ["/(admin)"])) &&
    userRole !== "admin"
  ) {
    // Redirect non-admin users trying to access admin routes
    return NextResponse.redirect(new URL("/", request.url));
  }

  // User is authenticated and authorized
  return NextResponse.next();
}

function redirectToSignIn(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = `redirectTo=${request.nextUrl.pathname}`;
  return NextResponse.redirect(url);
}

// Configure paths that require middleware
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes that don't require authentication
     * 2. /_next (Next.js internals)
     * 3. /_static (static files)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /robots.txt, and other static files
     * 6. Files in the public directory (.svg, .jpg, .png, etc.)
     */
    "/((?!_next|_static|_vercel|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
