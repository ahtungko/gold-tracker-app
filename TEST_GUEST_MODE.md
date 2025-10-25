# Guest Mode Testing Guide

## Quick Test Steps

### 1. Verify Feature Flag Configuration

Check that the feature flag is set in `.env`:
```bash
grep VITE_ENABLE_AUTH .env
```

Expected output: `VITE_ENABLE_AUTH=false`

### 2. Start Development Server

```bash
npm run dev
```

### 3. Visual Verification Checklist

Open the application in a browser and verify:

- [ ] **Header Component**
  - Sign In button should NOT be visible
  - Language selector should still be visible
  - App logo and navigation should work normally

- [ ] **Dashboard Layout** (if used)
  - User account dropdown should NOT be visible in the sidebar footer
  - All menu items should be accessible
  - No login prompts should appear

- [ ] **Navigation**
  - All routes (/, /tracker, etc.) should be accessible
  - No redirects to login pages
  - Bottom navigation (mobile) should work normally

- [ ] **Console Check**
  - Open browser DevTools console
  - Check for any errors related to authentication
  - tRPC auth.me query should not be called (check Network tab)

### 4. Feature Toggle Test

Test that auth can be re-enabled:

1. Stop the development server
2. Edit `.env` and change:
   ```
   VITE_ENABLE_AUTH=true
   ```
3. Restart the development server
4. Verify that the Sign In button appears in the header
5. Verify that auth behavior is restored

### 5. Code Verification

Verify the implementation files exist and are correct:

```bash
# Check feature flag file exists
test -f client/src/config/features.ts && echo "✓ Feature config exists" || echo "✗ Missing feature config"

# Check environment type definitions
test -f client/vite-env.d.ts && echo "✓ Type definitions exist" || echo "✗ Missing type definitions"

# Check documentation
test -f GUEST_MODE.md && echo "✓ Documentation exists" || echo "✗ Missing documentation"

# Verify ENABLE_AUTH is used in key files
grep -l "ENABLE_AUTH" client/src/_core/hooks/useAuth.ts client/src/components/layout/Header.tsx client/src/components/DashboardLayout.tsx client/src/main.tsx | wc -l
```

Expected: 4 files should use ENABLE_AUTH

## Expected Behavior Summary

### With VITE_ENABLE_AUTH=false (Guest Mode)
- No authentication UI visible
- User automatically logged in as guest
- All features accessible without sign-in
- No API calls to auth endpoints
- No redirects to login on errors

### With VITE_ENABLE_AUTH=true (Normal Mode)
- Sign In button visible in header
- User account dropdown visible in dashboard
- Unauthenticated users redirected to login
- Auth API calls function normally
- Full authentication flow restored

## Common Issues

### Issue: Feature flag not taking effect
**Solution**: Ensure you restart the dev server after changing `.env`

### Issue: Type errors in IDE
**Solution**: Restart TypeScript language server or IDE

### Issue: Still seeing auth UI
**Solution**: 
1. Check `.env` file has `VITE_ENABLE_AUTH=false`
2. Verify no `.env.local` is overriding the setting
3. Clear browser cache and hard reload

## Rollback

To completely revert to auth-enabled mode:
```bash
echo "VITE_ENABLE_AUTH=true" > .env
npm run dev
```

All auth code remains intact and functional.
