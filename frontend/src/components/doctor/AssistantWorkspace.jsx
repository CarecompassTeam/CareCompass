/* =====================================
   AssistantWorkspace — plain-JS port of the CareCompass
   sourced AI chat (patient & doctor roles).
   All Tailwind classes were replaced with semantic `aw-`
   classes defined in AssistantWorkspace.css.
===================================== */

import { useState, useRef, useEffect } from "react";
import {
  Send,
  FileText,
  Sparkles,
  Info,
  ShieldAlert,
  AlertTriangle,
  Copy,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { DISCLAIMER, ASSISTANT_SCOPE_NOTE } from "./constants";
import "./AssistantWorkspace.css";

/**
 * @typedef {Object} Citation
 * @property {string} docId
 * @property {string} docTitle
 * @property {number} page
 * @property {string} excerpt
 */

/**
 * @typedef {"answered"|"not_enough_info"|"refused"|"urgent"|"error"} AssistantStatus
 */

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {"user"|"assistant"} role
 * @property {string} text
 * @property {Citation[]} [citations]
 * @property {AssistantStatus} [status]
 * @property {boolean} [loading]
 */

const PATIENT_EXAMPLES = [
  "What does my HbA1c result mean?",
  "What medications am I currently taking?",
  "Why was I admitted to hospital in August?",
];

const DOCTOR_EXAMPLES = [
  "Summarize this patient's blood pressure trend",
  "What lab results are on file?",
  "What was the reason for the last visit?",
];

export function AssistantWorkspace({ role, patientId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeSource, setActiveSource] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const examples = role === "doctor" ? DOCTOR_EXAMPLES : PATIENT_EXAMPLES;

  const send = async (question) => {
    const q = question.trim();
    if (!q || busy) return;
    if (role === "doctor" && !patientId) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: q,
    };
    const loadingMsg = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: "",
      loading: true,
    };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setBusy(true);

    try {
      const res = await api("/api/assistant/ask", {
        method: "POST",
        body: JSON.stringify({ question: q, patientId }),
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                text: res.answer,
                citations: res.citations,
                status: res.status,
                loading: false,
              }
            : m
        )
      );
    } catch (e) {
      const err = e;
      const denied = err.status === 403;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                text: denied
                  ? "You are not assigned to this patient, so the assistant cannot retrieve their documents."
                  : "The assistant could not respond. Please try again.",
                status: denied ? "refused" : "error",
                loading: false,
              }
            : m
        )
      );
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  const reset = () => {
    setMessages([]);
    setActiveSource(null);
    inputRef.current?.focus();
  };

  return (
    <div className="aw-page">
      {/* Header */}
      <div className="aw-header">
        <div className="aw-header-identity">
          <span className="aw-header-badge">
            <Sparkles className="aw-icon-20" />
          </span>
          <div>
            <h1 className="aw-title">Assistant</h1>
            <p className="aw-header-note">
              {ASSISTANT_SCOPE_NOTE} · The doctor always decides.
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={reset} className="aw-reset-btn">
            <RefreshCw className="aw-icon-12" />
            Reset
          </button>
        )}
      </div>

      <div className="aw-grid">
        {/* Chat */}
        <div className="aw-col-chat">
          <div className="aw-chat-card">
            {/* Messages */}
            <div ref={scrollRef} className="aw-messages scrollbar-rivara">
              {messages.length === 0 ? (
                <div className="aw-empty">
                  <span className="aw-empty-badge">
                    <Sparkles className="aw-icon-24" />
                  </span>
                  <p className="aw-empty-title">
                    Ask a question about {role === "doctor" ? "this patient's" : "your"} documents
                  </p>
                  <p className="aw-empty-note">
                    The assistant reads only the documents {role === "doctor" ? "this patient is allowed to share with you" : "you can access"} and shows the source for every statement.
                  </p>
                  <div className="aw-examples">
                    {examples.map((q) => (
                      <button
                        key={q}
                        onClick={() => send(q)}
                        className="aw-example-btn"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    onCitationClick={(c) => setActiveSource(c)}
                  />
                ))
              )}

              {busy && (
                <div className="aw-busy-row">
                  <Loader2 className="aw-icon-14 aw-icon-primary aw-spin" />
                  <span className="aw-busy-text">Searching the documents…</span>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="aw-input-form">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={1}
                placeholder="Ask about a report, a result, or a visit note…"
                className="aw-textarea scrollbar-rivara"
                aria-label="Ask the assistant"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                className="aw-send-btn"
                aria-label="Send"
              >
                <Send className="aw-icon-16" />
              </button>
            </form>

            {/* Disclaimer */}
            <div className="aw-disclaimer">
              <Info className="aw-icon-14 aw-disclaimer-icon" />
              <p className="aw-disclaimer-text">
                <span className="aw-disclaimer-strong">{DISCLAIMER}</span>{" "}
                Answers come only from documents {role === "doctor" ? "this patient shares with you" : "you can access"}.
              </p>
            </div>
          </div>
        </div>

        {/* Source panel */}
        <div className="aw-col-source">
          <div className="aw-source-card">
            <div className="aw-source-head">
              <div className="aw-source-head-label">
                <FileText className="aw-icon-16 aw-icon-primary" />
                <span className="aw-source-head-title">Source</span>
              </div>
              {activeSource && (
                <button
                  onClick={() => setActiveSource(null)}
                  className="aw-source-close"
                  aria-label="Close source"
                >
                  <X className="aw-icon-16" />
                </button>
              )}
            </div>
            <div className="aw-source-body scrollbar-rivara">
              {!activeSource ? (
                <div className="aw-empty">
                  <span className="aw-source-empty-badge">
                    <FileText className="aw-icon-20" />
                  </span>
                  <p className="aw-source-empty-title">
                    Click a citation chip
                  </p>
                  <p className="aw-source-empty-note">
                    Each statement in the answer carries a chip showing the document and page it came from.
                  </p>
                </div>
              ) : (
                <SourceView citation={activeSource} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, onCitationClick }) {
  const isUser = message.role === "user";

  if (message.loading) {
    return (
      <div className="aw-msg-row aw-msg-row-assistant">
        <div className="aw-msg-loading">
          <Loader2 className="aw-icon-16 aw-icon-primary aw-spin" />
        </div>
      </div>
    );
  }

  const isUrgent = message.status === "urgent";
  const isRefused = message.status === "refused";
  const isNotEnough = message.status === "not_enough_info";

  return (
    <div className={cn("aw-msg-row", isUser ? "aw-msg-row-user" : "aw-msg-row-assistant")}>
      <div
        className={cn(
          "aw-msg-bubble",
          isUser
            ? "aw-msg-bubble-user"
            : isUrgent
            ? "aw-msg-bubble-urgent"
            : isRefused
            ? "aw-msg-bubble-refused"
            : isNotEnough
            ? "aw-msg-bubble-not-enough"
            : "aw-msg-bubble-assistant"
        )}
      >
        {isUrgent && (
          <div className="aw-msg-flag aw-msg-flag-urgent">
            <ShieldAlert className="aw-icon-14" />
            This may need urgent care
          </div>
        )}
        {isRefused && (
          <div className="aw-msg-flag aw-msg-flag-refused">
            <AlertTriangle className="aw-icon-14" />
            Outside what I can do
          </div>
        )}
        {isNotEnough && (
          <div className="aw-msg-flag aw-msg-flag-muted">
            <Info className="aw-icon-14" />
            Not enough information
          </div>
        )}

        <p className="aw-msg-text">{message.text}</p>

        {message.citations && message.citations.length > 0 && (
          <div className="aw-msg-citations">
            <span className="aw-msg-citations-label">
              Sources:
            </span>
            {message.citations.map((c, i) => (
              <button
                key={`${c.docId}-${c.page}-${i}`}
                onClick={() => onCitationClick(c)}
                className="aw-citation-chip"
              >
                <FileText className="aw-icon-10" />
                {c.docTitle.length > 28 ? c.docTitle.slice(0, 26) + "…" : c.docTitle}
                <span className="aw-citation-page">· p.{c.page}</span>
              </button>
            ))}
          </div>
        )}

        {!isUser && !message.loading && message.status === "answered" && (
          <div className="aw-msg-actions">
            <button className="aw-action-btn" aria-label="Copy answer">
              <Copy className="aw-icon-12" />
            </button>
            <button className="aw-action-btn" aria-label="Good answer">
              <ThumbsUp className="aw-icon-12" />
            </button>
            <button className="aw-action-btn" aria-label="Bad answer">
              <ThumbsDown className="aw-icon-12" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceView({ citation }) {
  return (
    <div>
      <div className="aw-srcv-head">
        <span className="aw-srcv-badge">
          <FileText className="aw-icon-16" />
        </span>
        <div>
          <p className="aw-srcv-title">{citation.docTitle}</p>
          <p className="aw-srcv-sub">
            Page {citation.page} · excerpt used
          </p>
        </div>
      </div>
      <div className="aw-srcv-excerpt-box">
        <pre className="aw-srcv-excerpt">
          {citation.excerpt}
        </pre>
      </div>
      <p className="aw-srcv-note">
        <ShieldAlert className="aw-icon-12 aw-srcv-note-icon" />
        This excerpt was retrieved only after the backend confirmed you can access this document.
      </p>
    </div>
  );
}

export default AssistantWorkspace;
