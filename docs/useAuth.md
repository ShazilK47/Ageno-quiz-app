# useAuth Hook for AgenoQuiz

This custom hook enhances the authentication experience in the AgenoQuiz app by leveraging SWR for caching and revalidation.

## Features

- **Built-in Caching**: Uses SWR's caching mechanism to reduce redundant API calls
- **Automatic Revalidation**: Session data is automatically refreshed when the window regains focus
- **Improved Error Handling**: Consistent error patterns across all authentication operations
- **TypeScript Support**: Full type safety with detailed type definitions
- **Comprehensive Auth Functions**: Complete set of authentication operations

## Usage Examples

### Basic Authentication

```tsx
import { useAuth } from "@/hooks/useAuth";

function MyComponent() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>
      {isAdmin && <div>Admin controls</div>}
    </div>
  );
}
```

### Login and Error Handling

```tsx
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.error) {
      setError(result.error.message);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
```

### Profile Updates

```tsx
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await updateProfile({ displayName });

    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
    } else {
      setMessage("Profile updated successfully!");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {message && (
        <div className={message.includes("Error") ? "error" : "success"}>
          {message}
        </div>
      )}
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display Name"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Updating..." : "Update Profile"}
      </button>
    </form>
  );
}
```

### Two-Factor Authentication

```tsx
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

function TwoFactorSetup() {
  const { getMFAStatus, startPhoneMFA, completePhoneMFA } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const recaptchaContainerRef = useRef(null);

  const handleStartVerification = async () => {
    setLoading(true);
    setMessage("");

    const result = await startPhoneMFA(
      phoneNumber,
      recaptchaContainerRef.current
    );

    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
    } else if (result.data) {
      setVerificationId(result.data.verificationId);
      setMessage("Verification code sent! Please enter it below.");
    }

    setLoading(false);
  };

  const handleCompleteVerification = async () => {
    setLoading(true);
    setMessage("");

    const result = await completePhoneMFA(verificationId, verificationCode);

    if (result.error) {
      setMessage(`Error: ${result.error.message}`);
    } else {
      setMessage("Two-factor authentication enabled successfully!");
      // Reset form
      setVerificationId("");
      setVerificationCode("");
      setPhoneNumber("");
    }

    setLoading(false);
  };

  return (
    <div>
      {message && (
        <div className={message.includes("Error") ? "error" : "success"}>
          {message}
        </div>
      )}

      {!verificationId ? (
        <>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone Number with Country Code"
            required
          />
          <div ref={recaptchaContainerRef}></div>
          <button onClick={handleStartVerification} disabled={loading}>
            {loading ? "Sending..." : "Send Verification Code"}
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Verification Code"
            required
          />
          <button onClick={handleCompleteVerification} disabled={loading}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </>
      )}
    </div>
  );
}
```

## Available Functions

The `useAuth` hook provides the following functions:

- `login(email, password)` - Sign in with email and password
- `loginWithGoogle()` - Sign in with Google
- `signUp(email, password, displayName)` - Create a new account
- `logout()` - Sign out the current user
- `updateProfile({ displayName, photoURL })` - Update user profile
- `updateEmail(currentPassword, newEmail)` - Change user email
- `updatePassword(currentPassword, newPassword)` - Change user password
- `sendEmailVerification()` - Send a verification email
- `forgotPassword(email)` - Send a password reset email
- `getMFAStatus()` - Get multi-factor authentication status
- `startPhoneMFA(phoneNumber, recaptchaContainer)` - Start phone MFA enrollment
- `completePhoneMFA(verificationId, verificationCode)` - Complete phone MFA setup
- `generateTOTPSecret()` - Generate a TOTP secret for authenticator apps
- `completeTOTPMFA(totpSecret, verificationCode)` - Complete TOTP MFA setup
- `unenrollMFA(factorUid)` - Remove an MFA factor
- `refreshUserSession()` - Refresh the authentication session

## Function Response Format

All auth functions return a consistent response object:

```typescript
{
  data: T | null;      // The operation result (if successful)
  error: {             // Error details (if failed)
    code: string;      // Error code (e.g., 'auth/user-not-found')
    message: string;   // Human-readable error message
  } | null;
  loading: boolean;    // Whether the operation is in progress
}
```

## Session Management

The hook also provides a `session` object with SWR functionality:

```typescript
session: {
  isAuthenticated: boolean; // Whether the user is authenticated
  user: any | null; // User data from the server
  loading: boolean; // Whether the session is loading
  error: Error | null; // Session error if any
  revalidate: () => Promise<any>; // Function to refresh the session data
}
```

## Compatibility with Existing Code

For backward compatibility, the hook still provides direct access to the original auth context values:

- `user` - The current user object
- `loading` - Whether the auth state is loading
- `isAdmin` - Whether the current user has admin privileges
- `verifySession()` - The original session verification function
