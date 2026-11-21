/* =====================================
   PatientWorkspace — patient dashboard shell
   Mirrors DoctorWorkspace's structure (topbar + sidebar + main)
   but with the patient navigation and a `pw-` class prefix.
   The patient's five tools: My History, Find a Doctor, My Visits,
   Assistant and My Records.
===================================== */

import { useState } from "react";
import {
  FileText,
  Sparkles,
  LogOut,
  Search,
  Bell,
  ShieldCheck,
  ChevronRight,
  FileHeart,
  Stethoscope,
  CalendarDays,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Logo } from "../doctor/Logo";
import { MedicalHistoryForm } from "./MedicalHistoryForm";
import { FindDoctor } from "./FindDoctor";
import { MyVisits } from "./MyVisits";
import { MyRecords } from "./MyRecords";
import { AssistantWorkspace } from "../doctor/AssistantWorkspace";

import "./PatientWorkspace.css";

const NAV = [
  {
    key: "history",
    label: "My History",
    icon: FileText,
    hint: "Enter and update your medical history",
  },
  {
    key: "find-doctor",
    label: "Find a Doctor",
    icon: Stethoscope,
    hint: "Book an in-clinic consultation",
  },
  {
    key: "visits",
    label: "My Visits",
    icon: CalendarDays,
    hint: "Appointments and past consultations",
  },
  {
    key: "assistant",
    label: "Assistant",
    icon: Sparkles,
    hint: "Ask a sourced question about your records",
  },
  {
    key: "documents",
    label: "My Records",
    icon: FileHeart,
    hint: "Access and manage your medical documents",
  },
];

/**
 * Patient dashboard shell.
 *
 * `patient` is `{ name, email }` and `onSignOut` is the sign-out callback.
 */
export function PatientWorkspace({ patient, onSignOut }) {
  const [view, setView] = useState("history");
  const [navOpen, setNavOpen] = useState(false);
  // Deep-link target: "View Doctor Profile" from My Visits opens Find a Doctor
  // on a specific doctor.
  const [doctorTarget, setDoctorTarget] = useState(null);

  const initials = patient.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="pw-root">
      {/* Top bar */}
      <header className="pw-topbar">
        <div className="pw-topbar-inner">
          <div className="pw-topbar-left">
            <button
              onClick={() => setNavOpen((o) => !o)}
              className="pw-nav-toggle"
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
            >
              <FileText className="pw-icon-16" />
            </button>
            <a href="#" className="pw-logo-link">
              <Logo size={28} wordmarkClassName="lg-wordmark-xl" />
              <span className="pw-patient-badge">Patient</span>
            </a>
          </div>

          <div className="pw-topbar-right">
            <button className="pw-search-btn" aria-label="Search">
              <Search className="pw-icon-14" />
              Search my records…
            </button>
            <button className="pw-bell-btn" aria-label="Notifications">
              <Bell className="pw-icon-16" />
              <span className="pw-bell-dot" />
            </button>

            <div className="pw-patient-chip">
              <span className="pw-patient-avatar">{initials}</span>
              <div className="pw-patient-meta">
                <p className="pw-patient-name">{patient.name}</p>
                <p className="pw-patient-role">Patient</p>
              </div>
            </div>

            <button onClick={onSignOut} className="pw-signout-btn">
              <LogOut className="pw-icon-14" />
              <span className="pw-signout-label">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="pw-shell">
        {/* Sidebar */}
        <aside className={cn("pw-sidebar", navOpen ? "pw-sidebar-open" : "pw-sidebar-closed")}>
          <nav className="pw-nav">
            <p className="pw-nav-heading">Patient workspace</p>
            {NAV.map((item) => {
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    setNavOpen(false);
                    setDoctorTarget(null);
                  }}
                  className={cn(
                    "pw-nav-item",
                    active ? "pw-nav-item-active" : "pw-nav-item-inactive"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="pw-icon-16" />
                  <span className="pw-nav-item-content">
                    <span className="pw-nav-item-label">{item.label}</span>
                    <span
                      className={cn(
                        "pw-nav-item-hint",
                        active ? "pw-nav-item-hint-active" : "pw-nav-item-hint-inactive"
                      )}
                    >
                      {item.hint}
                    </span>
                  </span>
                  {active && <ChevronRight className="pw-icon-14 pw-nav-chevron" />}
                </button>
              );
            })}

            <div className="pw-privacy-card">
              <p className="pw-privacy-title">
                <ShieldCheck className="pw-icon-14" />
                Your data is private
              </p>
              <p className="pw-privacy-text">
                Only you and your assigned doctor can see your history. Every
                view and change is recorded.
              </p>
            </div>
          </nav>
        </aside>

        {/* mobile backdrop */}
        {navOpen && (
          <div className="pw-backdrop" onClick={() => setNavOpen(false)} aria-hidden />
        )}

        {/* Main content */}
        <main className="pw-main">
          {view === "history" ? (
            <MedicalHistoryForm patientName={patient.name} />
          ) : view === "find-doctor" ? (
            <FindDoctor key={doctorTarget ?? "listing"} initialDoctorId={doctorTarget} />
          ) : view === "visits" ? (
            <MyVisits
              onFindDoctor={() => {
                setDoctorTarget(null);
                setView("find-doctor");
                if (typeof window !== "undefined") window.scrollTo({ top: 0 });
              }}
              onOpenDoctorProfile={(doctorId) => {
                setDoctorTarget(doctorId);
                setView("find-doctor");
                if (typeof window !== "undefined") window.scrollTo({ top: 0 });
              }}
            />
          ) : view === "assistant" ? (
            <AssistantWorkspace role="patient" />
          ) : (
            <MyRecords />
          )}
        </main>
      </div>
    </div>
  );
}

export default PatientWorkspace;
