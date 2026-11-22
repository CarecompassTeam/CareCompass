/* =====================================
   VerificationUI — shared status chips & document glyphs
=====================================
   Plain-CSS port of the workspace `verification-ui.tsx`. Small
   presentational pieces for the verification flow (status chips and
   document chips) so the admin queue reads from one visual language
   — the same tones the landing page's Verification section uses.
===================================== */

import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  FileImage,
  Circle,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { docKindLabel } from "../../utils/verification";

import "./VerificationUI.css";

const STATUS_TONES = {
  PENDING: { tone: "vu-tone-pending", label: "Pending", icon: Clock },
  UNDER_REVIEW: { tone: "vu-tone-review", label: "Under review", icon: Clock },
  VERIFIED: { tone: "vu-tone-verified", label: "Verified", icon: CheckCircle2 },
  REJECTED: { tone: "vu-tone-rejected", label: "Rejected", icon: XCircle },
};

export function ApplicationStatusChip({ status, className }) {
  const tone = STATUS_TONES[status] || STATUS_TONES.PENDING;
  const Icon = tone.icon;
  return (
    <span
      className={cn(
        "vu-chip",
        tone.tone,
        className
      )}
    >
      <Icon className="vu-icon-12" />
      {tone.label}
    </span>
  );
}

const DOC_STATUS_MAP = {
  UNDER_REVIEW: { tone: "vu-tone-review", label: "In review", icon: Clock },
  APPROVED: { tone: "vu-tone-verified", label: "Approved", icon: CheckCircle2 },
  REJECTED: { tone: "vu-tone-rejected", label: "Rejected", icon: XCircle },
};

export function DocStatusChip({ status }) {
  const meta = DOC_STATUS_MAP[status] || DOC_STATUS_MAP.UNDER_REVIEW;
  const Icon = meta.icon;
  return (
    <span className={cn("vu-chip vu-chip-doc", meta.tone)}>
      <Icon className="vu-icon-12" />
      {meta.label}
    </span>
  );
}

export function ChecklistItem({ pass, label }) {
  const Icon = pass ? CheckCircle2 : Circle;
  return (
    <li className={cn("vu-check", pass && "vu-check-pass")}>
      <Icon className="vu-icon-12" />
      {label}
    </li>
  );
}

export function DocumentGlyph({ mimeType, data, className }) {
  // Image scans render inline; PDFs get a paper glyph.
  if (data && mimeType === "image/png") {
    return (
      <img
        src={`data:image/png;base64,${data}`}
        alt="Document scan"
        className={cn("vu-glyph-img", className)}
      />
    );
  }
  if (data && mimeType === "image/jpeg") {
    return (
      <img
        src={`data:image/jpeg;base64,${data}`}
        alt="Document scan"
        className={cn("vu-glyph-img", className)}
      />
    );
  }
  return (
    <span className={cn("vu-glyph-fallback", className)}>
      <FileText className="vu-icon-20" />
    </span>
  );
}

export function DocFileChip({ mimeType, size }) {
  const isPdf = mimeType === "application/pdf";
  const Icon = isPdf ? FileText : FileImage;
  return (
    <span className="vu-filechip">
      <Icon className="vu-icon-12" />
      {isPdf ? "PDF" : "Image"} · {size}
    </span>
  );
}

export { docKindLabel };
