/* =====================================
   MedicalHistoryForm — patient's own history editor
   Plain-JS port of the workspace medical-history-form.tsx.
   The patient enters/updates the structured sections (personal
   details, conditions, medications, allergies, surgeries, family,
   lifestyle, notes). Saves go to /api/patient/history (mocked,
   persisted to localStorage). Everything is labelled patient-reported.
===================================== */

import { useState, useEffect } from "react";
import {
  User,
  HeartPulse,
  Pill,
  AlertTriangle,
  Activity,
  Users2,
  Footprints,
  StickyNote,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Save,
  ShieldCheck,
  Clock,
  FileText,
  Lock,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import { EMPTY_HISTORY, BLOOD_TYPES } from "../../services/medical-history";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/Select";
import { toast } from "../../hooks/use-toast";
import "./MedicalHistoryForm.css";

const STATUS = { IDLE: "idle", LOADING: "loading", SAVING: "saving", SAVED: "saved", ERROR: "error" };

const LIST_SECTIONS = [
  { key: "chronicConditions", label: "Chronic conditions", icon: HeartPulse, placeholder: "e.g. Type 2 diabetes", detailLabel: "Since / notes (optional)" },
  { key: "medications", label: "Current medications", icon: Pill, placeholder: "e.g. Metformin 500 mg", detailLabel: "Dose / frequency (optional)" },
  { key: "allergies", label: "Allergies", icon: AlertTriangle, placeholder: "e.g. Penicillin", detailLabel: "Reaction (optional)" },
  { key: "surgeries", label: "Past surgeries & hospital stays", icon: Activity, placeholder: "e.g. Appendectomy", detailLabel: "Year / notes (optional)" },
  { key: "familyHistory", label: "Family medical history", icon: Users2, placeholder: "e.g. Father — coronary disease", detailLabel: "Notes (optional)" },
];

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

export function MedicalHistoryForm({ patientName }) {
  const [data, setData] = useState(EMPTY_HISTORY);
  const [status, setStatus] = useState(STATUS.LOADING);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [errors, setErrors] = useState({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api("/api/patient/history");
        if (!alive) return;
        setData({ ...EMPTY_HISTORY, ...res.history, personal: { ...EMPTY_HISTORY.personal, ...(res.history?.personal || {}) }, lifestyle: { ...EMPTY_HISTORY.lifestyle, ...(res.history?.lifestyle || {}) } });
        setUpdatedAt(res.updatedAt);
      } catch {
        if (!alive) return;
        toast({ title: "Couldn't load your history", description: "Please refresh the page to try again." });
      } finally {
        if (alive) setStatus(STATUS.IDLE);
      }
    })();
    return () => { alive = false; };
  }, []);

  function validate() {
    const errs = {};
    const { personal } = data;
    if (personal.age) {
      const a = Number(personal.age);
      if (Number.isNaN(a) || a < 0 || a > 130) errs.age = "Age must be between 0 and 130.";
    }
    if (personal.heightCm) {
      const h = Number(personal.heightCm);
      if (Number.isNaN(h) || h < 20 || h > 300) errs.heightCm = "Height must be between 20 and 300 cm.";
    }
    if (personal.weightKg) {
      const w = Number(personal.weightKg);
      if (Number.isNaN(w) || w < 1 || w > 500) errs.weightKg = "Weight must be between 1 and 500 kg.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) {
      toast({ title: "Please fix the highlighted fields", description: "Some entries need a valid value before saving." });
      return;
    }
    setStatus(STATUS.SAVING);
    try {
      const res = await api("/api/patient/history", { method: "PUT", body: JSON.stringify(data) });
      setUpdatedAt(res.updatedAt);
      setDirty(false);
      setStatus(STATUS.SAVED);
      toast({ title: "History saved", description: "Your assigned doctor can now see the updated history." });
      setTimeout(() => setStatus(STATUS.IDLE), 2500);
    } catch (e) {
      const err = e;
      setStatus(STATUS.ERROR);
      if (err.fields) setErrors(err.fields);
      toast({ title: "Couldn't save", description: err.message, variant: "destructive" });
    }
  }

  const updatePersonal = (k, v) => { setData((d) => ({ ...d, personal: { ...d.personal, [k]: v } })); setDirty(true); };
  const addEntry = (key) => { setData((d) => ({ ...d, [key]: [...d[key], { id: genId(), name: "", detail: "" }] })); setDirty(true); };
  const updateEntry = (key, id, field, value) => { setData((d) => ({ ...d, [key]: d[key].map((e) => (e.id === id ? { ...e, [field]: value } : e)) })); setDirty(true); };
  const removeEntry = (key, id) => { setData((d) => ({ ...d, [key]: d[key].filter((e) => e.id !== id) })); setDirty(true); };
  const updateLifestyle = (k, v) => { setData((d) => ({ ...d, lifestyle: { ...d.lifestyle, [k]: v } })); setDirty(true); };

  return (
    <div className="mh-page">
      {/* Header */}
      <div className="mh-header">
        <div className="mh-header-title-row">
          <span className="mh-header-icon-tile">
            <FileText className="mh-icon-20" />
          </span>
          <h1 className="mh-title">My medical history</h1>
        </div>
        <p className="mh-subtitle">
          Keep your medical information in one place, {patientName.split(" ")[0]}.
          Your assigned doctor sees this before and during your visits.
        </p>

        <div className="mh-chip-row">
          <span className="mh-chip mh-chip-clay">
            <User className="mh-icon-12" />
            Patient-reported
          </span>
          <span className="mh-chip mh-chip-teal">
            <Lock className="mh-icon-12" />
            Only you & your assigned doctor can see this
          </span>
          {updatedAt && (
            <span className="mh-chip mh-chip-outline">
              <Clock className="mh-icon-12" />
              Last saved {formatRelative(updatedAt)}
            </span>
          )}
        </div>
      </div>

      {status === STATUS.LOADING ? (
        <div className="mh-loading">
          <Loader2 className="mh-icon-20 mh-spin mh-icon-primary" />
          <p>Loading your history…</p>
        </div>
      ) : (
        <>
          {/* Personal details */}
          <SectionCard icon={User} title="Personal details" description="Age, gender, height, weight and blood type.">
            <div className="mh-grid-3">
              <Field label="Age" error={errors.age}>
                <input
                  type="number"
                  inputMode="numeric"
                  value={data.personal.age}
                  onChange={(e) => updatePersonal("age", e.target.value)}
                  placeholder="54"
                  className={cn("mh-input", errors.age && "mh-input-error")}
                />
              </Field>
              <Field label="Gender">
                <Select value={data.personal.gender || undefined} onValueChange={(v) => updatePersonal("gender", v)}>
                  <SelectTrigger className="mh-select"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Blood type">
                <Select value={data.personal.bloodType || undefined} onValueChange={(v) => updatePersonal("bloodType", v)}>
                  <SelectTrigger className="mh-select"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Height (cm)" error={errors.heightCm}>
                <input
                  type="number"
                  inputMode="numeric"
                  value={data.personal.heightCm}
                  onChange={(e) => updatePersonal("heightCm", e.target.value)}
                  placeholder="165"
                  className={cn("mh-input", errors.heightCm && "mh-input-error")}
                />
              </Field>
              <Field label="Weight (kg)" error={errors.weightKg}>
                <input
                  type="number"
                  inputMode="numeric"
                  value={data.personal.weightKg}
                  onChange={(e) => updatePersonal("weightKg", e.target.value)}
                  placeholder="72"
                  className={cn("mh-input", errors.weightKg && "mh-input-error")}
                />
              </Field>
            </div>
          </SectionCard>

          {/* List sections */}
          {LIST_SECTIONS.map((s) => (
            <SectionCard
              key={s.key}
              icon={s.icon}
              title={s.label}
              description={`Add as many as you need. ${s.detailLabel.toLowerCase()}.`}
            >
              <div className="mh-list-stack">
                {data[s.key].length === 0 && (
                  <p className="mh-empty-list">Nothing added yet.</p>
                )}
                {data[s.key].map((entry) => (
                  <div key={entry.id} className="mh-entry-row">
                    <input
                      value={entry.name}
                      onChange={(e) => updateEntry(s.key, entry.id, "name", e.target.value)}
                      placeholder={s.placeholder}
                      className="mh-input mh-input-h36"
                    />
                    <input
                      value={entry.detail || ""}
                      onChange={(e) => updateEntry(s.key, entry.id, "detail", e.target.value)}
                      placeholder={s.detailLabel}
                      className="mh-input mh-input-h36"
                    />
                    <button
                      type="button"
                      onClick={() => removeEntry(s.key, entry.id)}
                      className="mh-remove-btn"
                      aria-label="Remove entry"
                    >
                      <Trash2 className="mh-icon-16" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addEntry(s.key)} className="mh-add-btn">
                  <Plus className="mh-icon-14" />
                  Add {s.label.toLowerCase()}
                </button>
              </div>
            </SectionCard>
          ))}

          {/* Lifestyle */}
          <SectionCard icon={Footprints} title="Lifestyle" description="Smoking, exercise, alcohol — what your day looks like.">
            <div className="mh-grid-2">
              <Field label="Smoking">
                <Select value={data.lifestyle.smoking || undefined} onValueChange={(v) => updateLifestyle("smoking", v)}>
                  <SelectTrigger className="mh-select"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="former">Former</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Exercise (sessions/week)">
                <input
                  type="number"
                  inputMode="numeric"
                  value={data.lifestyle.exercisePerWeek}
                  onChange={(e) => updateLifestyle("exercisePerWeek", e.target.value)}
                  placeholder="3"
                  className="mh-input"
                />
              </Field>
              <Field label="Alcohol">
                <Select value={data.lifestyle.alcohol || undefined} onValueChange={(v) => updateLifestyle("alcohol", v)}>
                  <SelectTrigger className="mh-select"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="occasional">Occasional</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SectionCard>

          {/* Notes */}
          <SectionCard icon={StickyNote} title="Notes" description="Anything else your doctor should know.">
            <textarea
              value={data.notes}
              onChange={(e) => { setData((d) => ({ ...d, notes: e.target.value })); setDirty(true); }}
              rows={4}
              placeholder="e.g. I get chest tightness when walking uphill, usually goes away after resting."
              className="mh-textarea"
            />
          </SectionCard>

          {/* Sticky save bar */}
          <div className="mh-save-bar">
            <div className="mh-save-status">
              {status === STATUS.SAVED ? (
                <>
                  <CheckCircle2 className="mh-icon-16 mh-icon-sage" />
                  <span className="mh-save-status-strong">Saved.</span>
                  <span className="mh-save-status-note">Every change is recorded in the audit log.</span>
                </>
              ) : dirty ? (
                <>
                  <span className="mh-save-dot" />
                  Unsaved changes
                </>
              ) : (
                <>
                  <ShieldCheck className="mh-icon-16 mh-icon-primary" />
                  All changes recorded in the audit log
                </>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={status === STATUS.SAVING || !dirty}
              className="mh-save-btn"
            >
              {status === STATUS.SAVING ? (
                <><Loader2 className="mh-icon-16 mh-spin" />Saving…</>
              ) : (
                <><Save className="mh-icon-16" />Save history</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="mh-section">
      <div className="mh-section-head">
        <span className="mh-section-icon-tile"><Icon className="mh-icon-16" /></span>
        <div>
          <h2 className="mh-section-title">{title}</h2>
          <p className="mh-section-desc">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="mh-field">
      <label className="mh-field-label">{label}</label>
      {children}
      {error && (
        <p className="mh-field-error">
          <AlertTriangle className="mh-icon-12" />
          {error}
        </p>
      )}
    </div>
  );
}

export default MedicalHistoryForm;
