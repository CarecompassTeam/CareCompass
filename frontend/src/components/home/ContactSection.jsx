
import { useId, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Send,
  User,
  MessageSquareText,
} from "lucide-react";

import "./ContactSection.css";

const DISCLAIMER =
  "Information assistant. Not a diagnosis. The doctor decides.";

const TOPICS = [
  { value: "early-access", label: "Early access request" },
  { value: "patient", label: "I'm a patient — question" },
  { value: "doctor", label: "I'm a doctor — join the platform" },
  { value: "feedback", label: "Feedback about the project" },
  { value: "other", label: "Something else" },
];

/* Shared with the backend validation (see /api/contact). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "early-access",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [serverError, setServerError] = useState("");

  const nameId = useId();
  const emailId = useId();
  const topicId = useId();
  const messageId = useId();

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));

    /* Clear the field error as soon as the user types again,
       and clear a global server error too. */
    if (fieldErrors[key]) {
      setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
    }
    if (status === "error") {
      setStatus("idle");
      setServerError("");
    }
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Please tell us your name.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name looks too short.";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.message.trim()) {
      errors.message = "Please write a short message.";
    } else if (form.message.trim().length < 10) {
      errors.message = "Message should be at least 10 characters.";
    } else if (form.message.trim().length > 2000) {
      errors.message = "Message is too long (max 2000 characters).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (status === "loading") return;

    if (!validate()) return;

    setStatus("loading");
    setServerError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          topic: form.topic,
          message: form.message.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        /* The backend returns { error, code } on validation failures. */
        throw new Error(
          data.error ||
            `Could not send your message (status ${response.status}).`
        );
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setServerError(
        error?.name === "TypeError"
          ? "Could not reach the server. Check that the backend is running, then try again."
          : error?.message || "Something went wrong. Please try again."
      );
    }
  };

  const resetForm = () => {
    setForm({ name: "", email: "", topic: "early-access", message: "" });
    setFieldErrors({});
    setServerError("");
    setStatus("idle");
  };

  return (
    <section id="contact" className="contact" aria-labelledby="contact-heading">
      <div className="contact-container">

        <div className="contact-heading">
          <p className="contact-eyebrow">
            <Mail size={13} />
            Contact
          </p>
          <h2 id="contact-heading">
            Questions about the project?{" "}
            <span className="contact-underline">Write to us.</span>
          </h2>
          <p className="contact-subtitle">
            Ask about early access, doctor verification or the graduation
            project itself — the team reads every message.
          </p>
        </div>

        <div className="contact-panel">

          {/* ── Left: form (or success state) ── */}
          <div className="contact-form-side">
            {status === "success" ? (
              <div className="contact-success" role="status">
                <span className="contact-success-icon">
                  <CheckCircle2 size={30} />
                </span>

                <h3>Message sent</h3>
                <p>
                  Thanks, {form.name.trim().split(" ")[0] || "there"} — your
                  message reached the CareCompass team. We usually reply
                  within a couple of days.
                </p>

                <button
                  type="button"
                  className="contact-again-button"
                  onClick={resetForm}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="contact-field">
                  <label htmlFor={nameId}>Name</label>

                  <div className="contact-input-wrap">
                    <User className="contact-input-icon" size={16} />
                    <input
                      id={nameId}
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? `${nameId}-err` : undefined}
                      className={fieldErrors.name ? "has-error" : ""}
                    />
                  </div>

                  {fieldErrors.name && (
                    <p className="contact-field-error" id={`${nameId}-err`}>
                      <AlertCircle size={13} />
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div className="contact-field">
                  <label htmlFor={emailId}>Email</label>

                  <div className="contact-input-wrap">
                    <Mail className="contact-input-icon" size={16} />
                    <input
                      id={emailId}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? `${emailId}-err` : undefined}
                      className={fieldErrors.email ? "has-error" : ""}
                    />
                  </div>

                  {fieldErrors.email && (
                    <p className="contact-field-error" id={`${emailId}-err`}>
                      <AlertCircle size={13} />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div className="contact-field">
                  <label htmlFor={topicId}>Topic</label>

                  <div className="contact-input-wrap">
                    <select
                      id={topicId}
                      className="contact-select"
                      value={form.topic}
                      onChange={(event) => updateField("topic", event.target.value)}
                    >
                      {TOPICS.map((topic) => (
                        <option key={topic.value} value={topic.value}>
                          {topic.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="contact-field">
                  <label htmlFor={messageId}>Message</label>

                  <div className="contact-input-wrap">
                    <textarea
                      id={messageId}
                      rows={5}
                      placeholder="Write your message… (this is a graduation project — synthetic data only)"
                      value={form.message}
                      onChange={(event) => updateField("message", event.target.value)}
                      aria-invalid={!!fieldErrors.message}
                      aria-describedby={fieldErrors.message ? `${messageId}-err` : undefined}
                      className={fieldErrors.message ? "has-error" : ""}
                    />
                  </div>

                  {fieldErrors.message && (
                    <p className="contact-field-error" id={`${messageId}-err`}>
                      <AlertCircle size={13} />
                      {fieldErrors.message}
                    </p>
                  )}
                </div>

                {status === "error" && serverError && (
                  <div role="alert" className="contact-error-banner">
                    <AlertCircle size={17} />
                    <p>{serverError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="contact-submit"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="contact-spinner" size={16} />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send message
                    </>
                  )}
                </button>

                <p className="contact-form-footnote">
                  <MessageSquareText size={12} />
                  Sent straight to the backend (<code>POST /api/contact</code>)
                  and saved in the contact messages table.
                </p>
              </form>
            )}
          </div>

          {/* ── Right: info card ── */}
          <aside className="contact-info-side">
            <div className="contact-info-card">
              <h3>What happens after you send?</h3>

              <ol className="contact-info-list">
                <li>
                  <span>1</span>
                  <p>Your message is validated and stored by the backend.</p>
                </li>
                <li>
                  <span>2</span>
                  <p>
                    The message is stored in the platform database and shows
                    up for the team.
                  </p>
                </li>
                <li>
                  <span>3</span>
                  <p>
                    The team replies to the email you provided — usually
                    within a couple of days.
                  </p>
                </li>
              </ol>

              <p className="contact-info-note">
                <strong>{DISCLAIMER}</strong>{" "}
                CareCompass is a graduation project. All data is synthetic —
                do not send real medical documents by email.
              </p>
            </div>
          </aside>

        </div>
      </div>
    </section>
  );
}
