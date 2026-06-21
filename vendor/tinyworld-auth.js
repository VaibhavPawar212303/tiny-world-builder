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
    console.log('[Clerk] Starting sign-in redirect...');

    const signInUrl = window.location.pathname.includes('/tiny-world-builder')
      ? '/sign-in.html?redirect=/tiny-world-builder'
      : '/sign-in.html';

    console.log('[Clerk] Sign-in URL:', signInUrl);

    // Show redirect modal
    const authContainer = document.getElementById('clerk-auth-container');
    const signInRoot = document.getElementById('clerk-sign-in-root');

    if (authContainer && signInRoot) {
      console.log('[Clerk] Auth container found, showing redirect');
      authContainer.style.display = 'flex';
      signInRoot.innerHTML = `
        <div style="color:#666;font-size:14px;text-align:center">
          <p>Redirecting to sign in...</p>
          <p style="font-size:12px;margin-top:12px;color:#999">
            <a href="${signInUrl}" style="color:#0066cc;text-decoration:none">Click here if not redirected</a>
          </p>
        </div>
      `;
    } else {
      console.warn('[Clerk] Auth container not found on this page');
    }

    // Redirect immediately
    console.log('[Clerk] Navigating to:', signInUrl);
    window.location.href = signInUrl;

  } catch (err) {
    console.error('[Clerk] Redirect failed:', err);
    showClerkError('Error', 'Could not redirect to sign-in: ' + err.message);
  }
}

function setupSignInButton() {
  console.log('[Auth] setupSignInButton called');
  const authContainer = document.getElementById('clerk-auth-container');
  const signInRoot = document.getElementById('clerk-sign-in-root');

  console.log('[Auth] Auth container:', authContainer ? '✓ Found' : '✗ Not found');
  console.log('[Auth] Sign-in root:', signInRoot ? '✓ Found' : '✗ Not found');

  if (!authContainer || !signInRoot) {
    console.error('[Auth] Auth container not found on this page');
    return;
  }

  console.log('[Auth] Setting up Clerk sign-in redirect');
  authContainer.style.display = 'flex';

  const publishableKey = window.__CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.error('[Auth] Clerk publishable key not found');
    signInRoot.innerHTML = `
      <div style="text-align:center;color:#d32f2f;font-family:system-ui,-apple-system,sans-serif">
        <h2>Clerk is not configured</h2>
        <p>Unable to load authentication. Please check environment variables.</p>
      </div>
    `;
    return;
  }

  // Use Clerk's hosted sign-in page instead of embedded UI
  console.log('[Auth] Redirecting to Clerk hosted sign-in...');
  redirectToClerkSignIn(publishableKey);
}


async function initClerk() {
  if (clerkInitialized) return true;

  if (clerkInitPromise) {
    return clerkInitPromise;
  }

  clerkInitPromise = (async () => {
    try {
      console.log('[Clerk] Starting Clerk initialization...');

      // For local development only, skip auth
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      console.log('[Clerk] Hostname:', window.location.hostname);
      console.log('[Clerk] Development mode:', isDev);

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
      console.log('[Clerk] Checking if user is already authenticated...');
      const user = await getUser();
      console.log('[Clerk] getUser returned:', user ? 'User found: ' + user.email : 'No user');

      if (user) {
        console.log('[Auth] User already signed in:', user.email);
        hideClerkAuth();
        clerkInitialized = true;
        return true;
      }

      // Show sign-in/sign-up buttons
      console.log('[Clerk] Calling setupSignInButton...');
      setupSignInButton();
      console.log('[Clerk] setupSignInButton returned');

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
console.log('[Auth Module] tinyworld-auth.js loaded, checking for __resolveTinyWorldAuthReady...');
console.log('[Auth Module] typeof __resolveTinyWorldAuthReady:', typeof window.__resolveTinyWorldAuthReady);
if (typeof window.__resolveTinyWorldAuthReady === 'function') {
  console.log('[Auth Module] ✓ Found __resolveTinyWorldAuthReady, calling initClerk()...');
  initClerk().then(() => {
    console.log('[Auth Module] ✓ initClerk completed successfully');
    window.__resolveTinyWorldAuthReady(true);
  }).catch((err) => {
    console.error('Clerk initialization failed:', err);
    window.__resolveTinyWorldAuthReady(false);
  });
} else {
  console.warn('[Auth Module] ✗ __resolveTinyWorldAuthReady not found!');
}
