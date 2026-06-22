// Custom Authentication UI and Flow
(function initCustomAuth() {
  'use strict';

  const API_BASE = '/api';
  const AUTH_STORAGE_KEY = 'tinyworld:auth_token';
  const USER_STORAGE_KEY = 'tinyworld:user';

  let currentUser = null;
  let isAuthModalOpen = false;

  // Auth UI Manager
  const AuthUI = {
    modal: null,
    loginForm: null,
    signupForm: null,
    closeBtn: null,
    userAccountArea: null,
    logoutBtn: null,
    userDisplayName: null,

    init() {
      this.modal = document.getElementById('auth-modal');
      this.loginForm = document.getElementById('auth-login-form');
      this.signupForm = document.getElementById('auth-signup-form');
      this.closeBtn = document.getElementById('auth-close');
      this.userAccountArea = document.getElementById('user-account-area');
      this.logoutBtn = document.getElementById('logout-btn');
      this.userDisplayName = document.getElementById('user-display-name');

      if (!this.modal) {
        console.warn('[Auth] Modal element not found');
        return;
      }

      this.setupEventListeners();
      this.checkAuthState();
    },

    setupEventListeners() {
      // Form switches
      document.getElementById('switch-to-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.showSignup();
      });

      document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLogin();
      });

      // Form submissions
      this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
      this.signupForm?.addEventListener('submit', (e) => this.handleSignup(e));

      // Close modal
      this.closeBtn?.addEventListener('click', () => this.close());
      this.modal?.addEventListener('click', (e) => {
        if (e.target === this.modal) this.close();
      });

      // Guest access
      document.getElementById('auth-guest')?.addEventListener('click', () => {
        this.createGuestUser();
      });

      // Logout button
      this.logoutBtn?.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
          TinyWorldAuthCustom.logout();
        }
      });

      // Keyboard close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isAuthModalOpen) {
          this.close();
        }
      });
    },

    async checkAuthState() {
      // Check if already logged in
      const token = localStorage.getItem(AUTH_STORAGE_KEY);
      const userStr = localStorage.getItem(USER_STORAGE_KEY);

      if (token && userStr) {
        try {
          currentUser = JSON.parse(userStr);
          console.log('[Auth] ✓ User already authenticated:', currentUser.email);
          this.close();
          return;
        } catch (err) {
          console.error('[Auth] Error parsing user:', err);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }

      // Show auth modal if not authenticated
      this.open();
    },

    open() {
      if (!this.modal) return;
      this.modal.removeAttribute('hidden');
      isAuthModalOpen = true;
      document.body.style.overflow = 'hidden';
      this.showLogin();
    },

    close() {
      if (!this.modal) return;
      // Only close if user is authenticated or is a guest
      if (!currentUser) return;
      this.modal.setAttribute('hidden', '');
      isAuthModalOpen = false;
      document.body.style.overflow = '';
    },

    showLogin() {
      if (this.loginForm) this.loginForm.removeAttribute('hidden');
      if (this.signupForm) this.signupForm.setAttribute('hidden', '');
      this.clearErrors();
    },

    showSignup() {
      if (this.loginForm) this.loginForm.setAttribute('hidden', '');
      if (this.signupForm) this.signupForm.removeAttribute('hidden');
      this.clearErrors();
    },

    clearErrors() {
      document.getElementById('login-error')?.setAttribute('hidden', '');
      document.getElementById('signup-error')?.setAttribute('hidden', '');
    },

    showError(formType, message) {
      const errorEl = document.getElementById(`${formType}-error`);
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.removeAttribute('hidden');
      }
    },

    setLoading(formType, isLoading) {
      const loadingEl = document.getElementById(`${formType}-loading`);
      const submitBtn = document.getElementById(`${formType}-submit`);
      if (loadingEl) {
        if (isLoading) {
          loadingEl.removeAttribute('hidden');
        } else {
          loadingEl.setAttribute('hidden', '');
        }
      }
      if (submitBtn) {
        submitBtn.disabled = isLoading;
      }
    },

    async handleLogin(e) {
      e.preventDefault();
      this.clearErrors();
      this.setLoading('login', true);

      try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
          throw new Error('Email and password are required');
        }

        const response = await fetch(`${API_BASE}/auth?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Store auth data
        localStorage.setItem(AUTH_STORAGE_KEY, data.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        currentUser = data.user;

        console.log('[Auth] ✓ Login successful:', currentUser.email);

        // Reset form
        this.loginForm.reset();
        this.updateUserDisplay();
        this.close();

        // Notify app of auth change
        window.dispatchEvent(new CustomEvent('tinyworld:auth-change', { detail: { user: currentUser } }));

      } catch (err) {
        console.error('[Auth] Login error:', err);
        this.showError('login', err.message || 'Login failed');
      } finally {
        this.setLoading('login', false);
      }
    },

    async handleSignup(e) {
      e.preventDefault();
      this.clearErrors();
      this.setLoading('signup', true);

      try {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;

        if (!name || !email || !password || !confirm) {
          throw new Error('All fields are required');
        }

        if (password !== confirm) {
          throw new Error('Passwords do not match');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const response = await fetch(`${API_BASE}/auth?action=signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Signup failed');
        }

        // Store auth data
        localStorage.setItem(AUTH_STORAGE_KEY, data.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        currentUser = data.user;

        console.log('[Auth] ✓ Signup successful:', currentUser.email);

        // Reset form
        this.signupForm.reset();
        this.updateUserDisplay();
        this.close();

        // Notify app of auth change
        window.dispatchEvent(new CustomEvent('tinyworld:auth-change', { detail: { user: currentUser } }));

      } catch (err) {
        console.error('[Auth] Signup error:', err);
        this.showError('signup', err.message || 'Signup failed');
      } finally {
        this.setLoading('signup', false);
      }
    },

    createGuestUser() {
      const guestUser = {
        id: 'guest_' + Date.now(),
        email: 'guest@tinyworld.local',
        name: 'Guest',
        is_guest: true,
        created_at: new Date().toISOString()
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guestUser));
      localStorage.setItem(AUTH_STORAGE_KEY, 'guest-token-' + guestUser.id);

      currentUser = guestUser;
      console.log('[Auth] ✓ Guest user created');

      this.updateUserDisplay();
      this.close();
      window.dispatchEvent(new CustomEvent('tinyworld:auth-change', { detail: { user: currentUser } }));
    },

    updateUserDisplay() {
      if (!currentUser) {
        if (this.userAccountArea) {
          this.userAccountArea.setAttribute('hidden', '');
        }
        return;
      }

      if (this.userAccountArea) {
        this.userAccountArea.removeAttribute('hidden');
      }

      if (this.userDisplayName) {
        const displayName = currentUser.name || currentUser.email || 'User';
        this.userDisplayName.textContent = displayName;
      }
    }
  };

  // Public API
  const TinyWorldAuthCustom = {
    init() {
      AuthUI.init();
    },

    getUser() {
      return currentUser;
    },

    getToken() {
      return localStorage.getItem(AUTH_STORAGE_KEY);
    },

    async logout() {
      try {
        const token = localStorage.getItem(AUTH_STORAGE_KEY);
        if (token && !token.startsWith('guest-token-')) {
          await fetch(`${API_BASE}/auth?action=logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
        }
      } catch (err) {
        console.error('[Auth] Logout API error:', err);
      } finally {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        currentUser = null;
        AuthUI.updateUserDisplay();
        window.dispatchEvent(new CustomEvent('tinyworld:auth-change', { detail: { user: null } }));
        AuthUI.open();
      }
    },

    isAuthenticated() {
      return !!currentUser;
    },

    isGuest() {
      return currentUser?.is_guest === true;
    }
  };

  // Export to global scope
  window.TinyWorldAuthCustom = TinyWorldAuthCustom;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      TinyWorldAuthCustom.init();
    });
  } else {
    TinyWorldAuthCustom.init();
  }
})();
