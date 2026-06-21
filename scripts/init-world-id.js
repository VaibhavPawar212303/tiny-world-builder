// Initialize World ID for current session
// Sets up the world ID for persistence and build history

(async function initWorldId() {
  'use strict';

  console.log('[WorldID] Initializing world ID...');

  // Wait for Clerk auth to be ready
  if (window.__tinyworldAuthReady) {
    try {
      await window.__tinyworldAuthReady;
    } catch (_) {}
  }

  // Get user ID from Clerk
  let userId = null;
  if (window.TinyWorldAuth) {
    try {
      const user = await window.TinyWorldAuth.getUser();
      if (user && user.id) {
        userId = user.id;
        console.log('[WorldID] User ID:', userId);
      }
    } catch (err) {
      console.warn('[WorldID] Could not get user ID:', err);
    }
  }

  // Generate or retrieve world ID
  // Try to get from URL params first
  const urlParams = new URLSearchParams(window.location.search);
  let worldId = urlParams.get('worldId');

  // Otherwise, try to get from localStorage
  if (!worldId) {
    try {
      worldId = localStorage.getItem('tinyworld:currentWorldId');
    } catch (_) {}
  }

  // Generate new world ID if still missing
  if (!worldId) {
    // Use user ID + timestamp if available, otherwise just timestamp
    const timestamp = Date.now();
    if (userId) {
      worldId = `${userId}-${timestamp}`;
    } else {
      worldId = `world-${timestamp}`;
    }
    console.log('[WorldID] Generated new world ID:', worldId);

    // Save to localStorage
    try {
      localStorage.setItem('tinyworld:currentWorldId', worldId);
    } catch (_) {}
  }

  // Set global world ID
  window.__currentWorldId = worldId;
  console.log('[WorldID] Current world ID:', window.__currentWorldId);

  // Inform build history UI
  if (window.buildHistoryUI) {
    window.buildHistoryUI.setWorldId(worldId);
    console.log('[WorldID] Build history UI notified');
  } else {
    // If build history UI not ready yet, wait for it
    let attempts = 0;
    const waitForUI = setInterval(() => {
      if (window.buildHistoryUI) {
        window.buildHistoryUI.setWorldId(worldId);
        console.log('[WorldID] Build history UI initialized (delayed)');
        clearInterval(waitForUI);
      }
      if (attempts++ > 50) {
        console.warn('[WorldID] Build history UI not found');
        clearInterval(waitForUI);
      }
    }, 100);
  }
})();
