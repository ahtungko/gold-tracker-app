# Guest/Anonymous Mode

This document describes the guest mode feature that allows the application to run without authentication.

## Overview

Guest mode temporarily disables all authentication UI and features, allowing the app to run in an anonymous mode where all features are accessible without sign-in.

## Configuration

The feature is controlled by the `VITE_ENABLE_AUTH` environment variable:

- `VITE_ENABLE_AUTH=false` - Guest mode (auth disabled)
- `VITE_ENABLE_AUTH=true` - Normal mode (auth enabled)

## Implementation Details

### Feature Flag

- Location: `client/src/config/features.ts`
- Export: `ENABLE_AUTH` constant

### Modified Components

1. **`useAuth` hook** (`client/src/_core/hooks/useAuth.ts`)
   - Returns a mock guest user when auth is disabled
   - Disables auth API queries when `ENABLE_AUTH=false`
   - Skips redirect-to-login logic when auth is disabled

2. **Header** (`client/src/components/layout/Header.tsx`)
   - Hides the "Sign In" button when auth is disabled

3. **DashboardLayout** (`client/src/components/DashboardLayout.tsx`)
   - Hides the user account dropdown when auth is disabled
   - Skips the login prompt when auth is disabled

4. **Main entry point** (`client/src/main.tsx`)
   - Disables automatic redirect to login on unauthorized errors when auth is disabled

### Guest User

When auth is disabled, the `useAuth` hook returns a mock guest user:

```typescript
{
  id: 0,
  openId: "guest",
  name: "Guest",
  email: "guest@example.com",
  loginMethod: null,
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
}
```

## Usage

### Enable Guest Mode

1. Set the environment variable:
   ```bash
   VITE_ENABLE_AUTH=false
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### Re-enable Authentication

1. Set the environment variable:
   ```bash
   VITE_ENABLE_AUTH=true
   ```

2. Restart the development server

## Testing

To verify guest mode is working:

1. Set `VITE_ENABLE_AUTH=false` in your `.env` file
2. Start the app
3. Verify:
   - No "Sign In" button appears in the header
   - No user account dropdown in dashboard layouts
   - All app features are accessible without authentication
   - No redirects to login pages occur

## Notes

- All auth code is preserved in the codebase and can be re-enabled by setting `VITE_ENABLE_AUTH=true`
- The guest user has standard "user" role permissions
- Auth-related tRPC queries are disabled but not removed
- Server-side auth endpoints remain functional for future re-enablement
