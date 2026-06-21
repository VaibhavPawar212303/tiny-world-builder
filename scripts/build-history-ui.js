// Build History UI - Version control and restoration
// Provides UI for viewing and restoring previous world builds

(function initBuildHistoryUI() {
  'use strict';

  // Wait for DOM and API to be ready
  if (typeof window === 'undefined') return;

  const buildHistoryUI = {
    isOpen: false,
    currentWorldId: null,

    async init() {
      // Wait for backend to be ready
      const maxWait = 10000;
      const start = Date.now();
      while (!window.tinyWorldAPI && Date.now() - start < maxWait) {
        await new Promise(r => setTimeout(r, 100));
      }

      if (!window.tinyWorldAPI) {
        console.warn('[BuildHistory] API not available');
        return;
      }

      this.createUI();
    },

    createUI() {
      // Create container
      const container = document.createElement('div');
      container.id = 'build-history-panel';
      container.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        width: 320px;
        max-height: 500px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      const header = document.createElement('div');
      header.style.cssText = `
        padding: 12px 16px;
        border-bottom: 1px solid #eee;
        background: #f9f9f9;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      header.innerHTML = `
        <h3 style="margin: 0; font-size: 14px; font-weight: 600;">Build History</h3>
        <button id="close-build-history" style="
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">×</button>
      `;

      const list = document.createElement('div');
      list.id = 'build-history-list';
      list.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      `;
      list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Loading builds...</p>';

      const actions = document.createElement('div');
      actions.style.cssText = `
        padding: 12px 16px;
        border-top: 1px solid #eee;
        background: #f9f9f9;
        display: flex;
        gap: 8px;
      `;
      actions.innerHTML = `
        <button id="save-build-btn" style="
          flex: 1;
          padding: 8px 12px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        ">Save Build</button>
      `;

      container.appendChild(header);
      container.appendChild(list);
      container.appendChild(actions);
      document.body.appendChild(container);

      // Wire up events
      document.getElementById('close-build-history').addEventListener('click', () => {
        this.close();
      });

      document.getElementById('save-build-btn').addEventListener('click', () => {
        this.saveBuild();
      });

      // Create toggle button (add to world menu)
      this.createToggleButton();
    },

    createToggleButton() {
      // Look for world menu or create a button in the UI
      const worldMenu = document.querySelector('[data-action="world-menu"]');
      if (!worldMenu) {
        // Fallback: create a button in top-right
        const btn = document.createElement('button');
        btn.id = 'toggle-build-history';
        btn.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          padding: 8px 12px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          z-index: 999;
          font-size: 12px;
          font-weight: 600;
        `;
        btn.textContent = 'Build History';
        btn.addEventListener('click', () => this.toggle());
        document.body.appendChild(btn);
      }
    },

    async loadBuilds() {
      if (!this.currentWorldId || !window.tinyWorldAPI) return;

      const list = document.getElementById('build-history-list');
      list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Loading...</p>';

      try {
        const builds = await window.tinyWorldAPI.getBuilds(this.currentWorldId);

        if (!builds || builds.length === 0) {
          list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No builds yet</p>';
          return;
        }

        list.innerHTML = builds.map((build, idx) => `
          <div style="
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 4px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: background 0.2s;
          " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='transparent'" onclick="window.buildHistoryUI.restoreBuild('${build.id}')">
            <div style="font-weight: 600; font-size: 13px;">v${build.version}</div>
            <div style="font-size: 12px; color: #666;">${build.title || 'Build ' + build.version}</div>
            <div style="font-size: 11px; color: #999;">
              ${new Date(build.created_at).toLocaleDateString()} ${new Date(build.created_at).toLocaleTimeString()}
            </div>
            ${build.change_summary ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">${build.change_summary}</div>` : ''}
          </div>
        `).join('');
      } catch (err) {
        console.error('[BuildHistory] Failed to load:', err);
        list.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Failed to load builds</p>';
      }
    },

    async saveBuild() {
      if (!this.currentWorldId || !window.tinyWorldAPI) return;

      const title = prompt('Build title:', '');
      if (title === null) return;

      try {
        const state = window.buildWorldStateObject?.();
        if (!state) {
          alert('Could not capture world state');
          return;
        }

        await window.tinyWorldAPI.createBuild(
          this.currentWorldId,
          title,
          '',
          state,
          'Manual save'
        );

        alert('Build saved!');
        this.loadBuilds();
      } catch (err) {
        console.error('[BuildHistory] Save failed:', err);
        alert('Failed to save build');
      }
    },

    async restoreBuild(buildId) {
      if (!this.currentWorldId || !window.tinyWorldAPI) return;

      if (!confirm('Restore this build? Current changes will be replaced.')) return;

      try {
        await window.tinyWorldAPI.restoreBuild(this.currentWorldId, buildId);
        alert('Build restored! Reloading...');
        location.reload();
      } catch (err) {
        console.error('[BuildHistory] Restore failed:', err);
        alert('Failed to restore build');
      }
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    open() {
      const panel = document.getElementById('build-history-panel');
      if (panel) {
        panel.style.display = 'flex';
        this.isOpen = true;
        this.loadBuilds();
      }
    },

    close() {
      const panel = document.getElementById('build-history-panel');
      if (panel) {
        panel.style.display = 'none';
        this.isOpen = false;
      }
    },

    setWorldId(worldId) {
      this.currentWorldId = worldId;
    },
  };

  window.buildHistoryUI = buildHistoryUI;
  buildHistoryUI.init();
})();
