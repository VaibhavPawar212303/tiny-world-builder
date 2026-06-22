// Mobile collapsible panels handler
(function initMobilePanels() {
  const IS_MOBILE = window.innerWidth <= 768;
  if (!IS_MOBILE) return;

  const panelToggleMap = {
    'sound-icon': 'sound-panel',
    'layers-toggle': 'layers-panel',
    'tips-toggle': 'tips-panel',
  };

  const closeButtonMap = {
    'sound-panel-close': 'sound-panel',
    'layers-close': 'layers-panel',
  };

  function closeAllPanels() {
    Object.values(panelToggleMap).forEach(panelId => {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.remove('visible');
      }
    });
    document.body.classList.remove('panel-open');
  }

  function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    const isVisible = panel.classList.contains('visible');
    if (isVisible) {
      panel.classList.remove('visible');
      document.body.classList.remove('panel-open');
    } else {
      closeAllPanels();
      panel.classList.add('visible');
      document.body.classList.add('panel-open');
    }
  }

  // Setup toggle buttons
  Object.entries(panelToggleMap).forEach(([toggleId, panelId]) => {
    const button = document.getElementById(toggleId);
    if (button) {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel(panelId);
      });
    }
  });

  // Setup close buttons
  Object.entries(closeButtonMap).forEach(([closeId, panelId]) => {
    const button = document.getElementById(closeId);
    if (button) {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllPanels();
      });
    }
  });

  // Close panels when clicking outside them
  document.addEventListener('click', (e) => {
    const isClickInPanel = e.target.closest('.sound-panel, #layers-panel, #tips-panel, #crowd-panel');
    const isClickOnToggle = e.target.closest('#sound-icon, #layers-toggle, #tips-toggle, #crowd-panel-handle');

    if (!isClickInPanel && !isClickOnToggle) {
      closeAllPanels();
    }
  });

  // Close panels on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllPanels();
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeAllPanels();
    }
  });
})();
