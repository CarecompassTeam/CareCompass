/* =====================================
   CareCompass — Mock API (frontend demo)
=====================================
   Drop-in replacement for the workspace `api()` fetch wrapper.
   Same signature:  api(path, options)  ->  Promise<responseData>

   Every doctor-dashboard component keeps calling the exact same
   endpoints as the original workspace; this module answers them
   with realistic mock data (small artificial delay included) so
   the whole dashboard works offline. When the real backend is
   ready, replace the body of `api()` with a `fetch(path, options)`
   call and nothing else has to change.
===================================== */

/* ── Assigned platform patients (same two as the original workspace) ── */

const MOCK_PATIENTS = [
  {
    id: "cmvo1qpso0008vf87pk93p4km", // Mariam R.
    name: "Mariam R.",
    email: "patient@carecompass.app",
    hasHistory: true,
    historyUpdatedAt: "2025-11-10T09:24:00.000Z",
  },
  {
    id: "cmvo1qpso0009vf875qccsecv", // Sara A.
    name: "Sara A.",
    email: "patient2@carecompass.app",
    hasHistory: true,
    historyUpdatedAt: "2025-11-14T16:02:00.000Z",
  },
];

/* ── Platform medical histories, keyed by patient id ── */

const entry = (id, name, detail) => ({ id, name, detail: detail || undefined });

const MOCK_HISTORIES = {
  cmvo1qpso0008vf87pk93p4km: {
    history: {
      personal: { age: "54", gender: "female", heightCm: "162", weightKg: "72", bloodType: "B+" },
      chronicConditions: [
        entry("m-cc1", "Hypertension", "Diagnosed 2021 — controlled on therapy"),
        entry("m-cc2", "Type 2 diabetes", "Diagnosed 2018 — HbA1c near target"),
      ],
      medications: [
        entry("m-m1", "Metformin 850 mg", "1 tablet twice daily, after meals"),
        entry("m-m2", "Atorvastatin 20 mg", "1 tablet at night"),
      ],
      allergies: [],
      surgeries: [entry("m-s1", "Appendectomy", "2004 — no complications")],
      familyHistory: [
        entry("m-f1", "Mother", "Type 2 diabetes"),
        entry("m-f2", "Uncle", "Hypertension"),
      ],
      lifestyle: { smoking: "never", exercisePerWeek: "4", alcohol: "never" },
      notes:
        "Keeps a written BP and glucose diary. Prefers Arabic during consultations. Walks 30 minutes most days.",
    },
    updatedAt: "2025-11-10T09:24:00.000Z",
  },
  cmvo1qpso0009vf875qccsecv: {
    history: {
      personal: { age: "31", gender: "female", heightCm: "168", weightKg: "64", bloodType: "A+" },
      chronicConditions: [],
      medications: [],
      allergies: [entry("s-al1", "Penicillin", "Rash reported in childhood")],
      surgeries: [],
      familyHistory: [entry("s-f1", "Father", "Hypertension — late onset")],
      lifestyle: { smoking: "never", exercisePerWeek: "2", alcohol: "never" },
      notes: "Preventive cardiac check requested. No symptoms reported.",
    },
    updatedAt: "2025-11-14T16:02:00.000Z",
  },
};

/* ── Mock assistant Q&A ── */

const MOCK_ASK_ANSWERS = [
  {
    answer:
      "Based on the available documents: the patient's most recent HbA1c is 7.1 % (target < 7.0 %) with a fasting glucose of 132 mg/dL, recorded in the December lab panel. Blood pressure is described as controlled on current therapy in the last follow-up notes. The patient takes Metformin twice daily after meals plus Atorvastatin at night, and tolerates both without reported side effects.",
    citations: [
      {
        docId: "d-mariam-hba1c",
        docTitle: "HbA1c — Glycated Haemoglobin",
        page: 1,
        excerpt: "HbA1c 7.1 % · Fasting glucose 132 mg/dL · eGFR 96 mL/min",
      },
      {
        docId: "d-mariam-followup",
        docTitle: "Follow-up Notes — Internal Medicine",
        page: 1,
        excerpt: "Findings: Stable; mild fatigue reported. Plan: continue current dose.",
      },
      {
        docId: "d-mariam-metformin",
        docTitle: "Metformin 500 mg — Repeat Prescription",
        page: 1,
        excerpt: "Metformin 500 mg · 1 tablet twice daily · after meals",
      },
    ],
    status: "answered",
  },
];

/* ── Mock pre-visit summary ── */

const MOCK_SUMMARY_CONTENT = `Mariam R. is a 54-year-old woman with hypertension (diagnosed 2021, controlled on therapy) and type 2 diabetes (diagnosed 2018, HbA1c near target).

Current medications are Metformin 850 mg twice daily after meals and Atorvastatin 20 mg at night [1][2]. The most recent HbA1c was 7.1 % with a fasting glucose of 132 mg/dL and an eGFR of 96 mL/min — slightly above the < 7.0 % target [3]. The December CBC was unremarkable (haemoglobin 11.8 g/dL, platelets 248 ×10⁹/L) [4].

At the last quarterly review the plan was to continue the current dose and recheck HbA1c in six weeks; mild fatigue was reported but there were no acute complaints [5]. The patient keeps a written BP and glucose diary, walks 30 minutes most days, and prefers Arabic during consultations.

No documented drug allergies. Suggested topics for today: review the pending Vitamin D result, discuss adherence to the evening statin, and confirm the six-week HbA1c recheck.`;

const MOCK_SUMMARY_SOURCES = [
  { docId: "d-mariam-metformin", docTitle: "Metformin 500 mg — Repeat Prescription", page: 1, excerpt: "Metformin 500 mg · 1 tablet · twice daily · after meals" },
  { docId: "d-mariam-atorva", docTitle: "Atorvastatin 20 mg — Prescription", page: 1, excerpt: "Atorvastatin 20 mg · 1 tablet · at bedtime" },
  { docId: "d-mariam-hba1c", docTitle: "HbA1c — Glycated Haemoglobin", page: 1, excerpt: "HbA1c 7.1 % · target < 7.0" },
  { docId: "d-mariam-cbc", docTitle: "Complete Blood Count (CBC) — Routine Panel", page: 1, excerpt: "Haemoglobin 11.8 g/dL · Platelets 248 ×10⁹/L" },
  { docId: "d-mariam-followup", docTitle: "Follow-up Notes — Internal Medicine", page: 1, excerpt: "Continue current dose; recheck HbA1c in 6 weeks" },
];

/* ── Plumbing ── */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpError(status, message) {
  const err = new Error(message || `Request failed with ${status}`);
  err.status = status;
  return err;
}

let askCallCount = 0;
let summarySeq = 0;

/**
 * Mock API — mirrors the original `api(path, options)` contract:
 * resolves with parsed JSON, rejects with an Error carrying `.status`.
 */
export async function api(path, options = {}) {
  await delay(350 + Math.random() * 300);

  const method = (options.method || "GET").toUpperCase();

  /* GET /api/doctor/patients — the doctor's assigned platform patients */
  if (path === "/api/doctor/patients" && method === "GET") {
    return { patients: MOCK_PATIENTS };
  }

  /* GET /api/doctor/patients/:id/history */
  const historyMatch = path.match(/^\/api\/doctor\/patients\/([^/]+)\/history$/);
  if (historyMatch && method === "GET") {
    const hit = MOCK_HISTORIES[historyMatch[1]];
    if (!hit) throw httpError(403, "You are not assigned to this patient.");
    return { history: hit.history, updatedAt: hit.updatedAt };
  }

  /* POST /api/assistant/ask — sourced Q&A */
  if (path === "/api/assistant/ask" && method === "POST") {
    askCallCount += 1;
    const base = MOCK_ASK_ANSWERS[(askCallCount - 1) % MOCK_ASK_ANSWERS.length];
    let body = {};
    try {
      body = options.body ? JSON.parse(options.body) : {};
    } catch {
      body = {};
    }
    const q = (body.question || "").toLowerCase();
    /* Small demo behaviour: urgent keywords produce the urgent status. */
    if (/\b(chest pain|urgent|emergency|can't breathe|د Breathing)\b/i.test(q)) {
      return {
        answer:
          "This question may describe an urgent situation. The assistant is not an emergency service — please advise the patient to seek immediate care or escalate directly.",
        citations: [],
        status: "urgent",
      };
    }
    return { answer: base.answer, citations: base.citations, status: base.status };
  }

  /* POST /api/assistant/summary — cited pre-visit summary */
  if (path === "/api/assistant/summary" && method === "POST") {
    summarySeq += 1;
    return {
      id: `sum-${summarySeq}`,
      content: MOCK_SUMMARY_CONTENT,
      sources: MOCK_SUMMARY_SOURCES,
      usedDocIds: MOCK_SUMMARY_SOURCES.map((s) => s.docId),
      approved: false,
      createdAt: new Date().toISOString(),
    };
  }

  /* Unknown route — behave like a 404 from a real backend. */
  throw httpError(404, `No mock handler for ${method} ${path}`);
}

export default api;
