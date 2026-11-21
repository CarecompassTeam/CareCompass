
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  Globe,
  ShieldCheck,
} from "lucide-react";

import "./Navbar.css";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#assistant", label: "The Assistant" },
  { href: "#verification", label: "Verification" },
  { href: "#ratings", label: "Doctor Ratings" },
  { href: "#design", label: "Design" },
];

export default function Navbar({ onSignIn, onSignUp }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState("EN");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  const handleSignIn = () => {
    closeMobileMenu();

    if (typeof onSignIn === "function") {
      onSignIn();
    } else {
      console.error(
        "Navbar: onSignIn was not provided by the parent component."
      );
    }
  };

  return (
    <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">

        <a href="#top" className="navbar-logo">
          <img
            src="/assets/carecompass-logo.png"
            alt="CareCompass logo"
          />

          <span>
            Care<span className="logo-highlight">Compass</span>
          </span>
        </a>

        <nav className="navbar-links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navbar-actions">

          <button
            className="language-button"
            onClick={() =>
              setLang((previous) =>
                previous === "EN" ? "ع" : "EN"
              )
            }
            aria-label="Switch language"
          >
            <Globe size={14} />
            <span>{lang}</span>
            <span className="language-separator">/</span>
            <span className="language-secondary">
              {lang === "EN" ? "ع" : "EN"}
            </span>
          </button>

          <button
            type="button"
            className="signin-button"
            onClick={handleSignIn}
          >
            Sign in
          </button>

          <button
  type="button"
  className="early-access-button"
  onClick={onSignUp}
>
  <ShieldCheck size={15} />
  Get early access
</button>

          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMobileOpen((previous) => !previous)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-menu">
          <nav>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mobile-menu-actions">
            <button
              type="button"
              className="mobile-signin-button"
              onClick={handleSignIn}
            >
              Sign in
            </button>

            <a
              href="#verification"
              className="mobile-access-button"
              onClick={closeMobileMenu}
            >
              Get early access
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
