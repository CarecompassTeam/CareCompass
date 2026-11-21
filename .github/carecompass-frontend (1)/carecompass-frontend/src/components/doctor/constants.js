// CareCompass shared constants — the medical safety copy lives in one place
// so the disclaimer is consistent everywhere (per the frontend spec).

export const DISCLAIMER =
  "Information assistant. Not a diagnosis. The doctor decides.";

export const ASSISTANT_SCOPE_NOTE =
  "Uses only documents you can access.";

export const BRAND_PALETTE = [
  { name: "Ink", hex: "#12292C", role: "Text & headings" },
  { name: "Teal", hex: "#0B7A75", role: "Primary actions" },
  { name: "Soft Teal", hex: "#E1F1EE", role: "Tints & surfaces" },
  { name: "Background", hex: "#F4F7F6", role: "Page base" },
  { name: "Border", hex: "#DDE7E5", role: "Dividers" },
  { name: "Clay", hex: "#B9732E", role: "Warm accents" },
];

export const ROLES = [
  {
    key: "doctor",
    label: "For Doctors",
    tagline: "Save time before the visit. Build a reputation patients trust.",
    description:
      "See a short, sourced summary of your patient's history before they walk in. Upload visit notes. Answer only the questions you can answer — with the document and page number next to every line.",
    bullets: [
      "Pre-visit summary, generated from documents and visits",
      "Verified-doctor badge once your license is checked",
      "Reputation built from real patient ratings",
    ],
    accent: "teal",
  },
  {
    key: "patient",
    label: "For Patients",
    tagline: "Understand your lab report. Know what to ask.",
    description:
      "Upload a lab report and read it in plain words. Ask the assistant a question and see exactly which line of which document the answer came from. Choose a verified, rated doctor — not a guess.",
    bullets: [
      "Lab reports explained in everyday language",
      "Questions to bring to your next visit",
      "Only verified, rated doctors on the platform",
    ],
    accent: "sage",
  },
  {
    key: "admin",
    label: "For Admins",
    tagline: "Keep the platform safe and the audit log honest.",
    description:
      "Review doctor identity documents and approve or reject. Create and disable users. Watch every sensitive action in the audit log — who, what, when, and the result.",
    bullets: [
      "Identity verification review queue",
      "User management with role and status",
      "Audit log filtered by user, action, and date",
    ],
    accent: "clay",
  },
];
