/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import admin from "firebase-admin";

// Session expiration time (14 days in seconds)
const SESSION_EXPIRATION_TIME = 60 * 60 * 24 * 14;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }
    try {
      // Verify the ID token first with additional logging
      let decodedToken;
      try {
        // Using the correct parameter format for Firebase Admin SDK
        decodedToken = await auth.verifyIdToken(idToken, true);
        console.log("Token verified successfully for user:", decodedToken.uid);
      } catch (verifyError: any) {
        console.error("Token verification failed:", verifyError);

        // Return detailed error message for debugging
        const errorMessage =
          verifyError instanceof Error
            ? verifyError.message
            : "Unknown verification error";

        const errorCode = verifyError.code || "unknown_error";

        console.error(
          `Token verification error (${errorCode}): ${errorMessage}`
        );

        return NextResponse.json(
          {
            error: "Invalid ID token",
            message: errorMessage,
            code: errorCode,
          },
          { status: 401 }
        );
      }

      const uid = decodedToken.uid;

      // Get or create user document with enhanced fields
      let userRole = "user";
      try {
        const userDoc = await db.collection("users").doc(uid).get();

        if (userDoc.exists) {
          // Update existing user document with new login timestamp
          const userData = userDoc.data();
          userRole = userData?.role || "user";

          await db.collection("users").doc(uid).update({
            lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // Create new user document with all required fields
          await db
            .collection("users")
            .doc(uid)
            .set({
              email: decodedToken.email || "",
              displayName: decodedToken.name || "",
              role: "user",
              emailVerified: decodedToken.email_verified || false,
              photoURL: decodedToken.picture || null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              activityLogs: [],
              customClaims: {
                role: "user",
              },
            });
        }
      } catch (firestoreError) {
        console.warn(
          "Could not update Firestore user document:",
          firestoreError
        );
        // Continue with session creation even if Firestore update fails
      }

      // Ensure custom claims are set correctly
      try {
        // Get current custom claims
        const userRecord = await auth.getUser(uid);
        const existingClaims = userRecord.customClaims || {};

        // Only update claims if role is missing or different
        if (existingClaims.role !== userRole) {
          await auth.setCustomUserClaims(uid, {
            ...existingClaims,
            role: userRole,
          });
          console.log(
            `Updated custom claims for user ${uid} with role: ${userRole}`
          );
        }
      } catch (claimsError) {
        console.warn("Could not update custom claims:", claimsError);
      }

      // Create a session cookie with additional logging and deduplication
      let sessionCookie;
      try {
        // Check if there's already a valid session for this user
        const existingSessionCookie = request.cookies.get("session")?.value;
        let createNewSession = true;
        
        if (existingSessionCookie) {
          try {
            // Verify if there's a valid session already
            const decodedSession = await auth.verifySessionCookie(
              existingSessionCookie,
              true // checkRevoked
            );
            
            // If the existing session is for the same user, skip creating a new one
            if (decodedSession && decodedSession.uid === uid) {
              console.log("Valid session already exists for user:", uid);
              sessionCookie = existingSessionCookie;
              createNewSession = false;
            }
          } catch {
            // Existing session is invalid or revoked, continue to create a new one
            console.log("Existing session invalid, creating new session");
          }
        }

        if (createNewSession) {
          sessionCookie = await auth.createSessionCookie(idToken, {
            expiresIn: SESSION_EXPIRATION_TIME * 1000, // Firebase Auth uses milliseconds
          });
          console.log("Session cookie created successfully for user:", uid);
        }
        
      } catch (cookieError: any) {
        console.error("Failed to create session cookie:", cookieError);

        // Return detailed error message for debugging
        const errorMessage =
          cookieError instanceof Error
            ? cookieError.message
            : "Unknown cookie creation error";

        const errorCode = cookieError.code || "unknown_error";

        console.error(`Session cookie error (${errorCode}): ${errorMessage}`);

        return NextResponse.json(
          {
            error: "Failed to create session cookie",
            message: errorMessage,
            code: errorCode,
          },
          { status: 401 }
        );
      }

      const cookiesStore = await cookies();

      // Set session cookie for authentication
      // Make sure sessionCookie is not undefined before setting it
      if (sessionCookie) {
        cookiesStore.set({
          name: "session",
          value: sessionCookie,
          maxAge: SESSION_EXPIRATION_TIME,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Secure in production
          path: "/",
          sameSite: "lax", // Changed from strict to lax for better compatibility
        });
      } else {
        console.error("Cannot set session cookie: value is undefined");
        return NextResponse.json(
          { error: "Failed to create session cookie - value is undefined" }, 
          { status: 500 }
        );
      }

      // Set user role cookie for authorization in middleware
      cookiesStore.set({
        name: "user_role",
        value: userRole,
        maxAge: SESSION_EXPIRATION_TIME,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax", // Changed from strict to lax for better compatibility
      });

      return NextResponse.json(
        {
          success: true,
          role: userRole,
          uid: uid,
        },
        { status: 200 }
      );
    } catch (sessionError: any) {
      console.error("Session error:", sessionError);
      return NextResponse.json(
        {
          error: "Session processing error",
          message:
            sessionError instanceof Error
              ? sessionError.message
              : "Unknown error",
          code: sessionError.code || "unknown_error",
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create session",
        message: error instanceof Error ? error.message : "Unknown error",
        code: error.code || "unknown_error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookiesStore = await cookies();

    // Clear session cookie
    cookiesStore.set({
      name: "session",
      value: "",
      maxAge: 0,
      path: "/",
    });

    // Clear user role cookie
    cookiesStore.set({
      name: "user_role",
      value: "",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Session deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
