// Mobile collapsible toolbar handler
(function initMobileToolbar() {
  const IS_MOBILE = () => window.innerWidth <= 768;

  if (!IS_MOBILE()) return;

  const CONTROLS = document.querySelector('.controls');
  if (!CONTROLS) return;

  // Create toggle button
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

  // Hide toolbar by default on mobile
  CONTROLS.style.display = 'none';

  // Toggle toolbar visibility
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

  // Close toolbar when clicking outside
  document.addEventListener('click', (e) => {
    const isClickInToolbar = e.target.closest('.controls');
    const isClickOnToggle = e.target.closest('#toolbar-toggle');

    if (!isClickInToolbar && !isClickOnToggle && CONTROLS.style.display !== 'none') {
      CONTROLS.style.display = 'none';
      toggleBtn.textContent = '≡';
      document.body.classList.remove('toolbar-open');
    }
  });

  // Close toolbar on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && CONTROLS.style.display !== 'none') {
      CONTROLS.style.display = 'none';
      toggleBtn.textContent = '≡';
      document.body.classList.remove('toolbar-open');
    }
  });

  // Handle resize
  window.addEventListener('resize', () => {
    if (!IS_MOBILE()) {
      CONTROLS.style.display = '';
      toggleBtn.style.display = 'none';
      CONTROLS.style.position = '';
      CONTROLS.style.zIndex = '';
      CONTROLS.style.background = '';
      CONTROLS.style.borderRadius = '';
      CONTROLS.style.padding = '';
    }
  });
})();
