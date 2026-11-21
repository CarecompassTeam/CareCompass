/* =====================================
   PreVisitSummaryWorkspace — AI-generated pre-visit summary
   with cited sources and doctor approval flow.
   Plain-JS port of the original carecompass/pre-visit-summary-workspace.tsx;
   all Tailwind classes were replaced with semantic `ps-` classes
   defined in PreVisitSummaryWorkspace.css.
===================================== */

import { useState } from "react";
import {
  FileText,
  Sparkles,
  Loader2,
  RefreshCw,
  Clock,
  ShieldCheck,
  FileSearch,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { DISCLAIMER } from "./constants";
import "./PreVisitSummaryWorkspace.css";

/**
 * @typedef {Object} Citation
 * @property {string} docId
 * @property {string} docTitle
 * @property {number} page
 * @property {string} excerpt
 */

/**
 * @typedef {Object} SummaryData
 * @property {string} id
 * @property {string} content
 * @property {Citation[]} sources
 * @property {string[]} usedDocIds
 * @property {boolean} approved
 * @property {string} createdAt
 */

export function PreVisitSummaryWorkspace({ patientId }) {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("idle");
  const [approving, setApproving] = useState(false);

  const generate = async () => {
    setStatus("loading");
    try {
      const res = await api("/api/assistant/summary", {
        method: "POST",
        body: JSON.stringify({ patientId }),
      });
      setSummary(res);
      setStatus(res.content ? "ready" : "error");
    } catch (e) {
      const err = e;
      setStatus(err.status === 403 ? "denied" : "error");
    }
  };

  const approve = async () => {
    if (!summary) return;
    setApproving(true);
    // Local approve: flip the flag (a real /api/summary/approve would persist).
    setTimeout(() => {
      setSummary({ ...summary, approved: true });
      setApproving(false);
    }, 700);
  };

  return (
    <div className="ps-page">
      {/* Header */}
      <div className="ps-header">
        <div className="ps-header-identity">
          <span className="ps-header-badge">
            <FileText className="ps-icon-20" />
          </span>
          <div>
            <h1 className="ps-title">Pre-visit summary</h1>
            <p className="ps-header-note">
              AI-generated from this patient's documents · every line cited
            </p>
          </div>
        </div>
        {summary && (
          <button
            onClick={generate}
            disabled={status === "loading"}
            className="ps-regen-btn"
          >
            <RefreshCw className={cn("ps-icon-12", status === "loading" && "ps-spin")} />
            Regenerate
          </button>
        )}
      </div>

      {/* Idle: prompt to generate */}
      {status === "idle" && (
        <div className="ps-idle">
          <span className="ps-idle-badge">
            <Sparkles className="ps-icon-24" />
          </span>
          <h2 className="ps-idle-title">
            Generate a pre-visit summary
          </h2>
          <p className="ps-idle-note">
            The assistant reads this patient's documents and visit notes and
            writes a one-page summary — reason for the last visit, conditions,
            medications, allergies, recent labs, and open points. Every line
            shows its source.
          </p>
          <button
            onClick={generate}
            className="ps-generate-btn"
          >
            <Sparkles className="ps-icon-16" />
            Generate summary
          </button>
          <p className="ps-idle-disclaimer">
            <ShieldCheck className="ps-icon-12 ps-icon-primary" />
            <span className="ps-strong">{DISCLAIMER}</span>
          </p>
        </div>
      )}

      {/* Loading */}
      {status === "loading" && (
        <div className="ps-loading">
          <Loader2 className="ps-icon-24 ps-icon-primary ps-spin" />
          <p className="ps-loading-title">Reading the documents and writing the summary…</p>
          <p className="ps-loading-note">This can take a few seconds.</p>
        </div>
      )}

      {/* Denied */}
      {status === "denied" && (
        <div className="ps-denied">
          <div className="ps-denied-head">
            <AlertCircle className="ps-icon-20 ps-icon-destructive" />
            <div>
              <p className="ps-denied-title">Access denied</p>
              <p className="ps-denied-note">
                You are not assigned to this patient.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="ps-error">
          <AlertCircle className="ps-icon-32 ps-error-icon" />
          <p className="ps-error-title">
            Couldn't generate the summary
          </p>
          <p className="ps-error-note">
            The assistant may be unavailable. Please try again.
          </p>
          <button
            onClick={generate}
            className="ps-retry-btn"
          >
            <RefreshCw className="ps-icon-12" />
            Try again
          </button>
        </div>
      )}

      {/* Ready: the summary */}
      {status === "ready" && summary && (
        <div>
          {/* Meta badges */}
          <div className="ps-badges">
            <span className="ps-badge ps-badge-teal">
              <Sparkles className="ps-icon-12" />
              AI-generated
            </span>
            {summary.approved ? (
              <span className="ps-badge ps-badge-approved">
                <CheckCircle2 className="ps-icon-12" />
                Approved to record
              </span>
            ) : (
              <span className="ps-badge ps-badge-draft">
                <Clock className="ps-icon-12" />
                Draft — not yet approved
              </span>
            )}
            <span className="ps-badge ps-badge-neutral">
              <Clock className="ps-icon-12" />
              Generated just now
            </span>
            <span className="ps-badge ps-badge-neutral">
              <FileSearch className="ps-icon-12" />
              {summary.sources.length} sources
            </span>
          </div>

          {/* Summary content */}
          <div className="ps-summary-card">
            <article className="ps-article">
              <RenderSummaryMarkdown content={summary.content} sources={summary.sources} />
            </article>
          </div>

          {/* Sources list */}
          {summary.sources.length > 0 && (
            <div className="ps-sources-card">
              <p className="ps-sources-label">
                <FileText className="ps-icon-14" />
                Sources used
              </p>
              <ul className="ps-sources-list">
                {summary.sources.map((s, i) => (
                  <li
                    key={`${s.docId}-${s.page}-${i}`}
                    className="ps-source-item"
                  >
                    <span className="ps-source-num">
                      {i + 1}
                    </span>
                    <div>
                      <p className="ps-source-title">{s.docTitle}</p>
                      <p className="ps-source-page">Page {s.page}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Approve / disclaimer */}
          {!summary.approved && (
            <div className="ps-approve">
              <p className="ps-approve-text">
                <span className="ps-strong">{DISCLAIMER}</span>{" "}
                Review the sources before any clinical decision. Approve to
                save this summary to the patient's record.
              </p>
              <button
                onClick={approve}
                disabled={approving}
                className="ps-approve-btn"
              >
                {approving ? (
                  <Loader2 className="ps-icon-14 ps-spin" />
                ) : (
                  <CheckCircle2 className="ps-icon-14" />
                )}
                {approving ? "Approving…" : "Approve to record"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Lightweight markdown-ish renderer: supports ## headings, - bullets, and
// inline [n] citation refs that map to the sources array.
function RenderSummaryMarkdown({ content, sources }) {
  const lines = content.split("\n");
  return (
    <div className="ps-md">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="ps-md-h3 ps-md-h3-gap">
              {renderRefs(line.slice(3), sources)}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h3 key={i} className="ps-md-h3">
              {renderRefs(line.slice(2), sources)}
            </h3>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="ps-md-bullet">
              <span className="ps-md-bullet-dot">• </span>
              {renderRefs(line.slice(2), sources)}
            </p>
          );
        }
        if (line.trim() === "") return <div key={i} className="ps-md-spacer" />;
        return (
          <p key={i} className="ps-md-p">
            {renderRefs(line, sources)}
          </p>
        );
      })}
    </div>
  );
}

function renderRefs(text, sources) {
  // Turn [1], [1,2] into small superscript-style chips.
  const parts = text.split(/(\[\d+(?:,\d+)*\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+(?:,\d+)*)\]$/);
    if (m) {
      const nums = m[1].split(",").map((n) => parseInt(n, 10));
      return (
        <sup key={i} className="ps-md-ref">
          [{nums.join(",")}]
        </sup>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default PreVisitSummaryWorkspace;
