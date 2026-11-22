/* =====================================
   CareCompass — Mock Admin API (frontend demo)
=====================================
   Drop-in mock for the admin dashboard, following the same pattern
   as src/services/api.js: admin components keep calling the exact
   same endpoints as the original workspace (/api/admin/*) and this
   module answers with realistic dummy data (small artificial delay
   included) so the whole dashboard works offline.

   Mutations (create user, change role, disable, verification
   decisions) live in memory and are mirrored to localStorage so a
   reload keeps them — exactly what the real /api/admin/* routes
   would do with the database. When the real backend is ready,
   replace the body of `adminApi()` with a fetch call and nothing
   else has to change.
===================================== */

import { refIdFrom, EMAIL_RE, passwordRules } from "../utils/verification";

const LS_KEY = "carecompass.admin-demo-state.v1";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpError(status, message) {
  const err = new Error(message || `Request failed with ${status}`);
  err.status = status;
  return err;
}

/* ── Session helper — the signed-in admin's identity ──────────────
   Mirrors the real backend, which stamps the acting admin's name on
   audit entries and verification decisions. Reads the same session
   the auth service (src/services/auth.js) stores. */
function currentAdmin() {
  try {
    const raw =
      window.localStorage.getItem("carecompass.session") ||
      window.sessionStorage.getItem("carecompass.session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.user) return null;
    return {
      email: session.user.email || "admin@carecompass.app",
      name: session.user.name || "Admin",
      role: String(session.user.role || "admin").toUpperCase(),
    };
  } catch {
    return null;
  }
}

/* ── Seed: users table ─────────────────────────────────────────────
   Same people as the bundled demo accounts (src/services/auth.js)
   plus self-registered patients and early-access doctors, matching
   the workspace's three backing stores. */

function seedUsers() {
  const daysAgo = (n) =>
    new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "acc-hana",
      kind: "account",
      name: "Dr. Hana Kamal",
      email: "doctor@carecompass.app",
      role: "DOCTOR",
      status: "active",
      source: "Demo account",
      createdAt: daysAgo(41),
    },
    {
      id: "acc-mariam",
      kind: "account",
      name: "Mariam R.",
      email: "patient@carecompass.app",
      role: "PATIENT",
      status: "active",
      source: "Demo account",
      createdAt: daysAgo(40),
    },
    {
      id: "acc-admin",
      kind: "account",
      name: "Admin",
      email: "admin@carecompass.app",
      role: "ADMIN",
      status: "active",
      source: "Demo account",
      createdAt: daysAgo(44),
    },
    {
      id: "acc-aya",
      kind: "account",
      name: "Aya Ramzy",
      email: "admin2@carecompass.app",
      role: "ADMIN",
      status: "active",
      source: "Demo account",
      createdAt: daysAgo(21),
    },
    {
      id: "acc-omar",
      kind: "account",
      name: "Dr. Omar Saleh",
      email: "doctor2@carecompass.app",
      role: "DOCTOR",
      status: "active",
      source: "Demo account",
      createdAt: daysAgo(19),
    },
    {
      id: "acc-mariam-adel",
      kind: "account",
      name: "Dr. Mariam Adel",
      email: "disabled@carecompass.app",
      role: "DOCTOR",
      status: "disabled",
      source: "Demo account",
      createdAt: daysAgo(30),
    },
    {
      id: "pat-sara",
      kind: "patient",
      name: "Sara A.",
      email: "patient2@carecompass.app",
      role: "PATIENT",
      status: "active",
      source: "Self-registered",
      createdAt: daysAgo(9),
    },
    {
      id: "pat-laila",
      kind: "patient",
      name: "Laila Mansour",
      email: "laila.mansour@example.com",
      role: "PATIENT",
      status: "active",
      source: "Self-registered",
      createdAt: daysAgo(4),
    },
    {
      id: "doc-youssef",
      kind: "doctor",
      name: "Dr. Youssef Nabil",
      email: "youssef.nabil@example.com",
      role: "DOCTOR",
      status: "active",
      source: "Cardiology",
      createdAt: daysAgo(12),
    },
    {
      id: "doc-nadia",
      kind: "doctor",
      name: "Dr. Nadia Fahmy",
      email: "nadia.fahmy@example.com",
      role: "DOCTOR",
      status: "active",
      source: "Dermatology",
      createdAt: daysAgo(6),
    },
  ];
}

/* ── Seed: verification applications ───────────────────────────────
   Four applications across the lifecycle. Documents carry no image
   data (the demo leaves previews empty — the paper glyph fallback
   renders instead). */

function seedApplications() {
  const now = Date.now();
  const hoursAgo = (h) => new Date(now - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: "sig-karim",
      refId: "CC-9F2C41",
      fullName: "Dr. Karim Adel",
      email: "karim.adel@example.com",
      specialty: "Cardiology",
      licenseNumber: "EG-LIC-2281904",
      status: "PENDING",
      rejectReason: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: hoursAgo(5),
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
      documents: [
        {
          id: "vd-karim-license",
          kind: "license",
          fileName: "medical-license.pdf",
          mimeType: "application/pdf",
          size: 486_112,
          status: "UNDER_REVIEW",
          reason: null,
          createdAt: hoursAgo(5),
        },
        {
          id: "vd-karim-id",
          kind: "national_id",
          fileName: "national-id-front.jpg",
          mimeType: "image/jpeg",
          size: 231_508,
          status: "UNDER_REVIEW",
          reason: null,
          createdAt: hoursAgo(5),
        },
        {
          id: "vd-karim-synd",
          kind: "syndicate",
          fileName: "syndicate-2025.pdf",
          mimeType: "application/pdf",
          size: 398_204,
          status: "UNDER_REVIEW",
          reason: null,
          createdAt: hoursAgo(5),
        },
      ],
    },
    {
      id: "sig-mona",
      refId: "CC-4B70DE",
      fullName: "Dr. Mona Sherif",
      email: "mona.sherif@example.com",
      specialty: "Neurology",
      licenseNumber: "EG-LIC-1933277",
      status: "UNDER_REVIEW",
      rejectReason: null,
      reviewedBy: null,
      reviewedAt: null,
      submittedAt: daysAgo(2),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
      documents: [
        {
          id: "vd-mona-license",
          kind: "license",
          fileName: "msha-license-scan.png",
          mimeType: "image/png",
          size: 512_930,
          status: "APPROVED",
          reason: null,
          createdAt: daysAgo(2),
        },
        {
          id: "vd-mona-id",
          kind: "national_id",
          fileName: "id-scan.pdf",
          mimeType: "application/pdf",
          size: 301_772,
          status: "UNDER_REVIEW",
          reason: null,
          createdAt: daysAgo(2),
        },
        {
          id: "vd-mona-synd",
          kind: "syndicate",
          fileName: "syndicate-card.jpg",
          mimeType: "image/jpeg",
          size: 187_466,
          status: "UNDER_REVIEW",
          reason: null,
          createdAt: daysAgo(2),
        },
      ],
    },
    {
      id: "sig-hazem",
      refId: "CC-1A93B8",
      fullName: "Dr. Hazem Tarek",
      email: "hazem.tarek@example.com",
      specialty: "Orthopedics",
      licenseNumber: "EG-LIC-1774092",
      status: "REJECTED",
      rejectReason:
        "The license scan is blurry — the name is not readable. Please re-upload a clear photo.",
      reviewedBy: "admin@carecompass.app",
      reviewedAt: daysAgo(3),
      submittedAt: daysAgo(4),
      createdAt: daysAgo(4),
      updatedAt: daysAgo(3),
      documents: [
        {
          id: "vd-hazem-license",
          kind: "license",
          fileName: "license-photo.jpg",
          mimeType: "image/jpeg",
          size: 402_118,
          status: "REJECTED",
          reason: "Scan is blurry — the printed name cannot be verified.",
          createdAt: daysAgo(4),
        },
        {
          id: "vd-hazem-id",
          kind: "national_id",
          fileName: "national-id.pdf",
          mimeType: "application/pdf",
          size: 288_045,
          status: "APPROVED",
          reason: null,
          createdAt: daysAgo(4),
        },
        {
          id: "vd-hazem-synd",
          kind: "syndicate",
          fileName: "syndicate-membership.pdf",
          mimeType: "application/pdf",
          size: 341_027,
          status: "UNDER_REVIEW",
          reason: null,
          createdAt: daysAgo(4),
        },
      ],
    },
    {
      id: "sig-youssef",
      refId: "CC-77C0AA",
      fullName: "Dr. Youssef Nabil",
      email: "youssef.nabil@example.com",
      specialty: "Cardiology",
      licenseNumber: "EG-LIC-2099381",
      status: "VERIFIED",
      rejectReason: null,
      reviewedBy: "admin@carecompass.app",
      reviewedAt: daysAgo(11),
      submittedAt: daysAgo(13),
      createdAt: daysAgo(13),
      updatedAt: daysAgo(11),
      documents: [
        {
          id: "vd-youssef-license",
          kind: "license",
          fileName: "cardiology-license.pdf",
          mimeType: "application/pdf",
          size: 455_301,
          status: "APPROVED",
          reason: null,
          createdAt: daysAgo(13),
        },
        {
          id: "vd-youssef-id",
          kind: "national_id",
          fileName: "id-front-back.pdf",
          mimeType: "application/pdf",
          size: 312_884,
          status: "APPROVED",
          reason: null,
          createdAt: daysAgo(13),
        },
        {
          id: "vd-youssef-synd",
          kind: "syndicate",
          fileName: "syndicate-2025.jpg",
          mimeType: "image/jpeg",
          size: 205_660,
          status: "APPROVED",
          reason: null,
          createdAt: daysAgo(13),
        },
      ],
    },
  ];
}

/* ── Seed: audit entries ───────────────────────────────────────────
   Generated relative to "now" so the dashboard's "today / last 7
   days" stats and the date filters always show meaningful values. */

function seedAudit() {
  const now = Date.now();
  const at = (ms) => new Date(now - ms).toISOString();
  const H = 60 * 60 * 1000;
  const D = 24 * H;

  const E = (offset, actor, actorRole, action, resource, result, detail) => ({
    id: `aud-${offset}-${action.toLowerCase()}`,
    actor,
    actorRole,
    action,
    resource,
    result,
    detail: detail ?? null,
    createdAt: at(offset),
  });

  return [
    E(4 * 60 * 1000, "Admin", "ADMIN", "AUTH_SIGNIN", "session", "success", "Password sign-in"),
    E(12 * 60 * 1000, "admin@carecompass.app", "ADMIN", "VERIFICATION_APPROVE", "verification/sig-youssef", "success", "Approved Dr. Youssef Nabil — Cardiology"),
    E(26 * 60 * 1000, "Dr. Hana Kamal", "DOCTOR", "PATIENT_HISTORY_VIEW", "patient/pat-sara/history", "success", "Opened medical history before a follow-up visit"),
    E(38 * 60 * 1000, "Dr. Hana Kamal", "DOCTOR", "ASSISTANT_ASK", "assistant/query", "success", "Asked about a pending HbA1c result"),
    E(52 * 60 * 1000, "Sara A.", "PATIENT", "PATIENT_HISTORY_UPDATE", "patient/pat-sara/history", "success", "Updated current medications"),
    E(1.4 * H, "Admin", "ADMIN", "AUTH_SIGNIN", "session", "denied", "Disabled account attempted sign-in"),
    E(2.2 * H, "admin@carecompass.app", "ADMIN", "VERIFICATION_REJECT", "verification/sig-hazem", "success", "Rejected — license scan unreadable"),
    E(2.6 * H, "Dr. Omar Saleh", "DOCTOR", "VISIT_CREATE", "visit/draft", "success", "Started a consultation record draft"),
    E(3.1 * H, "Laila Mansour", "PATIENT", "AUTH_SIGNIN", "session", "success", "Password sign-in"),
    E(4.5 * H, "Dr. Hana Kamal", "DOCTOR", "PATIENT_HISTORY_VIEW", "patient/acc-mariam/history", "success", null),
    E(5.2 * H, "admin@carecompass.app", "ADMIN", "ADMIN_USER_STATUS_SET", "user/pat-laila", "success", "Re-enabled account"),
    E(6.8 * H, "admin@carecompass.app", "ADMIN", "ADMIN_USER_ROLE_SET", "user/doc-youssef", "success", "PATIENT → DOCTOR"),
    E(8 * H, "Sara A.", "PATIENT", "RECORD_DOWNLOAD", "record/lab-panel-dec", "denied", "Record belongs to another patient"),
    E(9.5 * H, "Dr. Mona Sherif", "DOCTOR", "VERIFICATION_UPLOAD", "verification/sig-mona", "success", "Uploaded syndicate membership card"),
    E(11 * H, "Admin", "ADMIN", "AUTH_SIGNIN", "session", "success", "Password sign-in"),
    E(13.2 * H, "admin2@carecompass.app", "ADMIN", "ADMIN_USER_CREATE", "user/pat-laila", "success", "Created account for Laila Mansour"),
    E(15 * H, "Dr. Hana Kamal", "DOCTOR", "SUMMARY_GENERATE", "summary/mariam-r", "success", "Pre-visit summary with 5 sources"),
    E(19 * H, "admin@carecompass.app", "ADMIN", "ADMIN_USER_STATUS_SET", "user/acc-mariam-adel", "success", "Disabled account"),
    E(22 * H, "Mariam R.", "PATIENT", "PATIENT_HISTORY_UPDATE", "patient/acc-mariam/history", "error", "Validation failed on height value"),
    E(26 * H, "admin@carecompass.app", "ADMIN", "VERIFICATION_DECISION", "verification/sig-mona", "success", "Marked license document as approved"),
    E(2.4 * D, "Dr. Karim Adel", "DOCTOR", "VERIFICATION_SUBMIT", "verification/sig-karim", "success", "Early-access submission with 3 documents"),
    E(3.2 * D, "admin2@carecompass.app", "ADMIN", "AUTH_SIGNIN", "session", "success", "Password sign-in"),
    E(4.1 * D, "admin@carecompass.app", "ADMIN", "ADMIN_USER_ROLE_SET", "user/acc-aya", "success", "DOCTOR → ADMIN"),
    E(5.5 * D, "Dr. Youssef Nabil", "DOCTOR", "AUTH_SIGNIN", "session", "success", "Password sign-in"),
    E(6.3 * D, "Dr. Omar Saleh", "DOCTOR", "PATIENT_HISTORY_VIEW", "patient/pat-sara/history", "denied", "Patient not assigned to this doctor"),
    E(7.4 * D, "admin@carecompass.app", "ADMIN", "ADMIN_USER_CREATE", "user/acc-omar", "success", "Created account for Dr. Omar Saleh"),
    E(9.1 * D, "Admin", "ADMIN", "AUTH_SIGNIN", "session", "success", "Password sign-in"),
    E(11 * D, "admin@carecompass.app", "ADMIN", "VERIFICATION_APPROVE", "verification/sig-youssef", "success", "Approved — all three documents verified"),
  ];
}

/* ── Mutable demo state (seeded once, persisted to localStorage) ── */

function loadState() {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.audit)) {
        return parsed;
      }
    }
  } catch {
    /* fall through to seed */
  }

  const state = {
    users: seedUsers(),
    audit: seedAudit(),
    applications: seedApplications(),
  };
  saveState(state);
  return state;
}

function saveState(state) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors in the demo */
  }
}

let state = typeof window !== "undefined" ? loadState() : null;

let auditSeq = 0;
function pushAudit(action, resource, detail, result = "success") {
  auditSeq += 1;
  const admin = currentAdmin();
  state.audit.unshift({
    id: `aud-live-${auditSeq}`,
    actor: admin ? admin.name || admin.email : "admin@carecompass.app",
    actorRole: "ADMIN",
    action,
    resource,
    result,
    detail: detail ?? null,
    createdAt: new Date().toISOString(),
  });
}

/* ── Aggregations ─────────────────────────────────────────────────── */

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function auditStats() {
  const today = startOfToday();
  const week = today - 7 * 24 * 60 * 60 * 1000;
  let todayCount = 0;
  let weekCount = 0;
  for (const e of state.audit) {
    const t = new Date(e.createdAt).getTime();
    if (t >= today) todayCount += 1;
    if (t >= week) weekCount += 1;
  }
  return { today: todayCount, last7Days: weekCount };
}

function usersStats() {
  const total = state.users.length;
  const active = state.users.filter((u) => u.status === "active").length;
  const disabled = total - active;
  const byRole = {
    doctor: state.users.filter((u) => u.role === "DOCTOR").length,
    patient: state.users.filter((u) => u.role === "PATIENT").length,
    admin: state.users.filter((u) => u.role === "ADMIN").length,
  };
  return { total, active, disabled, byRole };
}

function verificationsStats() {
  const pending = state.applications.filter(
    (a) => a.status === "PENDING" || a.status === "UNDER_REVIEW"
  ).length;
  const verifiedTotal = state.applications.filter(
    (a) => a.status === "VERIFIED"
  ).length;
  return { pending, verifiedTotal };
}

/* ── The mock router — same contract as the workspace api() ──────── */

export async function adminApi(path, options = {}) {
  await delay(350 + Math.random() * 300);

  const method = (options.method || "GET").toUpperCase();

  /* GET /api/admin/overview — dashboard home stats */
  if (path === "/api/admin/overview" && method === "GET") {
    return {
      users: usersStats(),
      verifications: verificationsStats(),
      audit: auditStats(),
      recent: state.audit.slice(0, 6).map((e) => ({ ...e })),
    };
  }

  /* GET /api/admin/users — unified account table */
  if (path === "/api/admin/users" && method === "GET") {
    /* Deep-copy every row — like a real backend would after JSON
       serialization — so the store's objects are never shared with
       the React state. */
    return {
      users: state.users
        .map((u) => ({ ...u }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  /* POST /api/admin/users — create an account */
  if (path === "/api/admin/users" && method === "POST") {
    let body = {};
    try {
      body = options.body ? JSON.parse(options.body) : {};
    } catch {
      throw httpError(400, "Invalid request payload.");
    }

    const fields = {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const role = String(body.role || "");
    const password = String(body.password || "");

    if (name.length < 2) fields.name = "Enter the user's full name.";
    if (!EMAIL_RE.test(email)) fields.email = "Enter a valid email address.";
    if (!["DOCTOR", "PATIENT", "ADMIN"].includes(role))
      fields.role = "Choose a role.";
    if (!passwordRules(password).every((r) => r.pass))
      fields.password = "Password does not meet the requirements.";

    if (
      !fields.email &&
      state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())
    ) {
      fields.email = "An account with this email already exists.";
    }

    if (Object.keys(fields).length) {
      const err = httpError(422, "Some fields need attention before saving.");
      err.fields = fields;
      throw err;
    }

    const user = {
      id: `acc-${Date.now().toString(36)}`,
      kind: "account",
      name,
      email,
      role,
      status: "active",
      source: "Created by admin",
      createdAt: new Date().toISOString(),
    };
    state.users.push(user);
    pushAudit("ADMIN_USER_CREATE", `user/${user.id}`, `Created account for ${name}`);
    saveState(state);
    /* Return a copy — like a real backend would after serialization — so
       callers can't observe later mutations through this reference. */
    return { user: { ...user } };
  }

  /* PATCH /api/admin/users — change role / enable-disable */
  if (path === "/api/admin/users" && method === "PATCH") {
    let body = {};
    try {
      body = options.body ? JSON.parse(options.body) : {};
    } catch {
      throw httpError(400, "Invalid request payload.");
    }

    const user = state.users.find((u) => u.id === body.id);
    if (!user) throw httpError(404, "User not found.");

    const admin = currentAdmin();
    const selfEmail = admin?.email?.toLowerCase();
    const isSelf = user.email.toLowerCase() === selfEmail;

    if (body.action === "set-role") {
      if (user.kind !== "account")
        throw httpError(403, "Only managed accounts can change role.");
      if (isSelf)
        throw httpError(403, "You cannot change the role of your own account.");
      const role = String(body.role || "");
      if (!["DOCTOR", "PATIENT", "ADMIN"].includes(role))
        throw httpError(422, "Unknown role.");
      const prev = user.role;
      user.role = role;
      pushAudit(
        "ADMIN_USER_ROLE_SET",
        `user/${user.id}`,
        `${prev} → ${role}`
      );
      saveState(state);
      return { user: { ...user } };
    }

    if (body.action === "set-status") {
      if (isSelf)
        throw httpError(403, "You cannot disable your own account.");
      const disabling = body.disabled === true;
      user.status = disabling ? "disabled" : "active";
      pushAudit(
        "ADMIN_USER_STATUS_SET",
        `user/${user.id}`,
        disabling ? "Disabled account" : "Re-enabled account"
      );
      saveState(state);
      return { user: { ...user } };
    }

    throw httpError(400, "Unknown action.");
  }

  /* GET /api/admin/audit — paginated, filterable log */
  if (path.startsWith("/api/admin/audit") && method === "GET") {
    const params = new URLSearchParams(path.split("?")[1] || "");
    const page = Math.max(1, Number(params.get("page") || 1));
    const pageSize = Math.max(1, Number(params.get("pageSize") || 12));
    const user = params.get("user") || "";
    const action = params.get("action") || "";
    const from = params.get("from") || "";
    const to = params.get("to") || "";

    const localDay = (iso) => {
      const d = new Date(iso);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${mm}-${dd}`;
    };

    const filtered = state.audit.filter((e) => {
      if (user && !e.actor.toLowerCase().includes(user.toLowerCase()))
        return false;
      if (action && e.action !== action) return false;
      if (from && localDay(e.createdAt) < from) return false;
      if (to && localDay(e.createdAt) > to) return false;
      return true;
    });

    const total = filtered.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);
    const entries = filtered
      .slice((safePage - 1) * pageSize, safePage * pageSize)
      .map((e) => ({ ...e }));

    return {
      entries,
      total,
      page: safePage,
      pageSize,
      pageCount,
      actions: [...new Set(state.audit.map((e) => e.action))].sort(),
      actors: [...new Set(state.audit.map((e) => e.actor))].sort(),
    };
  }

  /* GET /api/admin/verifications — the review queue */
  if (path === "/api/admin/verifications" && method === "GET") {
    return {
      applications: state.applications.map((a) => ({
        ...a,
        documents: a.documents.map((d) => ({ ...d })),
      })),
    };
  }

  /* POST /api/admin/verifications/decision — approve / reject */
  if (path === "/api/admin/verifications/decision" && method === "POST") {
    let body = {};
    try {
      body = options.body ? JSON.parse(options.body) : {};
    } catch {
      throw httpError(400, "Invalid request payload.");
    }

    const app = state.applications.find((a) => a.id === body.id);
    if (!app) throw httpError(404, "Application not found.");

    const admin = currentAdmin();
    const reviewer = admin?.email || "admin@carecompass.app";

    if (body.action === "APPROVE") {
      app.status = "VERIFIED";
      app.reviewedBy = reviewer;
      app.reviewedAt = new Date().toISOString();
      app.rejectReason = null;
      app.documents = app.documents.map((d) => ({
        ...d,
        status: "APPROVED",
        reason: null,
      }));
      pushAudit(
        "VERIFICATION_APPROVE",
        `verification/${app.id}`,
        `Approved ${app.fullName} — ${app.specialty}`
      );
      saveState(state);
      return { application: { ...app } };
    }

    if (body.action === "REJECT") {
      const reason = String(body.reason || "").trim();
      if (reason.length < 4)
        throw httpError(422, "A rejection reason is required.");
      const rejectedDocIds = Array.isArray(body.rejectedDocIds)
        ? body.rejectedDocIds
        : [];
      app.status = "REJECTED";
      app.rejectReason = reason;
      app.reviewedBy = reviewer;
      app.reviewedAt = new Date().toISOString();
      app.documents = app.documents.map((d) =>
        rejectedDocIds.includes(d.id)
          ? { ...d, status: "REJECTED", reason }
          : d
      );
      pushAudit(
        "VERIFICATION_REJECT",
        `verification/${app.id}`,
        `Rejected ${app.fullName}`
      );
      saveState(state);
      return { application: { ...app } };
    }

    throw httpError(400, "Unknown action.");
  }

  /* Unknown route — behave like a 404 from a real backend. */
  throw httpError(404, `No mock handler for ${method} ${path}`);
}

export default adminApi;
