import {
  createElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Users,
  Search,
  PencilLine,
  Loader2,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
  User,
  HeartPulse,
  Pill,
  AlertTriangle,
  Activity,
  Users2,
  Footprints,
  StickyNote,
  FileText,
  Lock,
  AlertCircle,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  Building2,
  CalendarDays,
  CheckCircle2,
  Sparkles,
  Eye,
  Download,
  Plus,
  CalendarPlus,
  CalendarClock,
  History,
  Phone,
  Mail,
  Info,
  RefreshCw,
  FileSearch,
  FileHeart,
  UserPlus,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { createVisitDraft, useVisitRecords } from "../../services/visit-store";
import { DISCLAIMER } from "./constants";
import { makeAppointments } from "./MySchedule";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { toast } from "../../hooks/use-toast";
import "./DoctorPatients.css";

/* ═══════════════════════════════════════════════════════════════════════════
   Date helpers — same semantics as My Schedule so dates always line up.
   ═══════════════════════════════════════════════════════════════════════════ */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(iso, n) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m)}`;
}

function prettyDate(iso) {
  const d = fromISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function prettyShort(iso) {
  const d = fromISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function relativeLabel(iso, todayISO) {
  const diff = Math.round(
    (fromISODate(iso).getTime() - fromISODate(todayISO).getTime()) / 864e5
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

function daysAgoLabel(n) {
  if (n <= 0) return "today";
  if (n === 1) return "yesterday";
  if (n < 7) return `${n} d ago`;
  if (n < 30) return `${Math.floor(n / 7)} w ago`;
  return `${Math.floor(n / 30)} mo ago`;
}

function entry(id, name, detail) {
  return { id, name, detail };
}

const ENRICHMENT = [
  {
    key: "tarek",
    name: "Tarek M.",
    patientId: "CC-0977",
    age: 61,
    gender: "Male",
    bloodType: "A+",
    email: "tarek.mansour@example.com",
    heightCm: 174,
    weightKg: 88,
    joinedDaysAgo: 640,
    conditions: ["Hypertension — stage 1"],
    allergies: ["Penicillin — skin rash"],
    medications: ["Amlodipine 5 mg — once daily", "Losartan 50 mg — once daily"],
    history: {
      personal: { age: "61", gender: "male", heightCm: "174", weightKg: "88", bloodType: "A+" },
      chronicConditions: [
        entry("t-cc1", "Hypertension", "Diagnosed 2019 — controlled on medication"),
      ],
      medications: [
        entry("t-m1", "Amlodipine 5 mg", "Once daily, morning"),
        entry("t-m2", "Losartan 50 mg", "Once daily, evening"),
      ],
      allergies: [entry("t-a1", "Penicillin", "Skin rash reported in 2015")],
      surgeries: [entry("t-s1", "Cataract surgery", "2019 — uncomplicated")],
      familyHistory: [
        entry("t-f1", "Father", "Stroke at 67"),
        entry("t-f2", "Mother", "Hypertension"),
      ],
      lifestyle: { smoking: "former", exercisePerWeek: "2", alcohol: "occasional" },
      notes:
        "Retired teacher. Keeps a paper BP log and brings it to every visit. Prefers morning appointments.",
    },
    documents: [
      {
        id: "d-tarek-lipid",
        name: "Lipid Panel — Fasting",
        category: "lab-report",
        format: "PDF",
        size: "262 KB",
        uploaderRole: "patient",
        daysAgo: 12,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Total cholesterol", value: "6.1 mmol/L", note: "target < 5.2" },
          { label: "LDL", value: "4.2 mmol/L", note: "target < 3.0" },
          { label: "HDL", value: "1.0 mmol/L", note: "> 1.0" },
          { label: "Triglycerides", value: "1.9 mmol/L", note: "< 1.7" },
        ],
      },
      {
        id: "d-tarek-ecg",
        name: "ECG — Resting 12-lead",
        category: "medical-report",
        format: "PDF",
        size: "410 KB",
        uploaderRole: "doctor",
        daysAgo: 3,
        relatedVisitDaysAgo: 3,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Rhythm", value: "Normal sinus rhythm" },
          { label: "Rate", value: "76 bpm" },
          { label: "Findings", value: "No ischaemic changes" },
        ],
      },
      {
        id: "d-tarek-rx",
        name: "Amlodipine 5 mg — Prescription",
        category: "prescription",
        format: "PDF",
        size: "88 KB",
        uploaderRole: "doctor",
        daysAgo: 3,
        relatedVisitDaysAgo: 3,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Amlodipine 5 mg", value: "1 tablet · once daily", note: "morning · repeat 2 months" },
        ],
      },
    ],
    extraVisits: [
      {
        id: "v-tarek-extra1",
        daysAgo: 40,
        reason: "Routine hypertension review",
        diagnosis: "Blood pressure borderline at 144/90 mmHg — dose kept, lifestyle advice repeated.",
        notes: "Weight up 1 kg since spring. Discussed salt and portion sizes. Patient motivated, log complete.",
        treatment: ["Continue current antihypertensive dose", "Home BP log twice daily"],
        prescriptions: ["Losartan 50 mg — repeat 3 months"],
        followUp: "Routine review in 3 months.",
      },
    ],
    lastActivityDaysAgo: 3,
    lastActivityLabel: "Visit record updated",
  },
  {
    key: "mariam",
    name: "Mariam R.",
    patientId: "CC-1042",
    platformId: "cmvo1qpso0008vf87pk93p4km",
    age: 54,
    gender: "Female",
    bloodType: "B+",
    email: "patient@carecompass.app",
    heightCm: 162,
    weightKg: 72,
    joinedDaysAgo: 420,
    conditions: ["Hypertension", "Type 2 diabetes"],
    allergies: [],
    medications: ["Metformin 850 mg — twice daily", "Atorvastatin 20 mg — at night"],
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
    documents: [
      {
        id: "d-mariam-vitd",
        name: "Vitamin D (25-OH) Blood Test",
        category: "lab-report",
        format: "PDF",
        size: "305 KB",
        uploaderRole: "patient",
        daysAgo: 0,
        status: "processing",
        note: "Fasting sample collected at the lab this morning — results are being processed.",
      },
      {
        id: "d-mariam-cbc",
        name: "Complete Blood Count (CBC) — Routine Panel",
        category: "lab-report",
        format: "PDF",
        size: "412 KB",
        uploaderRole: "patient",
        uploadedOn: "18 Dec 2024",
        relatedVisit: "Visit — quarterly review · 18 Dec 2024",
        status: "ready",
        note: "Routine blood work taken before the quarterly diabetes review.",
        pageCount: 2,
        previewRows: [
          { label: "Haemoglobin", value: "11.8 g/dL", note: "12.0 – 16.0" },
          { label: "White blood cells", value: "6.2 ×10⁹/L", note: "4.0 – 10.0" },
          { label: "Platelets", value: "248 ×10⁹/L", note: "150 – 400" },
          { label: "Haematocrit", value: "36.2 %", note: "36.0 – 46.0" },
        ],
      },
      {
        id: "d-mariam-hba1c",
        name: "HbA1c — Glycated Haemoglobin",
        category: "lab-report",
        format: "PDF",
        size: "298 KB",
        uploaderRole: "doctor",
        uploadedOn: "18 Dec 2024",
        relatedVisit: "Visit — quarterly review · 18 Dec 2024",
        status: "ready",
        note: "Three-month blood sugar average, attached after the review.",
        pageCount: 1,
        previewRows: [
          { label: "HbA1c", value: "7.1 %", note: "target < 7.0" },
          { label: "Fasting glucose", value: "132 mg/dL", note: "70 – 99" },
          { label: "eGFR (kidney)", value: "96 mL/min", note: "> 90" },
        ],
      },
      {
        id: "d-mariam-metformin",
        name: "Metformin 500 mg — Repeat Prescription",
        category: "prescription",
        format: "PDF",
        size: "96 KB",
        uploaderRole: "doctor",
        uploadedOn: "18 Dec 2024",
        relatedVisit: "Visit — quarterly review · 18 Dec 2024",
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Metformin 500 mg", value: "1 tablet · twice daily", note: "after meals" },
          { label: "Vitamin D3 1000 IU", value: "1 capsule · once daily", note: "with breakfast" },
        ],
      },
      {
        id: "d-mariam-atorva",
        name: "Atorvastatin 20 mg — Prescription",
        category: "prescription",
        format: "PDF",
        size: "88 KB",
        uploaderRole: "doctor",
        uploadedOn: "04 Nov 2024",
        relatedVisit: "Visit — routine follow-up · 04 Nov 2024",
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Atorvastatin 20 mg", value: "1 tablet · at bedtime", note: "3-month course" },
        ],
      },
      {
        id: "d-mariam-followup",
        name: "Follow-up Notes — Internal Medicine",
        category: "visit-document",
        format: "PDF",
        size: "220 KB",
        uploaderRole: "doctor",
        uploadedOn: "04 Nov 2024",
        relatedVisit: "Visit — routine follow-up · 04 Nov 2024",
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Reason", value: "Routine diabetes follow-up" },
          { label: "Findings", value: "Stable; mild fatigue reported" },
          { label: "Plan", value: "Continue current dose; recheck HbA1c in 6 weeks" },
        ],
      },
      {
        id: "d-mariam-thyroid",
        name: "Thyroid Ultrasound — Scan Images",
        category: "medical-report",
        format: "JPG",
        size: "2.4 MB",
        uploaderRole: "patient",
        uploadedOn: "22 Sep 2024",
        relatedVisit: "Radiology — neck ultrasound · 22 Sep 2024",
        status: "ready",
        note: "Scan images from the neck ultrasound examination.",
      },
      {
        id: "d-mariam-endo",
        name: "Endocrinology Consultation Report",
        category: "medical-report",
        format: "PDF",
        size: "780 KB",
        uploaderRole: "doctor",
        uploadedOn: "22 Sep 2024",
        relatedVisit: "Visit — endocrinology · 22 Sep 2024",
        status: "ready",
        pageCount: 3,
        previewRows: [
          { label: "Assessment", value: "Type 2 diabetes — controlled" },
          { label: "Recommendation", value: "Lifestyle review; repeat labs annually" },
        ],
      },
      {
        id: "d-mariam-flu",
        name: "Vaccination Certificate — Influenza 2024",
        category: "uploaded",
        format: "PDF",
        size: "180 KB",
        uploaderRole: "patient",
        uploadedOn: "15 Oct 2024",
        status: "ready",
        note: "Seasonal flu vaccination certificate issued at the pharmacy clinic.",
        pageCount: 1,
      },
      {
        id: "d-mariam-insurance",
        name: "Insurance Pre-Approval Letter",
        category: "uploaded",
        format: "PDF",
        size: "154 KB",
        uploaderRole: "patient",
        uploadedOn: "15 May 2024",
        status: "failed",
        note: "File appears to be corrupted — the patient was asked to re-upload a clear scan.",
      },
    ],
    extraVisits: [],
    lastActivityDaysAgo: 0,
    lastActivityLabel: "Uploaded a lab report",
  },
  {
    key: "aya",
    name: "Aya S.",
    patientId: "CC-1088",
    age: 37,
    gender: "Female",
    bloodType: "O+",
    email: "aya.saeed@example.com",
    heightCm: 165,
    weightKg: 61,
    joinedDaysAgo: 45,
    conditions: ["Palpitations — under review"],
    allergies: ["Dust mites — sneezing"],
    medications: [],
    history: {
      personal: { age: "37", gender: "female", heightCm: "165", weightKg: "61", bloodType: "O+" },
      chronicConditions: [],
      medications: [],
      allergies: [entry("a-a1", "Dust mites", "Seasonal sneezing; no asthma")],
      surgeries: [],
      familyHistory: [entry("a-f1", "Sister", "Thyroid disease")],
      lifestyle: { smoking: "never", exercisePerWeek: "1", alcohol: "never" },
      notes:
        "Works in a high-pressure marketing job. Was drinking 3 coffees and 1 energy drink daily — cutting down after the last visit.",
    },
    documents: [
      {
        id: "d-aya-diary",
        name: "Symptom Diary — Palpitations",
        category: "uploaded",
        format: "PDF",
        size: "120 KB",
        uploaderRole: "patient",
        daysAgo: 2,
        status: "ready",
        note: "Two weeks of episodes with time, pulse and trigger notes.",
        pageCount: 4,
      },
      {
        id: "d-aya-ecg",
        name: "ECG — Resting 12-lead",
        category: "medical-report",
        format: "PDF",
        size: "395 KB",
        uploaderRole: "doctor",
        daysAgo: 8,
        relatedVisitDaysAgo: 8,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Rhythm", value: "Sinus tachycardia" },
          { label: "Rate", value: "104 bpm" },
          { label: "Findings", value: "No structural changes" },
        ],
      },
      {
        id: "d-aya-cbc",
        name: "Complete Blood Count (CBC)",
        category: "lab-report",
        format: "PDF",
        size: "340 KB",
        uploaderRole: "patient",
        daysAgo: 8,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Haemoglobin", value: "12.9 g/dL", note: "12.0 – 16.0" },
          { label: "White blood cells", value: "6.8 ×10⁹/L", note: "4.0 – 10.0" },
          { label: "Thyroid (TSH)", value: "2.1 mIU/L", note: "0.4 – 4.0" },
        ],
      },
    ],
    extraVisits: [],
    lastActivityDaysAgo: 2,
    lastActivityLabel: "Uploaded a document",
  },
  {
    key: "omar",
    name: "Omar D.",
    patientId: "CC-0954",
    age: 48,
    gender: "Male",
    bloodType: "A-",
    email: "omar.dawoud@example.com",
    heightCm: 178,
    weightKg: 92,
    joinedDaysAgo: 720,
    conditions: ["High cholesterol"],
    allergies: [],
    medications: ["Atorvastatin 10 mg — once daily"],
    history: {
      personal: { age: "48", gender: "male", heightCm: "178", weightKg: "92", bloodType: "A-" },
      chronicConditions: [entry("o-cc1", "High cholesterol", "LDL elevated on two separate panels")],
      medications: [entry("o-m1", "Atorvastatin 10 mg", "Once daily, evening")],
      allergies: [],
      surgeries: [entry("o-s1", "Knee arthroscopy", "2016 — sports injury")],
      familyHistory: [entry("o-f1", "Father", "Heart bypass at 58")],
      lifestyle: { smoking: "current", exercisePerWeek: "0", alcohol: "occasional" },
      notes: "Retail manager with long shifts. Agreed on a smoking-cessation plan at the last visit.",
    },
    documents: [
      {
        id: "d-omar-lipid",
        name: "Lipid Panel — Fasting",
        category: "lab-report",
        format: "PDF",
        size: "255 KB",
        uploaderRole: "patient",
        daysAgo: 12,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Total cholesterol", value: "6.4 mmol/L", note: "target < 5.2" },
          { label: "LDL", value: "4.8 mmol/L", note: "target < 2.6" },
          { label: "HDL", value: "0.9 mmol/L", note: "> 1.0" },
        ],
      },
      {
        id: "d-omar-rx",
        name: "Atorvastatin 10 mg — Prescription",
        category: "prescription",
        format: "PDF",
        size: "86 KB",
        uploaderRole: "doctor",
        daysAgo: 55,
        relatedVisitDaysAgo: 55,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Atorvastatin 10 mg", value: "1 tablet · once daily", note: "evening · repeat 3 months" },
        ],
      },
    ],
    extraVisits: [
      {
        id: "v-omar-extra1",
        daysAgo: 55,
        reason: "High cholesterol — statin start",
        diagnosis: "Primary hyperlipidaemia. Started on Atorvastatin 10 mg; repeat lipids in 12 weeks.",
        notes: "Smoking cessation discussed — referral to the quit clinic accepted. Diet sheet given.",
        treatment: ["Start Atorvastatin 10 mg in the evening", "Smoking-cessation referral", "Repeat lipid panel in 12 weeks"],
        prescriptions: ["Atorvastatin 10 mg — repeat 3 months"],
      },
    ],
    lastActivityDaysAgo: 12,
    lastActivityLabel: "Uploaded a lab report",
  },
  {
    key: "laila",
    name: "Laila N.",
    patientId: "CC-0871",
    age: 66,
    gender: "Female",
    bloodType: "O-",
    email: "laila.nasr@example.com",
    heightCm: 158,
    weightKg: 74,
    joinedDaysAgo: 800,
    conditions: ["Heart failure — NYHA II (stable)"],
    allergies: ["Sulfa drugs — rash"],
    medications: ["Furosemide 40 mg — morning", "Bisoprolol 2.5 mg — once daily"],
    history: {
      personal: { age: "66", gender: "female", heightCm: "158", weightKg: "74", bloodType: "O-" },
      chronicConditions: [
        entry("l-cc1", "Heart failure (NYHA II)", "Stable on current therapy; monitored 3-monthly"),
      ],
      medications: [
        entry("l-m1", "Furosemide 40 mg", "Once daily, morning"),
        entry("l-m2", "Bisoprolol 2.5 mg", "Once daily"),
      ],
      allergies: [entry("l-a1", "Sulfa drugs", "Rash — reported 2019")],
      surgeries: [entry("l-s1", "Pacemaker implant", "2021 — checks at the pacemaker clinic")],
      familyHistory: [entry("l-f1", "Mother", "Heart failure")],
      lifestyle: { smoking: "never", exercisePerWeek: "3", alcohol: "never" },
      notes: "Lives with her daughter. Weighs herself daily and brings the weight log to every visit.",
    },
    documents: [
      {
        id: "d-laila-echo",
        name: "Echocardiogram Report",
        category: "medical-report",
        format: "PDF",
        size: "640 KB",
        uploaderRole: "doctor",
        daysAgo: 19,
        status: "ready",
        pageCount: 2,
        previewRows: [
          { label: "Ejection fraction", value: "45 %", note: "mildly reduced" },
          { label: "LV size", value: "Normal" },
          { label: "Valves", value: "No significant disease" },
        ],
      },
      {
        id: "d-laila-bnp",
        name: "NT-proBNP — Blood Test",
        category: "lab-report",
        format: "PDF",
        size: "210 KB",
        uploaderRole: "patient",
        daysAgo: 19,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "NT-proBNP", value: "260 pg/mL", note: "< 300 — stable" },
          { label: "Sodium", value: "139 mmol/L", note: "135 – 145" },
          { label: "Creatinine", value: "88 µmol/L", note: "45 – 90" },
        ],
      },
      {
        id: "d-laila-rx",
        name: "Furosemide 40 mg — Prescription",
        category: "prescription",
        format: "PDF",
        size: "84 KB",
        uploaderRole: "doctor",
        daysAgo: 19,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Furosemide 40 mg", value: "1 tablet · once daily", note: "morning · repeat 2 months" },
        ],
      },
    ],
    extraVisits: [],
    lastActivityDaysAgo: 19,
    lastActivityLabel: "Uploaded a lab report",
  },
  {
    key: "youssef",
    name: "Youssef K.",
    patientId: "CC-1103",
    age: 52,
    gender: "Male",
    bloodType: "B-",
    email: "youssef.kamel@example.com",
    heightCm: 170,
    weightKg: 85,
    joinedDaysAgo: 6,
    conditions: ["Chest discomfort — first consultation pending"],
    allergies: [],
    medications: [],
    history: null,
    documents: [],
    extraVisits: [],
    lastActivityDaysAgo: 6,
    lastActivityLabel: "Joined CareCompass",
  },
  {
    key: "salma",
    name: "Salma H.",
    patientId: "CC-0968",
    age: 45,
    gender: "Female",
    bloodType: "AB+",
    email: "salma.hassan@example.com",
    heightCm: 164,
    weightKg: 70,
    joinedDaysAgo: 240,
    conditions: ["Hypothyroidism"],
    allergies: [],
    medications: ["Levothyroxine 75 mcg — morning, fasting"],
    history: {
      personal: { age: "45", gender: "female", heightCm: "164", weightKg: "70", bloodType: "AB+" },
      chronicConditions: [entry("s-cc1", "Hypothyroidism", "Diagnosed 2022")],
      medications: [entry("s-m1", "Levothyroxine 75 mcg", "Morning, 30 min before breakfast")],
      allergies: [],
      surgeries: [],
      familyHistory: [entry("s-f1", "Mother", "Hypothyroidism")],
      lifestyle: { smoking: "never", exercisePerWeek: "2", alcohol: "never" },
      notes: "Fatigue improving on the current dose.",
    },
    documents: [
      {
        id: "d-salma-tsh",
        name: "Thyroid Function — TSH & Free T4",
        category: "lab-report",
        format: "PDF",
        size: "230 KB",
        uploaderRole: "patient",
        daysAgo: 9,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "TSH", value: "6.8 mIU/L", note: "0.4 – 4.0 — above range" },
          { label: "Free T4", value: "11.2 pmol/L", note: "12 – 22 — below range" },
        ],
      },
      {
        id: "d-salma-rx",
        name: "Levothyroxine 75 mcg — Prescription",
        category: "prescription",
        format: "PDF",
        size: "82 KB",
        uploaderRole: "doctor",
        daysAgo: 21,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Levothyroxine 75 mcg", value: "1 tablet · once daily", note: "fasting, morning" },
        ],
      },
      {
        id: "d-salma-us",
        name: "Thyroid Ultrasound — Scan Images",
        category: "medical-report",
        format: "JPG",
        size: "2.1 MB",
        uploaderRole: "patient",
        daysAgo: 200,
        status: "ready",
        note: "Neck ultrasound — no nodules reported.",
      },
    ],
    extraVisits: [],
    lastActivityDaysAgo: 9,
    lastActivityLabel: "Uploaded a lab report",
  },
  {
    key: "sara",
    name: "Sara A.",
    patientId: "CC-1077",
    platformId: "cmvo1qpso0009vf875qccsecv",
    age: 31,
    gender: "Female",
    bloodType: "A+",
    email: "patient2@carecompass.app",
    heightCm: 168,
    weightKg: 64,
    joinedDaysAgo: 21,
    conditions: ["Preventive cardiac check"],
    allergies: [],
    medications: [],
    history: null,
    documents: [
      {
        id: "d-sara-insurance",
        name: "Insurance Card Copy",
        category: "uploaded",
        format: "JPG",
        size: "1.1 MB",
        uploaderRole: "patient",
        daysAgo: 20,
        status: "ready",
        note: "Uploaded during onboarding.",
      },
    ],
    extraVisits: [],
    lastActivityDaysAgo: 20,
    lastActivityLabel: "Uploaded a document",
  },
  {
    key: "nadia",
    name: "Nadia F.",
    patientId: "CC-0764",
    age: 58,
    gender: "Female",
    bloodType: "B+",
    email: "nadia.fahmy@example.com",
    heightCm: 160,
    weightKg: 78,
    joinedDaysAgo: 300,
    conditions: ["Hypertension", "Osteoarthritis — knees"],
    allergies: [],
    medications: ["Indapamide 1.5 mg — morning", "Paracetamol — as needed"],
    history: {
      personal: { age: "58", gender: "female", heightCm: "160", weightKg: "78", bloodType: "B+" },
      chronicConditions: [
        entry("n-cc1", "Hypertension", "Diagnosed 2015"),
        entry("n-cc2", "Osteoarthritis (knees)", "Bilateral; worse on stairs"),
      ],
      medications: [
        entry("n-m1", "Indapamide 1.5 mg", "Once daily, morning"),
        entry("n-m2", "Paracetamol", "As needed, max 4×/day"),
      ],
      allergies: [],
      surgeries: [entry("n-s1", "Hysterectomy", "2012 — uncomplicated")],
      familyHistory: [entry("n-f1", "Sister", "Breast cancer — in remission")],
      lifestyle: { smoking: "never", exercisePerWeek: "3", alcohol: "never" },
      notes: "Swimming twice a week helps the knees.",
    },
    documents: [
      {
        id: "d-nadia-xray",
        name: "X-ray — Both Knees (Standing)",
        category: "medical-report",
        format: "JPG",
        size: "1.8 MB",
        uploaderRole: "patient",
        daysAgo: 63,
        status: "ready",
        note: "Imaging from the knee-pain assessment.",
      },
      {
        id: "d-nadia-rx",
        name: "Indapamide 1.5 mg — Prescription",
        category: "prescription",
        format: "PDF",
        size: "80 KB",
        uploaderRole: "doctor",
        daysAgo: 21,
        status: "ready",
        pageCount: 1,
        previewRows: [
          { label: "Indapamide 1.5 mg", value: "1 tablet · once daily", note: "morning · repeat 3 months" },
        ],
      },
    ],
    extraVisits: [
      {
        id: "v-nadia-extra1",
        daysAgo: 21,
        reason: "Blood pressure review",
        diagnosis: "Blood pressure controlled at 128/82 mmHg. Knee osteoarthritis — physiotherapy advised.",
        notes: "Home readings stable all month. Swimming is helping the knees; keep current dose.",
        treatment: ["Continue Indapamide 1.5 mg", "Physiotherapy referral for both knees"],
        prescriptions: ["Indapamide 1.5 mg — repeat 3 months"],
        followUp: "Routine review in 3 months.",
      },
      {
        id: "v-nadia-extra2",
        daysAgo: 63,
        reason: "Knee pain assessment",
        diagnosis: "Osteoarthritis of both knees — no red flags; X-ray shows mild changes.",
        notes: "No swelling or locking. Advised weight-neutral exercise and paced analgesia.",
        treatment: ["Paracetamol up to 4×/day as needed", "Continue swimming", "X-ray both knees standing"],
        prescriptions: [],
      },
    ],
    lastActivityDaysAgo: 21,
    lastActivityLabel: "Visit record updated",
  },
  {
    key: "hassan",
    name: "Hassan A.",
    patientId: "CC-1121",
    age: 49,
    gender: "Male",
    bloodType: "O+",
    email: "hassan.abdel@example.com",
    heightCm: null,
    weightKg: null,
    joinedDaysAgo: 5,
    conditions: [],
    allergies: [],
    medications: [],
    history: null,
    documents: [],
    extraVisits: [],
    lastActivityDaysAgo: 5,
    lastActivityLabel: "Joined CareCompass",
  },
];
/* ═══════════════════════════════════════════════════════════════════════════
   Roster builder — merges sample enrichment with the real assigned-patient
   API and the exact appointment data used by My Schedule.
   ═══════════════════════════════════════════════════════════════════════════ */

function apptTime(a) {
  return toMinutes(a.time);
}

export function buildRoster(apiPatients, todayISO) {
  const appts = makeAppointments(todayISO);

  const byName = new Map();
  for (const a of appts) {
    const slot = byName.get(a.patientName) ?? { upcoming: [], completed: [] };
    if (a.status === "confirmed") slot.upcoming.push(a);
    else slot.completed.push(a);
    byName.set(a.patientName, slot);
  }

  const apiByName = new Map(apiPatients.map((p) => [p.name, p]));

  return ENRICHMENT.map((enr) => {
    const api = apiByName.get(enr.name) ?? null;
    const sched = byName.get(enr.name);
    const upcoming = (sched?.upcoming ?? []).sort(
      (a, b) => a.date.localeCompare(b.date) || apptTime(a) - apptTime(b)
    );
    const completed = (sched?.completed ?? []).sort(
      (a, b) => b.date.localeCompare(a.date) || apptTime(b) - apptTime(a)
    );

    const scheduleVisits = completed
      .filter((a) => a.visitRecord)
      .map((a) => ({
        id: a.id,
        dateISO: a.date,
        dateLabel: prettyDate(a.date),
        reason: a.reason,
        diagnosis: a.visitRecord.diagnosis,
        notes: a.visitRecord.notes,
        treatment: a.visitRecord.treatment,
        prescriptions: a.visitRecord.prescriptions,
        followUp: a.visitRecord.followUp,
      }));

    const extraVisits = enr.extraVisits.map((v) => ({
      id: v.id,
      dateISO: addDays(todayISO, -v.daysAgo),
      dateLabel: prettyDate(addDays(todayISO, -v.daysAgo)),
      reason: v.reason,
      diagnosis: v.diagnosis,
      notes: v.notes,
      treatment: v.treatment,
      prescriptions: v.prescriptions,
      followUp: v.followUp,
    }));

    const visits = [...scheduleVisits, ...extraVisits];

    const documents = enr.documents.map((d) => ({
      ...d,
      uploadedOn:
        d.uploadedOn ??
        prettyShort(addDays(todayISO, -(d.daysAgo ?? 0))),
      relatedVisit:
        d.relatedVisit ??
        (d.relatedVisitDaysAgo !== undefined
          ? `Visit · ${prettyShort(addDays(todayISO, -d.relatedVisitDaysAgo))}`
          : undefined),
    }));

    const joined = fromISODate(addDays(todayISO, -enr.joinedDaysAgo));

    return {
      key: enr.key,
      realId: api?.id ?? enr.platformId ?? null,
      assigned: !!api,
      patientId: enr.patientId,
      name: enr.name,
      email: api?.email ?? enr.email,
      phone: appts.find((a) => a.patientName === enr.name)?.phone ?? "—",
      age: enr.age,
      gender: enr.gender,
      bloodType: enr.bloodType,
      heightCm: enr.heightCm,
      weightKg: enr.weightKg,
      joinedDaysAgo: enr.joinedDaysAgo,
      joinedLabel: `${joined.getDate()} ${MONTHS[joined.getMonth()]} ${joined.getFullYear()}`,
      isNew: enr.joinedDaysAgo <= 30,
      conditions: enr.conditions,
      allergies: enr.allergies,
      medications: enr.medications,
      upcoming,
      visits,
      documents,
      /* Platform patients always decide via the live API — even when the
         fetch ends in 403 (that IS the access-control demo). */
      history: api || enr.platformId ? null : enr.history,
      lastVisitISO: visits[0]?.dateISO ?? null,
      lastActivityDaysAgo: enr.lastActivityDaysAgo,
      lastActivityLabel: enr.lastActivityLabel,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   AI summary builder — composes a cited summary from the patient's own
   documents and visit records so every line can be verified.
   ═══════════════════════════════════════════════════════════════════════════ */

function buildAiSummary(p, todayISO) {
  const sources = [];
  const push = (s) => {
    sources.push(s);
    return sources.length; // 1-based citation number
  };

  const visits = p.visits.filter((v) => !v.draft);
  const rxDocs = p.documents.filter((d) => d.category === "prescription" && d.status === "ready");
  const labDocs = p.documents.filter((d) => d.category === "lab-report" && d.status === "ready");
  const hasHistory = !!p.history;

  /* Not enough material for an honest summary. */
  if (
    !hasHistory &&
    visits.length === 0 &&
    rxDocs.length === 0 &&
    labDocs.length === 0
  )
    return null;

  const historyRef = hasHistory
    ? push({
        kind: "history",
        id: "history",
        label: "Medical history — patient-reported",
        meta: "Completed by the patient during onboarding",
      })
    : 0;

  const visitRefs = new Map();
  for (const v of visits.slice(0, 3)) {
    visitRefs.set(
      v.id,
      push({
        kind: "visit",
        id: v.id,
        label: `Visit record — ${p.name}`,
        meta: v.dateLabel,
      })
    );
  }

  const docRefs = new Map();
  for (const d of [...rxDocs.slice(0, 2), ...labDocs.slice(0, 3)]) {
    docRefs.set(
      d.id,
      push({
        kind: "document",
        id: d.id,
        label: d.name,
        meta: `${categoryMeta(d.category).singular} · uploaded ${d.uploadedOn}`,
        docId: d.id,
      })
    );
  }

  if (sources.length === 0) return null;

  const ref = (map, id) => {
    const n = map.get(id);
    return n ? ` [${n}]` : "";
  };

  const sections = [];

  /* Overview */
  const overviewLines = [];
  overviewLines.push(
    `${p.age}-year-old ${p.gender.toLowerCase()}, on your panel since ${p.joinedLabel}. ` +
      `${p.conditions.length > 0 ? `${p.conditions.length} active condition${p.conditions.length > 1 ? "s" : ""} recorded` : "No active conditions recorded"}` +
      `${p.lastVisitISO ? `; last seen ${relativeLabel(p.lastVisitISO, todayISO).toLowerCase()}` : "; no completed visits yet"}.`
  );
  if (p.upcoming[0]) {
    overviewLines.push(
      `Next in-clinic appointment ${relativeLabel(p.upcoming[0].date, todayISO).toLowerCase()} at ${p.upcoming[0].time} — ${p.upcoming[0].reason}`
    );
  }
  sections.push({ heading: "General Patient Overview", lines: overviewLines });

  /* History */
  if (hasHistory || p.conditions.length > 0) {
    const lines = [];
    for (const c of p.conditions) lines.push(`${c}${historyRef ? ` [${historyRef}]` : ""}`);
    if (p.allergies.length > 0) lines.push(`Allergies reported by the patient: ${p.allergies.join("; ")}.`);
    else lines.push(`No drug allergies recorded by the patient.`);
    sections.push({ heading: "Relevant Medical History", lines });
  }

  /* Previous diagnoses */
  if (visits.length > 0) {
    const lines = visits.slice(0, 3).map(
      (v) => `${v.diagnosis} — ${v.dateLabel}${ref(visitRefs, v.id)}`
    );
    sections.push({ heading: "Previous Diagnoses", lines });
  }

  /* Medications */
  if (p.medications.length > 0) {
    const lines = [];
    for (const m of p.medications) {
      const rxDoc = rxDocs.find((d) => m.toLowerCase().startsWith(d.name.split(" — ")[0].toLowerCase()));
      lines.push(`${m}${rxDoc ? ref(docRefs, rxDoc.id) : historyRef ? ` [${historyRef}]` : ""}`);
    }
    sections.push({ heading: "Current Medications", lines });
  }

  /* Labs */
  if (labDocs.length > 0) {
    const lines = labDocs.slice(0, 3).map((d) => {
      const first = d.previewRows?.[0];
      return first
        ? `${d.name}: ${first.label} ${first.value}${first.note ? ` (${first.note})` : ""}${ref(docRefs, d.id)}`
        : `${d.name} — ready for review${ref(docRefs, d.id)}`;
    });
    sections.push({ heading: "Recent Lab Results & Reports", lines });
  } else if (p.documents.length > 0) {
    sections.push({
      heading: "Recent Lab Results & Reports",
      lines: ["No lab reports on file yet."],
    });
  }

  /* Findings */
  const findings = [];
  if (p.allergies.length > 0)
    findings.push(`Allergy alert — ${p.allergies[0]}. Verify before prescribing.`);
  const latest = visits[0];
  if (latest) findings.push(`Most recent plan: ${latest.treatment[0] ?? latest.diagnosis}${ref(visitRefs, latest.id)}`);
  if (p.upcoming[0])
    findings.push(
      `Prepare for the ${relativeLabel(p.upcoming[0].date, todayISO).toLowerCase()} visit — ${p.upcoming[0].reason}`
    );
  if (findings.length === 0) findings.push("No significant findings recorded yet.");
  sections.push({ heading: "Important Findings", lines: findings });

  return { sections, sources };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Root component — My Patients list + patient profile routing
   ═══════════════════════════════════════════════════════════════════════════ */

export function DoctorPatients({
  onSelectPatient,
  initialPatientName,
  pickMode = false,
  onExitPickMode,
}) {
  const [apiPatients, setApiPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialPatientName ?? "");
  const [selectedName, setSelectedName] = useState(
    initialPatientName ?? null
  );

  /* Visit records live in the shared store so My Patients and the Visit
     Records section always show the same drafts and completed visits. */
  const storeVisits = useVisitRecords();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api("/api/doctor/patients");
        if (alive) setApiPatients(res.patients);
      } catch {
        if (alive) setApiPatients([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const todayISO = useMemo(() => toISODate(new Date()), []);
  const roster = useMemo(
    () => buildRoster(apiPatients, todayISO),
    [apiPatients, todayISO]
  );

  /* Link store records to the patient profiles: completed records created
     through the store (Visit Records form / profile dialog) join the
     profile's visit list. Schedule-seeded completed records are already in
     the roster via the appointment data, so they skip the injection. */
  const rosterWithStore = useMemo(
    () =>
      roster.map((p) => {
        const linkedCompleted = storeVisits.filter(
          (v) =>
            v.patientKey === p.key && v.inPatientProfile && v.status === "completed"
        );
        if (linkedCompleted.length === 0) return p;
        return {
          ...p,
          visits: [...linkedCompleted.map(storeVisitToEntry), ...p.visits],
        };
      }),
    [roster, storeVisits]
  );

  const selected = selectedName
    ? rosterWithStore.find((p) => p.name === selectedName) ?? null
    : null;

  if (selected) {
    const drafts = storeVisits
      .filter((v) => v.patientKey === selected.key && v.status === "draft")
      .map(storeVisitToEntry);
    return (
      <PatientProfile
        key={selected.key}
        patient={selected}
        drafts={drafts}
        onAddDraft={(v) =>
          createVisitDraft({
            patientKey: selected.key,
            patientName: selected.name,
            patientId: selected.patientId,
            dateISO: v.dateISO ?? todayISO,
            time: "10:00",
            reason: v.reason,
            diagnosis: v.diagnosis,
            notes: v.notes,
            treatment: v.treatment,
            prescriptions: v.prescriptions,
            docRefs: [],
          })
        }
        onBack={() => {
          setSelectedName(null);
          // Returning from a deep-linked profile should reveal the full list
          // again, not the single prefilled search match.
          if (initialPatientName) setSearch("");
        }}
        onAskAssistant={
          selected.realId && onSelectPatient
            ? () => onSelectPatient(selected.realId)
            : undefined
        }
        doctorName={getCurrentDoctorName()}
      />
    );
  }

  return (
    <MyPatientsList
      roster={rosterWithStore}
      loading={loading}
      search={search}
      setSearch={setSearch}
      pickMode={pickMode}
      onExitPickMode={onExitPickMode}
      onOpenPatient={(name) => setSelectedName(name)}
      onPickForAssistant={(p) => {
        if (p.realId && onSelectPatient) onSelectPatient(p.realId);
      }}
    />
  );
}

/* The doctor's own name is only used for "Added by …" labels in the sample
   data. Read from the demo session so it matches whoever is signed in. */
function getCurrentDoctorName() {
  if (typeof window === "undefined") return "Dr. Hana Kamal";
  try {
    const raw = sessionStorage.getItem("rivara.user");
    if (raw) {
      const u = JSON.parse(raw);
      if (u.name) return u.name;
    }
  } catch {
    /* ignore */
  }
  return "Dr. Hana Kamal";
}

/* Map a shared-store record onto the VisitEntry shape used across the
   patient profile (visits list, dialogs, AI summary). */
function storeVisitToEntry(v) {
  return {
    id: v.id,
    dateISO: v.dateISO,
    dateLabel: prettyDate(v.dateISO),
    reason: v.reason || "Consultation",
    diagnosis: v.diagnosis || "Diagnosis pending — record not completed yet.",
    notes: v.notes || "No clinical notes recorded yet.",
    treatment: v.treatment,
    prescriptions: v.prescriptions,
    followUp:
      v.followUp ?? (v.followUpISO ? prettyDate(v.followUpISO) : undefined),
    draft: v.status === "draft",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   My Patients main page
   ═══════════════════════════════════════════════════════════════════════════ */

const PAGE_SIZE = 6;

function MyPatientsList({
  roster,
  loading,
  search,
  setSearch,
  pickMode,
  onExitPickMode,
  onOpenPatient,
  onPickForAssistant,
}) {
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("any");
  const [sortBy, setSortBy] = useState("activity");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const stats = useMemo(() => {
    const total = roster.length;
    const newPatients = roster.filter((p) => p.isNew).length;
    const upcoming = roster.reduce((n, p) => n + p.upcoming.length, 0);
    const recentlyVisited = roster.filter((p) => {
      if (!p.lastVisitISO) return false;
      const diff = Math.round(
        (fromISODate(todayISO).getTime() - fromISODate(p.lastVisitISO).getTime()) / 864e5
      );
      return diff >= 0 && diff <= 14;
    }).length;
    return { total, newPatients, upcoming, recentlyVisited };
  }, [roster, todayISO]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = roster.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q)
    );
    if (statusFilter === "upcoming") list = list.filter((p) => p.upcoming.length > 0);
    if (statusFilter === "none") list = list.filter((p) => p.upcoming.length === 0);
    if (statusFilter === "new") list = list.filter((p) => p.isNew);
    if (statusFilter === "visited")
      list = list.filter((p) => {
        if (!p.lastVisitISO) return false;
        const diff = Math.round(
          (fromISODate(todayISO).getTime() - fromISODate(p.lastVisitISO).getTime()) / 864e5
        );
        return diff >= 0 && diff <= 14;
      });
    if (activityFilter === "7") list = list.filter((p) => p.lastActivityDaysAgo <= 7);
    if (activityFilter === "30") list = list.filter((p) => p.lastActivityDaysAgo <= 30);

    const sorted = [...list];
    if (sortBy === "activity") sorted.sort((a, b) => a.lastActivityDaysAgo - b.lastActivityDaysAgo);
    if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "next")
      sorted.sort((a, b) => {
        const ka = a.upcoming[0] ? `${a.upcoming[0].date} ${a.upcoming[0].time}` : "9999";
        const kb = b.upcoming[0] ? `${b.upcoming[0].date} ${b.upcoming[0].time}` : "9999";
        return ka.localeCompare(kb);
      });
    return sorted;
  }, [roster, q, statusFilter, activityFilter, sortBy, todayISO]);

  const visible = filtered.slice(0, visibleCount);
  const filtersActive = q !== "" || statusFilter !== "all" || activityFilter !== "any";

  const statCards = [
    {
      key: "all",
      label: "Total Patients",
      value: stats.total,
      icon: Users,
      tile: "dp-tile-teal",
      hint: "In your practice",
    },
    {
      key: "new",
      label: "New Patients",
      value: stats.newPatients,
      icon: UserPlus,
      tile: "dp-tile-sand",
      hint: "Joined in the last 30 days",
    },
    {
      key: "upcoming",
      label: "Upcoming Appointments",
      value: stats.upcoming,
      icon: CalendarClock,
      tile: "dp-tile-sage",
      hint: "Confirmed, in-clinic",
    },
    {
      key: "visited",
      label: "Recently Visited",
      value: stats.recentlyVisited,
      icon: History,
      tile: "dp-tile-accent",
      hint: "Seen in the last 14 days",
    },
  ];

  return (
    <div className="dp-page">
      {/* ── Page header ── */}
      <header>
        <p className="dp-eyebrow">
          Practice panel
        </p>
        <h1 className="dp-title">
          My Patients
        </h1>
        <p className="dp-subtitle">
          View and manage your patients and their medical information.
        </p>
      </header>

      {/* ── Pick-mode banner (Assistant / Pre-visit summary selection) ── */}
      {pickMode && (
        <div className="dp-pick-banner">
          <span className="dp-pick-icon">
            <Sparkles className="dp-icon-20" />
          </span>
          <div className="dp-flex-min">
            <p className="dp-pick-title">Select a patient to continue</p>
            <p className="dp-pick-desc">
              The AI tools work on patients with a platform record. Rows marked
              “no platform record” are demo-only.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onExitPickMode}
            className="dp-pick-cancel"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* ── Overview statistics ── */}
      <div className="dp-stats-grid">
        {statCards.map((c) => {
          const active =
            (c.key === "all" && statusFilter === "all" && !pickMode) ||
            (c.key !== "all" && statusFilter === c.key);
          return (
            <button
              key={c.key}
              onClick={() => {
                if (pickMode) return;
                setStatusFilter(c.key);
                setVisibleCount(PAGE_SIZE);
              }}
              aria-pressed={active}
              className={cn(
                "dp-stat-card",
                active
                  ? "dp-stat-on"
                  : "dp-stat-off"
              )}
            >
              <div className="dp-stat-top">
                <span
                  className={cn(
                    "dp-stat-tile",
                    c.tile
                  )}
                >
                  <c.icon className="dp-icon-18" />
                </span>
                <span className="dp-stat-value">
                  {c.value}
                </span>
              </div>
              <p className="dp-stat-label">{c.label}</p>
              <p className="dp-stat-hint">{c.hint}</p>
            </button>
          );
        })}
      </div>

      {/* ── Search + filters ── */}
      <div
        className="dp-filterbar"
        aria-label="Search and filters"
      >
        <div className="dp-search-wrap">
          <Search className="dp-search-icon" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search by patient name or patient ID…"
            aria-label="Search patients by name or patient ID"
            className="dp-search-input"
          />
        </div>
        <div className="dp-filters-row">
          <FilterSelect
            label="Patient status"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setVisibleCount(PAGE_SIZE);
            }}
            options={[
              { value: "all", label: "All patients" },
              { value: "upcoming", label: "Has upcoming appointment" },
              { value: "visited", label: "Recently visited (14 days)" },
              { value: "new", label: "New patients (30 days)" },
              { value: "none", label: "No upcoming appointments" },
            ]}
          />
          <FilterSelect
            label="Recent activity"
            value={activityFilter}
            onChange={(v) => {
              setActivityFilter(v);
              setVisibleCount(PAGE_SIZE);
            }}
            options={[
              { value: "any", label: "Active anytime" },
              { value: "7", label: "Active this week" },
              { value: "30", label: "Active this month" },
            ]}
          />
          <FilterSelect
            label="Sort by"
            value={sortBy}
            onChange={(v) => setSortBy(v)}
            options={[
              { value: "activity", label: "Sort: Last activity" },
              { value: "name", label: "Sort: Name (A–Z)" },
              { value: "next", label: "Sort: Next appointment" },
            ]}
          />
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setActivityFilter("any");
                setVisibleCount(PAGE_SIZE);
              }}
              className="dp-clear-btn"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Result count ── */}
      <p className="dp-result-count" role="status">
        {loading
          ? "Loading your patients…"
          : `Showing ${visible.length} of ${filtered.length} patient${
              filtered.length === 1 ? "" : "s"
            }`}
      </p>

      {/* ── Patient list ── */}
      <div className="dp-list">
        {/* header row (desktop) */}
        {!loading && filtered.length > 0 && (
          <div className="dp-list-head">
            <span>Patient</span>
            <span>Last visit</span>
            <span>Next appointment</span>
            <span>Docs</span>
            <span>Last activity</span>
            <span className="dp-list-head-right">Profile</span>
          </div>
        )}

        {loading ? (
          <div className="dp-loading">
            <Loader2 className="dp-icon-24 dp-spin dp-c-primary" />
            <p className="dp-loading-text">Loading your patients…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dp-empty">
            <span className="dp-empty-icon">
              <Search className="dp-icon-20" />
            </span>
            <p className="dp-empty-title">
              {q || filtersActive ? "No patients match your filters" : "No patients yet"}
            </p>
            <p className="dp-empty-text">
              {q || filtersActive
                ? "Try a different name, patient ID or filter combination."
                : "Patients who book with you or are assigned to your practice will appear here."}
            </p>
            {filtersActive && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setActivityFilter("any");
                  setVisibleCount(PAGE_SIZE);
                }}
                className="dp-pill-btn dp-mt-16"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <ul className="dp-list-body">
            {visible.map((p) => (
              <PatientRow
                key={p.key}
                patient={p}
                todayISO={todayISO}
                pickMode={pickMode}
                onOpen={() => onOpenPatient(p.name)}
                onPick={() => onPickForAssistant(p)}
              />
            ))}
          </ul>
        )}

        {/* Load more */}
        {!loading && filtered.length > visibleCount && (
          <div className="dp-load-more">
            <button
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="dp-pill-btn"
            >
              Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more patients
              <ChevronRight className="dp-icon-14" />
            </button>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && filtered.length <= visibleCount && (
        <p className="dp-all-shown">
          <CheckCircle2 className="dp-icon-12 dp-c-sage" />
          Showing all {filtered.length} patients in your practice
        </p>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="dp-filter-select">
      <span className="dp-filter-label">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="dp-filter-control"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* One row of the patient list — table-like on desktop, card on mobile. */
function PatientRow({
  patient,
  todayISO,
  pickMode,
  onOpen,
  onPick,
}) {
  const selectable = !pickMode || !!patient.realId;
  const handleClick = () => (pickMode ? onPick() : onOpen());
  const next = patient.upcoming[0];

  const body = (
    <>
      {/* Patient identity */}
      <div className="dp-row-id">
        <PatientAvatar name={patient.name} size={40} />
        <div className="dp-minw0">
          <p className="dp-row-name">
            <span className="dp-row-name-text">{patient.name}</span>
            {patient.isNew && (
              <span className="dp-new-chip-sm">
                New
              </span>
            )}
          </p>
          <p className="dp-row-sub">
            {patient.patientId} · {patient.age} y · {patient.gender}
          </p>
        </div>
      </div>

      {/* Meta cells — grid on mobile, becomes table cells on lg */}
      <div className="dp-row-cells">
        <ListCell label="Last visit">
          {patient.lastVisitISO ? (
            <>
              <p className="dp-cell-value">
                {prettyShort(patient.lastVisitISO)}
              </p>
              <p className="dp-cell-sub">
                {relativeLabel(patient.lastVisitISO, todayISO)}
              </p>
            </>
          ) : (
            <p className="dp-cell-none">—</p>
          )}
        </ListCell>
        <ListCell label="Next appointment">
          {next ? (
            <>
              <p className="dp-cell-value">
                {relativeLabel(next.date, todayISO)} · {next.time}
              </p>
              <p className="dp-cell-sub">
                {prettyShort(next.date)}
              </p>
            </>
          ) : (
            <p className="dp-cell-none">None</p>
          )}
        </ListCell>
        <ListCell label="Docs">
          <p className="dp-cell-value2">
            {patient.documents.length}{" "}
            <span className="dp-cell-sub">
              document{patient.documents.length === 1 ? "" : "s"}
            </span>
          </p>
        </ListCell>
        <ListCell label="Last activity">
          <p className="dp-cell-value">{patient.lastActivityLabel}</p>
          <p className="dp-cell-sub">
            {daysAgoLabel(patient.lastActivityDaysAgo)}
          </p>
        </ListCell>
      </div>

      {/* Action */}
      <div className="dp-row-action">
        {!pickMode ? (
          <span className="dp-row-view">
            View Profile
            <ChevronRight className="dp-icon-14" />
          </span>
        ) : patient.realId ? (
          <span className="dp-row-select">
            Select
            <ChevronRight className="dp-icon-14" />
          </span>
        ) : (
          <span className="dp-row-norecord">
            No platform record
          </span>
        )}
      </div>
    </>
  );

  if (!selectable) {
    return (
      <li className="dp-row-disabled dp-row-grid">
        {body}
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={handleClick}
        className="dp-group dp-row-btn dp-row-grid"
      >
        {body}
      </button>
    </li>
  );
}

function ListCell({
  label,
  children,
}) {
  return (
    <div className="dp-minw0">
      <p className="dp-cell-label">
        {label}
      </p>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Patient profile — header + 5 tabs
   ═══════════════════════════════════════════════════════════════════════════ */

const TAB_META = [
  { key: "overview", label: "Overview", icon: HeartPulse },
  { key: "visits", label: "Visits", icon: CalendarDays },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "history", label: "Medical History", icon: ClipboardList },
  { key: "ai", label: "AI Summary", icon: Sparkles },
];

function PatientProfile({
  patient,
  drafts,
  onAddDraft,
  onBack,
  onAskAssistant,
  doctorName,
}) {
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [tab, setTab] = useState("overview");
  const [visitOpen, setVisitOpen] = useState(null);
  const [apptOpen, setApptOpen] = useState(null);
  const [docOpen, setDocOpen] = useState(null);
  const [newRecordOpen, setNewRecordOpen] = useState(false);

  const allVisits = useMemo(
    () => [...drafts, ...patient.visits],
    [drafts, patient.visits]
  );
  const latestDraft = drafts[0] ?? null;
  const next = patient.upcoming[0] ?? null;
  const aiSummary = useMemo(() => buildAiSummary(patient, todayISO), [patient, todayISO]);

  const openVisitRecord = () => {
    if (latestDraft) {
      setVisitOpen(latestDraft);
    } else {
      setNewRecordOpen(true);
    }
  };

  return (
    <div className="dp-page">
      <button
        onClick={onBack}
        className="dp-back-btn"
      >
        <ArrowLeft className="dp-icon-14" />
        Back to My Patients
      </button>

      {/* ── Profile header ── */}
      <section
        className="dp-profile-card"
        aria-label="Patient information"
      >
        <div className="dp-profile-main">
          <div className="dp-profile-id">
            <span
              className="dp-profile-avatar"
              aria-hidden
            >
              {patient.name.split(" ").map((w) => w[0]).join("")}
            </span>
            <div className="dp-minw0">
              <h1 className="dp-profile-name">
                {patient.name}
              </h1>
              <div className="dp-profile-badges">
                <span className="dp-badge-id">
                  <User className="dp-icon-12" />
                  {patient.patientId}
                </span>
                <span className="dp-badge-teal">
                  {patient.age} years · {patient.gender}
                </span>
                <span className="dp-badge-sand">
                  Blood {patient.bloodType}
                </span>
                {patient.isNew && (
                  <span className="dp-badge-new">
                    <UserPlus className="dp-icon-12" />
                    New patient
                  </span>
                )}
                {patient.assigned && (
                  <span className="dp-badge-teal">
                    <ShieldCheck className="dp-icon-12" />
                    On your platform panel
                  </span>
                )}
              </div>
              <div className="dp-profile-contact">
                <span className="dp-contact-item">
                  <Phone className="dp-icon-14 dp-c-primary" />
                  {patient.phone}
                </span>
                <span className="dp-contact-item">
                  <Mail className="dp-icon-14 dp-c-primary dp-shrink0" />
                  <span className="dp-truncate">{patient.email}</span>
                </span>
              </div>
              <p className="dp-profile-meta">
                <span>Joined {patient.joinedLabel}</span>
                <span>
                  Last activity: {patient.lastActivityLabel.toLowerCase()} ·{" "}
                  {daysAgoLabel(patient.lastActivityDaysAgo)}
                </span>
              </p>
            </div>
          </div>

          {/* Next appointment mini-card */}
          <div className="dp-next-wrap">
            {next ? (
              <div className="dp-next-card">
                <p className="dp-next-label">
                  <CalendarClock className="dp-icon-14" />
                  Next appointment
                </p>
                <p className="dp-next-when">
                  {relativeLabel(next.date, todayISO)} · {next.time}
                </p>
                <p className="dp-text-xs-muted">{prettyDate(next.date)}</p>
                <p className="dp-next-reason">
                  {next.reason}
                </p>
                <span className="dp-next-chip">
                  <Building2 className="dp-icon-12" />
                  In-clinic
                </span>
              </div>
            ) : (
              <div className="dp-next-empty">
                <CalendarClock className="dp-icon-20 dp-mx-auto dp-c-muted" />
                <p className="dp-next-empty-title">
                  No upcoming appointment
                </p>
                <p className="dp-next-empty-text">
                  Bookable slots appear in My Schedule.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <div className="dp-actions" aria-label="Patient actions">
        <Button onClick={openVisitRecord} className="dp-btn-xl">
          {latestDraft ? (
            <>
              <FileText className="dp-icon-16 dp-mr-8" />
              Open Visit Record
            </>
          ) : (
            <>
              <CalendarPlus className="dp-icon-16 dp-mr-8" />
              Start Visit Record
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => setTab("visits")} className="dp-btn-xl">
          <CalendarDays className="dp-icon-16 dp-mr-8" />
          Upcoming Appointments
        </Button>
        <Button variant="outline" onClick={() => setTab("visits")} className="dp-btn-xl">
          <History className="dp-icon-16 dp-mr-8" />
          Previous Visits
        </Button>
        <Button variant="outline" onClick={() => setTab("documents")} className="dp-btn-xl">
          <FileText className="dp-icon-16 dp-mr-8" />
          Medical Documents
          <span className="dp-btn-count">
            {patient.documents.length}
          </span>
        </Button>
        <Button variant="outline" onClick={() => setTab("ai")} className="dp-btn-xl">
          <Sparkles className="dp-icon-16 dp-mr-8" />
          AI Summary
        </Button>
        {onAskAssistant && (
          <Button variant="outline" onClick={onAskAssistant} className="dp-btn-xl">
            <Sparkles className="dp-icon-16 dp-mr-8" />
            Ask the Assistant
          </Button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="dp-tabs" role="group" aria-label="Patient profile sections">
        {TAB_META.map((t) => {
          const active = tab === t.key;
          const count =
            t.key === "visits"
              ? patient.upcoming.length + allVisits.length
              : t.key === "documents"
                ? patient.documents.length
                : null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-pressed={active}
              className={cn(
                "dp-tab",
                active
                  ? "dp-tab-on"
                  : "dp-tab-off"
              )}
            >
              <t.icon className="dp-icon-14" />
              {t.label}
              {count !== null && (
                <span
                  className={cn(
                    "dp-tab-count",
                    active ? "dp-tab-count-on" : "dp-tab-count-off"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab panels ── */}
      <div className="dp-panels">
        {tab === "overview" && (
          <OverviewTab
            patient={patient}
            drafts={drafts}
            todayISO={todayISO}
            onOpenVisit={setVisitOpen}
            onOpenAppointment={setApptOpen}
            onOpenDocument={setDocOpen}
            goToTab={setTab}
          />
        )}
        {tab === "visits" && (
          <VisitsTab
            patient={patient}
            drafts={drafts}
            onOpenVisit={setVisitOpen}
            onOpenAppointment={setApptOpen}
          />
        )}
        {tab === "documents" && (
          <DocumentsTab
            patient={patient}
            doctorName={doctorName}
            onOpenDocument={setDocOpen}
          />
        )}
        {tab === "history" && (
          <HistoryTab patient={patient} todayISO={todayISO} />
        )}
        {tab === "ai" && (
          <AiSummaryTab
            patient={patient}
            summary={aiSummary}
            onOpenDocument={setDocOpen}
            onOpenVisit={setVisitOpen}
          />
        )}
      </div>

      {/* ── Dialogs ── */}
      <VisitDetailDialog
        visit={visitOpen}
        patient={patient}
        onClose={() => setVisitOpen(null)}
      />
      <AppointmentDialog
        appointment={apptOpen}
        todayISO={todayISO}
        onClose={() => setApptOpen(null)}
      />
      <DocumentPreviewDialog
        doc={docOpen}
        patient={patient}
        doctorName={doctorName}
        onClose={() => setDocOpen(null)}
      />
      <NewVisitRecordDialog
        open={newRecordOpen}
        patient={patient}
        todayISO={todayISO}
        onClose={() => setNewRecordOpen(false)}
        onSave={(v) => {
          onAddDraft(v);
          setNewRecordOpen(false);
          setTab("visits");
          toast({
            title: "Visit record started",
            description: `Saved as a draft in ${patient.name.split(" ")[0]}'s visits — automatically linked to ${patient.name} (${patient.patientId}).`,
          });
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab A — Overview
   ═══════════════════════════════════════════════════════════════════════════ */

function OverviewTab({
  patient,
  drafts,
  todayISO,
  onOpenVisit,
  onOpenAppointment,
  onOpenDocument,
  goToTab,
}) {
  const visits = [...drafts, ...patient.visits];
  const recentDocs = patient.documents.slice(0, 3);

  return (
    <div className="dp-grid2">
      {/* Alerts */}
      <section className="dp-card dp-span2">
        <h2 className="dp-h2">
          <AlertTriangle className="dp-icon-16 dp-c-clay" />
          Alerts &amp; important information
        </h2>
        {patient.allergies.length > 0 ? (
          <ul className="dp-stack2 dp-mt-12">
            {patient.allergies.map((a) => (
              <li
                key={a}
                className="dp-allergy-item"
              >
                <AlertTriangle className="dp-icon-16 dp-c-clay dp-shrink0 dp-mt-2" />
                <span>
                  <span className="dp-font-semibold">Allergy:</span> {a}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dp-ok-pill dp-mt-12">
            <CheckCircle2 className="dp-icon-16" />
            No known allergies recorded by the patient
          </p>
        )}
        {patient.conditions.length > 0 && (
          <div className="dp-cond-row dp-mt-12">
            {patient.conditions.map((c) => (
              <span
                key={c}
                className="dp-cond-chip"
              >
                <HeartPulse className="dp-icon-12" />
                {c}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Basic information */}
      <section className="dp-card">
        <h2 className="dp-h2">
          <User className="dp-icon-16 dp-c-primary" />
          Basic information
        </h2>
        <dl className="dp-info-grid dp-mt-12">
          <InfoItem label="Patient ID" value={patient.patientId} />
          <InfoItem label="Age" value={`${patient.age} years`} />
          <InfoItem label="Gender" value={patient.gender} />
          <InfoItem label="Blood type" value={patient.bloodType} />
          <InfoItem
            label="Height"
            value={patient.heightCm ? `${patient.heightCm} cm` : "—"}
          />
          <InfoItem
            label="Weight"
            value={patient.weightKg ? `${patient.weightKg} kg` : "—"}
          />
          <InfoItem label="Phone" value={patient.phone} />
          <InfoItem label="Joined" value={patient.joinedLabel} />
        </dl>
        <p className="dp-info-email">
          <Mail className="dp-icon-14 dp-c-primary dp-mr-6 dp-inline" />
          {patient.email}
        </p>
      </section>

      {/* Medical history highlights */}
      <section className="dp-card">
        <h2 className="dp-h2">
          <ClipboardList className="dp-icon-16 dp-c-primary" />
          Medical history highlights
        </h2>
        {patient.conditions.length === 0 && patient.medications.length === 0 ? (
          <div className="dp-mini-empty dp-mt-12">
            <p className="dp-text-sm-med-fg">Nothing recorded yet</p>
            <p className="dp-text-xs-muted dp-mt-4">
              {patient.name.split(" ")[0]} hasn&apos;t completed their medical history.
            </p>
          </div>
        ) : (
          <>
            <ul className="dp-stack2 dp-mt-12">
              {patient.conditions.slice(0, 3).map((c) => (
                <li key={c} className="dp-bullet-item dp-c-fg">
                  <span className="dp-dot dp-mt-6" />
                  {c}
                </li>
              ))}
              {patient.medications.slice(0, 3).map((m) => (
                <li key={m} className="dp-bullet-item dp-c-muted">
                  <Pill className="dp-icon-14 dp-c-primary dp-shrink0 dp-mt-2" />
                  {m}
                </li>
              ))}
            </ul>
            <button
              onClick={() => goToTab("history")}
              className="dp-history-link dp-mt-12"
            >
              Open full medical history
              <ChevronRight className="dp-icon-14" />
            </button>
          </>
        )}
      </section>

      {/* Upcoming appointments */}
      <section className="dp-card">
        <h2 className="dp-h2">
          <CalendarDays className="dp-icon-16 dp-c-primary" />
          Upcoming appointments
          <span className="dp-chip-accent dp-ml-auto">
            {patient.upcoming.length}
          </span>
        </h2>
        {patient.upcoming.length === 0 ? (
          <EmptyHint
            icon={CalendarDays}
            title="No upcoming appointments"
            text="Open slots are managed in My Schedule."
          />
        ) : (
          <ul className="dp-stack2 dp-mt-12">
            {patient.upcoming.slice(0, 3).map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => onOpenAppointment(a)}
                  className="dp-appt-item"
                >
                  <span className="dp-date-tile">
                    <span className="dp-date-day">
                      {fromISODate(a.date).getDate()}
                    </span>
                    <span className="dp-date-dow">
                      {WEEKDAYS[fromISODate(a.date).getDay()]}
                    </span>
                  </span>
                  <span className="dp-flex-min">
                    <span className="dp-appt-title">
                      {a.time} · {a.reason}
                    </span>
                    <span className="dp-appt-sub">
                      {relativeLabel(a.date, todayISO)} · {a.durationMins} min · Nile Badrawi Hospital
                    </span>
                  </span>
                  <ChevronRight className="dp-icon-16 dp-shrink0 dp-c-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent visits */}
      <section className="dp-card">
        <h2 className="dp-h2">
          <History className="dp-icon-16 dp-c-primary" />
          Recent visits
          <span className="dp-chip-accent dp-ml-auto">
            {visits.length}
          </span>
        </h2>
        {visits.length === 0 ? (
          <EmptyHint
            icon={History}
            title="No previous visits"
            text="Completed consultations will appear here."
          />
        ) : (
          <ul className="dp-stack2 dp-mt-12">
            {visits.slice(0, 2).map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => onOpenVisit(v)}
                  className="dp-visit-item"
                >
                  <span className="dp-row-between">
                    <span className="dp-appt-title">{v.dateLabel}</span>
                    {v.draft && <DraftChip />}
                  </span>
                  <span className="dp-visit-diag">
                    {v.diagnosis}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent documents */}
      <section className="dp-card">
        <h2 className="dp-h2">
          <FileText className="dp-icon-16 dp-c-primary" />
          Recently uploaded documents
          <span className="dp-chip-accent dp-ml-auto">
            {patient.documents.length}
          </span>
        </h2>
        {recentDocs.length === 0 ? (
          <EmptyHint
            icon={FileText}
            title="No documents yet"
            text="Lab reports and visit documents will appear here."
          />
        ) : (
          <ul className="dp-stack2 dp-mt-12">
            {recentDocs.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => onOpenDocument(d)}
                  className="dp-appt-item"
                >
                  <span
                    className={cn(
                      "dp-doc-tile",
                      categoryMeta(d.category).tile
                    )}
                  >
                    {createElement(categoryMeta(d.category).icon, { className: "dp-icon-16" })}
                  </span>
                  <span className="dp-flex-min">
                    <span className="dp-appt-title">
                      {d.name}
                    </span>
                    <span className="dp-appt-sub">
                      {categoryMeta(d.category).singular} · {d.uploadedOn}
                    </span>
                  </span>
                  <Eye className="dp-icon-16 dp-shrink0 dp-c-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="dp-minw0">
      <dt className="dp-info-label">
        {label}
      </dt>
      <dd className="dp-info-value">{value}</dd>
    </div>
  );
}

function EmptyHint({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div className="dp-empty-hint dp-mt-12">
      <Icon className="dp-icon-20 dp-c-muted" />
      <p className="dp-text-sm-med-fg dp-mt-8">{title}</p>
      <p className="dp-text-xs-muted dp-mt-2">{text}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab B — Visits
   ═══════════════════════════════════════════════════════════════════════════ */

function VisitsTab({
  patient,
  drafts,
  onOpenVisit,
  onOpenAppointment,
}) {
  const visits = [...drafts, ...patient.visits];

  return (
    <div className="dp-stack6">
      {/* Upcoming appointments */}
      <section aria-label="Upcoming appointments">
        <h2 className="dp-h2-lg">
          <CalendarDays className="dp-icon-16 dp-c-primary" />
          Upcoming appointments
          <span className="dp-chip-accent">
            {patient.upcoming.length}
          </span>
        </h2>
        {patient.upcoming.length === 0 ? (
          <div className="dp-empty-lg dp-mt-12">
            <CalendarClock className="dp-icon-24 dp-mx-auto dp-c-muted" />
            <p className="dp-text-sm-med-fg dp-mt-8">
              No upcoming appointments
            </p>
            <p className="dp-text-xs-muted dp-mt-4">
              When this patient books an open slot in My Schedule, it will appear
              here and on your calendar.
            </p>
          </div>
        ) : (
          <ul className="dp-stack2 dp-mt-12">
            {patient.upcoming.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => onOpenAppointment(a)}
                  className="dp-appt-row"
                >
                  <span className="dp-date-tile-lg">
                    <span className="dp-date-day-lg">
                      {fromISODate(a.date).getDate()}
                    </span>
                    <span className="dp-date-dow">
                      {WEEKDAYS[fromISODate(a.date).getDay()]}
                    </span>
                  </span>
                  <span className="dp-flex-min">
                    <span className="dp-appt-row-title">
                      {a.reason}
                    </span>
                    <span className="dp-appt-row-sub">
                      {prettyDate(a.date)} · {a.time} –{" "}
                      {fromMinutes(toMinutes(a.time) + a.durationMins)} · {a.durationMins} min
                    </span>
                  </span>
                  <span className="dp-chips-desktop">
                    <span className="dp-chip10-teal">
                      <CheckCircle2 className="dp-icon-12" />
                      Confirmed
                    </span>
                    <span className="dp-chip10-sand">
                      <Building2 className="dp-icon-12" />
                      In-clinic
                    </span>
                  </span>
                  <ChevronRight className="dp-icon-16 dp-shrink0 dp-c-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Completed visits */}
      <section aria-label="Previous visits">
        <h2 className="dp-h2-lg">
          <History className="dp-icon-16 dp-c-primary" />
          Previous visits
          <span className="dp-chip-accent">
            {visits.length}
          </span>
        </h2>
        {visits.length === 0 ? (
          <div className="dp-empty-lg dp-mt-12">
            <History className="dp-icon-24 dp-mx-auto dp-c-muted" />
            <p className="dp-text-sm-med-fg dp-mt-8">
              No previous visits yet
            </p>
            <p className="dp-text-xs-muted dp-mt-4">
              Completed consultation records will appear here. Use “Start Visit
              Record” above to document the first one.
            </p>
          </div>
        ) : (
          <ul className="dp-stack2 dp-mt-12">
            {visits.map((v) => (
              <li
                key={v.id}
                className="dp-visit-card"
              >
                <div className="dp-visit-head">
                  <div className="dp-visit-who">
                    <Clock className="dp-icon-14 dp-shrink0 dp-c-primary" />
                    <p className="dp-row-name-text">{v.dateLabel}</p>
                    {v.draft && <DraftChip />}
                    {!v.draft && (
                      <span className="dp-chip-done">
                        <CheckCircle2 className="dp-icon-12" />
                        Completed
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenVisit(v)}
                    className="dp-btn-round"
                  >
                    <Eye className="dp-icon-14 dp-mr-6" />
                    View Visit Details
                  </Button>
                </div>
                <p className="dp-visit-diag-lg">
                  {v.diagnosis}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="dp-footnote dp-mt-12">
          <Info className="dp-icon-14 dp-shrink0 dp-c-primary dp-mt-2" />
          Drafts and completed visits stay in sync with the Visit Records
          section — the patient sees only completed notes in their “My Visits”
          dashboard.
        </p>
      </section>
    </div>
  );
}

function DraftChip() {
  return (
    <span className="dp-draft-chip">
      <PencilLine className="dp-icon-12" />
      Draft
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab C — Documents
   ═══════════════════════════════════════════════════════════════════════════ */

const DOC_CATEGORIES = [
  { key: "all", label: "All", plural: "All documents" },
  { key: "lab-report", label: "Lab Reports", plural: "Lab reports" },
  { key: "medical-report", label: "Medical Reports", plural: "Medical reports" },
  { key: "prescription", label: "Prescriptions", plural: "Prescriptions" },
  { key: "visit-document", label: "Visit Documents", plural: "Visit documents" },
  { key: "uploaded", label: "Uploaded Documents", plural: "Uploaded documents" },
];

function categoryMeta(c) {
  switch (c) {
    case "lab-report":
      return { singular: "Lab Report", icon: FlaskConical, tile: "dp-tile-teal" };
    case "medical-report":
      return { singular: "Medical Report", icon: Stethoscope, tile: "dp-tile-teal" };
    case "prescription":
      return { singular: "Prescription", icon: Pill, tile: "dp-tile-sand" };
    case "visit-document":
      return { singular: "Visit Document", icon: ClipboardList, tile: "dp-tile-sand" };
    default:
      return { singular: "Uploaded Document", icon: FileHeart, tile: "dp-tile-accent" };
  }
}

function statusMeta(s) {
  switch (s) {
    case "ready":
      return {
        label: "Ready",
        className: "dp-tile-teal",
        icon: CheckCircle2,
      };
    case "processing":
      return {
        label: "Processing",
        className: "dp-tile-sand",
        spin: true,
        icon: Loader2,
      };
    default:
      return {
        label: "Failed",
        className: "dp-tile-destructive",
        icon: AlertTriangle,
      };
  }
}

function DocumentsTab({
  patient,
  doctorName,
  onOpenDocument,
}) {
  const [category, setCategory] = useState("all");

  const counts = useMemo(() => {
    const map = { all: patient.documents.length };
    for (const d of patient.documents) map[d.category] = (map[d.category] ?? 0) + 1;
    return map;
  }, [patient.documents]);

  const filtered =
    category === "all"
      ? patient.documents
      : patient.documents.filter((d) => d.category === category);

  return (
    <div>
      {/* Category filter chips */}
      <div className="dp-chips-row" role="group" aria-label="Filter documents by category">
        {DOC_CATEGORIES.map((c) => {
          const active = category === c.key;
          const n = counts[c.key] ?? 0;
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              aria-pressed={active}
              disabled={c.key !== "all" && n === 0}
              className={cn(
                "dp-cat-btn",
                active
                  ? "dp-tab-on"
                  : "dp-tab-off",
                c.key !== "all" && n === 0 && "dp-cat-disabled"
              )}
            >
              {c.label}
              <span
                className={cn(
                  "dp-tab-count",
                  active ? "dp-tab-count-on" : "dp-tab-count-off"
                )}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="dp-empty-xl dp-mt-16">
          <FileText className="dp-icon-24 dp-mx-auto dp-c-muted" />
          <p className="dp-text-sm-med-fg dp-mt-8">
            {patient.documents.length === 0
              ? "No medical documents yet"
              : `No ${DOC_CATEGORIES.find((c) => c.key === category)?.plural.toLowerCase()} yet`}
          </p>
          <p className="dp-text-xs-muted dp-mt-4 dp-maxw-md">
            {patient.documents.length === 0
              ? `${patient.name.split(" ")[0]} hasn't uploaded any documents, and no visit documents have been attached yet.`
              : "Documents in this category will appear here once uploaded."}
          </p>
        </div>
      ) : (
        <ul className="dp-stack2 dp-mt-16">
          {filtered.map((d) => {
            const cat = categoryMeta(d.category);
            const st = statusMeta(d.status);
            return (
              <li
                key={d.id}
                className="dp-doc-card"
              >
                <div className="dp-doc-head">
                  <span
                    className={cn(
                      "dp-doc-tile-lg",
                      cat.tile
                    )}
                  >
                    {createElement(cat.icon, { className: "dp-icon-20" })}
                  </span>
                  <div className="dp-flex-min">
                    <p className="dp-row-name-text">{d.name}</p>
                    <p className="dp-doc-meta">
                      <span>
                        {d.format} · {d.size}
                        {d.pageCount ? ` · ${d.pageCount} page${d.pageCount > 1 ? "s" : ""}` : ""}
                      </span>
                      <span>
                        {d.uploaderRole === "patient"
                          ? "Uploaded by patient"
                          : `Added by ${doctorName}`}
                      </span>
                      <span>{d.uploadedOn}</span>
                    </p>
                    {d.relatedVisit && (
                      <p className="dp-doc-related">
                        <ClipboardList className="dp-icon-12 dp-c-primary dp-mr-6 dp-inline" />
                        Related visit: {d.relatedVisit}
                      </p>
                    )}
                    {d.note && (
                      <p className="dp-doc-note">{d.note}</p>
                    )}
                  </div>
                  <div className="dp-doc-side">
                    <div className="dp-doc-side-row">
                      <span
                        className={cn(
                          "dp-status-chip",
                          st.className
                        )}
                      >
                        {createElement(st.icon, {
                          className: cn("dp-icon-12", st.spin && "dp-spin"),
                        })}
                        {st.label}
                      </span>
                      <span className="dp-chip-accent">
                        {cat.singular}
                      </span>
                    </div>
                    <div className="dp-doc-side-row">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenDocument(d)}
                        disabled={d.status === "failed"}
                        className="dp-btn-round"
                      >
                        <Eye className="dp-icon-14 dp-mr-6" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={d.status === "failed"}
                        onClick={() =>
                          toast({
                            title: "Download started",
                            description: `${d.name} — demo file, no data leaves the prototype.`,
                          })
                        }
                        className="dp-btn-round"
                      >
                        <Download className="dp-icon-14 dp-mr-6" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tab D — Medical History
   Real platform patients fetch /api/doctor/patients/[id]/history (with the
   403 access-denied flow). Prototype-only patients show the sample history.
   ═══════════════════════════════════════════════════════════════════════════ */

function HistoryTab({ patient, todayISO }) {
  if (patient.realId) {
    return <RealHistoryView patient={patient} todayISO={todayISO} />;
  }
  return (
    <HistorySectionsView
      patient={patient}
      history={patient.history}
      updatedAt={null}
      isReal={false}
      todayISO={todayISO}
    />
  );
}

/* Wrapper that can remount the fetcher (retry) without setState-in-effect. */
function RealHistoryView({ patient, todayISO }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <RealHistoryFetcher
      key={attempt}
      patient={patient}
      patientId={patient.realId}
      todayISO={todayISO}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  );
}

function RealHistoryFetcher({
  patient,
  patientId,
  todayISO,
  onRetry,
}) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api(`/api/doctor/patients/${patientId}/history`);
        if (alive) {
          setData(res);
          setStatus("ready");
        }
      } catch (e) {
        const err = e;
        if (alive) setStatus(err.status === 403 ? "denied" : "error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [patientId]);

  if (status === "loading") {
    return (
      <div className="dp-history-loading">
        <Loader2 className="dp-icon-24 dp-spin dp-c-primary" />
        <p className="dp-loading-text dp-mt-12">Loading medical history…</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div>
        <AccessDenied />
        <p className="dp-text-11 dp-c-muted dp-mt-12">
          You can still see this patient&apos;s appointments on your schedule, but
          their medical history is restricted to their assigned doctor.
        </p>
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="dp-history-error">
        <AlertCircle className="dp-icon-32 dp-mx-auto dp-c-clay" />
        <p className="dp-text-sm-med-fg dp-mt-12">
          Couldn&apos;t load this patient&apos;s history
        </p>
        <p className="dp-text-xs-muted dp-mt-4">Please try again.</p>
        <Button
          variant="outline"
          onClick={onRetry}
          className="dp-btn-round dp-mt-16"
        >
          <RefreshCw className="dp-icon-14 dp-mr-8" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <HistorySectionsView
      patient={patient}
      history={data.history}
      updatedAt={data.updatedAt}
      isReal
      todayISO={todayISO}
    />
  );
}

function HistorySectionsView({
  patient,
  history,
  updatedAt,
  isReal,
  todayISO,
}) {
  const hasHistory =
    !!history &&
    (history.chronicConditions.length > 0 ||
      history.medications.length > 0 ||
      history.allergies.length > 0 ||
      history.surgeries.length > 0 ||
      history.familyHistory.length > 0 ||
      !!history.notes ||
      !!history.personal.age ||
      !!history.personal.gender ||
      !!history.personal.bloodType);

  return (
    <div>
      {/* Source badges */}
      <div className="dp-badges-row">
        <span className="dp-meta-chip-warm">
          <User className="dp-icon-12" />
          Patient-reported history
        </span>
        {isReal && (
          <span className="dp-meta-chip-teal">
            <Lock className="dp-icon-12" />
            Live platform record
          </span>
        )}
        {updatedAt && (
          <span className="dp-meta-chip-muted">
            <Clock className="dp-icon-12" />
            Last updated by patient {formatRelative(updatedAt)}
          </span>
        )}
        <span className="dp-meta-chip-muted">
          <Eye className="dp-icon-12" />
          Read-only — the patient owns this record
        </span>
      </div>

      {!hasHistory ? (
        <div className="dp-history-empty">
          <FileText className="dp-icon-32 dp-mx-auto dp-c-muted" />
          <p className="dp-text-sm-med-fg dp-mt-12">
            No medical history entered yet
          </p>
          <p className="dp-text-xs-muted dp-mt-4 dp-maxw-md">
            {patient.name.split(" ")[0]} hasn&apos;t filled in their medical
            history during onboarding. Conditions documented by you in visit
            records are shown below.
          </p>
        </div>
      ) : (
        <>
          {history && (history.personal.age || history.personal.gender || history.personal.bloodType) && (
            <HistorySection
              icon={User}
              title="Personal details"
              items={[
                { label: "Age", value: history.personal.age || "—" },
                { label: "Gender", value: cap(history.personal.gender) || "—" },
                {
                  label: "Height",
                  value: history.personal.heightCm ? `${history.personal.heightCm} cm` : "—",
                },
                {
                  label: "Weight",
                  value: history.personal.weightKg ? `${history.personal.weightKg} kg` : "—",
                },
                { label: "Blood type", value: history.personal.bloodType || "—" },
              ]}
            />
          )}
          {history && (
            <>
              <HistoryListSection
                icon={HeartPulse}
                title="Existing medical conditions"
                entries={history.chronicConditions}
              />
              <HistoryListSection
                icon={Pill}
                title="Current medications"
                entries={history.medications}
              />
              <HistoryListSection
                icon={AlertTriangle}
                title="Allergies"
                entries={history.allergies}
              />
              <HistoryListSection
                icon={Activity}
                title="Previous surgeries & hospital stays"
                entries={history.surgeries}
              />
              <HistoryListSection
                icon={Users2}
                title="Family medical history"
                entries={history.familyHistory}
              />
              <HistorySection
                icon={Footprints}
                title="Lifestyle information"
                items={[
                  { label: "Smoking", value: cap(history.lifestyle.smoking) || "—" },
                  {
                    label: "Exercise",
                    value: history.lifestyle.exercisePerWeek
                      ? `${history.lifestyle.exercisePerWeek}×/week`
                      : "—",
                  },
                  { label: "Alcohol", value: cap(history.lifestyle.alcohol) || "—" },
                ]}
              />
              {history.notes && (
                <section className="dp-section">
                  <div className="dp-sec-head">
                    <StickyNote className="dp-icon-16 dp-c-primary" />
                    <h2 className="dp-h2-plain">
                      Other information from the patient
                    </h2>
                  </div>
                  <p className="dp-notes-text">
                    {history.notes}
                  </p>
                </section>
              )}
            </>
          )}
        </>
      )}

      {/* Doctor-documented information — from visit records, clearly separated */}
      {patient.visits.length > 0 && (
        <section className="dp-docby-section">
          <div className="dp-sec-head">
            <Stethoscope className="dp-icon-16 dp-c-primary" />
            <h2 className="dp-h2-plain">
              Documented by you in visit records
            </h2>
            <span className="dp-docby-chip">
              Doctor-documented
            </span>
          </div>
          <ul className="dp-stack2">
            {patient.visits.map((v) => (
              <li
                key={v.id}
                className="dp-docby-item"
              >
                <p className="dp-docby-when">
                  <Clock className="dp-icon-12 dp-c-primary" />
                  {v.dateLabel}
                  {v.draft && <DraftChip />}
                </p>
                <p className="dp-docby-diag">{v.diagnosis}</p>
              </li>
            ))}
          </ul>
          <p className="dp-text-11 dp-lead dp-c-muted dp-mt-12">
            Clinical diagnoses and notes you record stay separate from the
            patient-reported history above — the patient&apos;s original answers
            are never overwritten.
          </p>
        </section>
      )}

      {/* Source note */}
      <div className="dp-source-note">
        <ShieldCheck className="dp-icon-14 dp-c-primary dp-shrink0 dp-mt-2" />
        <p className="dp-text-11 dp-lead dp-c-muted">
          This history is{" "}
          <span className="dp-font-semibold dp-c-fg">patient-reported</span>{" "}
          — entered by the patient, not verified by a doctor. Every view is
          recorded in the audit log. Last checked {prettyShort(todayISO)}.
        </p>
      </div>
    </div>
  );
}

function HistorySection({
  icon: Icon,
  title,
  items,
}) {
  const hasAny = items.some((i) => i.value !== "—");
  if (!hasAny) return null;
  return (
    <section className="dp-section">
      <div className="dp-sec-head">
        <Icon className="dp-icon-16 dp-c-primary" />
        <h2 className="dp-h2-plain">{title}</h2>
        <span className="dp-report-chip">
          Patient-reported
        </span>
      </div>
      <dl className="dp-details-grid">
        {items.map((i) => (
          <div key={i.label} className="dp-minw0">
            <dt className="dp-info-label">
              {i.label}
            </dt>
            <dd className="dp-info-value">{i.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HistoryListSection({
  icon: Icon,
  title,
  entries,
}) {
  const visible = entries.filter((e) => e.name.trim());
  if (visible.length === 0) return null;
  return (
    <section className="dp-section">
      <div className="dp-sec-head">
        <Icon className="dp-icon-16 dp-c-primary" />
        <h2 className="dp-h2-plain">{title}</h2>
        <span className="dp-report-chip">
          Patient-reported
        </span>
        <span className="dp-text-10-muted">
          {visible.length} entr{visible.length === 1 ? "y" : "ies"}
        </span>
      </div>
      <ul className="dp-stack-sm">
        {visible.map((e) => (
          <li
            key={e.id}
            className="dp-entry-item"
          >
            <p className="dp-entry-name">{e.name}</p>
            {e.detail && <p className="dp-text-xs-muted">{e.detail}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AccessDenied() {
  return (
    <div className="dp-denied">
      <div className="dp-denied-head">
        <Lock className="dp-icon-20 dp-c-destructive" />
        <div>
          <p className="dp-denied-title">Access denied</p>
          <p className="dp-denied-sub">
            403 · You are not assigned to this patient
          </p>
        </div>
      </div>
      <div className="dp-denied-body">
        <p className="dp-denied-text">
          You can only view the medical history of patients assigned to you.
          This attempt has been recorded in the audit log.
        </p>
        <p className="dp-note-row dp-mt-12">
          <ShieldCheck className="dp-icon-12" />
          Every access attempt — successful or denied — is logged.
        </p>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   Tab E — AI Summary (demo data, clearly labelled, cited to real sources)
   ═════════════════════════════════════════════════════════════════════════ */

function AiSummaryTab({
  patient,
  summary,
  onOpenDocument,
  onOpenVisit,
}) {
  /* PatientProfile is keyed by patient.key, so this state resets on patient
     change without needing a reset effect. */
  const [status, setStatus] = useState("idle");

  const generate = () => {
    setStatus("loading");
    window.setTimeout(() => setStatus("ready"), 1400);
  };

  if (!summary) {
    return (
      <div className="dp-ai-none">
        <span className="dp-ai-none-icon">
          <Sparkles className="dp-icon-20" />
        </span>
        <h2 className="dp-serif-lg dp-mt-12">
          Not enough information yet
        </h2>
        <p className="dp-text-sm dp-c-muted dp-mx-auto dp-mt-4 dp-maxw-md">
          The AI summary needs at least one document, visit record or completed
          medical history. Once {patient.name.split(" ")[0]} uploads documents or
          you record a visit, a cited summary can be generated here.
        </p>
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className="dp-ai-idle">
        <span className="dp-ai-idle-icon">
          <Sparkles className="dp-icon-24" />
        </span>
        <h2 className="dp-serif-xl dp-mt-16">
          Generate an AI summary
        </h2>
        <p className="dp-text-sm dp-c-muted dp-mt-8 dp-maxw-md dp-pretty">
          The assistant reads {patient.name.split(" ")[0]}&apos;s documents,
          visit records and reported history, then writes a one-page summary —
          every line shows its source so you can verify it.
        </p>
        <Button onClick={generate} className="dp-btn-round dp-mt-20">
          <Sparkles className="dp-icon-16 dp-mr-8" />
          Generate summary
        </Button>
        <p className="dp-note-row dp-mt-16">
          <ShieldCheck className="dp-icon-12 dp-c-primary" />
          <span className="dp-font-semibold dp-c-ink">{DISCLAIMER}</span>
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="dp-history-loading">
        <Loader2 className="dp-icon-24 dp-spin dp-c-primary" />
        <p className="dp-loading-text dp-mt-12">Reading documents and visit records…</p>
        <p className="dp-text-xs dp-mt-4">This usually takes a few seconds.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Meta chips */}
      <div className="dp-badges-row">
        <span className="dp-meta-chip-teal">
          <Sparkles className="dp-icon-12" />
          AI-generated
        </span>
        <span className="dp-meta-chip-warm">
          <AlertTriangle className="dp-icon-12" />
          Draft — for review only, not a diagnosis
        </span>
        <span className="dp-meta-chip-muted">
          <FileSearch className="dp-icon-12" />
          {summary.sources.length} sources
        </span>
        <button
          onClick={generate}
          className="dp-regen-btn"
        >
          <RefreshCw className="dp-icon-12" />
          Regenerate
        </button>
      </div>

      {/* Summary content */}
      <section className="dp-section dp-section-pad">
        <div className="dp-stack5">
          {summary.sections.map((s) => (
            <div key={s.heading}>
              <h3 className="dp-h2-plain">{s.heading}</h3>
              <ul className="dp-stack-sm dp-mt-8">
                {s.lines.map((line, i) => (
                  <li key={i} className="dp-ai-line">
                    <span className="dp-dot-ai" />
                    <span className="dp-minw0">{renderRefs(line)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section className="dp-section">
        <p className="dp-sources-label">
          <FileText className="dp-icon-14" />
          Sources used — open any source to verify
        </p>
        <ul className="dp-stack2 dp-mt-12">
          {summary.sources.map((s, i) => (
            <li
              key={`${s.kind}-${s.id}`}
              className="dp-source-row"
            >
              <span className="dp-source-num">
                {i + 1}
              </span>
              <span
                className={cn(
                  "dp-source-tile",
                  s.kind === "document"
                    ? "dp-tile-teal"
                    : s.kind === "visit"
                      ? "dp-tile-sand"
                      : "dp-tile-accent"
                )}
              >
                {s.kind === "document" ? (
                  <FileText className="dp-icon-16" />
                ) : s.kind === "visit" ? (
                  <Stethoscope className="dp-icon-16" />
                ) : (
                  <ClipboardList className="dp-icon-16" />
                )}
              </span>
              <div className="dp-flex-min">
                <p className="dp-appt-title">{s.label}</p>
                <p className="dp-truncate dp-text-xs-muted">{s.meta}</p>
              </div>
              {(s.kind === "document" || s.kind === "visit") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (s.kind === "document") {
                      const doc = patient.documents.find((d) => d.id === s.docId);
                      if (doc) onOpenDocument(doc);
                    } else {
                      const visit = patient.visits.find((v) => v.id === s.id);
                      if (visit) onOpenVisit(visit);
                    }
                  }}
                  className="dp-btn-round dp-shrink0"
                >
                  <Eye className="dp-icon-14 dp-mr-6" />
                  View
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Disclaimer */}
      <div className="dp-ai-warning">
        <AlertTriangle className="dp-icon-16 dp-c-clay dp-shrink0 dp-mt-2" />
        <p className="dp-ai-warning-text">
          <span className="dp-font-semibold dp-c-ink">{DISCLAIMER}</span> This
          summary is AI-generated from the sources listed above and is{" "}
          <span className="dp-font-semibold">not a confirmed medical diagnosis</span>.
          Verify each point against the original documents and visit records
          before any clinical decision.
        </p>
      </div>
    </div>
  );
}

function renderRefs(text) {
  const parts = text.split(/(\[\d+(?:,\d+)*\])/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+(?:,\d+)*)\]$/);
    if (m) {
      const nums = m[1].split(",").map((n) => parseInt(n, 10));
      return (
        <sup
          key={i}
          className="dp-ref"
        >
          [{nums.join(",")}]
        </sup>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Dialogs — visit detail, appointment detail, document preview, new record
   ═══════════════════════════════════════════════════════════════════════════ */

function VisitDetailDialog({
  visit,
  patient,
  onClose,
}) {
  return (
    <Dialog open={!!visit} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dp-dialog dp-dialog-2xl">
        {visit && (
          <>
            <DialogHeader>
              <DialogTitle className="dp-dlg-title">
                <PatientAvatar name={patient.name} size={44} />
                <span className="dp-minw0">
                  <span className="dp-block-trunc">
                    Visit record — {patient.name}
                  </span>
                  <span className="dp-dlg-sub">
                    {visit.dateLabel} · Nile Badrawi Hospital, Maadi
                  </span>
                </span>
              </DialogTitle>
              <DialogDescription className="dp-sr-only">
                Full consultation details for {patient.name}
              </DialogDescription>
            </DialogHeader>

            <div className="dp-badges-row">
              {visit.draft ? (
                <span className="dp-chip11-sand">
                  <PencilLine className="dp-icon-14" />
                  Draft — private, not shared with the patient
                </span>
              ) : (
                <span className="dp-chip11-done">
                  <CheckCircle2 className="dp-icon-14" />
                  Completed visit
                </span>
              )}
              <span className="dp-chip11-clay">
                <Building2 className="dp-icon-14" />
                In-clinic
              </span>
            </div>

            <div className="dp-reason-box">
              <p className="dp-overline">
                Reason for consultation
              </p>
              <p className="dp-text-sm dp-c-fg dp-mt-4">{visit.reason}</p>
            </div>

            <div>
              <p className="dp-dlg-h3">
                <Stethoscope className="dp-icon-16 dp-c-primary" />
                Diagnosis
              </p>
              <p className="dp-text-sm dp-lead dp-c-muted dp-mt-6">
                {visit.diagnosis}
              </p>
            </div>

            <div>
              <p className="dp-dlg-h3">
                <FileText className="dp-icon-16 dp-c-primary" />
                Clinical notes
              </p>
              <p className="dp-text-sm dp-lead dp-c-muted dp-mt-6">
                {visit.notes}
              </p>
              <p className="dp-notes-foot">
                {visit.draft
                  ? "Private draft — the patient cannot see this record until it is finalised."
                  : "The patient sees only the notes you choose to share in their My Visits dashboard."}
              </p>
            </div>

            <div>
              <p className="dp-dlg-h3">
                <ClipboardList className="dp-icon-16 dp-c-primary" />
                Treatment &amp; recommendations
              </p>
              {visit.treatment.length === 0 ? (
                <p className="dp-text-sm dp-c-muted dp-mt-6">
                  No treatment items recorded.
                </p>
              ) : (
                <ul className="dp-stack-sm dp-mt-8">
                  {visit.treatment.map((t) => (
                    <li key={t} className="dp-bullet-item dp-c-muted">
                      <span className="dp-dot dp-mt-6" />
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="dp-dlg-h3">
                <Pill className="dp-icon-16 dp-c-primary" />
                Prescriptions
              </p>
              {visit.prescriptions.length === 0 ? (
                <p className="dp-text-sm dp-c-muted dp-mt-6">
                  No prescriptions were issued at this visit.
                </p>
              ) : (
                <ul className="dp-stack-sm dp-mt-8">
                  {visit.prescriptions.map((p2) => (
                    <li
                      key={p2}
                      className="dp-rx-item"
                    >
                      {p2}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {visit.followUp && (
              <div className="dp-followup">
                <CalendarClock className="dp-icon-16 dp-c-primary dp-shrink0 dp-mt-2" />
                <p className="dp-text-sm dp-lead dp-c-fg">
                  <span className="dp-font-semibold">Follow-up:</span> {visit.followUp}
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AppointmentDialog({
  appointment,
  todayISO,
  onClose,
}) {
  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dp-dialog dp-dialog-lg">
        {appointment && (
          <>
            <DialogHeader>
              <DialogTitle className="dp-dlg-title">
                <PatientAvatar name={appointment.patientName} size={44} />
                <span className="dp-minw0">
                  <span className="dp-block-trunc">{appointment.patientName}</span>
                  <span className="dp-dlg-sub">
                    {appointment.patientMeta}
                  </span>
                </span>
              </DialogTitle>
              <DialogDescription className="dp-sr-only">
                Appointment details for {appointment.patientName}
              </DialogDescription>
            </DialogHeader>

            <div className="dp-badges-row">
              <span className="dp-chip10-teal">
                <CheckCircle2 className="dp-icon-12" />
                Confirmed
              </span>
              <span className="dp-chip10-sand">
                <Building2 className="dp-icon-12" />
                In-clinic
              </span>
              <span className="dp-chip10-accent">
                {appointment.durationMins} min
              </span>
            </div>

            <dl className="dp-appt-details dp-mt-4">
              <div className="dp-appt-detail-row">
                <CalendarDays className="dp-icon-16 dp-shrink0 dp-c-primary" />
                <dt className="dp-sr-only">Date</dt>
                <dd className="dp-detail-value">
                  {prettyDate(appointment.date)}{" "}
                  <span className="dp-text-xs-norm">
                    ({relativeLabel(appointment.date, todayISO)})
                  </span>
                </dd>
              </div>
              <div className="dp-appt-detail-row">
                <Clock className="dp-icon-16 dp-shrink0 dp-c-primary" />
                <dt className="dp-sr-only">Time</dt>
                <dd className="dp-detail-value">
                  {appointment.time} –{" "}
                  {fromMinutes(toMinutes(appointment.time) + appointment.durationMins)}
                </dd>
              </div>
              <div className="dp-appt-detail-row">
                <Building2 className="dp-icon-16 dp-shrink0 dp-c-primary" />
                <dt className="dp-sr-only">Location</dt>
                <dd className="dp-detail-value">
                  Nile Badrawi Hospital
                  <span className="dp-text-xs-norm">
                    {" "}· Maadi, Cairo
                  </span>
                </dd>
              </div>
              <div className="dp-appt-detail-row">
                <Phone className="dp-icon-16 dp-shrink0 dp-c-primary" />
                <dt className="dp-sr-only">Phone</dt>
                <dd className="dp-detail-value">{appointment.phone}</dd>
              </div>
            </dl>

            <div className="dp-reason-box">
              <p className="dp-overline">
                Reason for consultation
              </p>
              <p className="dp-text-sm dp-lead dp-c-fg dp-mt-6">
                {appointment.reason}
              </p>
            </div>

            <p className="dp-footnote">
              <Info className="dp-icon-12 dp-shrink0 dp-c-primary dp-mt-2" />
              This appointment matches the slot shown in My Schedule. Use “Start
              Visit Record” on the profile to begin documenting the consultation.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DocumentPreviewDialog({
  doc,
  patient,
  doctorName,
  onClose,
}) {
  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dp-dialog dp-dialog-xl">
        {doc && (
          <>
            <DialogHeader>
              <DialogTitle className="dp-dlg-title-start">
                <span
                  className={cn(
                    "dp-doc-tile-lg",
                    categoryMeta(doc.category).tile
                  )}
                >
                  {createElement(categoryMeta(doc.category).icon, { className: "dp-icon-20" })}
                </span>
                <span className="dp-minw0">
                  <span className="dp-block-trunc">{doc.name}</span>
                  <span className="dp-dlg-sub">
                    {patient.name} · {patient.patientId}
                  </span>
                </span>
              </DialogTitle>
              <DialogDescription className="dp-sr-only">
                Preview of {doc.name}
              </DialogDescription>
            </DialogHeader>

            <div className="dp-badges-row">
              <span className="dp-chip-accent">
                {categoryMeta(doc.category).singular}
              </span>
              <span
                className={cn(
                  "dp-status-chip",
                  statusMeta(doc.status).className
                )}
              >
                {createElement(statusMeta(doc.status).icon, {
                  className: cn("dp-icon-12", statusMeta(doc.status).spin && "dp-spin"),
                })}
                {statusMeta(doc.status).label}
              </span>
              <span className="dp-chip10-outline">
                {doc.format} · {doc.size}
                {doc.pageCount ? ` · ${doc.pageCount} page${doc.pageCount > 1 ? "s" : ""}` : ""}
              </span>
            </div>

            <p className="dp-text-xs-muted">
              {doc.uploaderRole === "patient"
                ? "Uploaded by the patient"
                : `Added by ${doctorName}`}{" "}
              · {doc.uploadedOn}
              {doc.relatedVisit ? ` · Related visit: ${doc.relatedVisit}` : ""}
            </p>

            {doc.status !== "failed" && doc.previewRows ? (
              <dl className="dp-preview-rows">
                {doc.previewRows.map((r) => (
                  <div
                    key={r.label}
                    className="dp-preview-row"
                  >
                    <dt className="dp-preview-label">
                      {r.label}
                    </dt>
                    <dd className="dp-preview-value">
                      {r.value}
                      {r.note && (
                        <span className="dp-preview-note">
                          ({r.note})
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : doc.status !== "failed" ? (
              <div className="dp-no-preview">
                <FileSearch className="dp-icon-24 dp-c-muted" />
                <p className="dp-text-sm-med-fg dp-mt-8">
                  {doc.format} preview
                </p>
                <p className="dp-text-xs-muted dp-mt-4 dp-maxw-xs">
                  A rich preview isn&apos;t available for this file type in the
                  prototype — download it to view the original document.
                </p>
              </div>
            ) : (
              <div className="dp-failed-box">
                <AlertTriangle className="dp-icon-16 dp-c-destructive dp-shrink0 dp-mt-2" />
                <p className="dp-text-sm dp-lead dp-c-fg">
                  This file failed to process and can&apos;t be previewed.{" "}
                  {doc.note}
                </p>
              </div>
            )}

            <div className="dp-dlg-actions">
              <Button
                className="dp-btn-xl dp-flex1"
                disabled={doc.status === "failed"}
                onClick={() =>
                  toast({
                    title: "Download started",
                    description: `${doc.name} — demo file, no data leaves the prototype.`,
                  })
                }
              >
                <Download className="dp-icon-16 dp-mr-8" />
                Download
              </Button>
              <Button variant="outline" onClick={onClose} className="dp-btn-xl dp-flex1">
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewVisitRecordDialog({
  open,
  patient,
  todayISO,
  onClose,
  onSave,
}) {
  /* The form is a child of DialogContent, so it mounts fresh every time the
     dialog opens — no reset effect needed. */
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="dp-dialog dp-dialog-xl">
        {open && (
          <NewVisitRecordForm
            patient={patient}
            todayISO={todayISO}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewVisitRecordForm({
  patient,
  todayISO,
  onClose,
  onSave,
}) {
  const [date, setDate] = useState(todayISO);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescriptions, setPrescriptions] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [error, setError] = useState("");

  const save = () => {
    if (!diagnosis.trim()) {
      setError("A diagnosis is required to start a visit record.");
      return;
    }
    const toLines = (s) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
    onSave({
      id: `draft-${patient.key}-${Date.now()}`,
      dateISO: date,
      dateLabel: date ? prettyDate(date) : prettyDate(todayISO),
      reason: patient.upcoming[0]?.reason ?? "Consultation — recorded from patient profile",
      diagnosis: diagnosis.trim(),
      notes: notes.trim() || "No additional clinical notes recorded.",
      treatment: toLines(treatment),
      prescriptions: toLines(prescriptions),
      followUp: followUp.trim() || undefined,
      draft: true,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="dp-dlg-title">
          <PatientAvatar name={patient.name} size={44} />
          <span className="dp-minw0">
            <span className="dp-block-trunc">Start visit record</span>
            <span className="dp-dlg-sub">
              {patient.name} · {patient.patientId} · {patient.age} y {patient.gender}
            </span>
          </span>
        </DialogTitle>
        <DialogDescription className="dp-sr-only">
          Create a new visit record for {patient.name}
        </DialogDescription>
      </DialogHeader>

      <p className="dp-form-note">
        <Info className="dp-icon-14 dp-c-primary dp-shrink0 dp-mt-2" />
        This record will be automatically associated with{" "}
        <span className="dp-font-semibold">
          {patient.name} ({patient.patientId})
        </span>{" "}
        and saved as a private draft — in their Visits tab and in your Visit
        Records section.
      </p>

      <div className="dp-stack14">
        <label className="dp-field">
          <span className="dp-field-label">
            Visit date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="dp-input"
          />
        </label>
        <label className="dp-field">
          <span className="dp-field-label">
            Diagnosis <span className="dp-c-destructive">*</span>
          </span>
          <textarea
            value={diagnosis}
            onChange={(e) => {
              setDiagnosis(e.target.value);
              if (error) setError("");
            }}
            rows={2}
            placeholder="e.g. Blood pressure controlled on current therapy…"
            className="dp-textarea"
          />
          {error && (
            <span className="dp-field-error">
              <AlertCircle className="dp-icon-12" />
              {error}
            </span>
          )}
        </label>
        <label className="dp-field">
          <span className="dp-field-label">
            Clinical notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Examination findings, patient-reported symptoms, advice given…"
            className="dp-textarea"
          />
        </label>
        <label className="dp-field">
          <span className="dp-field-label">
            Treatment &amp; recommendations
            <span className="dp-field-hint">
              (one per line)
            </span>
          </span>
          <textarea
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            rows={3}
            placeholder={"Continue Metformin 850 mg twice daily\nHome BP log twice daily"}
            className="dp-textarea"
          />
        </label>
        <label className="dp-field">
          <span className="dp-field-label">
            Prescriptions
            <span className="dp-field-hint">
              (one per line)
            </span>
          </span>
          <textarea
            value={prescriptions}
            onChange={(e) => setPrescriptions(e.target.value)}
            rows={2}
            placeholder={"Metformin 850 mg — 1 tablet twice daily\nAtorvastatin 20 mg — 1 tablet at night"}
            className="dp-textarea"
          />
        </label>
        <label className="dp-field">
          <span className="dp-field-label">
            Follow-up
          </span>
          <input
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            placeholder="e.g. Follow-up in 4 weeks"
            className="dp-input"
          />
        </label>
      </div>

      <div className="dp-dlg-actions">
        <Button onClick={save} className="dp-btn-xl dp-flex1">
          <Plus className="dp-icon-16 dp-mr-8" />
          Save as draft
        </Button>
        <Button variant="outline" onClick={onClose} className="dp-btn-xl dp-flex1">
          Cancel
        </Button>
      </div>
    </>
  );
}

function PatientAvatar({
  name,
  size,
  className,
}) {
  return (
    <span
      className={cn(
        "dp-avatar",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size / 3) }}
      aria-hidden
    >
      {name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}

function cap(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatRelative(iso) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} d ago`;
  return d.toLocaleDateString();
}

export { DoctorPatients as default };

