// TinyWorld Backend API Client
// Provides methods to interact with the backend API for world persistence

class TinyWorldAPI {
  constructor(baseUrl = '', getAuthToken) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    this.getAuthToken = getAuthToken;
  }

  async request(endpoint, method = 'GET', data = null) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.warn('[API] No auth token available');
        return null;
      }

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const url = new URL(endpoint, this.baseUrl).toString();
      console.log(`[API] ${method} ${endpoint}`);

      const response = await fetch(url, options);

      if (response.status === 401) {
        console.error('[API] Unauthorized');
        return null;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error(`[API] Error: ${response.status}`, error);
        return null;
      }

      return await response.json();
    } catch (err) {
      console.error('[API] Request failed:', err);
      return null;
    }
  }

  // User Management
  async syncUser(email, username, displayName, avatarUrl) {
    return this.request('/api/users/sync', 'POST', {
      email,
      username,
      displayName,
      avatarUrl,
    });
  }

  // World Operations
  async getWorlds() {
    return this.request('/api/worlds', 'GET');
  }

  async getWorld(id) {
    return this.request(`/api/worlds/${id}`, 'GET');
  }

  async saveWorld(id, title, description, state) {
    return this.request('/api/worlds', 'POST', {
      id,
      title,
      description,
      state,
    });
  }

  async deleteWorld(id) {
    return this.request(`/api/worlds/${id}`, 'DELETE');
  }

  // Build History
  async getBuilds(worldId) {
    return this.request(`/api/worlds/${worldId}/builds`, 'GET');
  }

  async createBuild(worldId, title, description, state, changeSummary = '') {
    return this.request(`/api/worlds/${worldId}/builds`, 'POST', {
      title,
      description,
      state,
      changeSummary,
    });
  }

  async restoreBuild(worldId, buildId) {
    return this.request(
      `/api/worlds/${worldId}/builds/${buildId}/restore`,
      'POST'
    );
  }

  // Preferences
  async getPreferences() {
    return this.request('/api/preferences', 'GET');
  }

  async savePreferences(data) {
    return this.request('/api/preferences', 'PUT', data);
  }

  // Health Check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (_) {
      return false;
    }
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TinyWorldAPI;
}

// Or set on window for browser
if (typeof window !== 'undefined') {
  window.TinyWorldAPI = TinyWorldAPI;
}
