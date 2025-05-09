import { NextResponse } from "next/server";
import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session")?.value;

    console.log(
      "Session check requested, session cookie exists:",
      Boolean(sessionCookie)
    );

    // Helper function to clear cookies and return unauthorized response
    const createClearedCookieResponse = (reason = "no_cookie") => {
      console.log(`Creating cleared cookie response: ${reason}`);
      const response = NextResponse.json(
        { isAuthenticated: false, reason },
        { status: 401 }
      );

      // Clear the cookies
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

      return response;
    };

    // No session cookie found
    if (!sessionCookie) {
      console.log("No session cookie found during session check");
      return createClearedCookieResponse();
    }

    // Verify the session cookie
    try {
      let decodedClaims;
      try {
        // Use the correct parameter format for Firebase Admin SDK
        decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      } catch (cookieError) {
        console.error("Session cookie verification failed:", cookieError);
        return createClearedCookieResponse("invalid_cookie");
      }

      // Verify user still exists in Firebase Auth
      try {
        await auth.getUser(decodedClaims.uid);
        console.log("Session cookie verified for user:", decodedClaims.uid);
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
        } else {
          console.warn(`User document not found for uid: ${uid}`);
        }
      } catch (firestoreError) {
        console.warn(
          "Could not fetch user data from Firestore:",
          firestoreError
        );
        // Continue with session data only
      }

      // Get role from different sources in priority order
      const userRole =
        (userData && userData.role) || decodedClaims.role || "user";

      // Return combined user data from decoded claims and Firestore
      return NextResponse.json({
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
      });
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
