/* =====================================
   CareCompass — Shared visit-records store (mock)
=====================================
   Plain-JS port of the workspace lib/visit-store.ts.

   Visit Records (DoctorVisits) and the patient profiles inside
   My Patients (DoctorPatients) must show the SAME records, so the
   state lives here in a module-level singleton that survives view
   switches within the SPA session.

   Completed records are seeded from the exact appointment data used
   by My Schedule (`makeAppointments`), so the three sections never
   disagree. Drafts created anywhere land in this store and stay
   private until completed.

   Swap this file for a real API-backed store later — the exported
   function names are the contract.
===================================== */

import { useSyncExternalStore } from "react";
import { makeAppointments } from "../components/doctor/MySchedule";

/* ── Date helpers — same semantics as My Schedule / My Patients ── */

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function daysAgoLabel(n) {
  if (n <= 0) return "Today";
  if (n === 1) return "Yesterday";
  if (n < 7) return `${n} days ago`;
  if (n < 30) return `${Math.floor(n / 7)} w ago`;
  return `${Math.floor(n / 30)} mo ago`;
}

/* ── Seed — completed records mirror My Schedule's completed appointments;
      one in-progress draft exists for today's first consultation ── */

function seed() {
  const todayISO = toISODate(new Date());
  const appts = makeAppointments(todayISO);
  const byId = new Map(appts.map((a) => [a.id, a]));

  const out = [];

  const completedSeeds = [
    {
      apptId: "appt-mariam-past",
      visitId: "VR-2287",
      patientKey: "mariam",
      patientId: "CC-1042",
      docRefs: ["d-mariam-hba1c", "d-mariam-followup", "d-mariam-metformin"],
    },
    {
      apptId: "appt-tarek-past",
      visitId: "VR-2284",
      patientKey: "tarek",
      patientId: "CC-0977",
      docRefs: ["d-tarek-ecg", "d-tarek-rx"],
    },
    {
      apptId: "appt-aya-past",
      visitId: "VR-2279",
      patientKey: "aya",
      patientId: "CC-1088",
      docRefs: ["d-aya-ecg", "d-aya-diary"],
    },
  ];

  for (const s of completedSeeds) {
    const a = byId.get(s.apptId);
    if (!a || !a.visitRecord) continue;
    const diff = Math.round((Date.parse(todayISO) - Date.parse(a.date)) / 864e5);
    out.push({
      id: s.apptId,
      visitId: s.visitId,
      patientKey: s.patientKey,
      patientName: a.patientName,
      patientId: s.patientId,
      dateISO: a.date,
      time: a.time,
      reason: a.reason,
      diagnosis: a.visitRecord.diagnosis,
      notes: a.visitRecord.notes,
      treatment: a.visitRecord.treatment,
      prescriptions: a.visitRecord.prescriptions,
      followUp: a.visitRecord.followUp,
      docRefs: s.docRefs,
      status: "completed",
      inPatientProfile: false,
      updatedLabel: daysAgoLabel(diff),
    });
  }

  /* In-progress draft — started from today's first consultation with
     Tarek M. (the same appointment shown in My Schedule today). */
  const tarekToday = byId.get("appt-tarek-bp");
  if (tarekToday) {
    out.unshift({
      id: "draft-tarek-today",
      visitId: "VR-2290",
      patientKey: "tarek",
      patientName: tarekToday.patientName,
      patientId: "CC-0977",
      dateISO: tarekToday.date,
      time: tarekToday.time,
      reason: tarekToday.reason,
      diagnosis:
        "Blood pressure still above target on the current Amlodipine 5 mg dose — medication review in progress.",
      notes:
        "Home log shows 150–158 / 92–96 mmHg on five of the last seven days. Patient adherent to therapy, no side effects reported. Weight stable at 88 kg. Awaiting today's ECG result before adjusting the Losartan dose.",
      treatment: [],
      prescriptions: [],
      docRefs: ["d-tarek-lipid"],
      status: "draft",
      inPatientProfile: true,
      updatedLabel: "Today",
    });
  }

  /* Newest first — drafts on top, then completed by date. */
  return out.sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}

/* ── Store plumbing — tiny external store consumed via useSyncExternalStore ── */

let records = seed();
let seq = 2290;
const listeners = new Set();

function emit() {
  /* New array identity so useSyncExternalStore re-renders consumers. */
  records = [...records];
  listeners.forEach((l) => l());
}

function subscribe(cb) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getVisitRecords() {
  return records;
}

/** React hook — all visit records, newest first. */
export function useVisitRecords() {
  return useSyncExternalStore(subscribe, getVisitRecords, getVisitRecords);
}

export function getVisitRecord(id) {
  return records.find((r) => r.id === id);
}

/* ── Mutations — used by the Visit Records form and the patient-profile
      "Start Visit Record" dialog ── */

export function createVisitDraft(input) {
  seq += 1;
  const rec = {
    ...input,
    id: `vr-${seq}`,
    visitId: `VR-${seq}`,
    status: "draft",
    inPatientProfile: true,
    updatedLabel: "Just now",
  };
  records = [rec, ...records];
  emit();
  return rec;
}

export function updateVisitDraft(id, patch) {
  records = records.map((r) => {
    if (r.id !== id || r.status !== "draft") return r;
    return { ...r, ...patch, updatedLabel: "Just now" };
  });
  emit();
}

export function completeVisitRecord(id) {
  records = records.map((r) =>
    r.id === id && r.status === "draft"
      ? { ...r, status: "completed", updatedLabel: "Just now" }
      : r
  );
  emit();
}