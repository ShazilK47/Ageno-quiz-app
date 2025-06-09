/**
 * Auth Flow Testing Script
 * 
 * This script tests various aspects of the authentication flow and session management.
 * It's meant to be run in a Node.js environment with access to the application's
 * modules and dependencies.
 */

import fetch from 'node-fetch';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase/client';

// Add credentials type to RequestInit
declare module 'node-fetch' {
  interface RequestInit {
    credentials?: 'include' | 'omit' | 'same-origin';
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Test credentials (replace with valid test credentials)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';

/**
 * Test: Login Flow
 * This tests the complete login flow, from Firebase auth to session creation
 */
async function testLoginFlow() {
  console.log('🧪 Testing Login Flow');
  
  try {
    // Step 1: Sign in with Firebase
    console.log('  ⮕ Step 1: Firebase Authentication');
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const user = userCredential.user;
    console.log(`  ✓ Firebase authentication successful for ${user.email}`);
    
    // Step 2: Get ID token
    console.log('  ⮕ Step 2: Getting ID token');
    const idToken = await user.getIdToken();
    if (!idToken) {
      throw new Error('Failed to get ID token');
    }
    console.log('  ✓ ID token obtained');
    
    // Step 3: Create session
    console.log('  ⮕ Step 3: Creating server session');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });
    
    const sessionData = await sessionResponse.json();
    if (!sessionResponse.ok || !sessionData.success) {
      throw new Error(`Session creation failed: ${JSON.stringify(sessionData)}`);
    }
    console.log('  ✓ Server session created successfully');
    
    // Step 4: Verify session
    console.log('  ⮕ Step 4: Verifying session');
    const verifyResponse = await fetch('http://localhost:3000/api/auth/session/check', {
      credentials: 'include',
    });
    
    const verifyData = await verifyResponse.json();
    if (!verifyResponse.ok || !verifyData.isAuthenticated) {
      throw new Error(`Session verification failed: ${JSON.stringify(verifyData)}`);
    }
    console.log('  ✓ Session verified successfully');
    console.log('  ✓ User role:', verifyData.user.role);
    
    return { success: true, message: 'Login flow test passed', user: verifyData.user };
  } catch (error) {
    console.error('  ✗ Login flow test failed:', error);
    return { success: false, error, message: 'Login flow test failed' };
  }
}

/**
 * Test: Session Check
 * This tests the session check endpoint directly
 */
async function testSessionCheck() {
  console.log('🧪 Testing Session Check');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/session/check', {
      credentials: 'include',
    });
    
    const data = await response.json();
    console.log('  Session check result:', data.isAuthenticated ? 'Authenticated' : 'Not authenticated');
    
    if (data.isAuthenticated) {
      console.log('  ✓ User data:', data.user);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('  ✗ Session check test failed:', error);
    return { success: false, error };
  }
}

/**
 * Test: Logout Flow
 * This tests the logout functionality and session clearing
 */
async function testLogoutFlow() {
  console.log('🧪 Testing Logout Flow');
  
  try {
    // Step 1: Call logout endpoint
    console.log('  ⮕ Step 1: Calling logout endpoint');
    const logoutResponse = await fetch('http://localhost:3000/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    });
    
    const logoutData = await logoutResponse.json();
    if (!logoutResponse.ok || !logoutData.success) {
      throw new Error(`Logout failed: ${JSON.stringify(logoutData)}`);
    }
    console.log('  ✓ Logout API call successful');
    
    // Step 2: Verify session is cleared
    console.log('  ⮕ Step 2: Verifying session cleared');
    const verifyResponse = await fetch('http://localhost:3000/api/auth/session/check', {
      credentials: 'include',
    });
    
    const verifyData = await verifyResponse.json();
    if (verifyData.isAuthenticated) {
      throw new Error('Session still active after logout');
    }
    console.log('  ✓ Session successfully cleared');
    
    return { success: true, message: 'Logout flow test passed' };
  } catch (error) {
    console.error('  ✗ Logout flow test failed:', error);
    return { success: false, error };
  }
}

/**
 * Run all tests in sequence
 */
async function runAllTests() {
  console.log('🔍 Starting Authentication Flow Tests');
  console.log('====================================');
  
  // First check current session status
  await testSessionCheck();
  
  // Test full login flow
  const loginResult = await testLoginFlow();
  
  // If login was successful, test logout flow
  if (loginResult.success) {
    await testLogoutFlow();
    
    // Verify logout worked by checking session again
    await testSessionCheck();
  }
  
  console.log('====================================');
  console.log('🏁 Authentication Flow Tests Complete');
}

// Export test functions
export {
  testLoginFlow,
  testSessionCheck,
  testLogoutFlow,
  runAllTests,
};

// Automatically run all tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
