/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fetch from 'node-fetch';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../firebase/client';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Test configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com'; // Replace with a valid test account
const TEST_PASSWORD = 'testpassword123'; // Replace with the correct password

// Utility function to create a fetch cookie jar
const cookieJar = new Map();

// Custom fetch that handles cookies
async function fetchWithCookies(url: string, options: any = {}) {
  // Add cookies to request
  if (cookieJar.size > 0) {
    const cookieHeader = Array.from(cookieJar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    
    options.headers = {
      ...options.headers,
      Cookie: cookieHeader
    };
  }
  
  const response = await fetch(url, options);
  
  // Extract cookies from response
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    setCookieHeader.split(',').forEach(cookie => {
      const [cookieStr] = cookie.split(';');
      const [name, value] = cookieStr.split('=');
      if (value === '') {
        cookieJar.delete(name.trim());
      } else {
        cookieJar.set(name.trim(), value);
      }
    });
  }
  
  return response;
}

describe('Authentication API Integration Tests', () => {
  let idToken: string | null = null;
  
  // Test case: User authentication flow
  describe('Complete Authentication Flow', () => {
    // Before all tests, sign in to get an ID token
    beforeAll(async () => {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        idToken = await userCredential.user.getIdToken();
        expect(idToken).toBeTruthy();
      } catch (error) {
        console.error('Test setup failed:', error);
        throw error;
      }
    });
    
    // After all tests, sign out
    afterAll(async () => {
      await signOut(auth);
      cookieJar.clear();
    });
    
    it('should create a session with valid ID token', async () => {
      const response = await fetchWithCookies(`${API_BASE_URL}/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });
      
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(cookieJar.has('session')).toBe(true);
    });
    
    it('should verify the session is valid', async () => {
      const response = await fetchWithCookies(`${API_BASE_URL}/auth/session/check`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.isAuthenticated).toBe(true);
      expect(data.user).toBeTruthy();
      expect(data.user.uid).toBeTruthy();
      expect(data.user.email).toBe(TEST_EMAIL);
    });
    
    it('should access a protected resource with a valid session', async () => {
      // This would be a protected endpoint in your API
      const response = await fetchWithCookies(`${API_BASE_URL}/user/profile`);
      
      expect(response.status).toBe(200);
    });
    
    it('should successfully log out and invalidate the session', async () => {
      const response = await fetchWithCookies(`${API_BASE_URL}/auth/session`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify session cookie was cleared
      expect(cookieJar.has('session')).toBe(false);
    });
    
    it('should deny access to protected resources after logout', async () => {
      const response = await fetchWithCookies(`${API_BASE_URL}/user/profile`);
      
      expect(response.status).toBe(401);
    });
  });
  
  // Test case: Invalid authentication attempts
  describe('Invalid Authentication Attempts', () => {
    it('should reject invalid ID tokens', async () => {
      const response = await fetchWithCookies(`${API_BASE_URL}/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: 'invalid-token' }),
      });
      
      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data.error).toBeTruthy();
    });
    
    it('should return 401 for session check with no valid session', async () => {
      cookieJar.clear();
      const response = await fetchWithCookies(`${API_BASE_URL}/auth/session/check`);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.isAuthenticated).toBe(false);
    });
  });
});
