/* =====================================
   CareCompass — Verification helpers (frontend demo)
=====================================
   Plain-CSS port of the workspace `src/lib/verification.ts`.
   Only the pieces the admin dashboard needs live here: the shared
   email/password rules and the document-slot labels used by the
   verification queue panel.

   The workspace keeps this contract mirrored on the backend so the
   client checks and the server validation agree; the mock admin API
   (src/services/admin-api.js) answers with the same shapes.
===================================== */

/* ── Document kinds / labels ───────────────────────────────────── */

export const DOC_SLOTS = [
  {
    kind: "license",
    label: "Medical License",
    note: "Issued by the Ministry of Health",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    kind: "national_id",
    label: "National ID",
    note: "Both sides, clearly readable",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    kind: "syndicate",
    label: "Syndicate Membership",
    note: "Doctors' Syndicate, current year",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
];

export function docKindLabel(kind) {
  const hit = DOC_SLOTS.find((s) => s.kind === kind);
  return hit ? hit.label : kind;
}

/* ── Validators (mirrored on both sides in the workspace) ──────── */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password checklist for the create-user dialog.
 * Returns [{ label, pass }] so the UI can tick each rule live.
 */
export function passwordRules(pw) {
  return [
    { label: "At least 8 characters", pass: pw.length >= 8 },
    {
      label: "Upper and lowercase letters",
      pass: /[a-z]/.test(pw) && /[A-Z]/.test(pw),
    },
    { label: "At least one number", pass: /\d/.test(pw) },
    {
      label: "At least one symbol",
      pass: /[^A-Za-z0-9]/.test(pw),
    },
  ];
}

export function isStrongPassword(pw) {
  return passwordRules(pw).every((r) => r.pass);
}

/* Short human reference shown in the UI, e.g. "CC-7F3A2B". */
export function refIdFrom(id) {
  const tail = id
    .slice(-6)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "X");
  return `CC-${tail.padStart(6, "0")}`;
}
