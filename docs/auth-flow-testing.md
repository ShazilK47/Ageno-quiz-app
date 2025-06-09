# Authentication Flow Testing Plan

## Overview
This document provides a comprehensive testing plan to verify the authentication flow and session handling improvements. Following these steps will help ensure the entire authentication system works correctly.

## Prerequisites
1. The application is running locally at http://localhost:3000
2. You have a valid user account for testing
3. You have admin credentials for testing admin functionality

## Test Cases

### 1. Basic Authentication Flow

#### 1.1. Sign-in Flow
1. Open the application in a private/incognito browser window
2. Navigate to the sign-in page
3. Enter valid credentials and click Sign In
4. **Expected Result**: 
   - You should be redirected to the dashboard or home page
   - The header should show your user information
   - Protected routes should be accessible

#### 1.2. Sign-out Flow
1. While signed in, click the Sign Out or Logout button
2. **Expected Result**:
   - You should be redirected to the sign-in page
   - Attempting to access protected routes should redirect to sign-in page
   - Session cookies should be cleared (check browser dev tools)

#### 1.3. Session Persistence
1. Sign in to the application
2. Close the browser tab (but don't clear cookies/cache)
3. Open a new tab and navigate to the application URL
4. **Expected Result**: You should still be authenticated without needing to sign in again

### 2. Session Management

#### 2.1. Session Check API
1. Sign in to the application
2. Open browser developer tools and go to the Network tab
3. Navigate to a protected page
4. Look for requests to `/api/auth/session/check`
5. **Expected Result**: 
   - The response should have `isAuthenticated: true` 
   - The response should include user information including role

#### 2.2. Session Invalidation
1. Sign in on two different browser tabs
2. In one tab, click Sign Out
3. In the other tab, try to navigate to a protected route or refresh the page
4. **Expected Result**: The second tab should detect that you're signed out and redirect to the sign-in page

### 3. Role-Based Access Control

#### 3.1. Regular User Access
1. Sign in with a regular user account
2. Try to access user-specific routes (e.g., `/profile`, `/my-quizzes`)
3. Try to access admin routes (e.g., `/admin/dashboard`, `/admin/users`)
4. **Expected Result**: 
   - User routes should be accessible
   - Admin routes should redirect to home page or show an access denied message

#### 3.2. Admin User Access
1. Sign in with an admin user account
2. Try to access both user and admin routes
3. **Expected Result**: Both user and admin routes should be accessible

### 4. Edge Cases

#### 4.1. Invalid Session
1. Sign in to the application
2. Using browser dev tools, manually delete or modify the session cookie
3. Try to access a protected route
4. **Expected Result**: You should be redirected to the sign-in page

#### 4.2. Session Timeout
1. Sign in to the application
2. Leave the page idle for over 30 minutes
3. Try to interact with the page or navigate to another protected route
4. **Expected Result**: Your session should either still work (due to automatic refresh) or prompt you to sign in again

#### 4.3. Multiple Tabs Behavior
1. Open the application in multiple tabs and sign in on one tab
2. Check if all tabs recognize your authenticated state
3. Sign out on one tab and verify all tabs detect the sign-out
4. **Expected Result**: Authentication state should be consistent across all tabs

#### 4.4. Network Issues
1. Sign in to the application
2. Enable offline mode in browser developer tools
3. Try to navigate to different pages
4. **Expected Result**: The application should handle offline mode gracefully, possibly showing cached content or an offline message

### 5. Security Tests

#### 5.1. XSS Protection
1. Test if session cookies have proper flags (HttpOnly, Secure, SameSite)
2. Check in browser dev tools under Application > Cookies
3. **Expected Result**: 
   - Session cookie should have HttpOnly flag set to true
   - In production, Secure flag should be true
   - SameSite should be set to "Lax" or "Strict"

#### 5.2. CSRF Protection
1. Sign in to the application
2. Try making a cross-site request to your protected API endpoints
3. **Expected Result**: The request should fail due to CSRF protection

## Reporting Issues

If you encounter any issues during testing, please document the following information:

1. Test case number and description
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Browser and device information
6. Screenshots or video if applicable

## Using the Auth Test Page

For convenience, you can use our auth test page to automate some of these tests:

1. Navigate to `/auth-test` in the application
2. Use the provided buttons to test different aspects of the authentication flow
3. Check the test results in the results panel

## Conclusion

Completing these tests will help ensure that our authentication and session handling is robust, secure, and provides a good user experience. After fixing any issues discovered during testing, the authentication system should be ready for production use.
