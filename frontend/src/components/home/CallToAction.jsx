
import { ArrowRight, CalendarCheck, ShieldCheck } from "lucide-react";

import "./CallToAction.css";

const DISCLAIMER =
  "Information assistant. Not a diagnosis. The doctor decides.";

export default function CallToAction({ onSignIn, onSignUp }) {
  return (
    <section id="cta" className="cta" aria-labelledby="cta-heading">
      <div className="cta-container">

        <div className="cta-banner grain">
          <div className="cta-glow" aria-hidden="true" />

          <div className="cta-content">
            <p className="cta-eyebrow">
              <CalendarCheck size={13} />
              Early access · Graduation project
            </p>

            <h2 id="cta-heading">
              Ready to see your records{" "}
              <span className="cta-underline">in plain words?</span>
            </h2>

            <p className="cta-description">
              Create a free patient account in seconds, or apply for doctor
              access — every application is reviewed by a human before it is
              approved. No real patient data is ever stored.
            </p>

            <div className="cta-actions">
              <button
                type="button"
                className="cta-primary-button"
                onClick={
                  typeof onSignUp === "function"
                    ? onSignUp
                    : () => console.error("CallToAction: onSignUp was not provided by the parent component.")
                }
              >
                Get early access
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="cta-secondary-button"
                onClick={
                  typeof onSignIn === "function"
                    ? onSignIn
                    : () => console.error("CallToAction: onSignIn was not provided by the parent component.")
                }
              >
                Sign in
              </button>
            </div>

            <p className="cta-meta">
              <ShieldCheck size={13} />
              Only verified doctors see patients · Every action is written to
              the audit log · <strong>{DISCLAIMER}</strong>
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
