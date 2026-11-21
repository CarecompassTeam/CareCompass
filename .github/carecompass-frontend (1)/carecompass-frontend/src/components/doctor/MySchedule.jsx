/* ==========================================================================
   MySchedule — doctor dashboard "My Schedule" (calendar + availability)
   Plain-CSS port of the carecompass my-schedule component (TypeScript source).
   ========================================================================== */

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Building2,
  Stethoscope,
  User,
  Settings2,
  Ban,
  Trash2,
  Plus,
  CheckCircle2,
  Eye,
  FileText,
  ArrowLeft,
  Pill,
  ClipboardList,
  CalendarX2,
  Info,
  Save,
  Sunrise,
  MapPin,
  Phone,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { toast } from "../../hooks/use-toast";

import "./MySchedule.css";

/* ────────────────────────────────────────────────────────────────────────────
   Date & time helpers (all local-time, "HH:MM" 24h like Find a Doctor)
   ──────────────────────────────────────────────────────────────────────────── */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function prettyDate(iso) {
  const d = fromISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

/* Time options for availability selectors: 07:00 → 22:00 every 30 min. */
const TIME_OPTIONS = (() => {
  const out = [];
  for (let m = 7 * 60; m <= 22 * 60; m += 30) out.push(fromMinutes(m));
  return out;
})();

/* ────────────────────────────────────────────────────────────────────────────
   Sample data — realistic prototype (in-clinic only)
   Appointment dates are computed relative to "today" so the calendar is
   always alive. Patient names line up with the seeded assigned patients
   where possible (Mariam R. → Dr. Hana Kamal, Sara A. → Dr. Omar Fathy).

   Data shapes (were TS types in the source):
   - ApptStatus  = "confirmed" | "completed"
   - VisitRecord = { recordedOn, diagnosis, notes, treatment[], prescriptions[], followUp? }
   - Appointment = { id, patientName, patientMeta, phone, date, time,
                     durationMins, reason, status, visitRecord? }
   - DayConfig   = { enabled, start, end }
   - TimeBlock   = { id, date, label, start|null, end|null }   (null → full-day block)
   - Availability= { durationMins (15|30|45), days[7] (index 0 = Sunday … 6 = Saturday),
                     breakEnabled, breakStart, breakEnd, blocks[] }
   ──────────────────────────────────────────────────────────────────────────── */

function defaultAvailability() {
  const day = (start, end) => ({
    enabled: true,
    start,
    end,
  });
  const off = { enabled: false, start: "09:00", end: "17:00" };
  return {
    durationMins: 30,
    days: [
      day("09:00", "17:00"), // Sun
      day("09:00", "17:00"), // Mon
      day("09:00", "17:00"), // Tue
      day("09:00", "17:00"), // Wed
      day("09:00", "15:00"), // Thu
      off, // Fri — Egyptian clinics closed
      day("10:00", "14:00"), // Sat — short morning clinic
    ],
    breakEnabled: true,
    breakStart: "13:00",
    breakEnd: "14:00",
    blocks: [],
  };
}

/* Step forward/backward until a working day is found (≤ 8 steps). */
function nearestWorkingISO(iso, dir) {
  const av = defaultAvailability();
  let cur = iso;
  for (let i = 0; i < 8; i++) {
    if (av.days[fromISODate(cur).getDay()].enabled) return cur;
    cur = addDays(cur, dir);
  }
  return iso;
}

/* Slot start times of a working day under the default availability. */
function workingSlotStarts(iso) {
  return buildDaySlots(iso, defaultAvailability(), [])
    .slots.filter((s) => s.kind === "open")
    .map((s) => s.start);
}

export function makeAppointments(todayISO) {
  /* Today's sample appointments are placed inside today's real working
     window (whatever weekday the prototype is opened on); future/past
     appointments are snapped to the nearest working day. */
  const todayStarts = workingSlotStarts(todayISO);
  const t0 = todayStarts[0] ?? "09:00";
  const t1 = todayStarts[Math.floor(todayStarts.length / 2)] ?? "11:00";
  const t2 = todayStarts[todayStarts.length - 1] ?? "15:00";

  const day1 = nearestWorkingISO(addDays(todayISO, 1), 1);
  const day1Starts = workingSlotStarts(day1);
  const day2 = nearestWorkingISO(addDays(todayISO, 2), 1);
  const day4 = nearestWorkingISO(addDays(todayISO, 4), 1);
  const day4Starts = workingSlotStarts(day4);
  const day5 = nearestWorkingISO(addDays(todayISO, 5), 1);

  const past1 = nearestWorkingISO(addDays(todayISO, -1), -1);
  const past3 = nearestWorkingISO(addDays(todayISO, -3), -1);
  const past8 = nearestWorkingISO(addDays(todayISO, -8), -1);

  return [
    /* ── Today ── */
    {
      id: "appt-tarek-bp",
      patientName: "Tarek M.",
      patientMeta: "61 · Male · Hypertension",
      phone: "+20 100 445 2210",
      date: todayISO,
      time: t0,
      durationMins: 30,
      reason: "Blood pressure review — readings high at home this week.",
      status: "confirmed",
    },
    {
      id: "appt-mariam-followup",
      patientName: "Mariam R.",
      patientMeta: "54 · Female · Hypertension, Type 2 diabetes",
      phone: "+20 122 330 1187",
      date: todayISO,
      time: t1,
      durationMins: 30,
      reason: "Blood pressure & diabetes follow-up — bringing latest HbA1c lab.",
      status: "confirmed",
    },
    {
      id: "appt-aya-palpitations",
      patientName: "Aya S.",
      patientMeta: "37 · Female · Palpitations",
      phone: "+20 111 902 6634",
      date: todayISO,
      time: t2,
      durationMins: 30,
      reason: "Occasional palpitations after coffee — wants an ECG review.",
      status: "confirmed",
    },

    /* ── Upcoming days ── */
    {
      id: "appt-omar-lipids",
      patientName: "Omar D.",
      patientMeta: "48 · Male · High cholesterol",
      phone: "+20 106 218 4453",
      date: day1,
      time: day1Starts[0] ?? "09:30",
      durationMins: 30,
      reason: "Statin follow-up — lipid panel done last week.",
      status: "confirmed",
    },
    {
      id: "appt-laila-echo",
      patientName: "Laila N.",
      patientMeta: "66 · Female · Heart failure (stable)",
      phone: "+20 128 774 9021",
      date: day1,
      time: day1Starts[Math.min(2, day1Starts.length - 1)] ?? "12:00",
      durationMins: 30,
      reason: "Routine heart-failure check — weight and diuretic dose review.",
      status: "confirmed",
    },
    {
      id: "appt-youssef-chest",
      patientName: "Youssef K.",
      patientMeta: "52 · Male · Chest discomfort",
      phone: "+20 101 553 8712",
      date: day2,
      time: workingSlotStarts(day2)[1] ?? "10:00",
      durationMins: 30,
      reason: "Chest tightness when walking uphill — first consultation.",
      status: "confirmed",
    },
    {
      id: "appt-salma-results",
      patientName: "Salma H.",
      patientMeta: "45 · Female · Thyroid disease",
      phone: "+20 115 664 2290",
      date: day4,
      time: day4Starts[Math.floor(day4Starts.length / 3)] ?? "11:30",
      durationMins: 30,
      reason: "Thyroid results review — TSH out of range on last lab.",
      status: "confirmed",
    },
    {
      id: "appt-sara-new",
      patientName: "Sara A.",
      patientMeta: "31 · Female · Family history of heart disease",
      phone: "+20 109 887 5540",
      date: day5,
      time: workingSlotStarts(day5)[0] ?? "09:00",
      durationMins: 30,
      reason: "Preventive heart check — family history of early heart disease.",
      status: "confirmed",
    },

    /* ── Completed visits (with records) ── */
    {
      id: "appt-mariam-past",
      patientName: "Mariam R.",
      patientMeta: "54 · Female · Hypertension, Type 2 diabetes",
      phone: "+20 122 330 1187",
      date: past1,
      time: workingSlotStarts(past1)[1] ?? "10:00",
      durationMins: 30,
      reason: "Blood pressure follow-up.",
      status: "completed",
      visitRecord: {
        recordedOn: prettyDate(past1),
        diagnosis:
          "Stage 1 hypertension, controlled on current therapy. Blood pressure today 132/84 mmHg (was 148/92 in March).",
        notes:
          "Patient adherent to Metformin and home BP monitoring. Advised to keep sodium under 5 g/day and continue 30-minute daily walks. No chest pain, no dyspnoea on exertion. Weight stable at 72 kg.",
        treatment: [
          "Continue Metformin 850 mg twice daily.",
          "Reduce added salt; DASH-style diet sheet given.",
          "Home BP log twice daily — bring to next visit.",
        ],
        prescriptions: [
          "Metformin 850 mg — 1 tablet twice daily, after meals (repeat 3 months).",
          "Atorvastatin 20 mg — 1 tablet at night (repeat 3 months).",
        ],
        followUp: `Follow-up in 4 weeks — ${prettyDate(addDays(past1, 28))}.`,
      },
    },
    {
      id: "appt-tarek-past",
      patientName: "Tarek M.",
      patientMeta: "61 · Male · Hypertension",
      phone: "+20 100 445 2210",
      date: past3,
      time: workingSlotStarts(past3)[3] ?? "12:00",
      durationMins: 30,
      reason: "Dizziness on standing — medication review.",
      status: "completed",
      visitRecord: {
        recordedOn: prettyDate(past3),
        diagnosis:
          "Orthostatic hypotension, likely over-treatment with Amlodipine. ECG unchanged — no arrhythmia.",
        notes:
          "BP drop 25 mmHg on standing. Advised slow position changes and increased water intake. Dose reduction agreed with patient.",
        treatment: [
          "Amlodipine reduced from 10 mg to 5 mg daily.",
          "Drink 2 L of water daily; rise slowly from bed.",
        ],
        prescriptions: [
          "Amlodipine 5 mg — 1 tablet daily, morning (repeat 2 months).",
        ],
      },
    },
    {
      id: "appt-aya-past",
      patientName: "Aya S.",
      patientMeta: "37 · Female · Palpitations",
      phone: "+20 111 902 6634",
      date: past8,
      time: workingSlotStarts(past8)[0] ?? "09:30",
      durationMins: 30,
      reason: "First consultation — palpitations and stress.",
      status: "completed",
      visitRecord: {
        recordedOn: prettyDate(past8),
        diagnosis:
          "Benign sinus tachycardia associated with caffeine intake and work stress. Normal ECG, no structural disease suspected.",
        notes:
          "Three cups of coffee daily plus energy drinks. Advised to cut caffeine for two weeks and keep a symptom diary; Holter only if episodes continue.",
        treatment: [
          "Stop energy drinks; max one coffee per day.",
          "Symptom diary — note time, pulse and trigger for each episode.",
        ],
        prescriptions: [],
        followUp: `Review with diary — ${prettyDate(addDays(past8, 14))}.`,
      },
    },
  ];
}

/* One sample time-off block so the calendar shows the blocked visual. */
function defaultBlocks(todayISO) {
  return [
    {
      id: "block-conference",
      date: nearestWorkingISO(addDays(todayISO, 6), 1),
      label: "Cardiology conference — Cairo (all day)",
      start: null,
      end: null,
    },
  ];
}

/* ────────────────────────────────────────────────────────────────────────────
   Slot engine — derives the bookable grid from the live availability state.
   Open slots are instantly bookable by patients; booked/blocked are not.
   ──────────────────────────────────────────────────────────────────────────── */

/* SlotKind = "booked" | "open" | "break" | "blocked" */

function overlaps(aS, aE, bS, bE) {
  return aS < bE && bS < aE;
}

function buildDaySlots(iso, availability, appointments) {
  const dow = fromISODate(iso).getDay();
  const cfg = availability.days[dow];

  const dayAppts = appointments.filter((a) => a.date === iso);

  // Full-day block (holiday / time off) — nothing bookable.
  const fullBlock = availability.blocks.find(
    (b) => b.date === iso && b.start === null
  );
  if (fullBlock) {
    return {
      iso,
      working: true,
      fullBlocked: true,
      blockedLabel: fullBlock.label,
      slots: [],
      openCount: 0,
    };
  }

  if (!cfg.enabled) {
    return { iso, working: false, fullBlocked: false, slots: [], openCount: 0 };
  }

  const dur = availability.durationMins;
  const startM = toMinutes(cfg.start);
  const endM = toMinutes(cfg.end);
  const brS = availability.breakEnabled ? toMinutes(availability.breakStart) : -1;
  const brE = availability.breakEnabled ? toMinutes(availability.breakEnd) : -1;
  const partialBlocks = availability.blocks.filter(
    (b) => b.date === iso && b.start !== null && b.end !== null
  );

  const slots = [];
  let openCount = 0;

  for (let m = startM; m + dur <= endM; m += dur) {
    const slotStart = fromMinutes(m);
    const slotEnd = fromMinutes(m + dur);
    const appt = dayAppts.find(
      (a) =>
        overlaps(m, m + dur, toMinutes(a.time), toMinutes(a.time) + a.durationMins)
    );

    if (appt) {
      slots.push({ start: slotStart, end: slotEnd, kind: "booked", appointment: appt });
      continue;
    }
    if (availability.breakEnabled && overlaps(m, m + dur, brS, brE)) {
      slots.push({ start: slotStart, end: slotEnd, kind: "break" });
      continue;
    }
    const pb = partialBlocks.find((b) =>
      overlaps(m, m + dur, toMinutes(b.start), toMinutes(b.end))
    );
    if (pb) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        kind: "blocked",
        blockedLabel: pb.label,
      });
      continue;
    }
    slots.push({ start: slotStart, end: slotEnd, kind: "open" });
    openCount += 1;
  }

  return { iso, working: true, fullBlocked: false, slots, openCount };
}

/* ────────────────────────────────────────────────────────────────────────────
   Small shared pieces (same visual language as My Visits / Find a Doctor)
   ──────────────────────────────────────────────────────────────────────────── */

function StatusChip({ status }) {
  return status === "confirmed" ? (
    <span className="ms-chip ms-chip-confirmed">
      <CheckCircle2 className="ms-icon-12" />
      Confirmed
    </span>
  ) : (
    <span className="ms-chip ms-chip-completed">
      <CheckCircle2 className="ms-icon-12" />
      Completed
    </span>
  );
}

function InClinicChip({ compact = false }) {
  return (
    <span
      className={cn(
        "ms-chip ms-chip-inclinic",
        compact ? "ms-chip-inclinic-compact" : "ms-chip-inclinic-regular"
      )}
    >
      <Building2 className="ms-icon-12" />
      In-clinic
    </span>
  );
}

function PatientAvatar({ name, size, className }) {
  return (
    <span
      className={cn("ms-avatar", className)}
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

/* ────────────────────────────────────────────────────────────────────────────
   My Schedule — main component
   ──────────────────────────────────────────────────────────────────────────── */

export function MySchedule({ doctorName, specialty, onOpenPatient }) {
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [subView, setSubView] = useState("calendar");
  const [calView, setCalView] = useState("day");
  const [cursor, setCursor] = useState(todayISO); // anchor date of the visible period
  const [availability, setAvailability] = useState(() => ({
    ...defaultAvailability(),
    blocks: defaultBlocks(todayISO),
  }));
  const [appointments] = useState(() => makeAppointments(todayISO));
  const [detailId, setDetailId] = useState(null);
  const [visitId, setVisitId] = useState(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const detailAppointment = detailId
    ? appointments.find((a) => a.id === detailId) ?? null
    : null;
  const visitRecord = visitId
    ? appointments.find((a) => a.id === visitId)?.visitRecord ?? null
    : null;
  const visitPatient = visitId
    ? appointments.find((a) => a.id === visitId)?.patientName ?? ""
    : "";

  const workingDaysOn = availability.days.filter((d) => d.enabled).length;

  /* Day view slots */
  const daySlots = useMemo(
    () => buildDaySlots(cursor, availability, appointments),
    [cursor, availability, appointments]
  );

  /* Week view (Sun → Sat of the week containing the cursor) */
  const weekISOs = useMemo(() => {
    const start = addDays(cursor, -fromISODate(cursor).getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);
  const weekSlots = useMemo(
    () => weekISOs.map((iso) => buildDaySlots(iso, availability, appointments)),
    [weekISOs, availability, appointments]
  );

  /* Month grid (6 rows × 7 cols) */
  const monthCells = useMemo(() => {
    const first = new Date(monthCursor.year, monthCursor.month, 1);
    const start = addDays(toISODate(first), -first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const iso = addDays(start, i);
      const d = fromISODate(iso);
      return {
        iso,
        inMonth: d.getMonth() === monthCursor.month,
        appts: appointments.filter((a) => a.date === iso),
        blocked: availability.blocks.some((b) => b.date === iso),
      };
    });
  }, [monthCursor, appointments, availability.blocks]);

  /* Period label + navigation */
  const periodLabel = (() => {
    if (calView === "day") {
      const rel = relativeLabel(cursor, todayISO);
      return `${rel === "Today" ? "Today" : rel} · ${prettyDate(cursor)}`;
    }
    if (calView === "week") {
      const a = fromISODate(weekISOs[0]);
      const b = fromISODate(weekISOs[6]);
      const sameMonth = a.getMonth() === b.getMonth();
      return sameMonth
        ? `${a.getDate()} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
        : `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
    }
    return `${MONTHS_LONG[monthCursor.month]} ${monthCursor.year}`;
  })();

  const navigate = (dir) => {
    if (calView === "day") setCursor((c) => addDays(c, dir));
    else if (calView === "week") setCursor((c) => addDays(c, 7 * dir));
    else
      setMonthCursor(({ year, month }) => {
        const nm = month + dir;
        return { year: year + Math.floor(nm / 12), month: ((nm % 12) + 12) % 12 };
      });
  };

  const goToday = () => {
    setCursor(todayISO);
    const d = new Date();
    setMonthCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  /* Keep the day/week cursor anchored to a day inside the visible month
     when switching views, so the toolbar label stays consistent. */
  const switchCalView = (v) => {
    setCalView(v);
    if (v === "month") {
      const d = fromISODate(cursor);
      setMonthCursor({ year: d.getFullYear(), month: d.getMonth() });
    }
  };

  /* ── Visit record detail view ──────────────────────────────────────────── */
  if (visitRecord) {
    return (
      <VisitRecordView
        patientName={visitPatient}
        record={visitRecord}
        onBack={() => setVisitId(null)}
      />
    );
  }

  return (
    <div className="ms-page">
      {/* ── Page header ── */}
      <header className="ms-header">
        <div>
          <p className="ms-header-eyebrow">
            Appointments &amp; availability
          </p>
          <h1 className="ms-header-title">
            My Schedule
          </h1>
          <p className="ms-header-sub">
            Manage your appointments and working availability.
          </p>
        </div>
        <p className="ms-header-today">
          <CalendarDays className="ms-icon-14 ms-icon-primary" />
          Today · {prettyDate(todayISO)}
        </p>
      </header>

      {/* ── Calendar / Availability switch ── */}
      <div className="ms-switch" role="group" aria-label="Schedule sections">
        {[
          { key: "calendar", label: "Calendar", icon: CalendarRange },
          { key: "availability", label: "Availability Settings", icon: Settings2 },
        ].map((t) => {
          const active = subView === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSubView(t.key)}
              aria-pressed={active}
              className={cn(
                "ms-switch-btn",
                active
                  ? "ms-switch-btn-active"
                  : "ms-switch-btn-idle"
              )}
            >
              <t.icon className="ms-icon-14" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════════════ CALENDAR ════════════════════════════ */}
      {subView === "calendar" && (
        <>
          {/* Toolbar */}
          <div className="ms-toolbar">
            <div className="ms-view-group" role="group" aria-label="Calendar view">
              {["day", "week", "month"].map((v) => (
                <button
                  key={v}
                  onClick={() => switchCalView(v)}
                  aria-pressed={calView === v}
                  className={cn(
                    "ms-view-btn",
                    calView === v
                      ? "ms-view-btn-active"
                      : "ms-view-btn-idle"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="ms-nav-cluster">
              <button
                onClick={() => navigate(-1)}
                aria-label="Previous"
                className="ms-nav-btn"
              >
                <ChevronLeft className="ms-icon-16" />
              </button>
              <button
                onClick={goToday}
                className="ms-nav-today-btn"
              >
                Today
              </button>
              <button
                onClick={() => navigate(1)}
                aria-label="Next"
                className="ms-nav-btn"
              >
                <ChevronRight className="ms-icon-16" />
              </button>
            </div>

            <p className="ms-period-label">
              {periodLabel}
            </p>
          </div>

          {/* No working hours → calendar can't show bookable time */}
          {workingDaysOn === 0 ? (
            <div className="ms-no-hours">
              <span className="ms-no-hours-icon">
                <CalendarX2 className="ms-icon-24" />
              </span>
              <h2 className="ms-no-hours-title">
                No working hours configured
              </h2>
              <p className="ms-no-hours-text">
                Your calendar has no bookable time. Set your working days and
                hours so patients can book in-clinic consultations.
              </p>
              <Button
                onClick={() => setSubView("availability")}
                className="ms-btn-raised"
              >
                <Settings2 className="ms-icon-16 ms-icon-mr-8" />
                Open Availability Settings
              </Button>
            </div>
          ) : calView === "day" ? (
            <DayTimeline
              day={daySlots}
              cursor={cursor}
              todayISO={todayISO}
              onOpenAppointment={setDetailId}
            />
          ) : calView === "week" ? (
            <WeekGrid
              days={weekSlots}
              todayISO={todayISO}
              onOpenAppointment={setDetailId}
            />
          ) : (
            <MonthGrid
              cells={monthCells}
              todayISO={todayISO}
              cursorISO={cursor}
              onSelectDay={(iso) => {
                setCursor(iso);
                setCalView("day");
              }}
              onOpenAppointment={setDetailId}
            />
          )}

          {/* Booking logic caption */}
          <p className="ms-booking-caption">
            <Info className="ms-icon-14 ms-booking-caption-icon" />
            Open slots are instantly bookable by patients — when a patient
            confirms, the slot is marked booked and disappears from the
            bookable times. Booked and blocked slots cannot be selected.
            Consultations are in-clinic only.
          </p>
        </>
      )}

      {/* ══════════════════════ AVAILABILITY SETTINGS ══════════════════════ */}
      {subView === "availability" && (
        <AvailabilitySettings
          availability={availability}
          setAvailability={setAvailability}
          doctorName={doctorName}
          specialty={specialty}
        />
      )}

      {/* ── Appointment details dialog ── */}
      <Dialog
        open={!!detailAppointment}
        onOpenChange={(open) => !open && setDetailId(null)}
      >
        <DialogContent className="ms-detail-dialog">
          {detailAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="ms-detail-title">
                  <PatientAvatar name={detailAppointment.patientName} size={44} />
                  <span className="ms-detail-name-wrap">
                    <span className="ms-detail-name">{detailAppointment.patientName}</span>
                    <span className="ms-detail-meta">
                      {detailAppointment.patientMeta}
                    </span>
                  </span>
                </DialogTitle>
                <DialogDescription className="ms-sr-only">
                  Appointment details for {detailAppointment.patientName}
                </DialogDescription>
              </DialogHeader>

              <div className="ms-detail-chips">
                <StatusChip status={detailAppointment.status} />
                <InClinicChip />
                <span className="ms-detail-duration">
                  {detailAppointment.durationMins} min
                </span>
              </div>

              <dl className="ms-detail-facts">
                <div className="ms-detail-fact">
                  <CalendarDays className="ms-icon-16 ms-detail-fact-icon" />
                  <dt className="ms-sr-only">Date</dt>
                  <dd className="ms-detail-fact-value">
                    {prettyDate(detailAppointment.date)}{" "}
                    <span className="ms-detail-fact-rel">
                      ({relativeLabel(detailAppointment.date, todayISO)})
                    </span>
                  </dd>
                </div>
                <div className="ms-detail-fact">
                  <Clock className="ms-icon-16 ms-detail-fact-icon" />
                  <dt className="ms-sr-only">Time</dt>
                  <dd className="ms-detail-fact-value">
                    {detailAppointment.time} –{" "}
                    {fromMinutes(
                      toMinutes(detailAppointment.time) + detailAppointment.durationMins
                    )}
                  </dd>
                </div>
                <div className="ms-detail-fact">
                  <Building2 className="ms-icon-16 ms-detail-fact-icon" />
                  <dt className="ms-sr-only">Location</dt>
                  <dd className="ms-detail-fact-value">
                    Nile Badrawi Hospital
                    <span className="ms-detail-fact-rel">
                      {" "}
                      · Maadi, Cairo
                    </span>
                  </dd>
                </div>
                <div className="ms-detail-fact">
                  <Phone className="ms-icon-16 ms-detail-fact-icon" />
                  <dt className="ms-sr-only">Phone</dt>
                  <dd className="ms-detail-fact-value">
                    {detailAppointment.phone}
                  </dd>
                </div>
              </dl>

              <div className="ms-detail-reason">
                <p className="ms-detail-reason-label">
                  <ClipboardList className="ms-icon-12 ms-icon-primary" />
                  Reason for consultation
                </p>
                <p className="ms-detail-reason-text">
                  {detailAppointment.reason}
                </p>
              </div>

              <p className="ms-detail-note">
                <CheckCircle2 className="ms-icon-12 ms-detail-note-icon" />
                Confirmed automatically when the patient booked this open slot —
                no manual approval is needed.
              </p>

              <div className="ms-detail-actions">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailId(null);
                    onOpenPatient(detailAppointment.patientName);
                  }}
                  className="ms-btn-flex"
                >
                  <User className="ms-icon-16 ms-icon-mr-8" />
                  Open Patient Profile
                </Button>
                {detailAppointment.visitRecord && (
                  <Button
                    onClick={() => {
                      setVisitId(detailAppointment.id);
                      setDetailId(null);
                    }}
                    className="ms-btn-flex"
                  >
                    <FileText className="ms-icon-16 ms-icon-mr-8" />
                    View Visit Record
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Day view — a timeline of slots derived from availability
   ──────────────────────────────────────────────────────────────────────────── */

function DayTimeline({ day, cursor, todayISO, onOpenAppointment }) {
  const rel = relativeLabel(cursor, todayISO);
  const hasContent =
    day.slots.length > 0 || day.fullBlocked || !day.working;

  return (
    <section className="ms-day-section">
      <div className="ms-day-head">
        <h2 className="ms-day-title">
          {prettyDate(cursor)}
        </h2>
        {rel === "Today" ? (
          <span className="ms-day-today-badge">
            Today
          </span>
        ) : (
          <span className="ms-day-rel-badge">
            {rel}
          </span>
        )}
        {day.working && !day.fullBlocked && (
          <span className="ms-day-count">
            {day.openCount} open slot{day.openCount === 1 ? "" : "s"} ·{" "}
            {day.slots.filter((s) => s.kind === "booked").length} booked
          </span>
        )}
      </div>

      {!hasContent && (
        <div className="ms-day-empty">
          <CalendarDays className="ms-icon-28 ms-text-muted" />
          <p className="ms-day-empty-title">
            No appointments this day
          </p>
          <p className="ms-day-empty-sub">
            {day.working
              ? "Patients can book any open slot — booked times will appear here."
              : "This is not one of your working days."}
          </p>
        </div>
      )}

      {day.fullBlocked && (
        <div className="ms-day-blocked">
          <span className="ms-day-blocked-icon">
            <Ban className="ms-icon-20" />
          </span>
          <div>
            <p className="ms-day-blocked-title">
              Blocked — no appointments possible
            </p>
            <p className="ms-day-blocked-sub">{day.blockedLabel}</p>
          </div>
        </div>
      )}

      {day.working && !day.fullBlocked && day.slots.length > 0 && (
        <ol className="ms-day-slots">
          {day.slots.map((slot) => (
            <li key={slot.start}>
              {slot.kind === "booked" && slot.appointment ? (
                <button
                  onClick={() => onOpenAppointment(slot.appointment.id)}
                  className="ms-slot ms-slot-booked ms-group"
                  aria-label={`Appointment with ${slot.appointment.patientName} at ${slot.start}`}
                >
                  <span className="ms-slot-time">
                    <span className="ms-slot-time-start">{slot.start}</span>
                    <span className="ms-slot-time-end">
                      {slot.end}
                    </span>
                  </span>
                  <PatientAvatar name={slot.appointment.patientName} size={40} />
                  <span className="ms-slot-main">
                    <span className="ms-slot-name-row">
                      <span className="ms-slot-name">
                        {slot.appointment.patientName}
                      </span>
                      <StatusChip status={slot.appointment.status} />
                    </span>
                    <span className="ms-slot-meta">
                      <span className="ms-slot-mobile-time">
                        {slot.start}–{slot.end}
                      </span>
                      <InClinicChip compact />
                      <span className="ms-slot-duration">
                        <Clock className="ms-icon-12 ms-icon-primary" />
                        {slot.appointment.durationMins} min
                      </span>
                      <span className="ms-truncate">
                        {slot.appointment.reason}
                      </span>
                    </span>
                  </span>
                  <Eye className="ms-icon-16 ms-group-eye" />
                </button>
              ) : slot.kind === "open" ? (
                <div className="ms-slot ms-slot-open">
                  <span className="ms-slot-time">
                    <span className="ms-slot-time-start ms-slot-time-muted">
                      {slot.start}
                    </span>
                    <span className="ms-slot-time-end ms-slot-time-faint">
                      {slot.end}
                    </span>
                  </span>
                  <span className="ms-slot-open-icon">
                    <Clock className="ms-icon-16" />
                  </span>
                  <span className="ms-slot-main">
                    <span className="ms-slot-open-label">
                      Available
                    </span>
                    <span className="ms-slot-open-sub">
                      Open for patients to book · {slot.start}–{slot.end}
                    </span>
                  </span>
                  <span className="ms-slot-bookable">
                    Bookable
                  </span>
                </div>
              ) : slot.kind === "break" ? (
                <div className="ms-slot ms-slot-break">
                  <span className="ms-slot-time">
                    <span className="ms-slot-time-start ms-slot-time-clay">{slot.start}</span>
                    <span className="ms-slot-time-end ms-slot-time-clay-faint">{slot.end}</span>
                  </span>
                  <span className="ms-slot-break-icon">
                    <Coffee className="ms-icon-16" />
                  </span>
                  <p className="ms-slot-break-label">Break — not bookable</p>
                </div>
              ) : (
                <div className="ms-slot ms-slot-blocked">
                  <span className="ms-slot-time">
                    <span className="ms-slot-time-start ms-slot-time-clay">{slot.start}</span>
                    <span className="ms-slot-time-end ms-slot-time-clay-faint">{slot.end}</span>
                  </span>
                  <span className="ms-slot-break-icon">
                    <Ban className="ms-icon-16" />
                  </span>
                  <p className="ms-slot-break-label">
                    Blocked{slot.blockedLabel ? ` — ${slot.blockedLabel}` : ""}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Week view — 7 columns on desktop, stacked day sections on mobile
   ──────────────────────────────────────────────────────────────────────────── */

function WeekGrid({ days, todayISO, onOpenAppointment }) {
  return (
    <section className="ms-week-grid">
      {days.map((d, i) => {
        const date = fromISODate(d.iso);
        const isToday = d.iso === todayISO;
        const booked = d.slots.filter((s) => s.kind === "booked");
        return (
          <div
            key={d.iso}
            className={cn(
              "ms-week-card",
              isToday ? "ms-week-card-today" : "ms-week-card-idle"
            )}
          >
            <div className="ms-week-card-head">
              <p
                className={cn(
                  "ms-week-dow",
                  isToday ? "ms-week-dow-today" : "ms-week-dow-idle"
                )}
              >
                {WEEKDAYS[i]}
              </p>
              <p
                className={cn(
                  "ms-week-date",
                  isToday ? "ms-week-date-today" : "ms-week-date-idle"
                )}
              >
                {date.getDate()}
              </p>
            </div>

            {d.fullBlocked ? (
              <p className="ms-week-blocked">
                <Ban className="ms-icon-12" />
                <span className="ms-truncate">{d.blockedLabel}</span>
              </p>
            ) : !d.working ? (
              <p className="ms-week-off">
                Not working
              </p>
            ) : booked.length === 0 ? (
              <p className="ms-week-free">
                No appointments
                <span className="ms-week-open-count">
                  {d.openCount} open slot{d.openCount === 1 ? "" : "s"}
                </span>
              </p>
            ) : (
              <ul className="ms-week-list">
                {booked.map((s) => (
                  <li key={s.start}>
                    <button
                      onClick={() => onOpenAppointment(s.appointment.id)}
                      aria-label={`Appointment with ${s.appointment.patientName} at ${s.start}`}
                      className={cn(
                        "ms-week-appt",
                        s.appointment.status === "confirmed"
                          ? "ms-week-appt-confirmed"
                          : "ms-week-appt-done"
                      )}
                    >
                      <span className="ms-week-appt-time">
                        {s.start}
                      </span>
                      <span className="ms-week-appt-name">
                        {s.appointment.patientName}
                      </span>
                      <span className="ms-week-appt-chips">
                        <InClinicChip compact />
                        {s.appointment.status === "confirmed" ? (
                          <span className="ms-week-chip-confirmed">
                            Confirmed
                          </span>
                        ) : (
                          <span className="ms-week-chip-done">
                            Done
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
                {d.openCount > 0 && (
                  <li className="ms-week-more">
                    + {d.openCount} open slot{d.openCount === 1 ? "" : "s"}
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Month view — compact grid, dots on mobile, chips from sm up
   ──────────────────────────────────────────────────────────────────────────── */

function MonthGrid({ cells, todayISO, cursorISO, onSelectDay, onOpenAppointment }) {
  return (
    <section className="ms-month">
      {/* Weekday header */}
      <div className="ms-month-weekdays">
        {WEEKDAYS.map((w) => (
          <p
            key={w}
            className="ms-month-weekday"
          >
            {w}
          </p>
        ))}
      </div>

      <div className="ms-month-cells">
        {cells.map((c, idx) => {
          const isToday = c.iso === todayISO;
          const isCursor = c.iso === cursorISO;
          const d = fromISODate(c.iso);
          const confirmed = c.appts.filter((a) => a.status === "confirmed");
          return (
            <div
              key={c.iso}
              className={cn(
                "ms-month-cell",
                idx % 7 === 6 && "ms-month-cell-lastcol",
                idx >= 35 && "ms-month-cell-lastrow",
                !c.inMonth && "ms-month-cell-out",
                c.blocked && "ms-month-cell-blocked",
                isCursor && "ms-month-cell-cursor"
              )}
            >
              <div className="ms-month-cell-head">
                <button
                  onClick={() => onSelectDay(c.iso)}
                  aria-label={`Open ${prettyDate(c.iso)} in day view`}
                  className={cn(
                    "ms-month-day",
                    isToday
                      ? "ms-month-day-today"
                      : c.inMonth
                        ? "ms-month-day-in"
                        : "ms-month-day-out"
                  )}
                >
                  {d.getDate()}
                </button>
                {c.blocked && (
                  <Ban className="ms-icon-12 ms-month-blocked-icon" aria-label="Blocked day" />
                )}
              </div>

              {/* Mobile: status dots */}
              <div className="ms-month-dots">
                {c.appts.slice(0, 4).map((a) => (
                  <span
                    key={a.id}
                    className={cn(
                      "ms-month-dot",
                      a.status === "confirmed" ? "ms-month-dot-confirmed" : "ms-month-dot-done"
                    )}
                    aria-label={`${a.patientName} at ${a.time}`}
                  />
                ))}
              </div>

              {/* sm+: appointment chips */}
              <ul className="ms-month-chips">
                {confirmed.slice(0, 2).map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => onOpenAppointment(a.id)}
                      className="ms-month-chip ms-month-chip-confirmed"
                      aria-label={`${a.patientName} at ${a.time}`}
                    >
                      {a.time} {a.patientName}
                    </button>
                  </li>
                ))}
                {c.appts
                  .filter((a) => a.status === "completed")
                  .slice(0, 1)
                  .map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => onOpenAppointment(a.id)}
                        className="ms-month-chip ms-month-chip-done"
                        aria-label={`${a.patientName} at ${a.time}, completed`}
                      >
                        {a.time} {a.patientName}
                      </button>
                    </li>
                  ))}
                {(() => {
                  const shown =
                    Math.min(confirmed.length, 2) +
                    Math.min(c.appts.filter((a) => a.status === "completed").length, 1);
                  const remaining = c.appts.length - shown;
                  return remaining > 0 ? (
                    <li className="ms-month-more">
                      +{remaining} more
                    </li>
                  ) : null;
                })()}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Availability settings — working days, duration, break, time off
   ──────────────────────────────────────────────────────────────────────────── */

function AvailabilitySettings({ availability, setAvailability, doctorName, specialty }) {
  const [blockDate, setBlockDate] = useState("");
  const [blockLabel, setBlockLabel] = useState("");
  const [blockAllDay, setBlockAllDay] = useState(true);
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("12:00");

  const patchDay = (idx, patch) =>
    setAvailability((a) => ({
      ...a,
      days: a.days.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }));

  const openSlotsThisWeek = (() => {
    // Count open slots in the next 7 days with the current settings.
    let count = 0;
    const today = toISODate(new Date());
    for (let i = 0; i < 7; i++) {
      count += buildDaySlots(addDays(today, i), availability, []).openCount;
    }
    return count;
  })();

  const invalidDay = (cfg) =>
    cfg.enabled && toMinutes(cfg.end) <= toMinutes(cfg.start);
  const breakInvalid =
    availability.breakEnabled &&
    toMinutes(availability.breakEnd) <= toMinutes(availability.breakStart);

  const addBlock = () => {
    if (!blockDate) return;
    setAvailability((a) => ({
      ...a,
      blocks: [
        ...a.blocks,
        {
          id: `block-${a.blocks.length + 1}-${blockDate}`,
          date: blockDate,
          label: blockLabel.trim() || (blockAllDay ? "Unavailable (all day)" : "Unavailable"),
          start: blockAllDay ? null : blockStart,
          end: blockAllDay ? null : blockEnd,
        },
      ],
    }));
    setBlockDate("");
    setBlockLabel("");
    setBlockAllDay(true);
    toast({
      title: "Time added to your schedule",
      description: `${blockAllDay ? "All day" : `${blockStart}–${blockEnd}`} on ${prettyDate(
        blockDate
      )} is now blocked — patients can no longer book it.`,
    });
  };

  const saveAvailability = () => {
    toast({
      title: "Availability saved",
      description:
        "Patients instantly see the updated open slots. Booked appointments keep their time.",
    });
  };

  const blockDateInvalid =
    !!blockDate &&
    !blockAllDay &&
    toMinutes(blockEnd) <= toMinutes(blockStart);

  return (
    <div className="ms-av-root">
      {/* Instant-booking explainer */}
      <div className="ms-av-explainer">
        <Info className="ms-icon-16 ms-av-explainer-icon" />
        <p className="ms-av-explainer-text">
          These hours drive what patients can book on your Find a Doctor
          profile. Only{" "}
          <span className="ms-av-explainer-strong">open slots</span> can
          be booked — when a patient confirms, that slot is booked instantly
          (no manual approval) and becomes unavailable. Breaks, time off and
          non-working days are never bookable.
        </p>
      </div>

      {/* Working days & hours */}
      <section className="ms-panel">
        <div className="ms-panel-head">
          <h2 className="ms-panel-title">
            <CalendarDays className="ms-icon-16 ms-icon-primary" />
            Working days &amp; hours
          </h2>
          <p className="ms-panel-meta">
            {openSlotsThisWeek} open slot{openSlotsThisWeek === 1 ? "" : "s"} in
            the next 7 days
          </p>
        </div>

        <ul className="ms-day-list">
          {availability.days.map((cfg, idx) => {
            const invalid = invalidDay(cfg);
            return (
              <li
                key={idx}
                className={cn(
                  "ms-day-row",
                  cfg.enabled ? "ms-day-row-on" : "ms-day-row-off"
                )}
              >
                <div className="ms-day-row-inner">
                  <label className="ms-day-label">
                    <input
                      type="checkbox"
                      checked={cfg.enabled}
                      onChange={(e) => patchDay(idx, { enabled: e.target.checked })}
                      className="ms-checkbox"
                      aria-label={`${WEEKDAYS_LONG[idx]} working day`}
                    />
                    <span
                      className={cn(
                        "ms-day-name",
                        cfg.enabled ? "ms-day-name-on" : "ms-day-name-off"
                      )}
                    >
                      {WEEKDAYS_LONG[idx]}
                    </span>
                  </label>

                  {cfg.enabled ? (
                    <div className="ms-day-times">
                      <Select
                        value={cfg.start}
                        onValueChange={(v) => patchDay(idx, { start: v })}
                      >
                        <SelectTrigger
                          className="ms-select-trigger"
                          aria-label={`${WEEKDAYS_LONG[idx]} start time`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="ms-day-to">to</span>
                      <Select
                        value={cfg.end}
                        onValueChange={(v) => patchDay(idx, { end: v })}
                      >
                        <SelectTrigger
                          className="ms-select-trigger"
                          aria-label={`${WEEKDAYS_LONG[idx]} end time`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {invalid && (
                        <span className="ms-day-invalid">
                          End time must be after start
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="ms-day-off-note">
                      Not working — patients cannot book this day.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Appointment duration */}
      <section className="ms-panel">
        <h2 className="ms-panel-title">
          <Clock className="ms-icon-16 ms-icon-primary" />
          Appointment duration
        </h2>
        <p className="ms-panel-sub">
          Each bookable slot lasts this long. Changing it reshapes the calendar
          grid instantly.
        </p>
        <div className="ms-duration-group" role="group" aria-label="Slot duration">
          {[15, 30, 45].map((d) => (
            <button
              key={d}
              onClick={() => setAvailability((a) => ({ ...a, durationMins: d }))}
              aria-pressed={availability.durationMins === d}
              className={cn(
                "ms-duration-btn",
                availability.durationMins === d
                  ? "ms-duration-btn-active"
                  : "ms-duration-btn-idle"
              )}
            >
              {d} min
            </button>
          ))}
        </div>
      </section>

      {/* Break */}
      <section className="ms-panel">
        <div className="ms-break-head">
          <div>
            <h2 className="ms-panel-title">
              <Coffee className="ms-icon-16 ms-icon-primary" />
              Daily break
            </h2>
            <p className="ms-panel-sub">
              A recurring pause inside your working hours — slots overlapping it
              are not bookable.
            </p>
          </div>
          <label className="ms-break-toggle">
            <input
              type="checkbox"
              checked={availability.breakEnabled}
              onChange={(e) =>
                setAvailability((a) => ({ ...a, breakEnabled: e.target.checked }))
              }
              className="ms-checkbox"
              aria-label="Enable daily break"
            />
            <span className="ms-break-toggle-state">
              {availability.breakEnabled ? "On" : "Off"}
            </span>
          </label>
        </div>

        {availability.breakEnabled && (
          <div className="ms-break-times">
            <Select
              value={availability.breakStart}
              onValueChange={(v) => setAvailability((a) => ({ ...a, breakStart: v }))}
            >
              <SelectTrigger className="ms-select-trigger-bg" aria-label="Break start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ms-day-to">to</span>
            <Select
              value={availability.breakEnd}
              onValueChange={(v) => setAvailability((a) => ({ ...a, breakEnd: v }))}
            >
              <SelectTrigger className="ms-select-trigger-bg" aria-label="Break end">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {breakInvalid && (
              <span className="ms-day-invalid">
                Break end must be after start
              </span>
            )}
          </div>
        )}
      </section>

      {/* Time off & holidays */}
      <section className="ms-panel">
        <h2 className="ms-panel-title">
          <Ban className="ms-icon-16 ms-icon-primary" />
          Time off, holidays &amp; blocked periods
        </h2>
        <p className="ms-panel-sub">
          Block a full day (holiday, leave) or a period inside a working day.
          Blocked time is removed from the bookable slots.
        </p>

        {/* Add form */}
        <div className="ms-block-form">
          <div className="ms-block-form-inner">
            <div className="ms-block-form-row">
              <label className="ms-field">
                <span className="ms-field-label">
                  Date
                </span>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="ms-input"
                  aria-label="Block date"
                />
              </label>
              <label className="ms-field ms-field-wide">
                <span className="ms-field-label">
                  Label (optional)
                </span>
                <input
                  value={blockLabel}
                  onChange={(e) => setBlockLabel(e.target.value)}
                  placeholder="e.g. Public holiday, Annual leave…"
                  className="ms-input"
                  aria-label="Block label"
                />
              </label>
            </div>

            <div className="ms-block-form-controls">
              <label className="ms-allday-toggle">
                <input
                  type="checkbox"
                  checked={blockAllDay}
                  onChange={(e) => setBlockAllDay(e.target.checked)}
                  className="ms-checkbox"
                  aria-label="Block the whole day"
                />
                Whole day
              </label>
              {!blockAllDay && (
                <>
                  <Select value={blockStart} onValueChange={setBlockStart}>
                    <SelectTrigger className="ms-select-trigger" aria-label="Block start time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="ms-day-to">to</span>
                  <Select value={blockEnd} onValueChange={setBlockEnd}>
                    <SelectTrigger className="ms-select-trigger" aria-label="Block end time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {blockDateInvalid && (
                    <span className="ms-day-invalid">
                      End must be after start
                    </span>
                  )}
                </>
              )}
              <Button
                size="sm"
                onClick={addBlock}
                disabled={!blockDate || blockDateInvalid}
                className="ms-btn-add"
              >
                <Plus className="ms-icon-14 ms-icon-mr-6" />
                Add block
              </Button>
            </div>
          </div>
        </div>

        {/* Existing blocks */}
        {availability.blocks.length === 0 ? (
          <p className="ms-blocks-empty">
            No blocked dates — all your working hours are bookable.
          </p>
        ) : (
          <ul className="ms-blocks-list">
            {availability.blocks.map((b) => (
              <li
                key={b.id}
                className="ms-block-row"
              >
                <span className="ms-block-row-icon">
                  <Ban className="ms-icon-16" />
                </span>
                <div className="ms-block-row-main">
                  <p className="ms-block-row-label">{b.label}</p>
                  <p className="ms-block-row-meta">
                    {prettyDate(b.date)} ·{" "}
                    {b.start && b.end ? `${b.start}–${b.end}` : "Whole day"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setAvailability((a) => ({
                      ...a,
                      blocks: a.blocks.filter((x) => x.id !== b.id),
                    }))
                  }
                  aria-label={`Remove block: ${b.label}`}
                  className="ms-block-remove"
                >
                  <Trash2 className="ms-icon-14" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Save bar */}
      <div className="ms-save-bar">
        <p className="ms-save-note">
          <CheckCircle2 className="ms-icon-14 ms-save-note-icon" />
          Saving publishes these hours to patients right away. Existing
          appointments always keep their confirmed time.
        </p>
        <Button
          onClick={saveAvailability}
          disabled={availability.days.some(invalidDay) || breakInvalid}
          className="ms-btn-block"
        >
          <Save className="ms-icon-16 ms-icon-mr-8" />
          Save availability
        </Button>
      </div>

      {/* Doctor context footer */}
      <p className="ms-av-footer">
        <Stethoscope className="ms-icon-12 ms-icon-primary" />
        {doctorName} · {specialty} · Nile Badrawi Hospital, Maadi — in-clinic
        consultations only.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Visit record detail (read-only clinical record for completed appointments)
   ──────────────────────────────────────────────────────────────────────────── */

function VisitRecordView({ patientName, record, onBack }) {
  return (
    <div className="ms-page">
      <button
        onClick={onBack}
        className="ms-back-btn"
      >
        <ArrowLeft className="ms-icon-14" />
        Back to my schedule
      </button>

      {/* Header */}
      <section className="ms-record-panel ms-record-panel-first">
        <div className="ms-record-head">
          <PatientAvatar name={patientName} size={56} />
          <div className="ms-record-head-main">
            <h1 className="ms-record-title">
              Visit record — {patientName}
            </h1>
            <p className="ms-record-meta">
              <span className="ms-record-meta-item">
                <CalendarDays className="ms-icon-14 ms-icon-primary" />
                Recorded on {record.recordedOn}
              </span>
              <span className="ms-record-meta-item">
                <MapPin className="ms-icon-14 ms-icon-primary" />
                Nile Badrawi Hospital, Maadi
              </span>
            </p>
          </div>
          <span className="ms-record-completed">
            <CheckCircle2 className="ms-icon-14" />
            Completed visit
          </span>
        </div>
      </section>

      {/* Diagnosis */}
      <section className="ms-record-panel">
        <h2 className="ms-record-section-title">
          <Stethoscope className="ms-icon-16 ms-icon-primary" />
          Diagnosis
        </h2>
        <p className="ms-record-section-text">
          {record.diagnosis}
        </p>
      </section>

      {/* Clinical notes */}
      <section className="ms-record-panel">
        <h2 className="ms-record-section-title">
          <FileText className="ms-icon-16 ms-icon-primary" />
          Clinical notes
        </h2>
        <p className="ms-record-section-text">
          {record.notes}
        </p>
        <p className="ms-record-notes-foot">
          The patient sees only the notes you choose to share — private drafts
          and internal remarks stay visible to you alone.
        </p>
      </section>

      {/* Treatment */}
      <section className="ms-record-panel">
        <h2 className="ms-record-section-title">
          <ClipboardList className="ms-icon-16 ms-icon-primary" />
          Treatment &amp; recommendations
        </h2>
        <ul className="ms-record-treatment">
          {record.treatment.map((t) => (
            <li key={t} className="ms-record-treatment-item">
              <span className="ms-record-bullet" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Prescriptions */}
      <section className="ms-record-panel">
        <h2 className="ms-record-section-title">
          <Pill className="ms-icon-16 ms-icon-primary" />
          Prescriptions
        </h2>
        {record.prescriptions.length === 0 ? (
          <p className="ms-record-rx-empty">
            No prescriptions were issued at this visit.
          </p>
        ) : (
          <ul className="ms-record-rx-list">
            {record.prescriptions.map((p) => (
              <li
                key={p}
                className="ms-record-rx-item"
              >
                {p}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Follow-up */}
      {record.followUp && (
        <div className="ms-record-followup">
          <Sunrise className="ms-icon-16 ms-record-followup-icon" />
          <p className="ms-record-followup-text">
            <span className="ms-record-followup-strong">Follow-up:</span> {record.followUp}
          </p>
        </div>
      )}
    </div>
  );
}

export default MySchedule;
