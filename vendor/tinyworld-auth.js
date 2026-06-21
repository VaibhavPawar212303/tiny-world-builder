// Simple Clerk auth wrapper - redirects to Clerk's hosted sign-in
// No external Clerk SDK dependency (redirects don't need it)

const AUTH_EVENTS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  ERROR: 'error',
  SIGNUP: 'signup',
};

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

class MissingClerkError extends AuthError {
  constructor(message = 'Clerk is not configured') {
    super(message);
    this.name = 'MissingClerkError';
  }
}

let clerkInitialized = false;
let clerkInitPromise = null;

function hideClerkAuth() {
  const authContainer = document.getElementById('clerk-auth-container');
  if (authContainer) {
    authContainer.style.display = 'none';
  }
}

function showClerkError(title, message) {
  const authContainer = document.getElementById('clerk-auth-container');
  const signInRoot = document.getElementById('clerk-sign-in-root');

  if (!authContainer) return;

  authContainer.style.display = 'flex';

  if (signInRoot) {
    signInRoot.innerHTML = `
      <div style="text-align:center;color:#d32f2f;font-family:system-ui">
        <h2 style="margin:0 0 16px;font-size:20px">${title}</h2>
        <p style="margin:0;font-size:14px;line-height:1.5">${message}</p>
      </div>
    `;
  }
}

function redirectToClerkSignIn(publishableKey) {
  try {
    console.log('[Clerk] Starting redirect with key:', publishableKey);

    // Extract domain from publishable key
    // pk_test_Y2hhcm1lZC1yZWRiaXJkLTIzLmNsZXJrLmFjY291bnRzLmRldiQ
    const parts = publishableKey.split('_');
    const encoded = parts[parts.length - 1];

    if (!encoded) {
      throw new Error('Invalid publishable key format (no encoded part)');
    }

    let decoded;
    try {
      decoded = atob(encoded);
    } catch (e) {
      throw new Error('Failed to decode publishable key: ' + e.message);
    }

    const domain = decoded.replace(/\$.*/, '').trim();

    if (!domain) {
      throw new Error('Could not extract domain from key (decoded: ' + decoded + ')');
    }

    const redirectUrl = window.location.href;
    const signInUrl = `https://${domain}/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;

    console.log('[Clerk] Extracted domain:', domain);
    console.log('[Clerk] Current URL:', redirectUrl);
    console.log('[Clerk] Sign-in URL:', signInUrl);

    // Show redirect modal
    const authContainer = document.getElementById('clerk-auth-container');
    const signInRoot = document.getElementById('clerk-sign-in-root');

    if (authContainer && signInRoot) {
      console.log('[Clerk] Auth container found, showing modal');
      authContainer.style.display = 'flex';
      signInRoot.innerHTML = `
        <div style="color:#666;font-size:14px;text-align:center">
          <p>Redirecting to Clerk...</p>
          <p style="font-size:12px;margin-top:12px;color:#999">
            <a href="${signInUrl}" style="color:#0066cc;text-decoration:none">Click here if not redirected</a>
          </p>
        </div>
      `;
    } else {
      console.warn('[Clerk] Auth container not found on this page');
    }

    // Redirect immediately
    console.log('[Clerk] Setting window.location.href to:', signInUrl);
    window.location.href = signInUrl;

  } catch (err) {
    console.error('[Clerk] Redirect failed:', err);
    showClerkError('Configuration Error', 'Could not redirect to sign-in: ' + err.message);
  }
}

function setupSignInButton() {
  const authContainer = document.getElementById('clerk-auth-container');
  const signInRoot = document.getElementById('clerk-sign-in-root');

  if (!authContainer || !signInRoot) {
    console.log('[Auth] Auth container not found on this page');
    return;
  }

  console.log('[Auth] Setting up sign-in button');
  authContainer.style.display = 'flex';

  signInRoot.innerHTML = `
    <div style="text-align:center;font-family:system-ui,-apple-system,sans-serif">
      <p style="margin:0 0 24px;font-size:16px;color:#333">Sign in to continue building</p>
      <div style="display:flex;gap:12px;flex-direction:column">
        <a href="/sign-in.html" style="display:inline-block;padding:12px 32px;background:#0066cc;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='#0052a3'" onmouseout="this.style.background='#0066cc'">Sign In</a>
        <a href="/sign-up.html" style="display:inline-block;padding:12px 32px;background:#666;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;transition:background 0.2s" onmouseover="this.style.background='#555'" onmouseout="this.style.background='#666'">Sign Up</a>
      </div>
      <p style="margin-top:16px;font-size:12px;color:#666">Create an account or sign in to your existing account</p>
    </div>
  `;
}

async function initClerk() {
  if (clerkInitialized) return true;

  if (clerkInitPromise) {
    return clerkInitPromise;
  }

  clerkInitPromise = (async () => {
    try {
      console.log('[Clerk] Starting Clerk initialization...');

      // For local development, skip Clerk auth
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      console.log('[Clerk] Development mode:', isDev);
      console.log('[Clerk] Hostname:', window.location.hostname);

      if (isDev) {
        console.log('[Clerk] ✓ Development mode - skipping Clerk auth');
        hideClerkAuth();
        clerkInitialized = true;
        return true;
      }

      const pubKey = window.__CLERK_PUBLISHABLE_KEY;
      console.log('[Clerk] Searching for Clerk public key...');
      console.log('[Clerk]   window.__CLERK_PUBLISHABLE_KEY:', pubKey ? '✓ Present (' + pubKey.substring(0, 20) + '...)' : '✗ Missing');
      console.log('[Clerk]   window.__NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', window.__NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✓ Present' : '✗ Missing');
      console.log('[Clerk]   window.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', window.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✓ Present' : '✗ Missing');

      if (!pubKey || pubKey === 'undefined') {
        console.error('[Clerk] ✗ Clerk key not configured');
        console.error('[Clerk] To fix: Set CLERK_PUBLISHABLE_KEY in .env.local or your environment');
        showClerkError(
          'Clerk is not configured',
          'Please set CLERK_PUBLISHABLE_KEY environment variable.'
        );
        return false;
      }
      console.log('[Clerk] ✓ Clerk key loaded: ' + pubKey.substring(0, 20) + '...');

      // Check if user is already authenticated
      const user = await getUser();
      if (user) {
        console.log('[Auth] User already signed in:', user.email);
        hideClerkAuth();
        clerkInitialized = true;
        return true;
      }

      // Show sign-in/sign-up buttons
      setupSignInButton();

      clerkInitialized = true;
      return true;
    } catch (err) {
      console.error('Auth initialization error:', err);
      showClerkError('Authentication Error', err.message || 'Failed to initialize auth');
      clerkInitialized = false;
      return false;
    }
  })();

  return clerkInitPromise;
}

async function getUser() {
  try {
    // Check localStorage for authenticated user
    const userStr = localStorage.getItem('tinyworld:user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('[Auth] User found in localStorage:', user.email);
      return user;
    }

    // Check for gotrue.user (Netlify Identity compatible)
    const gotrueStr = localStorage.getItem('gotrue.user');
    if (gotrueStr) {
      const user = JSON.parse(gotrueStr);
      console.log('[Auth] User found in gotrue.user:', user.email);
      return user;
    }
  } catch (err) {
    console.error('[Auth] Error reading user from localStorage:', err);
  }

  return null;
}

async function login(email, password) {
  throw new AuthError('Use Clerk hosted sign-in instead');
}

async function signup(email, password) {
  throw new AuthError('Use Clerk hosted sign-in instead');
}

async function logout() {
  try {
    console.log('[Auth] Logging out user');
    // Clear session data
    localStorage.removeItem('tinyworld:user');
    localStorage.removeItem('tinyworld:auth_token');
    localStorage.removeItem('gotrue.user');

    // Notify other tabs/windows of auth change
    window.dispatchEvent(new CustomEvent('tinyworld:auth-change'));

    return true;
  } catch (err) {
    console.error('[Auth] Logout failed:', err);
    throw err;
  }
}

async function updateUser(attributes = {}) {
  return null;
}

async function requestPasswordRecovery(email) {
  // Handled by Clerk's hosted pages
}

async function oauthLogin(provider) {
  // Handled by Clerk's hosted pages
}

function onAuthChange(callback) {
  // Without the SDK, we can't track auth changes
  callback(null);
}

async function handleAuthCallback() {
  // Clerk handles the callback
  return null;
}

async function getSettings() {
  return {
    autoconfirm: false,
    external: {
      google: false,
      github: false,
    },
  };
}

window.TinyWorldAuth = {
  AUTH_EVENTS,
  AuthError,
  MissingClerkError,
  getSettings,
  getUser,
  handleAuthCallback,
  login,
  logout,
  oauthLogin,
  onAuthChange,
  requestPasswordRecovery,
  signup,
  updateUser,
  initClerk,
};

// Auto-initialize Clerk on script load
if (typeof window.__resolveTinyWorldAuthReady === 'function') {
  initClerk().then(() => {
    window.__resolveTinyWorldAuthReady(true);
  }).catch((err) => {
    console.error('Clerk initialization failed:', err);
    window.__resolveTinyWorldAuthReady(false);
  });
}
