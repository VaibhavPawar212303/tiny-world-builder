// Mobile collapsible toolbar handler
(function initMobileToolbar() {
  const IS_MOBILE = () => window.innerWidth <= 768;

  if (!IS_MOBILE()) return;

  const CONTROLS = document.querySelector('.controls');
  const BUILDING_OPTIONS = document.querySelector('.building-options');

  if (!CONTROLS && !BUILDING_OPTIONS) return;

  // Create toggle button for left sidebar
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'toolbar-toggle';
  toggleBtn.className = 'toolbar-toggle-btn';
  toggleBtn.setAttribute('aria-label', 'Toggle toolbar');
  toggleBtn.innerHTML = '≡'; // Hamburger icon
  toggleBtn.style.cssText = `
    position: fixed;
    left: 8px;
    top: 12px;
    z-index: 1001;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 2px solid #0066cc;
    border-radius: 8px;
    background: white;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  document.body.appendChild(toggleBtn);

  // Create toggle button for bottom toolbar
  const bottomToggleBtn = document.createElement('button');
  bottomToggleBtn.id = 'bottom-toolbar-toggle';
  bottomToggleBtn.className = 'bottom-toolbar-toggle-btn';
  bottomToggleBtn.setAttribute('aria-label', 'Toggle building options');
  bottomToggleBtn.innerHTML = '⬆'; // Up arrow
  bottomToggleBtn.style.cssText = `
    position: fixed;
    right: 8px;
    bottom: 12px;
    z-index: 1001;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 2px solid #00cc66;
    border-radius: 8px;
    background: white;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `;

  if (BUILDING_OPTIONS) {
    document.body.appendChild(bottomToggleBtn);
    BUILDING_OPTIONS.style.display = 'none';
  }

  // Hide left toolbar by default on mobile
  if (CONTROLS) {
    CONTROLS.style.display = 'none';
  }

  // Toggle left toolbar visibility
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = CONTROLS.style.display === 'none';

    if (isHidden) {
      // Show toolbar
      CONTROLS.style.display = 'flex';
      CONTROLS.style.position = 'fixed';
      CONTROLS.style.zIndex = '1000';
      CONTROLS.style.background = 'rgba(255, 255, 255, 0.95)';
      CONTROLS.style.borderRadius = '12px';
      CONTROLS.style.padding = '8px';
      toggleBtn.textContent = '✕';
      document.body.classList.add('toolbar-open');
    } else {
      // Hide toolbar
      CONTROLS.style.display = 'none';
      toggleBtn.textContent = '≡';
      document.body.classList.remove('toolbar-open');
    }
  });

  // Toggle bottom toolbar visibility
  if (BUILDING_OPTIONS) {
    bottomToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = BUILDING_OPTIONS.style.display === 'none';

      if (isHidden) {
        // Show bottom toolbar
        BUILDING_OPTIONS.style.display = 'flex';
        BUILDING_OPTIONS.style.position = 'fixed';
        BUILDING_OPTIONS.style.zIndex = '1000';
        BUILDING_OPTIONS.style.background = 'rgba(255, 255, 255, 0.95)';
        BUILDING_OPTIONS.style.borderRadius = '12px';
        BUILDING_OPTIONS.style.padding = '8px';
        BUILDING_OPTIONS.style.bottom = '60px';
        BUILDING_OPTIONS.style.right = '8px';
        BUILDING_OPTIONS.style.flexDirection = 'column';
        BUILDING_OPTIONS.style.maxHeight = '70vh';
        BUILDING_OPTIONS.style.overflowY = 'auto';
        bottomToggleBtn.textContent = '⬇';
        document.body.classList.add('bottom-toolbar-open');
      } else {
        // Hide bottom toolbar
        BUILDING_OPTIONS.style.display = 'none';
        bottomToggleBtn.textContent = '⬆';
        document.body.classList.remove('bottom-toolbar-open');
      }
    });
  }

  // Close toolbars when clicking outside
  document.addEventListener('click', (e) => {
    const isClickInLeftToolbar = e.target.closest('.controls');
    const isClickOnLeftToggle = e.target.closest('#toolbar-toggle');
    const isClickInBottomToolbar = e.target.closest('.building-options');
    const isClickOnBottomToggle = e.target.closest('#bottom-toolbar-toggle');

    if (!isClickInLeftToolbar && !isClickOnLeftToggle && CONTROLS && CONTROLS.style.display !== 'none') {
      CONTROLS.style.display = 'none';
      toggleBtn.textContent = '≡';
      document.body.classList.remove('toolbar-open');
    }

    if (!isClickInBottomToolbar && !isClickOnBottomToggle && BUILDING_OPTIONS && BUILDING_OPTIONS.style.display !== 'none') {
      BUILDING_OPTIONS.style.display = 'none';
      bottomToggleBtn.textContent = '⬆';
      document.body.classList.remove('bottom-toolbar-open');
    }
  });

  // Close toolbars on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (CONTROLS && CONTROLS.style.display !== 'none') {
        CONTROLS.style.display = 'none';
        toggleBtn.textContent = '≡';
        document.body.classList.remove('toolbar-open');
      }
      if (BUILDING_OPTIONS && BUILDING_OPTIONS.style.display !== 'none') {
        BUILDING_OPTIONS.style.display = 'none';
        bottomToggleBtn.textContent = '⬆';
        document.body.classList.remove('bottom-toolbar-open');
      }
    }
  });

  // Handle resize
  window.addEventListener('resize', () => {
    if (!IS_MOBILE()) {
      if (CONTROLS) {
        CONTROLS.style.display = '';
        CONTROLS.style.position = '';
        CONTROLS.style.zIndex = '';
        CONTROLS.style.background = '';
        CONTROLS.style.borderRadius = '';
        CONTROLS.style.padding = '';
      }
      if (BUILDING_OPTIONS) {
        BUILDING_OPTIONS.style.display = '';
        BUILDING_OPTIONS.style.position = '';
        BUILDING_OPTIONS.style.zIndex = '';
        BUILDING_OPTIONS.style.background = '';
        BUILDING_OPTIONS.style.borderRadius = '';
        BUILDING_OPTIONS.style.padding = '';
        BUILDING_OPTIONS.style.bottom = '';
        BUILDING_OPTIONS.style.right = '';
        BUILDING_OPTIONS.style.flexDirection = '';
        BUILDING_OPTIONS.style.maxHeight = '';
        BUILDING_OPTIONS.style.overflowY = '';
        bottomToggleBtn.style.display = 'none';
      }
      toggleBtn.style.display = 'none';
    }
  });
})();
