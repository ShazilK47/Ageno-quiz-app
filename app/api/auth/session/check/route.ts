import { NextResponse } from "next/server";
import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

// Set cache control headers to prevent caching of session responses
const CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "Surrogate-Control": "no-store" 
};

export async function GET() {
  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    // Reduce excessive logging in production
    if (process.env.NODE_ENV !== "development") {
      console.log(
        "Session check requested:", 
        sessionCookie ? "cookie exists" : "no cookie"
      );
    }

    // Helper function to clear cookies and return unauthorized response
    const createClearedCookieResponse = (reason = "no_cookie") => {
      const response = NextResponse.json(
        { 
          isAuthenticated: false, 
          reason,
          timestamp: new Date().toISOString() // Add timestamp to help with debugging
        },
        { status: 401, headers: CACHE_HEADERS }
      );

      // Clear all authentication cookies
      response.cookies.set({
        name: "session",
        value: "",
        maxAge: 0,
        path: "/",
      });

      response.cookies.set({
        name: "user_role",
        value: "",
        maxAge: 0,
        path: "/",
      });

      // Also clear any legacy cookies that might exist
      response.cookies.set({
        name: "auth_token",
        value: "",
        maxAge: 0,
        path: "/",
      });

      return response;
    };

    // No session cookie found
    if (!sessionCookie) {
      return createClearedCookieResponse();
    }

    // Verify the session cookie with better error handling
    try {
      let decodedClaims;
      try {
        // Use the correct parameter format for Firebase Admin SDK
        decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      } catch (cookieError) {
        console.error("Session cookie verification failed:", cookieError);
        
        // More specific error handling based on error code
        const errorMessage = (cookieError as Error).message || 'Unknown error';
        const reason = 
          errorMessage.includes('expired') ? 'session_expired' : 
          errorMessage.includes('revoked') ? 'session_revoked' : 
          'invalid_cookie';
        
        return createClearedCookieResponse(reason);
      }

      // Verify user still exists in Firebase Auth
      try {
        await auth.getUser(decodedClaims.uid);
      } catch (userError) {
        console.error("User doesn't exist in Firebase Auth:", userError);
        return createClearedCookieResponse("user_not_found");
      }

      const uid = decodedClaims.uid;
      
      // Try to get user data from Firestore for a more complete profile
      let userData = null;
      try {
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) {
          userData = userDoc.data();
          
          // Update last active timestamp in Firestore
          // Use a non-blocking approach with catch to not delay response
          db.collection("users").doc(uid).update({
            lastActive: new Date().toISOString(),
          }).catch(err => {
            console.warn("Failed to update last active timestamp:", err);
          });
        } else {
          console.warn(`User document not found for uid: ${uid}`);
        }
      } catch (firestoreError) {
        console.warn("Could not fetch user data from Firestore:", firestoreError);
        // Continue with session data only
      }

      // Get role from different sources in priority order
      const userRole =
        (userData && userData.role) || decodedClaims.role || "user";

      // Return combined user data with debug information to help troubleshooting
      const responseData = {
        isAuthenticated: true,
        user: {
          uid,
          email: decodedClaims.email || (userData ? userData.email : null),
          displayName:
            decodedClaims.name || (userData ? userData.displayName : null),
          role: userRole,
          emailVerified:
            decodedClaims.email_verified ||
            (userData ? userData.emailVerified : false),
          photoURL:
            decodedClaims.picture || (userData ? userData.photoURL : null),
          lastLoginAt:
            userData && userData.lastLoginAt ? userData.lastLoginAt : null,
          createdAt: userData && userData.createdAt ? userData.createdAt : null,
        },
        debug: {
          timestamp: new Date().toISOString(),
          sessionSource: userData ? 'firestore+claims' : 'claims-only',
        }
      };
      
      console.log(`Session verified successfully for user: ${uid}`);
      
      const response = NextResponse.json(responseData);
      
      // Add cache control headers to prevent caching
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      
      return response;
    } catch (verifyError) {
      console.error("Session verification error:", verifyError);
      return createClearedCookieResponse("verification_error");
    }
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      {
        isAuthenticated: false,
        error: "Session check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
