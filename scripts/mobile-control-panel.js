// Mobile unified control panel
(function initMobileControlPanel() {
  const IS_MOBILE = () => window.innerWidth <= 768;

  if (!IS_MOBILE()) return;

  // Wait for DOM to be ready
  setTimeout(() => {
    const CONTROLS = document.querySelector('.controls');
    if (!CONTROLS) return;

    // Create mobile control panel modal
    const panel = document.createElement('div');
    panel.id = 'mobile-control-panel';
    panel.className = 'mobile-control-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Control panel');
    panel.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      max-height: 0;
      background: rgba(255, 255, 255, 0.98);
      border-top: 2px solid #ddd;
      overflow-y: auto;
      z-index: 999;
      transition: max-height 0.3s ease-in-out;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    `;

    // Create panel header
    const header = document.createElement('div');
    header.className = 'control-panel-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Tools & Settings';
    title.style.cssText = 'margin: 0; font-size: 16px; font-weight: 600;';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'control-panel-close';
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
    `;
    header.appendChild(closeBtn);

    panel.appendChild(header);

    // Create content sections
    const content = document.createElement('div');
    content.className = 'control-panel-content';
    content.style.cssText = 'padding: 12px;';

    // Section 1: View & Display
    const viewSection = createSection('View & Display', [
      { id: 'home', label: '🏠 Center', tooltip: 'Center on your grid' },
      { id: 'persp', label: '📦 Perspective', tooltip: 'Toggle camera mode' },
      { id: 'view-modes', label: '👁️ Views', tooltip: 'Pick a camera view' },
      { id: 'time-weather', label: '⛅ Weather', tooltip: 'Time & weather' },
      { id: 'showcase-mode', label: '🎬 Showcase', tooltip: 'Showcase mode' },
    ]);
    content.appendChild(viewSection);

    // Section 2: Building Tools
    const buildSection = createSection('Building', [
      { id: 'build-play-mode', label: '🔨 Build/Play', tooltip: 'Switch mode' },
      { id: 'stamp-builder', label: '🏛️ Stamps', tooltip: 'Open stamps' },
      { id: 'clear', label: '🗑️ Clear', tooltip: 'Clear to grass' },
    ]);
    content.appendChild(buildSection);

    // Section 3: Files
    const fileSection = createSection('Files', [
      { id: 'import', label: '📥 Import', tooltip: 'Import JSON' },
      { id: 'export', label: '📤 Export', tooltip: 'Export JSON' },
      { id: 'reset', label: '🔄 Reset', tooltip: 'Reset world' },
    ]);
    content.appendChild(fileSection);

    // Section 4: Panels
    const panelSection = createSection('Panels', [
      { id: 'sound-icon', label: '🔊 Sound', tooltip: 'Sound controls' },
      { id: 'layers-toggle', label: '📋 Layers', tooltip: 'World items' },
      { id: 'tips-toggle', label: '⌨️ Controls', tooltip: 'Keyboard help' },
      { id: 'render-settings', label: '⚙️ Settings', tooltip: 'Render settings' },
    ]);
    content.appendChild(panelSection);

    // Section 5: Advanced
    const advSection = createSection('Advanced', [
      { id: 'generate', label: '✨ Generate', tooltip: 'AI generation', hidden: true },
      { id: 'dev-mode', label: '🖥️ Developer', tooltip: 'Developer tools' },
      { id: 'account-btn', label: '👤 Account', tooltip: 'My account', hidden: true },
    ]);
    content.appendChild(advSection);

    panel.appendChild(content);
    document.body.appendChild(panel);

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'mobile-control-toggle';
    toggleBtn.className = 'mobile-control-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle control panel');
    toggleBtn.innerHTML = '☰'; // Menu icon
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 1001;
      width: 48px;
      height: 48px;
      border: 2px solid #0066cc;
      border-radius: 50%;
      background: white;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    `;

    document.body.appendChild(toggleBtn);

    // Toggle panel
    function togglePanel(show) {
      if (show === undefined) {
        show = panel.style.maxHeight === '0px' || panel.style.maxHeight === '';
      }

      if (show) {
        const maxHeight = Math.min(window.innerHeight * 0.8, 500);
        panel.style.maxHeight = maxHeight + 'px';
        toggleBtn.textContent = '✕';
        toggleBtn.style.background = '#0066cc';
        toggleBtn.style.color = 'white';
      } else {
        panel.style.maxHeight = '0px';
        toggleBtn.textContent = '☰';
        toggleBtn.style.background = 'white';
        toggleBtn.style.color = '#0066cc';
      }
    }

    // Event listeners
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel(false);
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.mobile-control-panel') &&
          !e.target.closest('#mobile-control-toggle') &&
          panel.style.maxHeight !== '0px') {
        togglePanel(false);
      }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.style.maxHeight !== '0px') {
        togglePanel(false);
      }
    });

    // Close panel when a button is clicked
    const allButtons = panel.querySelectorAll('.control-btn');
    allButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setTimeout(() => togglePanel(false), 100);
      });
    });

    // Adjust on resize
    window.addEventListener('resize', () => {
      if (!IS_MOBILE()) {
        toggleBtn.style.display = 'none';
        panel.style.display = 'none';
      }
    });

    // Initialize closed
    togglePanel(false);
  }, 200);

  // Helper to create section
  function createSection(title, buttons) {
    const section = document.createElement('div');
    section.className = 'control-section';
    section.style.cssText = 'margin-bottom: 16px;';

    const heading = document.createElement('h4');
    heading.textContent = title;
    heading.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    section.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'control-buttons-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    `;

    buttons.forEach(btnConfig => {
      if (btnConfig.hidden) return;

      const originalBtn = document.getElementById(btnConfig.id);
      if (!originalBtn) return;

      const btn = document.createElement('button');
      btn.className = 'control-btn';
      btn.type = 'button';
      btn.title = btnConfig.tooltip;
      btn.textContent = btnConfig.label;
      btn.style.cssText = `
        padding: 10px 12px;
        background: #f5f5f5;
        border: 1px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        transition: all 0.2s;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#e8e8e8';
        btn.style.borderColor = '#999';
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.background = '#f5f5f5';
        btn.style.borderColor = '#ddd';
      });

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        originalBtn.click();
      });

      grid.appendChild(btn);
    });

    section.appendChild(grid);
    return section;
  }
})();
