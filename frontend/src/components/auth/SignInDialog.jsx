
import { useEffect, useId, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  Stethoscope,
  HeartPulse,
  UserCog,
  CheckCircle2,
  ArrowLeft,
  X,
} from "lucide-react";
import "./SignInDialog.css";

const DISCLAIMER =
  "Information assistant. Not a diagnosis. The doctor decides.";

const DEMO_ACCOUNTS = [
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

const ROLE_META = {
  doctor: {
    icon: Stethoscope,
    label: "Doctor",
    tint: "doctor",
  },
  patient: {
    icon: HeartPulse,
    label: "Patient",
    tint: "patient",
  },
  admin: {
    icon: UserCog,
    label: "Admin",
    tint: "admin",
  },
};

export function SignInDialog({
  open,
  onOpenChange,
  onDoctorSignIn,
  onPatientSignIn,
  onRequestAccess,
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="signin-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <section
        className="signin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-dialog-title"
      >
        <button
          type="button"
          className="signin-close"
          aria-label="Close sign in"
          onClick={() => onOpenChange(false)}
        >
          <X size={19} />
        </button>

        <h2 id="signin-dialog-title" className="signin-sr-only">
          Sign in to CareCompass
        </h2>

        <div className="signin-layout">
          <div className="signin-brand-panel">
            <div className="signin-brand-glow" aria-hidden="true" />

            <div className="signin-brand-top">
              <div className="signin-logo">
                <img
                  src="/assets/carecompass-logo-light.png"
                  alt=""
                />
                <span>
                  Care<span>Compass</span>
                </span>
              </div>

              <h2>Your records, finally in plain words.</h2>

              <p className="signin-brand-description">
                Sign in to keep your medical documents in one place — and ask a
                verified assistant questions about them.
              </p>
            </div>

            <div className="signin-brand-bottom">
              <div className="signin-security-note">
                <ShieldCheck size={17} />
                <p>
                  Only verified doctors see patients. Every action is written
                  to the audit log.
                </p>
              </div>

              <p className="signin-disclaimer">
                <Lock size={13} />
                <strong>{DISCLAIMER}</strong>
              </p>
            </div>
          </div>

          <SignInForm
            key="signin-form"
            onClose={() => onOpenChange(false)}
            onDoctorSignIn={onDoctorSignIn}
            onPatientSignIn={onPatientSignIn}
            onRequestAccess={onRequestAccess}
          />
        </div>
      </section>
    </div>
  );
}

function SignInForm({ onClose, onDoctorSignIn, onPatientSignIn, onRequestAccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [notice, setNotice] = useState("");

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const emailId = useId();
  const pwId = useId();

  useEffect(() => {
    const timer = setTimeout(() => emailRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  const validate = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearErrors = () => {
    if (status === "error" || status === "disabled") {
      setStatus("idle");
      setError("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (status === "loading") return;

    if (!validate()) {
      if (fieldErrors.email || !email.trim()) {
        emailRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    setStatus("loading");
    setError("");
    setNotice("");

    setTimeout(() => {
      const match = DEMO_ACCOUNTS.find(
        (account) =>
          account.email.toLowerCase() === email.trim().toLowerCase() &&
          account.password === password
      );

      if (!match) {
        setStatus("error");
        setError("Email or password is incorrect.");
        return;
      }

      if (match.disabled) {
        setStatus("disabled");
        setError(
          "This account has been disabled. Please contact your administrator."
        );
        return;
      }

      setStatus("success");
      setSuccess({
        name: match.name,
        role: match.role,
        redirect: match.redirect,
      });

      setNotice(`Welcome back, ${match.name}`);

      if (match.role === "doctor" && onDoctorSignIn) {
        setTimeout(
          () => onDoctorSignIn(match.email, match.name),
          1800
        );
      } else if (match.role === "patient" && onPatientSignIn) {
        setTimeout(
          () => onPatientSignIn(match.email, match.name),
          1800
        );
      }
    }, 1300);
  };

  const handleDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setFieldErrors({});
    setStatus("idle");
    setError("");
    setNotice("");
    passwordRef.current?.focus();
  };

  return (
    <div className="signin-form-panel">
      <div className="signin-mobile-logo">
        Care<span>Compass</span>
      </div>

      {success ? (
        <SuccessView success={success} onClose={onClose} />
      ) : (
        <>
          <div className="signin-heading">
            <h1>Sign in</h1>
            <p>Welcome back. Enter your details to continue.</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="signin-form"
            noValidate
          >
            <div className="signin-field">
              <label htmlFor={emailId}>Email</label>

              <div className="signin-input-wrap">
                <Mail className="signin-input-icon" size={17} />

                <input
                  id={emailId}
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((previous) => ({
                        ...previous,
                        email: undefined,
                      }));
                    }
                    clearErrors();
                  }}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={
                    fieldErrors.email ? `${emailId}-err` : undefined
                  }
                  className={fieldErrors.email ? "has-error" : ""}
                />
              </div>

              {fieldErrors.email && (
                <p className="signin-field-error" id={`${emailId}-err`}>
                  <AlertCircle size={13} />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="signin-field">
              <div className="signin-label-row">
                <label htmlFor={pwId}>Password</label>

                <button
                  type="button"
                  className="signin-text-button"
                  onClick={() =>
                    setNotice(
                      "In the live app, this sends a reset link to your email."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <div className="signin-input-wrap">
                <Lock className="signin-input-icon" size={17} />

                <input
                  id={pwId}
                  ref={passwordRef}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((previous) => ({
                        ...previous,
                        password: undefined,
                      }));
                    }
                    clearErrors();
                  }}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={
                    fieldErrors.password ? `${pwId}-err` : undefined
                  }
                  className={`signin-password-input ${
                    fieldErrors.password ? "has-error" : ""
                  }`}
                />

                <button
                  type="button"
                  className="signin-password-toggle"
                  onClick={() => setShowPw((value) => !value)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  aria-pressed={showPw}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {fieldErrors.password && (
                <p className="signin-field-error" id={`${pwId}-err`}>
                  <AlertCircle size={13} />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <label className="signin-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Keep me signed in on this device</span>
            </label>

            {(status === "error" || status === "disabled") && error && (
              <div
                role="alert"
                className={`signin-error-banner ${
                  status === "disabled" ? "disabled" : ""
                }`}
              >
                <AlertCircle size={17} />
                <p>{error}</p>
              </div>
            )}

            {notice && (
              <p className="signin-notice" role="status">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="signin-submit"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="signin-spinner" size={17} />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <p className="signin-enter-hint">
              Press <kbd>Enter</kbd> to submit · <kbd>Shift+Enter</kbd> for a
              new line
            </p>
          </form>

          <div className="signin-demo-section">
            <div className="signin-divider">
              <span />
              <span>Demo accounts</span>
              <span />
            </div>

            <div className="signin-demo-list">
              {DEMO_ACCOUNTS.map((account) => {
                const meta = ROLE_META[account.role];
                const RoleIcon = meta.icon;

                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleDemoAccount(account)}
                    className="signin-demo-account"
                  >
                    <span className={`signin-role-icon ${meta.tint}`}>
                      <RoleIcon size={17} />
                    </span>

                    <span className="signin-demo-details">
                      <span className="signin-demo-role">
                        {meta.label}
                        {account.disabled && (
                          <span className="signin-disabled-label">
                            · disabled
                          </span>
                        )}
                      </span>
                      <span className="signin-demo-email">
                        {account.email}
                      </span>
                    </span>

                    <span className="signin-demo-use">Use →</span>
                  </button>
                );
              })}
            </div>

            <p className="signin-demo-footnote">
              All demo passwords are <span>demo1234</span>. Synthetic data
              only.
            </p>
          </div>

          <p className="signin-request-access">
            Don&apos;t have an account?{" "}
            <button type="button" onClick={onRequestAccess}>
              Request access
            </button>
          </p>
        </>
      )}
    </div>
  );
}

function SuccessView({ success, onClose }) {
  const meta = ROLE_META[success.role];
  const Icon = meta.icon;

  return (
    <div className="signin-success">
      <span className={`signin-success-icon ${meta.tint}`}>
        <Icon size={29} />
      </span>

      <div className="signin-success-label">
        <CheckCircle2 size={16} />
        <span>Signed in</span>
      </div>

      <h2>Welcome back, {success.name}</h2>

      <p>
        Redirecting you to{" "}
        <span className="signin-redirect-path">{success.redirect}</span>
        …
      </p>

      <div className="signin-progress">
        <div />
      </div>

      <button
        type="button"
        className="signin-back-button"
        onClick={onClose}
      >
        <ArrowLeft size={15} />
        Back to CareCompass
      </button>
    </div>
  );
}

export default SignInDialog;
