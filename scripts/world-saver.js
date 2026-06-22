// World Saver - Handle world persistence to authenticated user's TiDB account
(function initWorldSaver() {
  'use strict';

  const API_BASE = '/api';
  const WORLD_STORAGE_KEY = 'tinyworld:current_world_id';

  let currentWorldId = null;
  let isSaving = false;

  // World Management API
  const WorldSaver = {
    init() {
      // Restore current world ID from localStorage
      currentWorldId = localStorage.getItem(WORLD_STORAGE_KEY);

      // Listen for auth changes
      window.addEventListener('tinyworld:auth-change', (e) => {
        const user = e.detail?.user;
        if (user) {
          console.log('[WorldSaver] User authenticated:', user.email);
          this.loadUserWorlds();
        } else {
          console.log('[WorldSaver] User logged out');
          currentWorldId = null;
        }
      });

      console.log('[WorldSaver] Initialized');
    },

    getAuthToken() {
      if (typeof window.TinyWorldAuthCustom !== 'undefined') {
        return window.TinyWorldAuthCustom.getToken();
      }
      return null;
    },

    isAuthenticated() {
      return !!this.getAuthToken();
    },

    async saveWorld(title, description, state) {
      if (isSaving) {
        console.warn('[WorldSaver] Save already in progress');
        return false;
      }

      isSaving = true;
      console.log('[WorldSaver] ========== SAVE START ==========');
      console.log('[WorldSaver] Title:', title);
      console.log('[WorldSaver] Description:', description);
      console.log('[WorldSaver] State size:', JSON.stringify(state).length, 'bytes');

      try {
        const token = this.getAuthToken();
        console.log('[WorldSaver] Auth token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

        if (!token) {
          console.error('[WorldSaver] ❌ Not authenticated');
          return false;
        }

        // If no world ID, create new world
        if (!currentWorldId) {
          console.log('[WorldSaver] No worldId - creating new world');
          return await this.createWorld(title, description, state);
        }

        // Update existing world
        console.log('[WorldSaver] WorldId exists:', currentWorldId, '- updating');
        return await this.updateWorld(currentWorldId, title, description, state);

      } catch (error) {
        console.error('[WorldSaver] ❌ Save error:', error);
        return false;
      } finally {
        isSaving = false;
        console.log('[WorldSaver] ========== SAVE END ==========');
      }
    },

    async createWorld(title, description, state) {
      try {
        const token = this.getAuthToken();

        console.log('[WorldSaver] 📝 CREATE WORLD');
        console.log('[WorldSaver] ├─ Title:', title);
        console.log('[WorldSaver] ├─ Description:', description);
        console.log('[WorldSaver] ├─ State size:', JSON.stringify(state).length, 'bytes');
        console.log('[WorldSaver] ├─ Token:', token ? `${token.substring(0, 30)}...` : 'MISSING');
        console.log('[WorldSaver] └─ Endpoint: POST /api/worlds');

        const payload = {
          title: title || 'My World',
          description: description || '',
          state: state || {}
        };

        console.log('[WorldSaver] Request body size:', JSON.stringify(payload).length, 'bytes');

        const response = await fetch(`${API_BASE}/worlds`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        console.log('[WorldSaver] Response status:', response.status);

        if (!response.ok) {
          const error = await response.json();
          console.error('[WorldSaver] ❌ API error:', error);
          throw new Error(error.error || 'Failed to create world');
        }

        const data = await response.json();
        console.log('[WorldSaver] ✓ API response:', data);

        currentWorldId = data.id;

        // Save world ID for future reference
        localStorage.setItem(WORLD_STORAGE_KEY, currentWorldId);
        console.log('[WorldSaver] ✓ Saved to localStorage:', WORLD_STORAGE_KEY, '=', currentWorldId);

        console.log('[WorldSaver] ✓ World created:', currentWorldId);
        return true;

      } catch (error) {
        console.error('[WorldSaver] ❌ Create error:', error.message);
        return false;
      }
    },

    async updateWorld(worldId, title, description, state) {
      try {
        const token = this.getAuthToken();

        console.log('[WorldSaver] 📝 UPDATE WORLD');
        console.log('[WorldSaver] ├─ WorldId:', worldId);
        console.log('[WorldSaver] ├─ Title:', title);
        console.log('[WorldSaver] ├─ Description:', description);
        console.log('[WorldSaver] ├─ State size:', JSON.stringify(state).length, 'bytes');
        console.log('[WorldSaver] ├─ Token:', token ? `${token.substring(0, 30)}...` : 'MISSING');
        console.log('[WorldSaver] └─ Endpoint: PUT /api/worlds?worldId=' + worldId);

        const payload = {
          title: title || 'My World',
          description: description || '',
          state: state || {}
        };

        console.log('[WorldSaver] Request body size:', JSON.stringify(payload).length, 'bytes');

        const response = await fetch(`${API_BASE}/worlds?worldId=${worldId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        console.log('[WorldSaver] Response status:', response.status);

        if (!response.ok) {
          const error = await response.json();
          console.error('[WorldSaver] ❌ API error:', error);
          throw new Error(error.error || 'Failed to update world');
        }

        const data = await response.json();
        console.log('[WorldSaver] ✓ API response:', data);

        console.log('[WorldSaver] ✓ World updated:', worldId);
        return true;

      } catch (error) {
        console.error('[WorldSaver] ❌ Update error:', error.message);
        return false;
      }
    },

    async loadUserWorlds() {
      try {
        const token = this.getAuthToken();
        if (!token) return;

        console.log('[WorldSaver] Loading user worlds');

        const response = await fetch(`${API_BASE}/worlds`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load worlds');
        }

        const data = await response.json();
        console.log('[WorldSaver] ✓ Loaded', data.worlds?.length || 0, 'worlds');

        return data.worlds || [];

      } catch (error) {
        console.error('[WorldSaver] Load error:', error);
        return [];
      }
    },

    async getWorld(worldId) {
      try {
        const token = this.getAuthToken();
        if (!token) return null;

        console.log('[WorldSaver] Fetching world:', worldId);

        const response = await fetch(`${API_BASE}/worlds?worldId=${worldId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('World not found');
        }

        const world = await response.json();
        console.log('[WorldSaver] ✓ World loaded:', worldId);

        return world;

      } catch (error) {
        console.error('[WorldSaver] Fetch error:', error);
        return null;
      }
    },

    async deleteWorld(worldId) {
      try {
        const token = this.getAuthToken();
        if (!token) return false;

        console.log('[WorldSaver] Deleting world:', worldId);

        const response = await fetch(`${API_BASE}/worlds?worldId=${worldId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete world');
        }

        // Clear current world if deleted
        if (worldId === currentWorldId) {
          currentWorldId = null;
          localStorage.removeItem(WORLD_STORAGE_KEY);
        }

        console.log('[WorldSaver] ✓ World deleted:', worldId);
        return true;

      } catch (error) {
        console.error('[WorldSaver] Delete error:', error);
        return false;
      }
    },

    getCurrentWorldId() {
      return currentWorldId;
    },

    setCurrentWorldId(worldId) {
      currentWorldId = worldId;
      if (worldId) {
        localStorage.setItem(WORLD_STORAGE_KEY, worldId);
      } else {
        localStorage.removeItem(WORLD_STORAGE_KEY);
      }
    }
  };

  // Export to global scope
  window.WorldSaver = WorldSaver;

  // Initialize when auth is ready
  if (window.TinyWorldAuthCustom) {
    WorldSaver.init();
  } else {
    // Fallback: init when custom auth loads
    document.addEventListener('DOMContentLoaded', () => {
      if (window.TinyWorldAuthCustom) {
        WorldSaver.init();
      }
    });
  }
})();
