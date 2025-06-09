# How to Test the Authentication Flow

This guide explains how to test the authentication and session handling in the application.

## 1. Using the Browser Test Page

The easiest way to test is using our built-in test page:

1. Start the development server with `npm run dev`
2. Navigate to [http://localhost:3000/auth-test](http://localhost:3000/auth-test)
3. Enter test credentials in the form
4. Use the buttons to test different aspects of the authentication flow:
   - Test Auth State: Checks the current authentication state in the React context
   - Test Session Check: Verifies that the server recognizes your session
   - Test Login: Attempts to log in with the provided credentials
   - Test Logout: Logs out the current user
   - Run All Tests: Runs all tests in sequence

## 2. Manual Testing

For a more comprehensive test, follow these steps:

1. Open the application in two different browser tabs
2. Sign in on the first tab
3. Refresh the second tab and verify that you're signed in there too
4. Sign out on the first tab
5. Refresh the second tab and verify that you're signed out there too

## 3. Testing Admin Access

To test admin access:

1. Sign in with admin credentials
2. Try accessing `/admin/dashboard` or other admin routes
3. Sign out and sign in with regular user credentials
4. Verify that you cannot access admin routes

## 4. Security Testing

To check session cookie security:

1. Sign in to the application
2. Open browser developer tools (F12)
3. Go to Application > Cookies
4. Verify that the session cookie has the HttpOnly flag

## 5. Automated Tests

We also have automated tests you can run:

```bash
npm test -- --testPathPattern=auth-flow-test
```

This will run the authentication flow tests and report any issues.

## Common Issues

If you encounter any of these issues:

- **"Authentication required" message**: Your session may have expired. Try signing in again.
- **Stuck in loading state**: The authentication check may be failing. Check browser console for errors.
- **Inconsistent authentication state**: Try clearing browser cookies and cache, then signing in again.

## Reporting Problems

If you find any authentication or session issues, please report them with:

1. Steps to reproduce the issue
2. Expected behavior
3. Actual behavior
4. Browser console errors (if any)
5. Screenshots (if applicable)
