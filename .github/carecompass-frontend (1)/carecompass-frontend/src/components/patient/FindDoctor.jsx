/* =====================================
   FindDoctor — patient doctor directory + booking
   Plain-JS port of the workspace find-doctor.tsx.
   Listing → Doctor profile → Booking flow → Success.
   In-clinic consultations only (Egyptian clinic prototype).
   All data is in-file; availability is generated deterministically.
===================================== */

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Star,
  BadgeCheck,
  MapPin,
  GraduationCap,
  CalendarDays,
  Clock,
  Wallet,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  SearchX,
  Building2,
  Languages,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/Select";
import { toast } from "../../hooks/use-toast";
import "./FindDoctor.css";

/* ── Constants ────────────────────────────────────────────────── */
const MORNING_TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const EVENING_TIMES = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── Doctors (verbatim from the workspace) ────────────────────── */
const DOCTORS = [
  {
    id: "hana-kamal", name: "Dr. Hana Kamal", specialty: "Cardiology",
    headline: "Consultant cardiologist focused on preventive heart care and honest, unhurried explanations.",
    experience: 14, rating: 4.8, reviewCount: 124, verified: true, fee: 600, photo: "/assets/doc-1.jpg",
    clinic: { name: "Nile Badrawi Hospital", address: "14 Saray El Manial St, Maadi", area: "Maadi, Cairo" },
    education: ["MBBCh — Cairo University, 2008", "MD Cardiology — Ain Shams University, 2015", "Fellowship in Interventional Cardiology — Vienna, 2017"],
    bio: "Dr. Hana believes a heart check-up should never feel rushed. She reads your full history before you walk in, explains every result in plain words, and only orders the tests she can justify. Her patients describe her as calm, precise, and genuinely easy to talk to.",
    languages: ["Arabic", "English", "French"], sessions: ["morning", "evening"],
    reviews: [
      { author: "Mariam R.", when: "2 weeks ago", rating: 5, text: "Took the time to read my history before the visit. Explained my blood pressure plan without any jargon." },
      { author: "Tarek M.", when: "1 month ago", rating: 5, text: "The first cardiologist who told me what I don't need to worry about, not just what to fear." },
      { author: "Aya S.", when: "2 months ago", rating: 4, text: "Excellent doctor. The clinic gets busy, so arrive early — but the visit itself is never hurried." },
    ],
  },
  {
    id: "omar-fathy", name: "Dr. Omar Fathy", specialty: "Neurology",
    headline: "Neurologist specialising in headaches, epilepsy, and sleep problems — with careful, evidence-first follow-ups.",
    experience: 11, rating: 4.7, reviewCount: 96, verified: true, fee: 550, photo: "/assets/doc-2.jpg",
    clinic: { name: "Cairo Neuro & Scan Clinic", address: "Abbas El Akkad St, Nasr City", area: "Nasr City, Cairo" },
    education: ["MBBCh — Ain Shams University, 2011", "Master's in Clinical Neurology — Cairo University, 2016", "EEG & Epilepsy training — King's College London, 2019"],
    bio: "Dr. Omar keeps a simple promise with every patient: no test without a reason, and no diagnosis without showing you the evidence. He runs one of the few dedicated epilepsy follow-up clinics in Nasr City.",
    languages: ["Arabic", "English"], sessions: ["evening"],
    reviews: [
      { author: "Hossam A.", when: "3 weeks ago", rating: 5, text: "After three years of migraines, two visits were enough to find the right treatment. Life-changing." },
      { author: "Nada K.", when: "1 month ago", rating: 4, text: "Very thorough. Evening appointments run a bit late but he never rushes you once you're in." },
    ],
  },
  {
    id: "salma-abdel-aziz", name: "Dr. Salma Abdel Aziz", specialty: "Dermatology",
    headline: "Dermatologist for medical skin care, acne, and hair loss — treatment plans you can actually keep up with.",
    experience: 9, rating: 4.9, reviewCount: 210, verified: true, fee: 450, photo: "/assets/doc-3.jpg",
    clinic: { name: "Glow Dermatology Clinic", address: "12 Baghdad St, Korba", area: "Heliopolis, Cairo" },
    education: ["MBBCh — Cairo University, 2013", "Master's in Dermatology & Venereology — Alexandria University, 2018", "Laser & Aesthetic Medicine diploma — 2020"],
    bio: "Dr. Salma built her reputation on realistic skincare: no miracle promises, just a clear diagnosis, a short written plan, and follow-ups until the problem is actually gone. She is especially loved by acne and hair-loss patients.",
    languages: ["Arabic", "English"], sessions: ["morning", "evening"],
    reviews: [
      { author: "Habiba E.", when: "1 week ago", rating: 5, text: "My skin has never been better. She explained every product and told me which ones to stop wasting money on." },
      { author: "Omar T.", when: "3 weeks ago", rating: 5, text: "Direct, kind, and the plan worked. Booking is easy and the clinic runs on time." },
      { author: "Salma N.", when: "2 months ago", rating: 5, text: "Best dermatologist in Heliopolis. Worth every pound." },
    ],
  },
  {
    id: "youssef-abdel-rahman", name: "Dr. Youssef Abdel Rahman", specialty: "Orthopedics",
    headline: "Orthopedic surgeon for sports injuries, knee and shoulder problems — surgery always the last resort.",
    experience: 13, rating: 4.6, reviewCount: 88, verified: true, fee: 500, photo: "/assets/doc-4.jpg",
    clinic: { name: "Active Ortho Center", address: "El Bostan District, 8th District", area: "Sheikh Zayed, Giza" },
    education: ["MBBCh — Alexandria University, 2009", "Master's in Orthopedic Surgery — Cairo University, 2014", "Arthroscopy & Sports Medicine fellowship — Lyon, 2018"],
    bio: "A former university basketball player, Dr. Youssef understands athletes — and ordinary knees. He is known for exhausting every conservative option before mentioning surgery, and for clear post-op rehabilitation plans.",
    languages: ["Arabic", "English"], sessions: ["morning"],
    reviews: [
      { author: "Karim H.", when: "2 weeks ago", rating: 5, text: "Avoided a knee surgery thanks to his rehab plan. Six months later I'm back to running." },
      { author: "Mona G.", when: "1 month ago", rating: 4, text: "Very professional. Morning clinic only, so plan your day — but absolutely worth it." },
    ],
  },
  {
    id: "layla-hassan", name: "Dr. Layla Hassan", specialty: "Pediatrics",
    headline: "Pediatrician for newborns and children — gentle with kids, straight answers for parents.",
    experience: 10, rating: 4.9, reviewCount: 167, verified: true, fee: 350, photo: "/assets/doc-5.jpg",
    clinic: { name: "Little Steps Pediatrics", address: "90th St, 5th Settlement", area: "New Cairo" },
    education: ["MBBCh — Cairo University, 2012", "Master's in Pediatrics — Ain Shams University, 2017", "Neonatal Resuscitation instructor — 2019"],
    bio: "Dr. Layla's clinic has a small play corner and a strict rule: children are examined where they feel safe. Parents praise her for explaining when to worry — and when it's just a virus that needs patience.",
    languages: ["Arabic", "English"], sessions: ["morning", "evening"],
    reviews: [
      { author: "Yasmin F.", when: "1 week ago", rating: 5, text: "My toddler actually laughs at the clinic now. She never prescribes antibiotics without a clear reason." },
      { author: "Ahmed W.", when: "2 weeks ago", rating: 5, text: "Called us back personally the day after our baby's fever. That says everything." },
    ],
  },
  {
    id: "karim-moustafa", name: "Dr. Karim Moustafa", specialty: "ENT",
    headline: "Ear, nose and throat consultant — 22 years of experience in sinus and hearing problems.",
    experience: 22, rating: 4.4, reviewCount: 61, verified: true, fee: 400, photo: "/assets/doc-6.jpg",
    clinic: { name: "ClearSound ENT Clinic", address: "52 Tahrir St, Dokki", area: "Dokki, Giza" },
    education: ["MBBCh — Cairo University, 2000", "Master's in ENT — Cairo University, 2005", "Endoscopic Sinus Surgery training — Graz, 2010"],
    bio: "Dr. Karim has treated three generations of families from the same buildings around Dokki. His clinic calendar fills quickly — bookings usually open a week ahead.",
    languages: ["Arabic", "English", "German"], sessions: ["morning", "evening"], fullyBooked: true,
    reviews: [
      { author: "Rami D.", when: "1 month ago", rating: 5, text: "Fixed a ten-year sinus problem in one session. Hard to get an appointment, impossible to fault the care." },
      { author: "Salwa M.", when: "2 months ago", rating: 4, text: "Very experienced doctor. The waiting list is long, so book early." },
    ],
  },
  {
    id: "farida-el-sharkawy", name: "Dr. Farida El-Sharkawy", specialty: "Obstetrics & Gynecology",
    headline: "Consultant in pregnancy care and women's health — known for calm visits and zero unnecessary interventions.",
    experience: 16, rating: 4.8, reviewCount: 143, verified: true, fee: 550, photo: "/assets/doc-7.jpg",
    clinic: { name: "Care Women's Clinic", address: "14 Shehab St, Mohandessin", area: "Mohandessin, Giza" },
    education: ["MBBCh — Cairo University, 2006", "Master's in Obstetrics & Gynecology — Cairo University, 2012", "Fetal Medicine Foundation certificate — 2016"],
    bio: "Dr. Farida follows a simple philosophy: informed women make the best decisions. She walks every expectant mother through each scan and each option, and keeps a written birth-plan conversation from the first trimester.",
    languages: ["Arabic", "English"], sessions: ["morning", "evening"],
    reviews: [
      { author: "Dina L.", when: "2 weeks ago", rating: 5, text: "Followed my whole pregnancy with her. Calm, honest, and my C-section plan was respected completely." },
      { author: "Heba R.", when: "1 month ago", rating: 5, text: "She answers the little questions other doctors wave away. The clinic is spotless and organised." },
    ],
  },
  {
    id: "ahmed-el-dengawy", name: "Dr. Ahmed El-Dengawy", specialty: "Internal Medicine",
    headline: "Internist for diabetes, blood pressure, and everyday family medicine — clear notes you can actually follow.",
    experience: 7, rating: 4.3, reviewCount: 52, verified: true, fee: 300, photo: "/assets/doc-8.jpg",
    clinic: { name: "Shifa Family Clinic", address: "Gamel Abdel Nasser Rd, Smouha", area: "Smouha, Alexandria" },
    education: ["MBBCh — Alexandria University, 2015", "Master's in Internal Medicine — Alexandria University, 2020", "Diabetes care certificate — EASD, 2022"],
    bio: "The youngest consultant on our list — and the first to tell you when you don't need a specialist at all. Dr. Ahmed keeps every patient's medication list on one printed page, reviewed together at each visit.",
    languages: ["Arabic", "English"], sessions: ["evening"],
    reviews: [
      { author: "Mostafa Z.", when: "1 week ago", rating: 4, text: "Great follow-up on my father's diabetes. One page with everything — brilliant idea." },
      { author: "Reem H.", when: "3 weeks ago", rating: 5, text: "Honest, affordable, and easy to talk to. Rare combination." },
    ],
  },
];

const SPECIALTIES = [...new Set(DOCTORS.map((d) => d.specialty))].sort();
const RATING_OPTIONS = [
  { value: "any", label: "Any rating" },
  { value: "4.5", label: "4.5 ★ & up" },
  { value: "4.0", label: "4.0 ★ & up" },
  { value: "3.5", label: "3.5 ★ & up" },
];
const AVAIL_OPTIONS = [
  { value: "any", label: "Any day" },
  { value: "today", label: "Available today" },
  { value: "tomorrow", label: "Available tomorrow" },
  { value: "week", label: "Next 7 days" },
];

/* ── Date / availability helpers (deterministic) ──────────────── */
function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function buildAvailability(doctor) {
  const now = new Date();
  const todayISO = toISODate(now);
  const times = [];
  if (doctor.sessions.includes("morning")) times.push(...MORNING_TIMES);
  if (doctor.sessions.includes("evening")) times.push(...EVENING_TIMES);

  const days = [];
  const cursor = new Date(now);
  let scanned = 0;
  while (days.length < 5 && scanned < 12) {
    scanned++;
    if (cursor.getDay() === 5) { /* Friday — Egyptian clinics closed */
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    const iso = toISODate(cursor);
    const d = fromISODate(iso);
    const diff = Math.round((d.getTime() - fromISODate(todayISO).getTime()) / 864e5);
    const label = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : WEEKDAYS[d.getDay()];
    const slots = times.map((t) => {
      let booked = !!doctor.fullyBooked;
      if (!booked && iso === todayISO) {
        const [h, m] = t.split(":").map(Number);
        const slotTime = new Date(d); slotTime.setHours(h, m, 0, 0);
        if (slotTime.getTime() < now.getTime() + 60 * 60 * 1000) booked = true;
      }
      if (!booked && hashStr(`${doctor.id}|${iso}|${t}`) % 100 < 34) booked = true;
      return { time: t, booked };
    });
    days.push({ iso, weekday: WEEKDAYS[d.getDay()], dayNum: d.getDate(), month: MONTHS[d.getMonth()], label, slots });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
function firstOpenLabel(avail) {
  for (const d of avail) {
    const open = d.slots.find((s) => !s.booked);
    if (open) return `${d.label} · ${open.time}`;
  }
  return null;
}
function hasOpenOn(avail, iso) {
  return avail.some((d) => (!iso || d.iso === iso) && d.slots.some((s) => !s.booked));
}

/* ── Sub-components ───────────────────────────────────────────── */
function Stars({ rating, size = 14 }) {
  const rounded = Math.round(rating);
  return (
    <span className="fd-stars" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className={cn("fd-star", i < rounded && "fd-star-filled")} style={{ width: size, height: size }} />
      ))}
    </span>
  );
}
function VerifiedChip() {
  return (
    <span className="fd-verified-chip">
      <BadgeCheck className="fd-icon-12" />
      Verified
    </span>
  );
}
function Avatar({ doctor, size = 88 }) {
  const [failed, setFailed] = useState(false);
  const initials = doctor.name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("").slice(0, 2);
  if (failed) {
    return <span className="fd-avatar fd-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.32 }}>{initials}</span>;
  }
  return (
    <img
      src={doctor.photo}
      alt={`Portrait of ${doctor.name}, ${doctor.specialty}`}
      className="fd-avatar"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}

export function FindDoctor({ initialDoctorId = null }) {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");
  const [minRating, setMinRating] = useState("any");
  const [availFilter, setAvailFilter] = useState("any");
  const [selectedId, setSelectedId] = useState(initialDoctorId);
  const [lastBooking, setLastBooking] = useState(null);

  useEffect(() => {
    if (initialDoctorId) {
      setSelectedId(initialDoctorId);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    }
  }, [initialDoctorId]);

  const availabilities = useMemo(() => Object.fromEntries(DOCTORS.map((d) => [d.id, buildAvailability(d)])), []);

  const filtersActive = query !== "" || specialty !== "all" || minRating !== "any" || availFilter !== "any";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DOCTORS.filter((d) => {
      if (q && !(`${d.name} ${d.specialty}`.toLowerCase().includes(q))) return false;
      if (specialty !== "all" && d.specialty !== specialty) return false;
      if (minRating !== "any" && d.rating < Number(minRating)) return false;
      const avail = availabilities[d.id];
      if (availFilter === "today" && !hasOpenOn([avail[0]])) return false;
      if (availFilter === "tomorrow" && !(avail[1] && hasOpenOn([avail[1]]))) return false;
      if (availFilter === "week" && !hasOpenOn(avail)) return false;
      return true;
    });
  }, [query, specialty, minRating, availFilter, availabilities]);

  function resetFilters() {
    setQuery(""); setSpecialty("all"); setMinRating("any"); setAvailFilter("any");
  }

  const selectedDoctor = DOCTORS.find((d) => d.id === selectedId) || null;
  const bookedDoctor = lastBooking ? DOCTORS.find((d) => d.id === lastBooking.doctorId) : null;

  if (lastBooking && bookedDoctor) {
    return <SuccessView doctor={bookedDoctor} booking={lastBooking}
      onBookAnother={() => setLastBooking(null)}
      onBack={() => { setLastBooking(null); setSelectedId(null); }} />;
  }
  if (selectedDoctor) {
    return <DoctorProfile doctor={selectedDoctor} availability={availabilities[selectedDoctor.id]}
      onBack={() => setSelectedId(null)}
      onBooked={(dateIso, time) => { setLastBooking({ doctorId: selectedDoctor.id, dateIso, time }); }}
      onResetSelection={() => setSelectedId(null)} />;
  }

  return (
    <div className="fd-page">
      {/* Header */}
      <div className="fd-header">
        <p className="fd-eyebrow">In-clinic consultations</p>
        <h1 className="fd-title">Find a Doctor</h1>
        <p className="fd-subtitle">Find the right specialist and book an in-clinic consultation.</p>
      </div>

      {/* Search & filters */}
      <div className="fd-filters-card">
        <div className="fd-search-wrap">
          <Search className="fd-icon-16 fd-search-icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by doctor name or specialty…"
            aria-label="Search by doctor name or specialty"
            className="fd-search-input"
          />
          {query && (
            <button onClick={() => setQuery("")} className="fd-clear-search" aria-label="Clear search">×</button>
          )}
        </div>
        <div className="fd-filter-grid">
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="fd-filter-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specialties</SelectItem>
              {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="fd-filter-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RATING_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={availFilter} onValueChange={setAvailFilter}>
            <SelectTrigger className="fd-filter-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AVAIL_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="fd-result-row">
          <span className="fd-result-count">
            {filtered.length} doctor{filtered.length === 1 ? "" : "s"} found{filtersActive ? " · filters applied" : ""}
          </span>
          {filtersActive && (
            <button onClick={resetFilters} className="fd-reset-btn">
              <RotateCcw className="fd-icon-12" /> Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Doctor list */}
      {filtered.length === 0 ? (
        <div className="fd-empty">
          <span className="fd-empty-icon"><SearchX className="fd-icon-24" /></span>
          <h2 className="fd-empty-title">No doctors found</h2>
          <p className="fd-empty-text">No doctor matches your search or filters right now. Try a different name, specialty, or widen your availability.</p>
          <button onClick={resetFilters} className="fd-reset-all-btn">Reset all filters</button>
        </div>
      ) : (
        <ul className="fd-doctor-list">
          {filtered.map((d) => (
            <DoctorCard key={d.id} doctor={d} availability={availabilities[d.id]} onOpen={() => { setSelectedId(d.id); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }} />
          ))}
        </ul>
      )}

      <p className="fd-footer-disclaimer">
        Every doctor on CareCompass passes identity verification before appearing here.
      </p>
    </div>
  );
}

function DoctorCard({ doctor, availability, onOpen }) {
  const nextLabel = firstOpenLabel(availability);
  return (
    <li className="fd-card">
      <Avatar doctor={doctor} size={88} />
      <div className="fd-card-main">
        <div className="fd-card-name-row">
          <h3 className="fd-card-name">{doctor.name}</h3>
          {doctor.verified && <VerifiedChip />}
        </div>
        <div className="fd-card-spec-row">
          <span className="fd-card-pill">{doctor.specialty}</span>
          <span className="fd-card-exp">{doctor.experience} years of experience</span>
        </div>
        <p className="fd-card-headline">{doctor.headline}</p>
        <div className="fd-card-meta">
          <span className="fd-card-meta-item"><MapPin className="fd-icon-12" /> {doctor.clinic.area}</span>
          <span className="fd-card-meta-item"><Wallet className="fd-icon-12" /> EGP {doctor.fee} consultation</span>
          <span className="fd-card-meta-item"><Languages className="fd-icon-12" /> {doctor.languages.join(" · ")}</span>
        </div>
      </div>
      <div className="fd-card-aside">
        <div className="fd-card-rating">
          <Stars rating={doctor.rating} />
          <span className="fd-card-rating-num">{doctor.rating}</span>
          <span className="fd-card-review-count">{doctor.reviewCount} patient reviews</span>
        </div>
        {nextLabel ? (
          <span className="fd-card-next">Next available: {nextLabel}</span>
        ) : (
          <span className="fd-card-full">Fully booked this week</span>
        )}
        <Button variant="outline" size="sm" onClick={onOpen} className="fd-view-profile-btn">
          View Profile <ChevronRight className="fd-icon-14" />
        </Button>
      </div>
    </li>
  );
}

function DoctorProfile({ doctor, availability, onBack, onBooked, onResetSelection }) {
  const [flowStarted, setFlowStarted] = useState(false);
  const [dateIso, setDateIso] = useState(null);
  const [time, setTime] = useState(null);
  const fullyBooked = !hasOpenOn(availability);

  function startFlow() {
    setFlowStarted(true);
    const firstOpen = availability.find((d) => hasOpenOn([d]));
    if (firstOpen) setDateIso(firstOpen.iso);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }
  function onPickDate(iso) { setDateIso(iso); setTime(null); }
  function onPickTime(t) { setTime(t); }
  function onConfirmed(iso, t) {
    toast({ title: "Appointment booked", description: `Your in-clinic consultation with ${doctor.name} is confirmed.` });
    onBooked(iso, t);
  }

  return (
    <div className="fd-profile">
      <button onClick={onBack} className="fd-back-btn">
        <ArrowLeft className="fd-icon-14" /> Back to results
      </button>

      {/* Header card */}
      <div className="fd-profile-header">
        <Avatar doctor={doctor} size={112} />
        <div className="fd-profile-head-main">
          <div className="fd-card-name-row">
            <h1 className="fd-profile-name">{doctor.name}</h1>
            {doctor.verified && <VerifiedChip />}
          </div>
          <div className="fd-card-spec-row">
            <span className="fd-card-pill">{doctor.specialty}</span>
            <span className="fd-card-exp">{doctor.experience} years of experience</span>
          </div>
          <div className="fd-profile-meta">
            <span className="fd-profile-rating"><Stars rating={doctor.rating} /> {doctor.rating} · {doctor.reviewCount} reviews</span>
            <span className="fd-card-meta-item"><Wallet className="fd-icon-12" /> EGP {doctor.fee} consultation fee</span>
            <span className="fd-card-meta-item"><Languages className="fd-icon-12" /> {doctor.languages.join(" · ")}</span>
          </div>
        </div>
        <div className="fd-profile-head-action">
          {fullyBooked ? (
            <span className="fd-card-full fd-full-pill">Fully booked this week</span>
          ) : (
            <Button onClick={startFlow}><CalendarDays className="fd-icon-14" /> Book Consultation</Button>
          )}
          <p className="fd-profile-note">In-clinic visits only</p>
        </div>
      </div>

      <div className="fd-profile-grid">
        {/* Info column */}
        <div className="fd-info-col">
          <InfoCard icon={Stethoscope} title="About">
            <p className="fd-info-text">{doctor.bio}</p>
          </InfoCard>
          <InfoCard icon={GraduationCap} title="Qualifications & education">
            <ul className="fd-edu-list">
              {doctor.education.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </InfoCard>
          <InfoCard icon={MapPin} title="Clinic & location">
            <p className="fd-info-text fd-clinic-name">{doctor.clinic.name}</p>
            <p className="fd-info-text fd-clinic-addr">{doctor.clinic.address} · {doctor.clinic.area}</p>
            <span className="fd-inclinic-pill">This doctor receives in-clinic only — no video consultations.</span>
          </InfoCard>
          <InfoCard icon={Star} title={`Patient reviews (${doctor.reviewCount})`}>
            <div className="fd-reviews">
              {doctor.reviews.map((r, i) => (
                <div key={i} className="fd-review">
                  <div className="fd-review-head">
                    <span className="fd-review-author">{r.author}</span>
                    <span className="fd-review-when">{r.when}</span>
                    <Stars rating={r.rating} size={12} />
                  </div>
                  <p className="fd-review-text">“{r.text}”</p>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>

        {/* Booking column */}
        <div className="fd-booking-col">
          <BookingCard doctor={doctor} availability={availability} flowStarted={flowStarted}
            dateIso={dateIso} time={time} fullyBooked={fullyBooked}
            onStart={startFlow} onPickDate={onPickDate} onPickTime={onPickTime} onConfirmed={onConfirmed} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <section className="fd-info-card">
      <div className="fd-info-head">
        <span className="fd-info-icon-tile"><Icon className="fd-icon-16" /></span>
        <h2 className="fd-info-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function BookingCard({ doctor, availability, flowStarted, dateIso, time, fullyBooked, onStart, onPickDate, onPickTime, onConfirmed }) {
  const selectedDay = availability.find((d) => d.iso === dateIso);
  const morningSlots = selectedDay ? selectedDay.slots.filter((s) => MORNING_TIMES.includes(s.time)) : [];
  const eveningSlots = selectedDay ? selectedDay.slots.filter((s) => EVENING_TIMES.includes(s.time)) : [];

  return (
    <div className="fd-booking-card">
      <p className="fd-booking-title">Book an in-clinic consultation</p>
      <p className="fd-booking-fee">EGP {doctor.fee} · paid at the clinic</p>

      {!flowStarted ? (
        fullyBooked ? (
          <div className="fd-booking-full-box">
            No open slots on the coming days. Check back soon — new dates open weekly.
          </div>
        ) : (
          <>
            <span className="fd-booking-next">Next available: {firstOpenLabel(availability)}</span>
            <Button onClick={onStart} className="fd-booking-cta"><CalendarDays className="fd-icon-14" /> Book Consultation</Button>
            <p className="fd-booking-helper">Choose a date, pick a time slot, and your visit is confirmed instantly.</p>
          </>
        )
      ) : (
        <>
          <fieldset className="fd-flow-step">
            <legend className="fd-flow-legend">1 Choose a date</legend>
            <div className="fd-day-grid">
              {availability.map((d) => {
                const open = hasOpenOn([d]);
                return (
                  <button key={d.iso} type="button" disabled={!open}
                    onClick={() => onPickDate(d.iso)}
                    className={cn("fd-day-btn", dateIso === d.iso && "fd-day-btn-active")}>
                    <span className="fd-day-wd">{d.label}</span>
                    <span className="fd-day-num">{d.dayNum}</span>
                    <span className="fd-day-mon">{d.month}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="fd-flow-step">
            <legend className="fd-flow-legend">2 Choose a time</legend>
            {!dateIso ? (
              <p className="fd-slot-prompt">Select a date above to see open time slots.</p>
            ) : !hasOpenOn([selectedDay]) ? (
              <p className="fd-slot-prompt">No open slots on {selectedDay.weekday} {selectedDay.dayNum} {selectedDay.month}. Please pick another date.</p>
            ) : (
              <>
                {morningSlots.length > 0 && <SlotGroup label="Morning" slots={morningSlots} time={time} onPick={onPickTime} />}
                {eveningSlots.length > 0 && <SlotGroup label="Evening" slots={eveningSlots} time={time} onPick={onPickTime} />}
                <p className="fd-slot-helper">Crossed-out times are already booked and cannot be selected.</p>
              </>
            )}
          </fieldset>

          {dateIso && time && (
            <div className="fd-summary">
              <p className="fd-summary-title">Booking summary</p>
              <dl className="fd-summary-list">
                <div><dt>Doctor</dt><dd>{doctor.name}</dd></div>
                <div><dt>Clinic</dt><dd>{doctor.clinic.name}, {doctor.clinic.area}</dd></div>
                <div><dt>Date</dt><dd>{selectedDay.weekday}, {selectedDay.dayNum} {selectedDay.month}</dd></div>
                <div><dt>Time</dt><dd>{time}</dd></div>
              </dl>
              <Button onClick={() => onConfirmed(dateIso, time)} className="fd-confirm-btn">
                <CheckCircle2 className="fd-icon-14" /> Confirm Booking
              </Button>
              <p className="fd-booking-helper">Booking is confirmed instantly. No payment is taken online.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SlotGroup({ label, slots, time, onPick }) {
  return (
    <div className="fd-slot-group">
      <p className="fd-slot-group-label">{label}</p>
      <div className="fd-slot-grid">
        {slots.map((s) => (
          <button key={s.time} type="button" disabled={s.booked}
            onClick={() => onPick(s.time)}
            className={cn("fd-slot-btn", s.booked && "fd-slot-btn-booked", time === s.time && "fd-slot-btn-active")}>
            {s.time}
          </button>
        ))}
      </div>
    </div>
  );
}

function SuccessView({ doctor, booking, onBookAnother, onBack }) {
  const d = fromISODate(booking.dateIso);
  const dateStr = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return (
    <div className="fd-success">
      <span className="fd-success-icon"><CheckCircle2 className="fd-icon-32" /></span>
      <h1 className="fd-success-title">Appointment booked!</h1>
      <p className="fd-success-text">Your in-clinic consultation with {doctor.name} is confirmed. We saved the details below.</p>
      <div className="fd-success-card">
        <Avatar doctor={doctor} size={56} />
        <div className="fd-success-doc">
          <p className="fd-success-doc-name">{doctor.name}</p>
          <p className="fd-success-doc-spec">{doctor.specialty}</p>
          {doctor.verified && <VerifiedChip />}
        </div>
        <dl className="fd-success-list">
          <div><dt>Clinic</dt><dd>{doctor.clinic.name}, {doctor.clinic.area}</dd></div>
          <div><dt>Date</dt><dd>{dateStr}</dd></div>
          <div><dt>Time</dt><dd>{booking.time} — in-clinic visit</dd></div>
          <div><dt>Fee</dt><dd>EGP {doctor.fee} — paid at the clinic</dd></div>
        </dl>
      </div>
      <p className="fd-success-note">Please arrive 10 minutes early and bring any recent reports with you. The clinic may call to remind you the day before.</p>
      <div className="fd-success-actions">
        <Button variant="outline" onClick={onBookAnother}>Book another appointment</Button>
        <Button onClick={onBack}>Back to Find a Doctor</Button>
      </div>
    </div>
  );
}

export default FindDoctor;
