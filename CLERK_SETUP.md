# Clerk Authentication Setup Guide

This application uses Clerk for authentication. Here's how to configure it.

## 1. Create a Clerk Account

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign up for a free account
3. Create a new application

## 2. Get Your Clerk API Keys

After creating your application, you'll find:
- **Publishable Key** - Safe to use in frontend code
- **Secret Key** - Only for backend use (currently not needed)

## 3. Configure Clerk in Your Application

⚠️ **IMPORTANT: You MUST set the Clerk publishable key or the auth screen will not appear.**

### Option A: Environment Variable (Recommended for Deployment) ✅

Set the `CLERK_PUBLISHABLE_KEY` environment variable in your deployment platform:

```bash
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
```

**For local development with Node.js:**
```bash
export CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
npm run dev
```

### Option B: Query Parameter (Development)

Append the key to your URL:

```
http://localhost:3000/?clerk_key=pk_test_xxxxxxxxxxxxx
```

### Option C: Local Storage (Development)

Set via browser console before loading the app:

```javascript
localStorage.setItem('clerk_publishable_key', 'pk_test_xxxxxxxxxxxxx');
location.reload();
```

**Or add a script to your HTML before loading the app:**
```html
<script>
  // Set test key for development
  window.__CLERK_PUBLISHABLE_KEY = 'pk_test_xxxxxxxxxxxxx';
</script>
```

## 4. Authentication Flow

### On First Visit (No Session)
```
App Loads
  ↓
Clerk Initializes (checks for session)
  ↓
No existing session found
  ↓
Clerk Sign-In Modal Opens
  ↓
User enters credentials
  ↓
Session created & stored in cookies
  ↓
App loads with authenticated user
```

### On Return Visit (Has Session)
```
App Loads
  ↓
Clerk Initializes
  ↓
Session found in cookies
  ↓
Session automatically restored
  ↓
Clerk Modal hidden
  ↓
App loads with authenticated user (seamless)
```

### The Sign-In Modal

When the app loads without an authenticated session, you'll see:
- A modal overlay (semi-transparent dark background)
- Centered sign-in form
- Options for Email/Password or OAuth providers (Google, GitHub, etc.)
- "Create Account" link to switch to sign-up

The modal is managed by Clerk and will:
- Handle all authentication logic
- Validate credentials
- Create the session
- Close automatically on successful login
- Allow you to continue building

## 5. Configure Clerk Application Settings

### Allowed Redirect URLs

Add these to your Clerk dashboard (Settings > URLs):

```
http://localhost:3000
http://localhost:8888
https://yourdomain.com
```

### Authentication Methods

Configure which authentication methods you want to enable:
- Email & Password
- Google OAuth
- GitHub OAuth
- etc.

## 6. Testing

### Test Session Continuation

1. Log in to the app
2. Refresh the page
3. You should remain logged in (session continues)
4. Close and reopen the browser
5. Session persists (Clerk manages this via cookies)

### Check Auth State

Open browser console and run:

```javascript
TinyWorldAuth.getUser().then(user => console.log('User:', user));
```

## Environment Variables Reference

For reference, the app accepts these environment variables:

```bash
# Frontend
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Backend (if adding API endpoints later)
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

## Troubleshooting

### "Clerk is not configured" Error

1. Check that `CLERK_PUBLISHABLE_KEY` is set
2. Verify the key is correct (should start with `pk_`)
3. Try setting it via URL parameter: `?clerk_key=pk_test_xxx`
4. Check browser console for error messages

### Stuck on "Redirecting to sign in..." Screen

**Debug Steps:**

1. **Open Browser Console** (F12 → Console tab)
2. **Check for errors**:
   ```javascript
   // Run in console to see Clerk state
   console.log('Clerk loaded:', !!window.Clerk);
   console.log('Clerk key:', window.__CLERK_PUBLISHABLE_KEY);
   console.log('Clerk instance:', window.Clerk?.clerk);
   ```

3. **Manual redirect** - Click the "click here" fallback link

4. **Force redirect** - Paste in console:
   ```javascript
   // Extract and redirect manually
   const key = window.__CLERK_PUBLISHABLE_KEY || 'pk_test_Y2hhcm1lZC1yZWRiaXJkLTIzLmNsZXJrLmFjY291bnRzLmRldiQ';
   const decoded = atob(key.split('_')[2]);
   const domain = decoded.replace(/\$.*/, '');
   const url = `https://${domain}/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
   console.log('Redirecting to:', url);
   window.location.href = url;
   ```

### User Not Staying Logged In

1. Check browser cookies are enabled
2. Clear browser cache and try again
3. Check that Clerk is fully initialized (5s timeout)

### Authentication Not Working

1. Verify the Clerk application is active in your dashboard
2. Check Redirect URLs are configured correctly
3. Check browser console for errors (F12)
4. Ensure Clerk publishable key matches the application in your dashboard
5. Make sure `.env.local` file exists with your Clerk keys
