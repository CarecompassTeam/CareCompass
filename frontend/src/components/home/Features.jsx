
import {
  Sparkles,
  ShieldCheck,
  Star,
  FlaskConical,
  ClipboardList,
  FolderLock,
  Lock,
} from "lucide-react";

import "./Features.css";

const DISCLAIMER =
  "Information assistant. Not a diagnosis. The doctor decides.";

/* Each card carries the anchor id the navbar / footer link to
   (assistant, verification, ratings, lab, summary). */
const FEATURES = [
  {
    id: "assistant",
    icon: Sparkles,
    tint: "teal",
    title: "The cited assistant",
    text: "Ask anything about your records in plain words. Every answer shows the exact document and page it came from — so you can trust it, check it, or ask again.",
    tag: "Answers with sources",
  },
  {
    id: "verification",
    icon: ShieldCheck,
    tint: "sage",
    title: "Human doctor verification",
    text: "No doctor appears on CareCompass until an admin has personally checked their license, national ID and syndicate card. Trust is earned, not assumed.",
    tag: "Every doctor reviewed by hand",
  },
  {
    id: "ratings",
    icon: Star,
    tint: "clay",
    title: "Doctor ratings",
    text: "After each visit, patients rate the doctor they actually saw. Ratings are tied to real, completed visits — so the numbers mean something.",
    tag: "Ratings from real visits only",
  },
  {
    id: "lab",
    icon: FlaskConical,
    tint: "teal",
    title: "Lab reports in plain words",
    text: "Upload a lab panel and get every value explained: what it measures, whether it is inside range, and what to ask your doctor about — never a diagnosis.",
    tag: "Your values, explained",
  },
  {
    id: "summary",
    icon: ClipboardList,
    tint: "sage",
    title: "Pre-visit summary",
    text: "Before every appointment, CareCompass builds a cited summary of the history, medications and latest results — so the visit starts at \u201cwhat\u2019s new\u201d, not at zero.",
    tag: "No visit starts from zero",
  },
  {
    id: "records",
    icon: FolderLock,
    tint: "clay",
    title: "One private record vault",
    text: "Lab reports, prescriptions, scans and notes — kept in one place, readable at any age, and shared only with the doctors you actually choose.",
    tag: "Your documents, your control",
  },
];

export default function Features() {
  return (
    <section id="features" className="features" aria-labelledby="features-heading">
      <div className="features-container">

        <div className="features-heading">
          <p className="features-eyebrow">
            <Lock size={13} />
            Features
          </p>
          <h2 id="features-heading">
            Everything explained.{" "}
            <span className="features-underline">Nothing guessed.</span>
          </h2>
          <p className="features-subtitle">
            Six things CareCompass does for you — always with the source
            shown, and always with the doctor making the final call.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                id={feature.id}
                className={`features-card ${feature.tint}`}
                key={feature.id}
              >
                <div className="features-card-top">
                  <span className="features-card-icon">
                    <Icon size={20} />
                  </span>
                  <span className="features-card-tag">{feature.tag}</span>
                </div>

                <h3 className="features-card-title">{feature.title}</h3>
                <p className="features-card-text">{feature.text}</p>
              </article>
            );
          })}
        </div>

        <p className="features-disclaimer">
          <strong>{DISCLAIMER}</strong>{" "}
          CareCompass is an information assistant for synthetic demo data. It
          never diagnoses, never prescribes, and never replaces your doctor.
        </p>

      </div>
    </section>
  );
}
