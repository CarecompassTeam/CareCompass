/* =====================================
   Admin verification queue — the "human checks the license" step
=====================================
   Plain-CSS port of the workspace `admin-review-dialog.tsx`. Renders
   in two variants:
     • <AdminVerificationQueue>    — the floating dialog (legacy entry)
     • <VerificationQueuePanel>    — embedded panel inside the Admin
                                     workspace's Verifications section
   A human admin opens each submission, checks every document against
   the doctor's name and specialty, and approves or rejects (with a
   reason so the doctor can re-upload).
===================================== */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  Award,
  IdCard,
  FileText,
  Inbox,
  RefreshCcw,
  Mail,
  BadgeCheck,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { adminApi as api } from "../../services/admin-api";
import { toast } from "../../hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { Checkbox } from "../ui/Checkbox";
import { Label } from "../ui/Label";
import { Separator } from "../ui/Separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/AlertDialog";
import {
  ApplicationStatusChip,
  DocStatusChip,
  DocFileChip,
  DocumentGlyph,
} from "./VerificationUI";
import { docKindLabel } from "../../utils/verification";

import "./AdminReviewDialog.css";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SlotIcon({ kind }) {
  const Icon =
    kind === "license" ? Award : kind === "national_id" ? IdCard : FileText;
  return <Icon className="av-slot-icon" />;
}

function initialsOf(name) {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => (w[0] ? w[0].toUpperCase() : ""))
    .join("");
}

/* ─── Embedded panel (shared by the dialog and the workspace section) ──── */

export function VerificationQueuePanel({ variant, onClose }) {
  const [applications, setApplications] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDocIds, setRejectDocIds] = useState([]);
  const [approving, setApproving] = useState(null);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const res = await api("/api/admin/verifications");
      setApplications(res.applications);
    } catch (err) {
      setLoadError(err.message || "Could not load the verification queue.");
      setApplications([]);
    }
  }, []);

  // Loads on mount. The dialog wrapper only mounts this panel while open,
  // so every open starts with a fresh fetch.
  useEffect(() => {
    void load();
  }, [load]);

  const pendingCount = useMemo(
    () =>
      (applications ?? []).filter(
        (a) => a.status === "UNDER_REVIEW" || a.status === "PENDING"
      ).length,
    [applications]
  );

  const decide = async (app, action, reason, rejectedDocIds) => {
    setBusyId(app.id);
    try {
      const res = await api("/api/admin/verifications/decision", {
        method: "POST",
        body: JSON.stringify({
          id: app.id,
          action,
          reason,
          rejectedDocIds,
        }),
      });
      setApplications((prev) =>
        prev
          ? prev.map((a) => (a.id === res.application.id ? res.application : a))
          : prev
      );
      toast({
        title:
          action === "APPROVE"
            ? `${app.fullName} verified`
            : `Application rejected`,
        description:
          action === "APPROVE"
            ? "The verified badge is live and the doctor now appears in patient search."
            : "The doctor will see the reason and can re-upload.",
      });
      setApproving(null);
      setRejecting(null);
      setRejectReason("");
      setRejectDocIds([]);
    } catch (err) {
      toast({
        title: "Decision failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className={cn(
        "av-queue",
        variant === "panel" ? "av-queue-panel" : "av-queue-dialog"
      )}
    >
      {/* header */}
      <div className="av-queue-header">
        <div className="av-queue-header-row">
          <div className="av-queue-titlewrap">
            <span className="av-queue-badge">
              <ShieldCheck className="av-icon-20" />
            </span>
            <div>
              <p className="av-eyebrow">Admin · Identity verification</p>
              <h2 className="av-queue-title">Verification queue</h2>
              <p className="av-queue-sub">
                Check every document against the doctor&apos;s name and
                specialty before approving.
              </p>
            </div>
          </div>
          <div className="av-queue-actions">
            <span className="av-count-chip">
              {pendingCount} awaiting review
            </span>
            <button
              type="button"
              onClick={() => void load()}
              className="av-refresh-btn"
              aria-label="Refresh queue"
            >
              <RefreshCcw className="av-icon-14" />
            </button>
          </div>
        </div>
      </div>

      {/* list */}
      <div
        className={cn(
          "av-queue-list scrollbar-rivara",
          variant === "panel" && "av-queue-list-panel"
        )}
      >
        {applications === null && (
          <div className="av-loading">
            <Loader2 className="av-icon-20 av-spin" />
            Loading applications…
          </div>
        )}

        {applications !== null && loadError && (
          <div role="alert" className="av-alert">
            <AlertCircle className="av-alert-icon" />
            <p>{loadError}</p>
          </div>
        )}

        {applications !== null && !loadError && applications.length === 0 && (
          <div className="av-empty">
            <span className="av-empty-icon">
              <Inbox className="av-icon-24" />
            </span>
            <p className="av-empty-title">No applications yet</p>
            <p className="av-empty-text">
              Doctor signups from the early access form will appear here for
              review.
            </p>
          </div>
        )}

        {applications?.map((app) => {
          const expanded = expandedId === app.id;
          const busy = busyId === app.id;
          return (
            <div
              key={app.id}
              className={cn("av-card", expanded && "av-card-open")}
            >
              {/* row */}
              <div className="av-row">
                <span className="av-avatar">{initialsOf(app.fullName)}</span>
                <div className="av-row-main">
                  <div className="av-row-nameline">
                    <p className="av-name">{app.fullName}</p>
                    <ApplicationStatusChip status={app.status} />
                  </div>
                  <p className="av-row-sub">
                    {app.specialty} · {app.email} · Ref{" "}
                    <span className="av-mono">{app.refId}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : app.id)}
                  className="av-expand-btn"
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "Collapse" : "Expand"} application for ${app.fullName}`}
                >
                  {app.documents.length} docs
                  <ChevronDown
                    className={cn("av-chevron", expanded && "av-chevron-open")}
                  />
                </button>
              </div>

              {expanded && (
                <div className="av-body">
                  {/* identity facts */}
                  <div className="av-facts">
                    <span className="av-fact">
                      <Award className="av-icon-14" />
                      License{" "}
                      <span className="av-fact-value av-mono">
                        {app.licenseNumber}
                      </span>
                    </span>
                    <span className="av-fact">
                      <Mail className="av-icon-14" />
                      {app.email}
                    </span>
                    <span>
                      Submitted{" "}
                      {app.submittedAt
                        ? new Date(app.submittedAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "—"}
                    </span>
                  </div>

                  {app.rejectReason && (
                    <div className="av-prev-reject">
                      <XCircle className="av-prev-reject-icon" />
                      <p>
                        <span className="av-prev-reject-label">
                          Previous rejection:{" "}
                        </span>
                        {app.rejectReason}
                      </p>
                    </div>
                  )}

                  {/* documents */}
                  <div className="av-docs-grid">
                    {app.documents.map((doc) => (
                      <DocumentReviewCard key={doc.id} doc={doc} />
                    ))}
                  </div>

                  <Separator className="av-sep" />

                  {/* decisions */}
                  {app.status === "VERIFIED" ? (
                    <p className="av-approved-note">
                      <BadgeCheck className="av-icon-16" />
                      Approved by {app.reviewedBy ?? "admin"} — account is
                      verified.
                    </p>
                  ) : busy ? (
                    <p className="av-busy-note">
                      <Loader2 className="av-icon-16 av-spin" />
                      Saving decision…
                    </p>
                  ) : (
                    <div className="av-decide-row">
                      <Button
                        type="button"
                        onClick={() => setApproving(app)}
                        className="av-btn-approve"
                      >
                        <CheckCircle2 className="av-btn-icon" />
                        Approve &amp; verify
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setRejecting(app);
                          setRejectReason("");
                          setRejectDocIds([]);
                        }}
                        className="av-btn-reject"
                      >
                        <XCircle className="av-btn-icon" />
                        Reject with reason
                      </Button>
                    </div>
                  )}

                  {/* reject panel */}
                  {rejecting?.id === app.id && !busy && (
                    <div className="av-reject-panel">
                      <Label
                        htmlFor={`reason-${app.id}`}
                        className="av-reject-label"
                      >
                        Rejection reason (required)
                      </Label>
                      <p className="av-reject-hint">
                        The doctor receives this reason and can re-upload —
                        the account stays in &apos;Rejected&apos; until the new
                        submission is approved.
                      </p>
                      <Textarea
                        id={`reason-${app.id}`}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. The license scan is blurry — the name is not readable. Please re-upload a clear photo."
                        className="av-reject-textarea"
                      />
                      {app.documents.length > 0 && (
                        <div className="av-reject-docs-title">
                          <p className="av-reject-docs-heading">
                            Documents that failed (optional)
                          </p>
                          <div className="av-reject-docs">
                            {app.documents.map((doc) => (
                              <label
                                key={doc.id}
                                className="av-reject-doc"
                              >
                                <Checkbox
                                  checked={rejectDocIds.includes(doc.id)}
                                  onCheckedChange={(v) =>
                                    setRejectDocIds((prev) =>
                                      v
                                        ? [...prev, doc.id]
                                        : prev.filter((id) => id !== doc.id)
                                    )
                                  }
                                />
                                <SlotIcon kind={doc.kind} />
                                {docKindLabel(doc.kind)}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="av-reject-actions">
                        <Button
                          type="button"
                          disabled={rejectReason.trim().length < 4}
                          onClick={() =>
                            void decide(
                              app,
                              "REJECT",
                              rejectReason.trim(),
                              rejectDocIds
                            )
                          }
                          className="av-btn-confirm-reject"
                        >
                          Confirm rejection
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setRejecting(null)}
                          className="av-btn-cancel"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div
        className={cn(
          "av-queue-footer",
          variant === "panel" && "av-queue-footer-panel"
        )}
      >
        <p className="av-footer-note">
          Unverified doctors can&apos;t see patients — full stop.
        </p>
        {variant === "dialog" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onClose?.()}
          >
            Close
          </Button>
        ) : (
          <p className="av-footer-hint">
            Approving writes the decision to the audit log.
          </p>
        )}
      </div>

      {/* Approve confirmation */}
      <AlertDialog
        open={!!approving}
        onOpenChange={(v) => !v && setApproving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="av-dialog-title">
              Verify {approving?.fullName}?
            </AlertDialogTitle>
            <AlertDialogDescription className="av-dialog-desc">
              The verified badge appears on the profile, the doctor appears in
              patient search, and the patient list becomes available. This
              action is written to the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approving && void decide(approving, "APPROVE")}
            >
              Approve &amp; verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Dialog wrapper (legacy floating entry point) ─────────────────────── */

export function AdminVerificationQueue({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="av-queue-dialog-content"
        aria-describedby={undefined}
      >
        <DialogTitle className="av-sr-only">
          Admin verification queue
        </DialogTitle>
        <DialogDescription className="av-sr-only">
          Review doctor identity documents and approve or reject applications.
        </DialogDescription>
        {open && (
          <VerificationQueuePanel
            variant="dialog"
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── Document review card ──────────────────────────────────────────────── */

function DocumentReviewCard({ doc }) {
  const [openError, setOpenError] = useState(false);

  const openDoc = () => {
    try {
      if (!doc) return;
      // data may be absent if the payload was trimmed; guard anyway
      if (!doc.data) {
        setOpenError(true);
        return;
      }
      const byteChars = atob(doc.data);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++)
        bytes[i] = byteChars.charCodeAt(i);
      const blob = new Blob([bytes], { type: doc.mimeType });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      setOpenError(true);
    }
  };

  return (
    <div className="av-doc-card">
      <div className="av-doc-head">
        <span className="av-doc-kind">
          <SlotIcon kind={doc.kind} />
          {docKindLabel(doc.kind)}
        </span>
        <DocStatusChip status={doc.status} />
      </div>
      <div className="av-doc-body">
        <div className="av-doc-preview">
          <DocumentGlyph
            mimeType={doc.mimeType}
            data={doc.data}
            className="av-doc-glyph"
          />
        </div>
        <p className="av-doc-name" title={doc.fileName}>
          {doc.fileName}
        </p>
        <div className="av-doc-meta">
          <DocFileChip mimeType={doc.mimeType} size={formatBytes(doc.size)} />
          <button
            type="button"
            onClick={openDoc}
            className="av-doc-open"
          >
            <ExternalLink className="av-icon-12" />
            Open
          </button>
        </div>
        {doc.status === "REJECTED" && doc.reason && (
          <p className="av-doc-reason">{doc.reason}</p>
        )}
        {openError && (
          <p className="av-doc-openerr">
            Preview unavailable for this file.
          </p>
        )}
      </div>
    </div>
  );
}
