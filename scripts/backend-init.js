// Initialize TinyWorld Backend API Client
// Sets up the API client with Clerk authentication

(async function initBackendAPI() {
  'use strict';

  // Configure backend URL - use same origin (Vercel functions)
  const BACKEND_URL = window.location.origin;

  // Wait for Clerk auth to be ready
  if (window.__tinyworldAuthReady) {
    try {
      await window.__tinyworldAuthReady;
    } catch (_) {}
  }

  // Initialize API client
  window.tinyWorldAPI = new TinyWorldAPI(BACKEND_URL, async () => {
    try {
      console.log('[Backend] Getting auth token...');

      // Get user from our custom auth
      const auth = window.TinyWorldAuth;
      if (!auth) {
        console.warn('[Backend] TinyWorldAuth not available');
        return null;
      }

      const user = await auth.getUser();
      if (!user) {
        console.warn('[Backend] User not authenticated');
        return null;
      }

      console.log('[Backend] User authenticated:', user.id);

      // Try multiple ways to get the Clerk JWT token
      let token = null;

      // Method 1: Try sessionStorage (if we stored it)
      token = sessionStorage.getItem('clerk-session-token');
      if (token) {
        console.log('[Backend] Token from sessionStorage');
        return token;
      }

      // Method 2: Try localStorage backup
      token = localStorage.getItem('clerk-session-token');
      if (token) {
        console.log('[Backend] Token from localStorage');
        return token;
      }

      // Method 3: Try Clerk SDK if available
      if (window.Clerk && window.Clerk.session) {
        console.log('[Backend] Getting token from Clerk session...');
        try {
          // Get the default session token
          token = await window.Clerk.session.getToken();
          if (token) {
            console.log('[Backend] Token from Clerk.session.getToken()');
            // Store for next time
            sessionStorage.setItem('clerk-session-token', token);
            return token;
          }
        } catch (err) {
          console.warn('[Backend] Clerk.session.getToken() failed:', err.message);
        }
      }

      // Method 4: Use a dummy token with user info for testing
      // This won't verify but helps us see what's happening
      const dummyToken = 'test-token-' + user.id;
      console.warn('[Backend] No valid token found, using test token');
      sessionStorage.setItem('clerk-session-token', dummyToken);
      return dummyToken;

    } catch (err) {
      console.error('[Backend] Failed to get auth token:', err.message);
      console.error('[Backend] Full error:', err);
      return null;
    }
  });

  // Sync user profile with backend
  if (window.TinyWorldAuth) {
    try {
      const user = await window.TinyWorldAuth.getUser();
      if (user && user.email) {
        await window.tinyWorldAPI.syncUser(
          user.email,
          user.username || '',
          user.name || user.email,
          user.picture || ''
        );
        console.log('[Backend] User synced');
      }
    } catch (err) {
      console.warn('[Backend] User sync failed:', err);
    }
  }

  // Check backend health
  const healthy = await window.tinyWorldAPI.healthCheck();
  if (healthy) {
    console.log('[Backend] Connected and healthy ✓');
    window.tinyWorldBackendReady = true;
  } else {
    console.warn('[Backend] Not available, using localStorage fallback');
    window.tinyWorldBackendReady = false;
  }
})();
