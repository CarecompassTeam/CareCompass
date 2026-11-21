/* =====================================
   CareCompass — Auth service
=====================================
   Frontend auth state in one file:

   - signIn()  : real backend first (POST /api/auth/signin),
                 bundled demo accounts as offline fallback.
   - setSession() / getSession() : token handling. The backend does not
                 issue a JWT yet, so the client mints an opaque session
                 token (crypto.randomUUID) and stores it together with
                 the user payload — localStorage when "keep me signed in"
                 is checked, sessionStorage otherwise. Sessions expire
                 after 12 hours and are cleared automatically.
   - logout()  : clears every stored session artifact.

   Nothing else in the app touches localStorage for auth — components
   use the useAuth() hook (see src/hooks/use-auth.jsx).
===================================== */

const SESSION_KEY = "carecompass.session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Mirrors the seeded DemoAccounts in the backend (Prisma) — used only
   when the backend is unreachable so the demo still works offline. */
export const DEMO_ACCOUNTS = [
  {
    email: "doctor@carecompass.app",
    password: "demo1234",
    role: "doctor",
    name: "Dr. Hana Kamal",
    redirect: "/doctor/patients",
  },
  {
    email: "patient@carecompass.app",
    password: "demo1234",
    role: "patient",
    name: "Mariam R.",
    redirect: "/patient/home",
  },
  {
    email: "admin@carecompass.app",
    password: "demo1234",
    role: "admin",
    name: "Admin",
    redirect: "/admin/users",
  },
  {
    email: "disabled@carecompass.app",
    password: "demo1234",
    role: "doctor",
    name: "Dr. Mariam Adel",
    redirect: "",
    disabled: true,
  },
  {
    email: "doctor2@carecompass.app",
    password: "demo1234",
    role: "doctor",
    name: "Dr. Omar Saleh",
    redirect: "/doctor/patients",
  },
];

/* ── Token handling ─────────────────────────────────────────────── */

function createToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `cc.${crypto.randomUUID()}`;
  }
  return `cc.${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}`;
}

function storageFor(remember) {
  return remember ? window.localStorage : window.sessionStorage;
}

export function setSession({ user, remember = true, demo = false }) {
  const token = createToken();
  const session = {
    token,
    demo,
    user, // { email, name, role, redirect }
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  try {
    /* Clear the other storage first so we never keep two sessions. */
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    storageFor(remember).setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* Storage can be unavailable (private mode) — keep the session in
       memory only by returning it; getSession() below still works for
       this tab through the fallback cache. */
  }

  memorySession = session;
  return session;
}

let memorySession = null;

export function getSession() {
  /* 1) This-tab fallback (storage unavailable). */
  if (memorySession && memorySession.expiresAt > Date.now()) {
    return memorySession;
  }

  /* 2) Persisted session — localStorage wins over sessionStorage. */
  let raw = null;
  try {
    raw =
      window.localStorage.getItem(SESSION_KEY) ||
      window.sessionStorage.getItem(SESSION_KEY);
  } catch {
    raw = null;
  }

  if (!raw) return null;

  try {
    const session = JSON.parse(raw);

    if (!session?.token || !session?.user) {
      logout();
      return null;
    }

    if (session.expiresAt <= Date.now()) {
      logout(); // expired — clean it up
      return null;
    }

    return session;
  } catch {
    logout();
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function logout() {
  memorySession = null;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore storage errors on logout */
  }
}

/* ── Sign in ────────────────────────────────────────────────────── */

function demoSignIn(email, password) {
  const match = DEMO_ACCOUNTS.find(
    (account) =>
      account.email.toLowerCase() === email.trim().toLowerCase() &&
      account.password === password
  );

  if (!match) {
    const error = new Error("Email or password is incorrect.");
    error.status = 401;
    error.code = "INVALID";
    throw error;
  }

  if (match.disabled) {
    const error = new Error(
      "This account has been disabled. Please contact your administrator."
    );
    error.status = 403;
    error.code = "ACCOUNT_DISABLED";
    throw error;
  }

  return {
    ok: true,
    role: match.role,
    name: match.name,
    redirect: match.redirect,
    demo: true, // signed in against the bundled demo list, not the backend
  };
}

/**
 * Sign in — real backend first, demo fallback when it cannot be reached.
 *
 * Resolves with: { ok, role, name, redirect, demo, remember }
 * Rejects with an Error carrying `.status` and `.code` from the backend.
 */
export async function signIn(email, password, { remember = true } = {}) {
  if (!EMAIL_RE.test(email.trim())) {
    const error = new Error("Enter a valid email address.");
    error.code = "VALIDATION";
    throw error;
  }

  if (!password) {
    const error = new Error("Password is required.");
    error.code = "VALIDATION";
    throw error;
  }

  let result;

  try {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        data.error || `Sign in failed (status ${response.status}).`
      );
      error.status = response.status;
      error.code = data.code || "SIGNIN_FAILED";
      throw error;
    }

    result = { ...data, demo: false };
  } catch (error) {
    /* Fall back to the demo accounts when the backend is unreachable
       (network error) or broken (5xx / 404). Real 401/403 responses
       (wrong password, disabled account) still surface as-is. */
    const backendDown =
      error?.name === "TypeError" ||
      error?.status >= 500 ||
      error?.status === 404;

    if (backendDown) {
      result = demoSignIn(email, password);
    } else {
      throw error;
    }
  }

  setSession({
    user: {
      email: email.trim().toLowerCase(),
      name: result.name,
      role: String(result.role || "").toLowerCase(),
      redirect: result.redirect || "",
    },
    remember,
    demo: result.demo,
  });

  return result;
}
