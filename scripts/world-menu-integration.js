// World Menu Integration - Connect existing UI to TiDB world saving
(function initWorldMenuIntegration() {
  'use strict';

  console.log('[WorldMenu] Integration initializing');

  // Wait for WorldSaver and auth to be ready
  const checkReady = setInterval(() => {
    if (window.WorldSaver && window.TinyWorldAuthCustom) {
      clearInterval(checkReady);
      init();
    }
  }, 100);

  async function init() {
    console.log('[WorldMenu] Starting integration');

    // Get UI elements
    const worldMenuList = document.getElementById('world-menu-list');
    const worldMenuEmpty = document.getElementById('world-menu-empty');
    const saveAsBtn = document.querySelector('[data-action="save-as"]');
    const worldMenuName = document.getElementById('world-menu-name');

    if (!worldMenuList || !saveAsBtn) {
      console.warn('[WorldMenu] UI elements not found');
      return;
    }

    // Load and display saved worlds
    async function refreshWorldList() {
      if (!window.WorldSaver.isAuthenticated()) {
        console.log('[WorldMenu] User not authenticated');
        if (worldMenuEmpty) worldMenuEmpty.removeAttribute('hidden');
        worldMenuList.innerHTML = '';
        return;
      }

      try {
        console.log('[WorldMenu] Loading saved worlds...');
        const worlds = await window.WorldSaver.loadUserWorlds();

        if (!worlds || worlds.length === 0) {
          console.log('[WorldMenu] No saved worlds');
          if (worldMenuEmpty) worldMenuEmpty.removeAttribute('hidden');
          worldMenuList.innerHTML = '';
          return;
        }

        // Hide empty message
        if (worldMenuEmpty) worldMenuEmpty.setAttribute('hidden', '');

        // Build world list items
        worldMenuList.innerHTML = worlds.map(world => {
          const date = new Date(world.updated_at).toLocaleDateString();
          const time = new Date(world.updated_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

          return `
            <li>
              <button class="world-menu-item world-item-load" data-world-id="${world.id}" role="menuitem">
                <span class="world-menu-icon">📁</span>
                <span class="world-menu-label">${world.title}</span>
                <span class="world-menu-hint">${date} ${time}</span>
              </button>
            </li>
          `;
        }).join('');

        // Add click handlers to world items
        document.querySelectorAll('.world-item-load').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const worldId = btn.getAttribute('data-world-id');
            await loadWorld(worldId);
          });
        });

        console.log('[WorldMenu] Loaded', worlds.length, 'worlds');

      } catch (error) {
        console.error('[WorldMenu] Error loading worlds:', error);
        if (worldMenuEmpty) worldMenuEmpty.removeAttribute('hidden');
      }
    }

    // Load a world
    async function loadWorld(worldId) {
      try {
        console.log('[WorldMenu] Loading world:', worldId);
        const world = await window.WorldSaver.getWorld(worldId);

        if (!world) {
          alert('Failed to load world');
          return;
        }

        // Update world name in UI
        if (worldMenuName) {
          worldMenuName.value = world.title;
        }

        // Set current world ID
        window.WorldSaver.setCurrentWorldId(worldId);

        // Apply world state if builder is ready
        if (typeof window.applyState === 'function') {
          window.applyState(world.state);
          console.log('[WorldMenu] ✓ World loaded:', world.title);
          alert('World loaded: ' + world.title);
        } else {
          console.log('[WorldMenu] applyState not ready yet, state will be applied when builder loads');
          // Store state for later application
          window.__pendingWorldState = world.state;
        }

      } catch (error) {
        console.error('[WorldMenu] Error loading world:', error);
        alert('Failed to load world: ' + error.message);
      }
    }

    // Handle "Save as new" button
    saveAsBtn?.addEventListener('click', async (e) => {
      e.preventDefault();

      if (!window.WorldSaver.isAuthenticated()) {
        alert('Please log in first to save worlds');
        return;
      }

      try {
        const title = worldMenuName?.value?.trim() || 'My World';
        const state = typeof window.buildWorldStateObject === 'function'
          ? window.buildWorldStateObject()
          : {};

        console.log('[WorldMenu] Saving world:', title);

        const success = await window.WorldSaver.saveWorld(title, '', state);

        if (success) {
          alert('World saved: ' + title);
          await refreshWorldList();
        } else {
          alert('Failed to save world');
        }

      } catch (error) {
        console.error('[WorldMenu] Save error:', error);
        alert('Failed to save: ' + error.message);
      }
    });

    // Listen for auth changes
    window.addEventListener('tinyworld:auth-change', (e) => {
      const user = e.detail?.user;
      console.log('[WorldMenu] Auth changed:', user?.email);
      if (user) {
        refreshWorldList();
      } else {
        worldMenuList.innerHTML = '';
        if (worldMenuEmpty) worldMenuEmpty.removeAttribute('hidden');
      }
    });

    // Initial load
    await refreshWorldList();

    // Auto-save every 60 seconds if authenticated
    setInterval(async () => {
      if (window.WorldSaver.isAuthenticated()) {
        const currentWorldId = window.WorldSaver.getCurrentWorldId();
        if (currentWorldId) {
          try {
            const state = typeof window.buildWorldStateObject === 'function'
              ? window.buildWorldStateObject()
              : {};
            const title = worldMenuName?.value?.trim() || 'My World';

            console.log('[WorldMenu] Auto-saving world...');
            await window.WorldSaver.updateWorld(currentWorldId, title, '', state);
            console.log('[WorldMenu] ✓ Auto-saved');
          } catch (error) {
            console.warn('[WorldMenu] Auto-save failed:', error);
          }
        }
      }
    }, 60000); // Every 60 seconds

    console.log('[WorldMenu] ✓ Integration ready');
  }
})();
