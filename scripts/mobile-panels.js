// Mobile collapsible panels handler
(function initMobilePanels() {
  const IS_MOBILE = () => window.innerWidth <= 768;

  if (!IS_MOBILE()) return;

  const panelToggleMap = {
    'sound-icon': 'sound-panel',
    'layers-toggle': 'layers-panel',
    'tips-toggle': 'tips-panel',
  };

  const closeButtonMap = {
    'sound-panel-close': 'sound-panel',
    'layers-close': 'layers-panel',
  };

  // Initialize panels - remove hidden attribute
  function initPanels() {
    Object.values(panelToggleMap).forEach(panelId => {
      const panel = document.getElementById(panelId);
      if (panel) {
        // Remove hidden attribute so CSS can control visibility
        panel.removeAttribute('hidden');
        panel.classList.add('mobile-panel');
      }
    });
  }

  function closeAllPanels() {
    Object.values(panelToggleMap).forEach(panelId => {
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.remove('visible');
        panel.setAttribute('hidden', '');
      }
    });
    document.body.classList.remove('panel-open');
  }

  function openPanel(panelId) {
    closeAllPanels();
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.removeAttribute('hidden');
      panel.classList.add('visible');
      document.body.classList.add('panel-open');
    }
  }

  function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;

    if (panel.hasAttribute('hidden') || !panel.classList.contains('visible')) {
      openPanel(panelId);
    } else {
      closeAllPanels();
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanels);
  } else {
    initPanels();
  }

  // Setup toggle buttons
  setTimeout(() => {
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
      const isClickInPanel = e.target.closest('.sound-panel, .layers-panel, .tips-panel, .crowd-panel');
      const isClickOnToggle = e.target.closest('#sound-icon, #layers-toggle, #tips-toggle, #crowd-panel-handle');

      if (!isClickInPanel && !isClickOnToggle && document.body.classList.contains('panel-open')) {
        closeAllPanels();
      }
    });

    // Close panels on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('panel-open')) {
        closeAllPanels();
      }
    });
  }, 100);

  // Handle window resize
  window.addEventListener('resize', () => {
    if (!IS_MOBILE()) {
      closeAllPanels();
    }
  });
})();
