/* =====================================
   CareCompass — Auth context & route guard
=====================================
   App-wide auth state on top of src/services/auth.js:

   - <AuthProvider>  : restores the persisted session on mount and
                       exposes { session, user, isAuthed, signIn, logout }.
   - useAuth()       : read auth state anywhere in the tree.
   - <RequireAuth>   : route guard. Renders children only when a session
                       exists and (optionally) the role matches; otherwise
                       renders `fallback` (default: a sign-in required
                       card). Works with the current view-switching App
                       and with react-router later (same guard pattern).
===================================== */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AlertCircle, LogIn } from "lucide-react";

import { getSession, logout as clearSession, signIn as serviceSignIn } from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  /* Keep the in-memory state in sync across tabs and on expiry. */
  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const signIn = useCallback(async (email, password, options) => {
    const result = await serviceSignIn(email, password, options);
    setSession(getSession());
    return result;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo(() => {
    const next = {
      session,
      user: session?.user || null,
      isAuthed: session !== null,
      isDemo: session?.demo === true,
      signIn,
      logout,
    };

    return next;
  }, [session, signIn, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }

  return context;
}

/* ── Route guard ────────────────────────────────────────────────── */

export function RequireAuth({ role, children, fallback }) {
  const { session, isAuthed } = useAuth();

  if (!isAuthed || !session) {
    return fallback || <SignInRequiredCard />;
  }

  if (role && session.user?.role !== role) {
    return fallback || <AccessDeniedCard neededRole={role} />;
  }

  return children;
}

function SignInRequiredCard() {
  return (
    <div className="auth-guard-card">
      <span className="auth-guard-icon">
        <LogIn size={22} />
      </span>
      <h2>Sign in required</h2>
      <p>
        This area is protected. Sign in with your CareCompass account to
        continue.
      </p>
    </div>
  );
}

function AccessDeniedCard({ neededRole }) {
  return (
    <div className="auth-guard-card">
      <span className="auth-guard-icon denied">
        <AlertCircle size={22} />
      </span>
      <h2>Access denied</h2>
      <p>
        Your account does not have the{" "}
        <strong>{neededRole}</strong> role required for this area.
      </p>
    </div>
  );
}
