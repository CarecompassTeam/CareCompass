
import {
  Heart,
  ShieldCheck,
  FileText,
  Mail,
} from "lucide-react";

import "./SiteFooter.css";

const DISCLAIMER =
  "Information assistant. Not a diagnosis. The doctor decides.";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "The Assistant", href: "#assistant" },
      { label: "Doctor Ratings", href: "#ratings" },
      { label: "Verification", href: "#verification" },
    ],
  },
  {
    title: "For you",
    links: [
      { label: "For Doctors", href: "#roles" },
      { label: "For Patients", href: "#roles" },
      { label: "Lab reports in plain words", href: "#lab" },
      { label: "Pre-visit summary", href: "#summary" },
    ],
  },
  {
    title: "The project",
    links: [
      { label: "Design system", href: "#design" },
      { label: "Security plan", href: "#" },
      { label: "Sprint plan", href: "#" },
      { label: "Team", href: "#" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">

      {/* Disclaimer Banner */}
      <div className="footer-disclaimer">
        <div className="footer-container footer-disclaimer-content">

          <span className="footer-disclaimer-badge">
            <ShieldCheck size={14} />
            {DISCLAIMER}
          </span>

          <p>
            CareCompass is a graduation project. All data used is synthetic.
            No real patient data is ever stored.
          </p>

        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-container footer-main">

        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">

            <a href="#top" className="footer-logo">
              <img
                src="/assets/carecompass-logo-light.png"
                alt="CareCompass logo"
              />

              <span>
                Care<span>Compass</span>
              </span>
            </a>

            <p className="footer-brand-description">
              An AI-assisted healthcare records platform. The assistant
              explains. The doctor decides.
            </p>

            <div className="footer-social-links">

              <a
                href="#"
                className="footer-social-link"
                aria-label="GitHub"
                rel="noopener noreferrer"
              >
                <span className="footer-github-icon">GH</span>
              </a>

              <a
                href="mailto:"
                className="footer-social-link"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>

            </div>

          </div>

          {/* Footer Link Columns */}
          {FOOTER_LINKS.map((column) => (
            <div className="footer-column" key={column.title}>

              <p className="footer-column-title">
                {column.title}
              </p>

              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>

            </div>
          ))}

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">

          <p>
            <FileText size={14} />
            Built by the CareCompass team — Faculty of Science,
            Computer &amp; Information Sciences.
          </p>

          <p>
            Made with
            <Heart size={12} className="footer-heart" />
            for patients who deserve a clearer report
            · Academic year 2026/2027
          </p>

        </div>

      </div>

    </footer>
  );
}
