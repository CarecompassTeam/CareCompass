
import {
  UploadCloud,
  MessageSquareText,
  Stethoscope,
  ArrowRight,
  HeartPulse,
  ClipboardList,
  FolderLock,
  CalendarCheck,
} from "lucide-react";

import "./HowItWorks.css";

const DISCLAIMER =
  "Information assistant. Not a diagnosis. The doctor decides.";

const STEPS = [
  {
    icon: UploadCloud,
    step: "01",
    title: "Create your account & upload records",
    text: "Patients sign up in seconds and keep lab reports, prescriptions and scans in one private vault. Doctors go through a human verification check before they ever see a patient.",
  },
  {
    icon: MessageSquareText,
    step: "02",
    title: "Ask in your own words",
    text: "Ask the assistant anything about your documents — \u201cwhat does my HbA1c mean?\u201d — and get a plain-language answer that always shows the exact document and page it came from.",
  },
  {
    icon: Stethoscope,
    step: "03",
    title: "The doctor decides",
    text: "A verified doctor reviews the same records, gets a cited pre-visit summary, and makes every medical decision. The assistant explains — it never diagnoses.",
  },
];

const ROLES = [
  {
    icon: HeartPulse,
    tint: "patient",
    title: "For patients",
    points: [
      { icon: FolderLock, text: "One private place for every medical document" },
      { icon: MessageSquareText, text: "Plain-words answers with the source always shown" },
      { icon: ClipboardList, text: "A ready pre-visit summary so no visit starts from zero" },
    ],
  },
  {
    icon: Stethoscope,
    tint: "doctor",
    title: "For doctors",
    points: [
      { icon: ClipboardList, text: "Assigned patients with complete histories and documents" },
      { icon: CalendarCheck, text: "Schedule, visit records and AI summaries in one dashboard" },
      { icon: ShieldIcon, text: "Only verified doctors are listed — every action is audited" },
    ],
  },
];

function ShieldIcon({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works" aria-labelledby="how-heading">
      <div className="how-container">

        <div className="how-heading">
          <p className="how-eyebrow">How it works</p>
          <h2 id="how-heading">
            From documents to answers{" "}
            <span className="how-underline">in three steps</span>
          </h2>
          <p className="how-subtitle">
            No medical jargon, no lost PDFs, no guessing. Here is the whole
            journey — the same one for every patient and every doctor.
          </p>
        </div>

        <ol className="how-steps">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <li className="how-step" key={item.step}>
                <div className="how-step-top">
                  <span className="how-step-icon">
                    <Icon size={21} />
                  </span>
                  <span className="how-step-number">{item.step}</span>
                </div>
                <h3 className="how-step-title">{item.title}</h3>
                <p className="how-step-text">{item.text}</p>
              </li>
            );
          })}
        </ol>

        <div id="roles" className="how-roles" aria-labelledby="roles-heading">
          <h3 id="roles-heading" className="how-roles-heading">
            Built for both sides of the clinic
          </h3>

          <div className="how-roles-grid">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <article className={`how-role ${role.tint}`} key={role.title}>
                  <div className="how-role-header">
                    <span className="how-role-icon">
                      <Icon size={19} />
                    </span>
                    <h4>{role.title}</h4>
                  </div>

                  <ul className="how-role-points">
                    {role.points.map((point) => {
                      const PointIcon = point.icon;
                      return (
                        <li key={point.text}>
                          <PointIcon size={15} />
                          <span>{point.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>

          <a href="#cta" className="how-roles-cta">
            See what CareCompass offers
            <ArrowRight size={15} />
          </a>
        </div>

        <p className="how-disclaimer">
          <strong>{DISCLAIMER}</strong>{" "}
          CareCompass explains and summarizes. It never diagnoses or
          recommends treatment.
        </p>

      </div>
    </section>
  );
}
