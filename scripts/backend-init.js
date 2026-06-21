// Initialize TinyWorld Backend API Client
// Sets up the API client with Clerk authentication

(async function initBackendAPI() {
  'use strict';

  // Configure backend URL (change for production)
  const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : window.location.origin;

  // Wait for Clerk auth to be ready
  if (window.__tinyworldAuthReady) {
    try {
      await window.__tinyworldAuthReady;
    } catch (_) {}
  }

  // Initialize API client
  window.tinyWorldAPI = new TinyWorldAPI(BACKEND_URL, async () => {
    try {
      // Get token from Clerk
      const auth = window.TinyWorldAuth;
      if (!auth) return null;

      // Try to get user - if it returns a user object, we're authenticated
      const user = await auth.getUser();
      if (!user) return null;

      // Manually get the Clerk session token
      // This is stored by Clerk SDK when user logs in
      const token = sessionStorage.getItem('clerk-session-token')
        || localStorage.getItem('clerk-session-token');

      if (token) return token;

      // Fallback: try to extract from Clerk
      if (window.Clerk && window.Clerk.session) {
        return await window.Clerk.session.getToken({ template: 'tinyworld' });
      }

      return null;
    } catch (err) {
      console.warn('[Backend] Failed to get auth token:', err);
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
