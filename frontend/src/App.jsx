import { useEffect, useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";

import Navbar from "./components/home/Navbar";
import Hero from "./components/home/Hero";
import HowItWorks from "./components/home/HowItWorks";
import Features from "./components/home/Features";
import CallToAction from "./components/home/CallToAction";
import ContactSection from "./components/home/ContactSection";
import SiteFooter from "./components/home/SiteFooter";
import { SignInDialog } from "./components/auth/SignInDialog";
import { SignUpDialog } from "./components/auth/SignUpDialog";
import { DoctorWorkspace } from "./components/doctor/DoctorWorkspace";
import { PatientWorkspace } from "./components/patient/PatientWorkspace";
import { Toaster } from "./components/ui/Toaster";
import { AuthProvider, useAuth, RequireAuth } from "./hooks/use-auth";

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { session, user, isAuthed, logout } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState("Checking backend...");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        return response.json();
      })
      .then((data) => {
        setApiStatus(
          data.status === "ok" ? "Connected" : "Unexpected response"
        );
      })
      .catch(() => {
        setApiStatus("Not connected");
      });
  }, []);

  /* ── Protected views — session role decides what renders.
     Route guard: each area is wrapped in <RequireAuth role=…>, so a
     session with the wrong role never reaches the dashboard. ── */

  if (isAuthed && user?.role === "doctor") {
    return (
      <>
        <RequireAuth role="doctor">
          <DoctorWorkspace
            doctor={{
              name: user.name,
              specialty: "Internal Medicine",
              rating: 4.9,
              ratings: 128,
            }}
            onSignOut={logout}
          />
        </RequireAuth>
        <Toaster />
      </>
    );
  }

  if (isAuthed && user?.role === "patient") {
    /* Patient dashboard: replace <PatientWorkspaceSlot /> with your own
       dashboard component (session + logout are ready in useAuth()). */
    return (
      <>
       <RequireAuth role="patient">
  <PatientWorkspace user={user} onSignOut={logout} />
</RequireAuth>
        <Toaster />
      </>
    );
  }

  if (isAuthed && user?.role === "admin") {
    return (
      <>
        <RequireAuth role="admin">
          <AdminPlaceholder onSignOut={logout} />
        </RequireAuth>
        <Toaster />
      </>
    );
  }

  /* ── Public landing page ── */
  return (
    <>
      <Navbar
        onSignIn={() => setSignInOpen(true)}
        onSignUp={() => setSignUpOpen(true)}
      />
      <Hero />
      <HowItWorks />
      <Features />
      <CallToAction
        onSignIn={() => setSignInOpen(true)}
        onSignUp={() => setSignUpOpen(true)}
      />
      <ContactSection />
      <SiteFooter />

      <SignInDialog
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onSignedIn={() => setSignInOpen(false)}
        onRequestAccess={() => {
          setSignInOpen(false);
          setSignUpOpen(true);
        }}
      />
      <SignUpDialog
        open={signUpOpen}
        onOpenChange={setSignUpOpen}
        onBackToSignIn={() => {
          setSignUpOpen(false);
          setSignInOpen(true);
        }}
      />

      <Toaster />
    </>
  );
}

/* Admin dashboard is not in this sprint — keep the session clean. */
function AdminPlaceholder({ onSignOut }) {
  return (
    <div className="auth-guard-card">
      <span className="auth-guard-icon denied">
        <ShieldAlert size={22} />
      </span>
      <h2>Admin area</h2>
      <p>
        You are signed in as admin. The admin verification dashboard is not
        part of this frontend build yet.
      </p>

      <button type="button" className="patient-slot-logout" onClick={onSignOut}>
        <LogOut size={15} />
        Sign out
      </button>
    </div>
  );
}
