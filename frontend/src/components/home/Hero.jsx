
import {
  ShieldCheck,
  Star,
  Quote,
  ArrowRight,
  FileText,
  Sparkles,
} from "lucide-react";

import "./Hero.css";

const DISCLAIMER =
  "Information assistant. Not a diagnosis. The doctor decides.";

export default function Hero() {
  return (
    <section
      id="top"
      className="hero grain"
      aria-labelledby="hero-heading"
    >
      {/* Background decoration */}
      <div className="hero-background" aria-hidden="true" />

      <div className="hero-container">

        {/* Left: Main content */}
        <div className="hero-content">

          {/* Graduation Badge */}
          <div className="hero-badge">
            <span className="hero-status">
              <span className="hero-status-ping" />
              <span className="hero-status-dot" />
            </span>

            Graduation project · Faculty of Science
          </div>

          {/* Main Heading */}
          <h1 id="hero-heading" className="hero-heading">
            Your medical records,
            <br />
            <span className="ink-underline">
              finally in plain words.
            </span>
          </h1>

          {/* Description */}
          <p className="hero-description">
            CareCompass is a healthcare platform where doctors and patients
            keep medical documents in one place — and ask a{" "}
            <span className="hero-verified-text">verified</span>{" "}
            assistant questions about them. Every answer shows where it
            came from. The doctor always decides.
          </p>

          {/* Action Buttons */}
          <div className="hero-actions">

            <a href="#assistant" className="hero-primary-button">
              See how it works
              <ArrowRight size={16} />
            </a>

            <a href="#roles" className="hero-secondary-button">
              For doctors &amp; patients
            </a>

          </div>

          {/* Medical Disclaimer */}
          <div className="hero-disclaimer">
            <FileText className="disclaimer-icon" size={16} />

            <p>
              <strong>{DISCLAIMER}</strong>{" "}
              CareCompass explains and summarizes. It never diagnoses or
              recommends treatment.
            </p>
          </div>

        </div>

        {/* Right: Hero image and floating cards */}
        <div className="hero-visual">

          <div className="hero-image-wrapper">

            {/* Main Doctor Image */}
            <div className="hero-image-container">

              <img
                src="/assets/hero-doctor.png"
                alt="A doctor reviewing a patient's records on a tablet in a bright clinic"
                className="hero-doctor-image"
              />

              <div
                className="hero-image-overlay"
                aria-hidden="true"
              />

            </div>

            {/* Floating Card: Verified Doctor */}
            <div className="hero-doctor-card float-slow" role="status">

              <div className="doctor-card-header">

                <span className="doctor-verified-icon">
                  <ShieldCheck size={17} />
                </span>

                <div>
                  <p className="doctor-card-label">Verified</p>
                  <p className="doctor-card-name">Dr. Hana K.</p>
                </div>

              </div>

              <div className="doctor-card-rating">

                <div className="doctor-stars">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className={
                        i < 4
                          ? "doctor-star"
                          : "doctor-star doctor-star-partial"
                      }
                    />
                  ))}
                </div>

                <span className="doctor-rating-number">4.8</span>

              </div>

              <p className="doctor-card-specialty">
                124 ratings · Cardiology
              </p>

            </div>

            {/* Floating Card: Assistant */}
            <div className="hero-assistant-card float-slower">

              <div className="assistant-card-header">
                <Sparkles size={14} />
                <span>Assistant</span>
              </div>

              <p className="assistant-card-description">
                Your HbA1c of 6.4% means your average blood sugar is
                slightly above target.
              </p>

              <div className="assistant-card-footer">

                <span className="assistant-source">
                  <FileText size={11} />
                  Lab · p.2
                </span>

                <span className="assistant-source-label">
                  source shown
                </span>

              </div>

            </div>

            {/* Floating Quote */}
            <div className="hero-quote">

              <Quote size={14} />

              <span>
                Built by students. Treating synthetic data like it's real.
              </span>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
