import { useEffect, useState } from "react";
import Navbar from "./components/home/Navbar";
import Hero from "./components/home/Hero";
import SiteFooter from "./components/home/SiteFooter";
import { SignInDialog } from "./components/auth/SignInDialog";
import { SignUpDialog } from "./components/auth/SignUpDialog";
import { DoctorWorkspace } from "./components/doctor/DoctorWorkspace";
import { PatientWorkspace } from "./components/patient/PatientWorkspace";
import { Toaster } from "./components/ui/Toaster";

export default function App() {
  const [apiStatus, setApiStatus] = useState("Checking backend...");
  const [signInOpen, setSignInOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [doctorSession, setDoctorSession] = useState(null);
  const [patientSession, setPatientSession] = useState(null);

  const handleDoctorSignIn = (email, name) => {
    setSignInOpen(false);
    setDoctorSession({ email, name });
  };

  const handlePatientSignIn = (email, name) => {
    setSignInOpen(false);
    setPatientSession({ email, name });
  };

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

  if (patientSession) {
    return (
      <>
        <PatientWorkspace
          patient={{ name: patientSession.name, email: patientSession.email }}
          onSignOut={() => setPatientSession(null)}
        />
        <Toaster />
      </>
    );
  }

  if (doctorSession) {
    return (
      <>
        <DoctorWorkspace
          doctor={{
            name: doctorSession.name,
            specialty: "Internal Medicine",
            rating: 4.9,
            ratings: 128,
          }}
          onSignOut={() => setDoctorSession(null)}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Navbar
        onSignIn={() => setSignInOpen(true)}
        onSignUp={() => setSignUpOpen(true)}
      />
      <Hero />
      <SiteFooter />

      <SignInDialog
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onDoctorSignIn={handleDoctorSignIn}
        onPatientSignIn={handlePatientSignIn}
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
