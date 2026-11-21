import { useState } from "react";
import {
  Newspaper,
  Users,
  Sparkles,
  FileText,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  LogOut,
  Search,
  Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { MedicalFeed } from "./MedicalFeed";
import { DoctorPatients } from "./DoctorPatients";
import { Logo } from "./Logo";
import { AssistantWorkspace } from "./AssistantWorkspace";
import { PreVisitSummaryWorkspace } from "./PreVisitSummaryWorkspace";
import { MySchedule } from "./MySchedule";
import { DoctorVisits } from "./DoctorVisits";

import "./DoctorWorkspace.css";

const NAV = [
  {
    key: "feed",
    label: "Feed",
    icon: Newspaper,
    badge: "new",
    hint: "Curated medical content from trusted sources",
  },
  {
    key: "patients",
    label: "Patients",
    icon: Users,
    hint: "Your assigned patient list and profiles",
  },
  {
    key: "schedule",
    label: "My Schedule",
    icon: CalendarDays,
    hint: "Appointments and working availability",
  },
  {
    key: "visits",
    label: "Visit Records",
    icon: ClipboardList,
    hint: "Consultation records — drafts & completed",
  },
  {
    key: "assistant",
    label: "Assistant",
    icon: Sparkles,
    hint: "Ask a sourced question about your patients",
  },
  {
    key: "summary",
    label: "Pre-visit Summary",
    icon: FileText,
    hint: "Cited patient summaries before the visit",
  },
];

/**
 * Doctor dashboard shell.
 *
 * `doctor` is `{ name, specialty, rating, ratings }` and `onSignOut`
 * is the sign-out callback.
 */
export function DoctorWorkspace({ doctor, onSignOut }) {
  const [view, setView] = useState("feed");
  const [navOpen, setNavOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  // Patient name deep-linked from My Schedule ("Open Patient Profile").
  const [patientTargetName, setPatientTargetName] = useState(null);
  // Pick mode: the Assistant / Pre-visit Summary need a patient selection
  // instead of opening the patient's profile.
  const [pickMode, setPickMode] = useState(false);

  return (
    <div className="dw-root">
      {/* Top bar */}
      <header className="dw-topbar">
        <div className="dw-topbar-inner">
          <div className="dw-topbar-left">
            {/* mobile nav toggle */}
            <button
              onClick={() => setNavOpen((o) => !o)}
              className="dw-nav-toggle"
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
            >
              <Newspaper className="dw-icon-16" />
            </button>
            <a href="#" className="dw-logo-link">
              <Logo size={28} wordmarkClassName="lg-wordmark-xl" />
              <span className="dw-doctor-badge">Doctor</span>
            </a>
          </div>

          <div className="dw-topbar-right">
            {/* search */}
            <button
              className="dw-search-btn"
              aria-label="Search"
            >
              <Search className="dw-icon-14" />
              Search patients, documents…
              <kbd className="dw-search-kbd">
                /
              </kbd>
            </button>
            <button
              className="dw-bell-btn"
              aria-label="Notifications"
            >
              <Bell className="dw-icon-16" />
              <span className="dw-bell-dot" />
            </button>

            {/* doctor chip */}
            <div className="dw-doctor-chip">
              <span className="dw-doctor-avatar">
                {doctor.name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("")}
              </span>
              <div className="dw-doctor-meta">
                <p className="dw-doctor-name">
                  {doctor.name}
                  <ShieldCheck className="dw-icon-12 dw-doctor-verified-icon" />
                </p>
                <p className="dw-doctor-specialty">
                  {doctor.specialty} · {doctor.rating}★
                </p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="dw-signout-btn"
            >
              <LogOut className="dw-icon-14" />
              <span className="dw-signout-label">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="dw-shell">
        {/* Sidebar */}
        <aside
          className={cn(
            "dw-sidebar",
            navOpen ? "dw-sidebar-open" : "dw-sidebar-closed"
          )}
        >
          <nav className="dw-nav">
            <p className="dw-nav-heading">
              Doctor workspace
            </p>
            {NAV.map((item) => {
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    setNavOpen(false);
                    setPickMode(false);
                    // Normal navigation always shows the plain patient list.
                    if (item.key !== "patients") setPatientTargetName(null);
                  }}
                  className={cn(
                    "dw-nav-item",
                    active
                      ? "dw-nav-item-active"
                      : "dw-nav-item-inactive"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="dw-icon-16" />
                  <span className="dw-nav-item-content">
                    <span className="dw-nav-item-label">{item.label}</span>
                    <span
                      className={cn(
                        "dw-nav-item-hint",
                        active ? "dw-nav-item-hint-active" : "dw-nav-item-hint-inactive"
                      )}
                    >
                      {item.hint}
                    </span>
                  </span>
                  {item.badge && (
                    <span
                      className={cn(
                        "dw-nav-badge",
                        active ? "dw-nav-badge-active" : "dw-nav-badge-new"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                  {active && !item.badge && (
                    <ChevronRight className="dw-icon-14 dw-nav-chevron" />
                  )}
                </button>
              );
            })}

            <div className="dw-verified-card">
              <p className="dw-verified-title">
                <ShieldCheck className="dw-icon-14" />
                Verified doctor
              </p>
              <p className="dw-verified-text">
                Your license was reviewed and approved. You can now see assigned
                patients and the medical feed.
              </p>
            </div>
          </nav>
        </aside>

        {/* mobile backdrop */}
        {navOpen && (
          <div
            className="dw-backdrop"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
        )}

        {/* Main content */}
        <main className="dw-main">
          {view === "feed" ? (
            <MedicalFeed doctorName={doctor.name} />
          ) : view === "patients" ? (
            <DoctorPatients
              key={patientTargetName ?? "list"}
              pickMode={pickMode}
              onExitPickMode={() => setPickMode(false)}
              initialPatientName={patientTargetName}
              onSelectPatient={(id) => {
                setSelectedPatientId(id);
                setPickMode(false);
                setView("assistant");
              }}
            />
          ) : view === "schedule" ? (
            <MySchedule
              doctorName={doctor.name}
              specialty={doctor.specialty}
              onOpenPatient={(patientName) => {
                setPatientTargetName(patientName);
                setPickMode(false);
                setView("patients");
                if (typeof window !== "undefined") window.scrollTo({ top: 0 });
              }}
            />
          ) : view === "visits" ? (
            <DoctorVisits
              specialty={doctor.specialty}
              onOpenPatientProfile={(patientName) => {
                setPatientTargetName(patientName);
                setPickMode(false);
                setView("patients");
                if (typeof window !== "undefined") window.scrollTo({ top: 0 });
              }}
            />
          ) : view === "assistant" ? (
            selectedPatientId ? (
              <AssistantWorkspace role="doctor" patientId={selectedPatientId} />
            ) : (
              <PickPatientView
                tool="assistant"
                onOpenPatients={() => {
                  setPickMode(true);
                  setView("patients");
                }}
              />
            )
          ) : view === "summary" ? (
            selectedPatientId ? (
              <PreVisitSummaryWorkspace patientId={selectedPatientId} />
            ) : (
              <PickPatientView
                tool="summary"
                onOpenPatients={() => {
                  setPickMode(true);
                  setView("patients");
                }}
              />
            )
          ) : (
            <PlaceholderView view={view} />
          )}
        </main>
      </div>
    </div>
  );
}

function PickPatientView({ tool, onOpenPatients }) {
  return (
    <div className="dw-pick-view">
      <span className="dw-pick-icon">
        <Users className="dw-icon-24" />
      </span>
      <h2 className="dw-pick-title">
        Pick a patient first
      </h2>
      <p className="dw-pick-text">
        The {tool === "assistant" ? "assistant" : "pre-visit summary"} works on
        one assigned patient at a time. Open your patient list and choose one.
      </p>
      <button
        onClick={onOpenPatients}
        className="dw-pick-btn"
      >
        <Users className="dw-icon-16" />
        Open patient list
      </button>
    </div>
  );
}

function PlaceholderView({ view }) {
  const labels = {
    patients: "Patient list",
    schedule: "My Schedule",
    visits: "Visit Records",
    assistant: "Assistant",
    summary: "Pre-visit summary",
  };
  const descriptions = {
    patients:
      "Your assigned patients, their visits and documents. Shown on the real API in a later sprint.",
    schedule:
      "Appointments and working availability — available in the My Schedule section.",
    visits:
      "Consultation records and drafts — available in the Visit Records section.",
    assistant:
      "Ask the assistant a sourced question about a patient. Shown on the real API in a later sprint.",
    summary:
      "A short, cited summary of a patient's history before the visit. Shown on the real API in a later sprint.",
  };
  return (
    <div className="dw-placeholder-view">
      <span className="dw-placeholder-icon">
        <Sparkles className="dw-icon-24" />
      </span>
      <h2 className="dw-placeholder-title">
        {labels[view]}
      </h2>
      <p className="dw-placeholder-text">
        {descriptions[view]}
      </p>
      <p className="dw-placeholder-hint">
        <Newspaper className="dw-icon-14 dw-placeholder-hint-icon" />
        Try the <span className="dw-placeholder-hint-strong">Feed</span> —
        it's ready now.
      </p>
    </div>
  );
}

export default DoctorWorkspace;
