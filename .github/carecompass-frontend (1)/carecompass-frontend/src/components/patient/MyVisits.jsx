/* =====================================
   MyVisits — patient appointments & visit history
   Plain-JS port of the workspace my-visits.tsx.
   Three tabs (Upcoming / Past Visits / Cancelled) plus two
   detail views (appointment detail, past-visit detail).
   Cancelling moves an appointment to the Cancelled tab.
===================================== */

import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileHeart,
  FileText,
  MapPin,
  Pill,
  Stethoscope,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../ui/AlertDialog";
import { toast } from "../../hooks/use-toast";
import "./MyVisits.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function futureDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return {
    weekday: WEEKDAYS[d.getDay()],
    date: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    relative: offsetDays === 0 ? "Today" : offsetDays === 1 ? "Tomorrow" : `In ${offsetDays} days`,
  };
}

function makeUpcomingAppointments() {
  const hana = futureDate(4);
  const salma = futureDate(11);
  const youssef = futureDate(18);
  return [
    {
      id: "appt-hana-followup", doctorId: "hana-kamal", doctorName: "Dr. Hana Kamal", specialty: "Cardiology",
      photo: "/assets/doc-1.jpg", clinic: { name: "Nile Badrawi Hospital", address: "14 Saray El Manial St, Maadi", area: "Maadi, Cairo" },
      reason: "Blood pressure & diabetes follow-up", weekday: hana.weekday, date: hana.date, relative: hana.relative,
      time: "10:30", durationMins: 30, bookingRef: "CC-2481",
    },
    {
      id: "appt-salma-skin", doctorId: "salma-abdel-aziz", doctorName: "Dr. Salma Abdel Aziz", specialty: "Dermatology",
      photo: "/assets/doc-3.jpg", clinic: { name: "Glow Dermatology Clinic", address: "12 Baghdad St, Korba", area: "Heliopolis, Cairo" },
      reason: "Skin check follow-up", weekday: salma.weekday, date: salma.date, relative: salma.relative,
      time: "17:30", durationMins: 30, bookingRef: "CC-2509",
    },
    {
      id: "appt-youssef-knee", doctorId: "youssef-abdel-rahman", doctorName: "Dr. Youssef Abdel Rahman", specialty: "Orthopedics",
      photo: "/assets/doc-4.jpg", clinic: { name: "Active Ortho Center", address: "El Bostan District, 8th District", area: "Sheikh Zayed, Giza" },
      reason: "Knee pain assessment", weekday: youssef.weekday, date: youssef.date, relative: youssef.relative,
      time: "09:30", durationMins: 30, bookingRef: "CC-2533",
    },
  ];
}

const PAST_VISITS = [
  {
    id: "visit-hana-dec", doctorId: "hana-kamal", doctorName: "Dr. Hana Kamal", specialty: "Cardiology",
    photo: "/assets/doc-1.jpg", clinic: { name: "Nile Badrawi Hospital", area: "Maadi, Cairo" },
    date: "Wed, 18 Dec 2024", reason: "Quarterly review — blood pressure & diabetes",
    diagnosis: "Blood pressure controlled on the current dose. Type 2 diabetes stable — HbA1c slightly above target.",
    clinicalNotes: "Continue the current medication plan. Weight stable since September. Discussed diet — a session with the diabetes educator is recommended. No new symptoms of concern reported.",
    treatment: ["Continue Metformin 500 mg twice daily with meals", "Reduce added salt; aim for a 30-minute walk 5 days a week", "Repeat HbA1c in 6 weeks"],
    prescriptions: ["Metformin 500 mg — 1 tablet twice daily", "Vitamin D3 1000 IU — once daily"],
    documents: ["HbA1c — Glycated Haemoglobin", "Complete Blood Count (CBC) — Routine Panel", "Metformin 500 mg — Repeat Prescription"],
    followUp: "04 Feb 2025", releasedOn: "20 Dec 2024",
  },
  {
    id: "visit-hana-nov", doctorId: "hana-kamal", doctorName: "Dr. Hana Kamal", specialty: "Cardiology",
    photo: "/assets/doc-1.jpg", clinic: { name: "Nile Badrawi Hospital", area: "Maadi, Cairo" },
    date: "Mon, 04 Nov 2024", reason: "Routine follow-up",
    diagnosis: "Stable overall; mild fatigue reported in the afternoons.",
    clinicalNotes: "Fatigue most likely related to timing of meals and medication. No dose change needed. Cholesterol discussed — starting a statin as a precaution.",
    treatment: ["Start Atorvastatin 20 mg at bedtime", "Recheck lipid profile with the next blood panel"],
    prescriptions: ["Atorvastatin 20 mg — 1 tablet at bedtime"],
    documents: ["Follow-up Notes — Internal Medicine", "Atorvastatin 20 mg — Prescription"],
    releasedOn: "06 Nov 2024",
  },
  {
    id: "visit-hana-endo", doctorId: "hana-kamal", doctorName: "Dr. Hana Kamal", specialty: "Endocrinology",
    photo: "/assets/doc-1.jpg", clinic: { name: "Nile Badrawi Hospital", area: "Maadi, Cairo" },
    date: "Sun, 22 Sep 2024", reason: "Endocrinology consultation — thyroid & diabetes",
    diagnosis: "Type 2 diabetes — controlled. Thyroid ultrasound normal, no nodules.",
    clinicalNotes: "Thyroid function within range. Reviewed home glucose readings together — pattern is good on the current dose.",
    treatment: ["Lifestyle review; repeat labs annually"],
    documents: ["Endocrinology Consultation Report", "Thyroid Ultrasound — Scan Images"],
    releasedOn: "24 Sep 2024",
  },
  {
    id: "visit-salma-aug", doctorId: "salma-abdel-aziz", doctorName: "Dr. Salma Abdel Aziz", specialty: "Dermatology",
    photo: "/assets/doc-3.jpg", clinic: { name: "Glow Dermatology Clinic", area: "Heliopolis, Cairo" },
    date: "Thu, 15 Aug 2024", reason: "Routine skin screening",
    diagnosis: "No significant findings; dry skin on the lower legs.",
    clinicalNotes: "Full-body check clear. Dry patches are weather-related — a plain moisturizer is enough; no medicated cream required.",
    treatment: ["Switch to a fragrance-free moisturizer", "No follow-up needed unless changes appear"],
    releasedOn: "15 Aug 2024",
  },
  {
    id: "visit-omar-jul", doctorId: "omar-fathy", doctorName: "Dr. Omar Fathy", specialty: "Cardiology (referred)",
    photo: "/assets/doc-2.jpg", clinic: { name: "Cairo Neuro & Scan Clinic", area: "Nasr City, Cairo" },
    date: "Tue, 02 Jul 2024", reason: "Pre-treatment cardiac clearance",
    diagnosis: "Cleared for treatment. ECG shows normal sinus rhythm.",
    clinicalNotes: "No structural concerns on examination. Cleared to continue the planned treatment without cardiology restrictions.",
    treatment: ["No further cardiology follow-up needed"],
    documents: ["Cardiology Visit Summary — Referred"],
    releasedOn: "02 Jul 2024",
  },
];

const CANCELLED_SEED = [
  {
    id: "canc-youssef", doctorId: "youssef-abdel-rahman", doctorName: "Dr. Youssef Abdel Rahman", specialty: "Orthopedics",
    photo: "/assets/doc-4.jpg", clinic: { name: "Active Ortho Center", area: "Sheikh Zayed, Giza" },
    weekday: "Thu", date: "12 Dec 2024", time: "10:00", cancelledOn: "05 Dec 2024",
  },
  {
    id: "canc-karim", doctorId: "karim-moustafa", doctorName: "Dr. Karim Moustafa", specialty: "ENT",
    photo: "/assets/doc-6.jpg", clinic: { name: "ClearSound ENT Clinic", area: "Dokki, Giza" },
    weekday: "Thu", date: "28 Nov 2024", time: "17:30", cancelledOn: "20 Nov 2024",
  },
];

const BEFORE_VISIT_CHECKLIST = [
  "Please arrive 10 minutes early to check in at reception.",
  "Bring your national ID and insurance card.",
  "Bring any recent reports — you can show them from My Records.",
];

/* ── Sub-components ───────────────────────────────────────────── */
function ConfirmedChip() {
  return <span className="mv-chip mv-chip-confirmed"><CheckCircle2 className="mv-icon-12" /> Confirmed</span>;
}
function CancelledChip() {
  return <span className="mv-chip mv-chip-cancelled">Cancelled</span>;
}
function SpecialtyChip({ specialty }) {
  return <span className="mv-chip mv-chip-spec">{specialty}</span>;
}
function DoctorAvatar({ src, name, size = 64, muted }) {
  const [failed, setFailed] = useState(false);
  const initials = name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").slice(0, 2);
  if (failed) return <span className={cn("mv-avatar mv-avatar-fallback", muted && "mv-avatar-muted")} style={{ width: size, height: size, fontSize: size * 0.32 }}>{initials}</span>;
  return <img src={src} alt={`Portrait of ${name}`} className={cn("mv-avatar", muted && "mv-avatar-muted")} style={{ width: size, height: size }} onError={() => setFailed(true)} draggable={false} />;
}

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past Visits" },
  { key: "cancelled", label: "Cancelled" },
];

export function MyVisits({ onFindDoctor, onOpenDoctorProfile }) {
  const [tab, setTab] = useState("upcoming");
  const [upcoming, setUpcoming] = useState(makeUpcomingAppointments);
  const [cancelled, setCancelled] = useState(CANCELLED_SEED);
  const [detailId, setDetailId] = useState(null);
  const [visitId, setVisitId] = useState(null);
  const [cancelTargetId, setCancelTargetId] = useState(null);

  const cancelTarget = upcoming.find((a) => a.id === cancelTargetId) || null;
  const detailAppointment = upcoming.find((a) => a.id === detailId) || null;
  const detailVisit = PAST_VISITS.find((v) => v.id === visitId) || null;

  function confirmCancel() {
    if (!cancelTarget) return;
    setUpcoming((prev) => prev.filter((a) => a.id !== cancelTarget.id));
    setCancelled((prev) => [
      {
        id: `canc-${cancelTarget.id}`, doctorId: cancelTarget.doctorId, doctorName: cancelTarget.doctorName, specialty: cancelTarget.specialty,
        photo: cancelTarget.photo, clinic: { name: cancelTarget.clinic.name, area: cancelTarget.clinic.area },
        weekday: cancelTarget.weekday, date: cancelTarget.date, time: cancelTarget.time, cancelledOn: "Just now",
      },
      ...prev,
    ]);
    if (detailId === cancelTarget.id) setDetailId(null);
    setCancelTargetId(null);
    setTab("cancelled");
    toast({ title: "Appointment cancelled", description: `Your in-clinic visit with ${cancelTarget.doctorName} on ${cancelTarget.weekday}, ${cancelTarget.date} has been cancelled.` });
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  const cancelDialog = (
    <AlertDialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTargetId(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
          <AlertDialogDescription>
            {cancelTarget
              ? `Your in-clinic visit with ${cancelTarget.doctorName} on ${cancelTarget.weekday}, ${cancelTarget.date} at ${cancelTarget.time} will be cancelled and the slot released to other patients. This cannot be undone.`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setCancelTargetId(null)}>Keep appointment</AlertDialogCancel>
          <AlertDialogAction onClick={confirmCancel} className="mv-alert-destructive">Cancel Appointment</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (detailVisit) {
    return <><VisitDetail visit={detailVisit} onBack={() => setVisitId(null)} onOpenDoctorProfile={onOpenDoctorProfile} />{cancelDialog}</>;
  }
  if (detailAppointment) {
    return <><AppointmentDetail appt={detailAppointment} onBack={() => setDetailId(null)} onOpenDoctorProfile={onOpenDoctorProfile} onCancel={() => setCancelTargetId(detailAppointment.id)} />{cancelDialog}</>;
  }

  return (
    <div className="mv-page">
      {/* Header */}
      <div className="mv-header">
        <div>
          <p className="mv-eyebrow">Appointments & consultations</p>
          <h1 className="mv-title">My Visits</h1>
          <p className="mv-subtitle">Track your upcoming in-clinic appointments and revisit the details your doctor shared after each completed consultation.</p>
        </div>
        <Button onClick={onFindDoctor}>Find a Doctor</Button>
      </div>

      {/* Tabs */}
      <div className="mv-tabs" role="group" aria-label="Visit tabs">
        {TABS.map((t) => {
          const count = t.key === "upcoming" ? upcoming.length : t.key === "past" ? PAST_VISITS.length : cancelled.length;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("mv-tab-btn", active && "mv-tab-btn-active")} aria-current={active ? "page" : undefined}>
              {t.label}
              <span className="mv-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "upcoming" ? (
        upcoming.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No upcoming appointments" body="When you book an in-clinic consultation it will appear here with its date, time and clinic details." actionLabel="Find a Doctor" onAction={onFindDoctor} />
        ) : (
          <ul className="mv-list">
            {upcoming.map((a) => (
              <li key={a.id} className="mv-card">
                <DoctorAvatar src={a.photo} name={a.doctorName} size={64} />
                <div className="mv-card-main">
                  <div className="mv-card-name-row">
                    <h3 className="mv-card-name">{a.doctorName}</h3>
                    <ConfirmedChip />
                  </div>
                  <div className="mv-card-spec-row">
                    <SpecialtyChip specialty={a.specialty} />
                    <span className="mv-card-relative">{a.relative}</span>
                  </div>
                  <p className="mv-card-reason">{a.reason}</p>
                  <div className="mv-card-meta">
                    <span className="mv-card-meta-item"><CalendarDays className="mv-icon-12" /> {a.weekday}, {a.date}</span>
                    <span className="mv-card-meta-item"><Clock className="mv-icon-12" /> {a.time} · {a.durationMins} min</span>
                    <span className="mv-card-meta-item"><MapPin className="mv-icon-12" /> {a.clinic.name}, {a.clinic.area}</span>
                  </div>
                </div>
                <div className="mv-card-actions">
                  <Button size="sm" onClick={() => { setDetailId(a.id); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }}><Eye className="mv-icon-14" /> View Details</Button>
                  <Button variant="outline" size="sm" onClick={() => onOpenDoctorProfile(a.doctorId)}><Stethoscope className="mv-icon-14" /> View Doctor Profile</Button>
                  <Button variant="ghost" size="sm" className="mv-cancel-btn" onClick={() => setCancelTargetId(a.id)}>Cancel Appointment</Button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : tab === "past" ? (
        PAST_VISITS.length === 0 ? (
          <EmptyState icon={FileText} title="No past visits yet" body="After each completed consultation, the details your doctor shares with you will be collected here." />
        ) : (
          <ul className="mv-list">
            {PAST_VISITS.map((v) => (
              <li key={v.id} className="mv-card">
                <DoctorAvatar src={v.photo} name={v.doctorName} size={56} />
                <div className="mv-card-main">
                  <div className="mv-card-name-row">
                    <h3 className="mv-card-name">{v.doctorName}</h3>
                    <SpecialtyChip specialty={v.specialty} />
                  </div>
                  <p className="mv-card-date"><CalendarDays className="mv-icon-12" /> {v.date}</p>
                  <p className="mv-card-diagnosis">{v.diagnosis || v.reason}</p>
                  <div className="mv-card-meta">
                    <span className="mv-card-meta-item"><Building2 className="mv-icon-12" /> {v.clinic.name}, {v.clinic.area}</span>
                    {v.documents && <span className="mv-card-meta-item"><FileHeart className="mv-icon-12" /> {v.documents.length} document{v.documents.length === 1 ? "" : "s"}</span>}
                  </div>
                </div>
                <div className="mv-card-actions">
                  <Button size="sm" onClick={() => { setVisitId(v.id); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }}><Eye className="mv-icon-14" /> View Visit Details</Button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        cancelled.length === 0 ? (
          <EmptyState icon={CalendarX2} title="No cancelled appointments" body="Appointments you cancel will be kept here for your reference — they never appear as completed visits." />
        ) : (
          <ul className="mv-list">
            {cancelled.map((c) => (
              <li key={c.id} className="mv-card mv-card-cancelled">
                <DoctorAvatar src={c.photo} name={c.doctorName} size={48} muted />
                <div className="mv-card-main">
                  <div className="mv-card-name-row">
                    <h3 className="mv-card-name">{c.doctorName}</h3>
                    <CancelledChip />
                  </div>
                  <div className="mv-card-spec-row"><SpecialtyChip specialty={c.specialty} /></div>
                  <div className="mv-card-meta">
                    <span className="mv-card-meta-item mv-meta-clay"><CalendarDays className="mv-icon-12" /> Original: {c.weekday}, {c.date}</span>
                    <span className="mv-card-meta-item mv-meta-clay"><Clock className="mv-icon-12" /> {c.time}</span>
                    <span className="mv-card-meta-item mv-meta-clay"><Building2 className="mv-icon-12" /> {c.clinic.name}, {c.clinic.area}</span>
                  </div>
                  <p className="mv-cancelled-on">Cancelled on {c.cancelledOn}</p>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      <p className="mv-footer">All CareCompass consultations are in-clinic visits — details are shared by your doctor after each appointment.</p>
      {cancelDialog}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, actionLabel, onAction }) {
  return (
    <div className="mv-empty">
      <span className="mv-empty-icon"><Icon className="mv-icon-24" /></span>
      <h2 className="mv-empty-title">{title}</h2>
      <p className="mv-empty-text">{body}</p>
      {actionLabel && <Button onClick={onAction} className="mv-empty-btn">{actionLabel}</Button>}
    </div>
  );
}

function AppointmentDetail({ appt, onBack, onOpenDoctorProfile, onCancel }) {
  return (
    <div className="mv-detail">
      <button onClick={onBack} className="mv-back-btn"><ArrowLeft className="mv-icon-14" /> Back to my visits</button>
      <div className="mv-detail-header">
        <DoctorAvatar src={appt.photo} name={appt.doctorName} size={88} />
        <div className="mv-detail-head-main">
          <div className="mv-card-name-row">
            <h1 className="mv-detail-name">{appt.doctorName}</h1>
            <ConfirmedChip />
          </div>
          <div className="mv-card-spec-row"><SpecialtyChip specialty={appt.specialty} /></div>
          <p className="mv-detail-reason">{appt.reason}</p>
          <div className="mv-card-meta">
            <span className="mv-card-meta-item"><MapPin className="mv-icon-12" /> In-clinic visit</span>
            <span className="mv-card-meta-item"><FileText className="mv-icon-12" /> Booking ref {appt.bookingRef}</span>
          </div>
        </div>
        <div className="mv-detail-head-action">
          <Button variant="outline" size="sm" onClick={() => onOpenDoctorProfile(appt.doctorId)}><Stethoscope className="mv-icon-14" /> View Doctor Profile</Button>
          <p className="mv-detail-datetime">{appt.weekday}, {appt.date} · {appt.time}</p>
        </div>
      </div>

      <dl className="mv-detail-grid">
        <div><dt>Date</dt><dd>{appt.weekday}, {appt.date}</dd><span className="mv-detail-pill">{appt.relative}</span></div>
        <div><dt>Time</dt><dd>{appt.time} · {appt.durationMins} min</dd></div>
        <div><dt>Consultation type</dt><dd>In-clinic visit</dd></div>
        <div><dt>Clinic</dt><dd>{appt.clinic.name}</dd></div>
        <div><dt>Clinic address</dt><dd>{appt.clinic.address}, {appt.clinic.area}</dd></div>
      </dl>

      <section className="mv-detail-section">
        <h2 className="mv-detail-section-title"><CheckCircle2 className="mv-icon-16 mv-icon-primary" /> Before your visit</h2>
        <ul className="mv-checklist">
          {BEFORE_VISIT_CHECKLIST.map((c) => <li key={c}><CheckCircle2 className="mv-icon-14 mv-icon-sage" /> {c}</li>)}
        </ul>
        <p className="mv-detail-foot">CareCompass consultations are in-clinic only — video visits are not offered.</p>
      </section>

      <section className="mv-detail-danger">
        <h2 className="mv-detail-danger-title">Can't make it?</h2>
        <p className="mv-detail-danger-body">Cancelling releases the slot to other patients. The appointment will move to your Cancelled tab.</p>
        <Button variant="destructive" size="sm" onClick={onCancel}>Cancel Appointment</Button>
      </section>
    </div>
  );
}

function VisitDetail({ visit, onBack, onOpenDoctorProfile }) {
  return (
    <div className="mv-detail">
      <button onClick={onBack} className="mv-back-btn"><ArrowLeft className="mv-icon-14" /> Back to my visits</button>
      <div className="mv-detail-header">
        <DoctorAvatar src={visit.photo} name={visit.doctorName} size={88} />
        <div className="mv-detail-head-main">
          <div className="mv-card-name-row">
            <h1 className="mv-detail-name">{visit.doctorName}</h1>
            <SpecialtyChip specialty={visit.specialty} />
          </div>
          <div className="mv-card-meta">
            <span className="mv-card-meta-item"><CalendarDays className="mv-icon-12" /> {visit.date}</span>
            <span className="mv-card-meta-item"><Building2 className="mv-icon-12" /> {visit.clinic.name}, {visit.clinic.area}</span>
          </div>
          <p className="mv-detail-sage-note">Details shared by {visit.doctorName} on {visit.releasedOn} — only finalized information is shown.</p>
        </div>
      </div>

      {visit.diagnosis && (
        <DetailSection icon={Stethoscope} title="Diagnosis">
          <p className="mv-detail-text">{visit.diagnosis}</p>
        </DetailSection>
      )}
      {visit.clinicalNotes && (
        <DetailSection icon={FileText} title="Clinical notes">
          <p className="mv-detail-text">{visit.clinicalNotes}</p>
          <p className="mv-detail-foot">Notes your doctor chose to share with you — private drafts and internal remarks are never included.</p>
        </DetailSection>
      )}
      {visit.treatment && visit.treatment.length > 0 && (
        <DetailSection icon={ClipboardList} title="Treatment & recommendations">
          <ul className="mv-checklist">
            {visit.treatment.map((t) => <li key={t}><CheckCircle2 className="mv-icon-14 mv-icon-sage" /> {t}</li>)}
          </ul>
        </DetailSection>
      )}
      {visit.prescriptions && visit.prescriptions.length > 0 && (
        <DetailSection icon={Pill} title="Prescriptions">
          <ul className="mv-rx-list">
            {visit.prescriptions.map((p) => <li key={p}><Pill className="mv-icon-14 mv-meta-clay" /> {p}</li>)}
          </ul>
        </DetailSection>
      )}
      {visit.documents && visit.documents.length > 0 && (
        <DetailSection icon={FileHeart} title="Related documents">
          <ul className="mv-rx-list">
            {visit.documents.map((d) => <li key={d}><FileHeart className="mv-icon-14 mv-icon-primary" /> {d}</li>)}
          </ul>
          <p className="mv-detail-foot">These documents are available in your My Records section.</p>
        </DetailSection>
      )}
      {visit.followUp && (
        <div className="mv-followup-banner">
          <p className="mv-followup-title">Follow-up visit: {visit.followUp}</p>
          <p className="mv-followup-note">Book your next in-clinic consultation from Find a Doctor.</p>
        </div>
      )}
    </div>
  );
}

function DetailSection({ icon: Icon, title, children }) {
  return (
    <section className="mv-detail-section">
      <h2 className="mv-detail-section-title"><Icon className="mv-icon-16 mv-icon-primary" /> {title}</h2>
      {children}
    </section>
  );
}

export default MyVisits;
