import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Debug endpoint to check session cookie state 
 * This helps diagnose authentication issues
 */
export async function GET() {
  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;
    const userRole = cookiesStore.get("user_role")?.value;

    // Get all cookies for debugging
    const allCookies = cookiesStore.getAll();

    return NextResponse.json({
      hasCookies: allCookies.length > 0,
      hasSessionCookie: !!sessionCookie,
      cookieNames: allCookies.map(cookie => cookie.name),
      sessionCookieLength: sessionCookie ? sessionCookie.length : 0,
      userRole: userRole || null,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache"
      }
    });
  } catch (error) {
    console.error("Session debug error:", error);
    return NextResponse.json(
      { 
        error: "Failed to debug session",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
