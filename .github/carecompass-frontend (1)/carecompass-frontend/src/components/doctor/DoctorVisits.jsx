import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Eye,
  FileHeart,
  FileText,
  FlaskConical,
  HeartPulse,
  History,
  Info,
  Loader2,
  Lock,
  PencilLine,
  Pill,
  Plus,
  Search,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { api } from "../../services/api";
import {
  completeVisitRecord,
  createVisitDraft,
  updateVisitDraft,
  useVisitRecords,
} from "../../services/visit-store";
import { buildRoster } from "./DoctorPatients";
import { Button } from "../ui/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/AlertDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { toast } from "../../hooks/use-toast";
import "./DoctorVisits.css";

/* ═══════════════════════════════════════════════════════════════════════════
   Date helpers — same semantics as My Schedule / My Patients so every date
   in the dashboard lines up.
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
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
}

const CLINIC = { name: "Nile Badrawi Hospital", area: "Maadi, Cairo" };
const PAGE_SIZE = 6;

/* ═══════════════════════════════════════════════════════════════════════════
   Root component — list / detail / form routing for the Visit Records view.
   ═══════════════════════════════════════════════════════════════════════════ */

export function DoctorVisits({
  specialty,
  onOpenPatientProfile,
}) {
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const [apiPatients, setApiPatients] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api("/api/doctor/patients");
        if (alive) setApiPatients(res.patients);
      } catch {
        if (alive) setApiPatients([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const roster = useMemo(
    () => buildRoster(apiPatients, todayISO),
    [apiPatients, todayISO]
  );
  const rosterByKey = useMemo(
    () => new Map(roster.map((p) => [p.key, p])),
    [roster]
  );

  const visits = useVisitRecords();
  const sorted = useMemo(
    () =>
      [...visits].sort(
        (a, b) =>
          b.dateISO.localeCompare(a.dateISO) || b.time.localeCompare(a.time)
      ),
    [visits]
  );

  /* Sub-view routing. Filters live here so they survive detail/form trips. */
  const [subView, setSubView] = useState("list");
  const [detailId, setDetailId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [formNew, setFormNew] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  /* List filters */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("any");

  const scrollTop = () => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  const detail = detailId
    ? visits.find((v) => v.id === detailId) ?? null
    : null;
  const editRecord =
    !formNew && editId ? visits.find((v) => v.id === editId) ?? null : null;
  const confirmTarget = confirmId
    ? visits.find((v) => v.id === confirmId) ?? null
    : null;

  const openDetail = (id) => {
    setDetailId(id);
    setSubView("detail");
    scrollTop();
  };
  const openNewForm = () => {
    setFormNew(true);
    setEditId(null);
    setSubView("form");
    scrollTop();
  };
  const openEditForm = (id) => {
    setFormNew(false);
    setEditId(id);
    setSubView("form");
    scrollTop();
  };
  const backToList = () => {
    setSubView("list");
    setDetailId(null);
    setEditId(null);
    scrollTop();
  };

  const confirmComplete = () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    completeVisitRecord(target.id);
    setConfirmId(null);
    toast({
      title: "Visit completed",
      description: `${target.visitId} was shared with ${target.patientName} and is now visible in their My Visits section.`,
    });
    if (subView === "form") {
      setDetailId(target.id);
      setSubView("detail");
      scrollTop();
    }
  };

  /* ── Detail view ─────────────────────────────────────────────────────── */
  if (subView === "detail" && detail) {
    return (
      <>
        <VisitDetail
          record={detail}
          patient={rosterByKey.get(detail.patientKey) ?? null}
          specialty={specialty}
          todayISO={todayISO}
          allRecords={sorted}
          onBack={backToList}
          onEdit={() => openEditForm(detail.id)}
          onComplete={() => setConfirmId(detail.id)}
          onOpenRecord={openDetail}
          onOpenPatientProfile={() => onOpenPatientProfile(detail.patientName)}
        />
        <CompleteVisitDialog
          record={confirmTarget}
          onCancel={() => setConfirmId(null)}
          onConfirm={confirmComplete}
        />
      </>
    );
  }

  /* ── Create / edit form ──────────────────────────────────────────────── */
  if (subView === "form" && (formNew || editRecord)) {
    return (
      <>
        <VisitForm
          key={formNew ? "new" : editRecord?.id}
          todayISO={todayISO}
          roster={roster}
          record={editRecord}
          onBack={backToList}
          onSaveDraft={(input, recordId) => {
            if (recordId) {
              updateVisitDraft(recordId, input);
              toast({
                title: "Draft updated",
                description: `Changes to ${editRecord?.visitId} were saved. The record stays private until it is completed.`,
              });
              setDetailId(recordId);
              setSubView("detail");
              scrollTop();
            } else {
              const created = createVisitDraft(input);
              toast({
                title: "Draft saved",
                description: `${created.visitId} is private to you — ${created.patientName} cannot see it until it is completed.`,
              });
              setDetailId(created.id);
              setSubView("detail");
              scrollTop();
            }
          }}
          onRequestComplete={(id) => setConfirmId(id)}
        />
        <CompleteVisitDialog
          record={confirmTarget}
          onCancel={() => setConfirmId(null)}
          onConfirm={confirmComplete}
        />
      </>
    );
  }

  /* ── List (default) ──────────────────────────────────────────────────── */
  return (
    <VisitsList
      records={sorted}
      todayISO={todayISO}
      specialty={specialty}
      search={search}
      setSearch={setSearch}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      dateFilter={dateFilter}
      setDateFilter={setDateFilter}
      onOpenRecord={openDetail}
      onNewRecord={openNewForm}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Visit Records main page
   ═══════════════════════════════════════════════════════════════════════════ */

function VisitsList({
  records,
  todayISO,
  specialty,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  onOpenRecord,
  onNewRecord,
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return records.filter((v) => {
      if (
        q &&
        !(
          v.patientName.toLowerCase().includes(q) ||
          v.patientId.toLowerCase().includes(q) ||
          v.visitId.toLowerCase().includes(q) ||
          v.diagnosis.toLowerCase().includes(q)
        )
      )
        return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (dateFilter !== "any") {
        const diff = Math.round(
          (fromISODate(todayISO).getTime() - fromISODate(v.dateISO).getTime()) / 864e5
        );
        if (diff < 0 || diff > Number(dateFilter)) return false;
      }
      return true;
    });
  }, [records, q, statusFilter, dateFilter, todayISO]);

  const visible = filtered.slice(0, visibleCount);
  const filtersActive = q !== "" || statusFilter !== "all" || dateFilter !== "any";

  const stats = useMemo(() => {
    const drafts = records.filter((v) => v.status === "draft").length;
    const completed = records.filter((v) => v.status === "completed").length;
    const patients = new Set(
      records.filter((v) => v.status === "completed").map((v) => v.patientKey)
    ).size;
    return { total: records.length, drafts, completed, patients };
  }, [records]);

  const statCards = [
    {
      key: "all",
      label: "Total Records",
      value: stats.total,
      icon: ClipboardList,
      tile: "dv-tile-teal",
      hint: "Drafts and completed visits",
    },
    {
      key: "draft",
      label: "Draft Records",
      value: stats.drafts,
      icon: PencilLine,
      tile: "dv-tile-sand",
      hint: "Private, not yet shared",
    },
    {
      key: "completed",
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      tile: "dv-tile-green",
      hint: "Shared with patients",
    },
    {
      key: null,
      label: "Patients Seen",
      value: stats.patients,
      icon: Users,
      tile: "dv-tile-accent",
      hint: "Unique patients, completed visits",
    },
  ];

  return (
    <div className="dv-page">
      {/* ── Page header ── */}
      <header className="dv-header">
        <div>
          <p className="dv-eyebrow">
            Consultation documentation
          </p>
          <h1 className="dv-title">
            Visit Records
          </h1>
          <p className="dv-subtitle">
            Manage your consultation records and document patient visits —
            work in private drafts, then complete a record to share it with
            the patient.
          </p>
        </div>
        <Button onClick={onNewRecord} className="dv-btn-new">
          <Plus className="dv-btn-icon dv-icon-mr" />
          New Visit Record
        </Button>
      </header>

      {/* ── Overview statistics ── */}
      <div className="dv-stats">
        {statCards.map((c, i) => {
          const active = c.key !== null && statusFilter === c.key;
          const inner = (
            <>
              <div className="dv-stat-top">
                <span className={cn("dv-stat-tile", c.tile)}>
                  <c.icon className="dv-stat-tile-icon" />
                </span>
                <span className="dv-stat-value">
                  {c.value}
                </span>
              </div>
              <p className="dv-stat-label">
                {c.label}
              </p>
              <p className="dv-stat-hint">
                {c.hint}
              </p>
            </>
          );
          if (c.key === null) {
            return (
              <div
                key={`stat-${i}`}
                className="dv-stat-card"
              >
                {inner}
              </div>
            );
          }
          return (
            <button
              key={`stat-${i}`}
              onClick={() => {
                setStatusFilter(active ? "all" : c.key);
                setVisibleCount(PAGE_SIZE);
              }}
              aria-pressed={active}
              className={cn(
                "dv-stat-card-btn",
                active
                  ? "dv-stat-btn-active"
                  : "dv-stat-btn-idle"
              )}
            >
              {inner}
            </button>
          );
        })}
      </div>

      {/* ── Search + filters ── */}
      <div
        className="dv-filterbar"
        aria-label="Search and filters"
      >
        <div className="dv-search-wrap">
          <Search className="dv-search-icon" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search by patient name or visit ID…"
            aria-label="Search visit records by patient name or visit ID"
            className="dv-search-input"
          />
        </div>
        <div className="dv-filters">
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setVisibleCount(PAGE_SIZE);
            }}
            options={[
              { value: "all", label: "All statuses" },
              { value: "draft", label: "Draft only" },
              { value: "completed", label: "Completed only" },
            ]}
          />
          <FilterSelect
            label="Visit date"
            value={dateFilter}
            onChange={(v) => {
              setDateFilter(v);
              setVisibleCount(PAGE_SIZE);
            }}
            options={[
              { value: "any", label: "Any date" },
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
            ]}
          />
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDateFilter("any");
                setVisibleCount(PAGE_SIZE);
              }}
              className="dv-clear-filters"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Result count ── */}
      <p className="dv-result-count" role="status">
        Showing {visible.length} of {filtered.length} visit record
        {filtered.length === 1 ? "" : "s"}
      </p>

      {/* ── Records list ── */}
      <div className="dv-list-card">
        {records.length === 0 ? (
          <div className="dv-empty">
            <span className="dv-empty-icon">
              <ClipboardList className="dv-icon-24" />
            </span>
            <h2 className="dv-empty-title">
              No visit records yet
            </h2>
            <p className="dv-empty-text">
              Document your first consultation — save it as a private draft or
              complete it to share the details with your patient.
            </p>
            <Button onClick={onNewRecord} className="dv-btn-empty-cta">
              <Plus className="dv-btn-icon dv-icon-mr" />
              New Visit Record
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dv-empty">
            <span className="dv-nomatch-icon">
              <Search className="dv-icon-20" />
            </span>
            <p className="dv-nomatch-title">
              No records match your filters
            </p>
            <p className="dv-nomatch-text">
              Try a different patient name, visit ID or filter combination.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDateFilter("any");
                setVisibleCount(PAGE_SIZE);
              }}
              className="dv-clear-all"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* header row (desktop) */}
            <div className="dv-list-head">
              <span>Patient</span>
              <span>Visit date</span>
              <span>Specialty</span>
              <span>Main diagnosis</span>
              <span>Status</span>
              <span>Updated</span>
              <span className="dv-list-head-col-right">Record</span>
            </div>
            <ul className="dv-rows">
              {visible.map((v) => (
                <VisitRow
                  key={v.id}
                  record={v}
                  todayISO={todayISO}
                  specialty={specialty}
                  onOpen={() => onOpenRecord(v.id)}
                />
              ))}
            </ul>
          </>
        )}

        {/* Load more */}
        {records.length > 0 && filtered.length > visibleCount && (
          <div className="dv-loadmore">
            <button
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="dv-loadmore-btn"
            >
              Load {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
              records
              <ChevronRight className="dv-icon-14" />
            </button>
          </div>
        )}
      </div>

      {records.length > 0 && filtered.length > 0 && filtered.length <= visibleCount && (
        <p className="dv-allshown">
          <CheckCircle2 className="dv-allshown-icon" />
          Showing all {filtered.length} record
          {filtered.length === 1 ? "" : "s"} — drafts stay private until you
          complete them
        </p>
      )}
    </div>
  );
}

/* One row of the records list — table-like on desktop, card on mobile. */
function VisitRow({
  record,
  todayISO,
  specialty,
  onOpen,
}) {
  const isDraft = record.status === "draft";
  return (
    <li className={cn(isDraft && "dv-row-draft")}>
      <button
        onClick={onOpen}
        aria-label={`Open visit record ${record.visitId} for ${record.patientName}`}
        className="dv-row-btn"
      >
        {/* Patient identity */}
        <div className="dv-row-patient">
          <PatientAvatar name={record.patientName} size={40} />
          <div className="dv-minw0">
            <p className="dv-row-name">
              {record.patientName}
            </p>
            <p className="dv-row-sub">
              {record.patientId} · {record.visitId}
            </p>
          </div>
        </div>

        {/* Meta cells — grid on mobile, becomes table cells on lg */}
        <div className="dv-row-cells">
          <ListCell label="Visit date">
            <p className="dv-cell-value">
              {prettyShort(record.dateISO)}
            </p>
            <p className="dv-cell-sub">
              {relativeLabel(record.dateISO, todayISO)} · {record.time}
            </p>
          </ListCell>
          <ListCell label="Specialty">
            <p className="dv-cell-value">{specialty}</p>
            <p className="dv-cell-sub">In-clinic</p>
          </ListCell>
          <ListCell label="Main diagnosis">
            {record.diagnosis ? (
              <p className="dv-cell-diagnosis">
                {record.diagnosis}
              </p>
            ) : (
              <p className="dv-cell-pending">
                Diagnosis pending
              </p>
            )}
          </ListCell>
          <ListCell label="Status">
            {isDraft ? <DraftChip /> : <CompletedChip />}
            <p className="dv-cell-updated">
              {record.updatedLabel}
            </p>
          </ListCell>
        </div>

        {/* Action */}
        <div className="dv-row-action">
          <span className="dv-view-chip">
            View Details
            <ChevronRight className="dv-icon-14" />
          </span>
        </div>
      </button>
    </li>
  );
}

function ListCell({
  label,
  children,
}) {
  return (
    <div className="dv-cell">
      <p className="dv-cell-label">
        {label}
      </p>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Visit details page
   ═══════════════════════════════════════════════════════════════════════════ */

function VisitDetail({
  record,
  patient,
  specialty,
  todayISO,
  allRecords,
  onBack,
  onEdit,
  onComplete,
  onOpenRecord,
  onOpenPatientProfile,
}) {
  const [docPreview, setDocPreview] = useState(null);
  const isDraft = record.status === "draft";

  const docs = useMemo(() => {
    if (!patient) return [];
    return record.docRefs
      .map((id) => patient.documents.find((d) => d.id === id))
      .filter((d) => !!d);
  }, [patient, record.docRefs]);

  /* Other records for the same patient (this consultation excluded). */
  const otherRecords = useMemo(
    () =>
      allRecords
        .filter(
          (v) =>
            v.patientKey === record.patientKey &&
            v.id !== record.id &&
            v.dateISO !== record.dateISO
        )
        .slice(0, 4),
    [allRecords, record.patientKey, record.id, record.dateISO]
  );

  const followUpLabel = record.followUp ?? (record.followUpISO ? prettyDate(record.followUpISO) : null);

  return (
    <div className="dv-page">
      <button
        onClick={onBack}
        className="dv-back-btn"
      >
        <ArrowLeft className="dv-icon-14" />
        Back to Visit Records
      </button>

      {/* ── Header card ── */}
      <section
        className="dv-detail-header"
        aria-label="Visit record summary"
      >
        <div className="dv-detail-top">
          <div className="dv-minw0">
            <div className="dv-detail-titlerow">
              <h1 className="dv-detail-title">
                Visit record — {record.patientName}
              </h1>
              {isDraft ? <DraftChip large /> : <CompletedChip large />}
            </div>
            <p className="dv-detail-meta">
              <span className="dv-meta-item">
                <User className="dv-meta-icon" />
                {record.patientId} · {record.visitId}
              </span>
              <span className="dv-meta-item">
                <Stethoscope className="dv-meta-icon" />
                {specialty}
              </span>
              <span className="dv-meta-item">
                <Building2 className="dv-meta-icon" />
                {CLINIC.name}, {CLINIC.area}
              </span>
            </p>
            <p className="dv-detail-when">
              <span className="dv-meta-item">
                <CalendarDays className="dv-when-icon" />
                {prettyDate(record.dateISO)}
              </span>
              <span className="dv-meta-item">
                <Clock className="dv-when-icon" />
                {record.time} – {fromMinutes(toMinutes(record.time) + 30)} · 30 min
              </span>
            </p>
          </div>

          {isDraft && (
            <div className="dv-detail-actions">
              <Button variant="outline" onClick={onEdit} className="dv-btn-rounded">
                <PencilLine className="dv-btn-icon dv-icon-mr" />
                Edit Record
              </Button>
              <Button onClick={onComplete} className="dv-btn-rounded">
                <CheckCircle2 className="dv-btn-icon dv-icon-mr" />
                Complete Visit
              </Button>
            </div>
          )}
        </div>

        {/* Patient-visibility banner */}
        {isDraft ? (
          <p className="dv-banner dv-banner-draft">
            <Lock className="dv-banner-icon-clay" />
            <span>
              <span className="dv-banner-strong">Private draft.</span> Only you can
              see this record — {record.patientName.split(" ")[0]} cannot see it
              in their My Visits section until you complete the visit.
            </span>
          </p>
        ) : (
          <p className="dv-banner dv-banner-shared">
            <CheckCircle2 className="dv-banner-icon-primary" />
            <span>
              <span className="dv-banner-strong">Shared with {record.patientName}.</span>{" "}
              The diagnosis, notes, recommendations and prescriptions below are
              visible in their My Visits dashboard. Completed records can no
              longer be edited.
            </span>
          </p>
        )}
      </section>

      {/* ── Body ── */}
      <div className="dv-detail-body">
        {/* Consultation details */}
        <div className="dv-detail-main">
          <section className="dv-card">
            <h2 className="dv-card-title">
              <Info className="dv-card-title-icon" />
              Chief complaint
            </h2>
            <p className="dv-card-text">
              {record.reason || "Not recorded yet."}
            </p>
          </section>

          <section className="dv-card">
            <h2 className="dv-card-title">
              <FileText className="dv-card-title-icon" />
              Clinical notes
            </h2>
            <p className="dv-card-text">
              {record.notes || "No clinical notes recorded yet."}
            </p>
            <p className="dv-card-footnote">
              {isDraft
                ? "Private draft — the patient cannot see this record until it is finalised."
                : "The patient sees these notes in their My Visits dashboard."}
            </p>
          </section>

          <section className="dv-card">
            <h2 className="dv-card-title">
              <Stethoscope className="dv-card-title-icon" />
              Diagnosis
            </h2>
            {record.diagnosis ? (
              <p className="dv-card-text">
                {record.diagnosis}
              </p>
            ) : (
              <p className="dv-card-text-pending">
                Diagnosis pending — add it before completing the visit.
              </p>
            )}
          </section>

          <section className="dv-card">
            <h2 className="dv-card-title">
              <ClipboardList className="dv-card-title-icon" />
              Treatment &amp; recommendations
            </h2>
            {record.treatment.length === 0 ? (
              <p className="dv-card-text-plain">
                No treatment items recorded yet.
              </p>
            ) : (
              <ul className="dv-dotlist">
                {record.treatment.map((t) => (
                  <li
                    key={t}
                    className="dv-dotitem"
                  >
                    <span className="dv-dot" />
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dv-card">
            <h2 className="dv-card-title">
              <Pill className="dv-card-title-icon" />
              Prescription
            </h2>
            {record.prescriptions.length === 0 ? (
              <p className="dv-card-text-plain">
                No prescriptions were issued at this visit.
              </p>
            ) : (
              <ul className="dv-dotlist">
                {record.prescriptions.map((p) => (
                  <li
                    key={p}
                    className="dv-rxitem"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {followUpLabel && (
            <div className="dv-followup">
              <CalendarClock className="dv-followup-icon" />
              <p className="dv-followup-text">
                <span className="dv-followup-strong">Follow-up:</span>{" "}
                {followUpLabel}
                {record.followUpISO && (
                  <span className="dv-followup-rel">
                    ({relativeLabel(record.followUpISO, todayISO)})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — patient, documents, previous visits */}
        <aside className="dv-detail-side">
          {/* Patient information */}
          <section className="dv-card">
            <h2 className="dv-card-title">
              <HeartPulse className="dv-card-title-icon" />
              Patient information
            </h2>
            {!patient ? (
              <div className="dv-patient-loading">
                <Loader2 className="dv-spin-icon" />
                Loading patient information…
              </div>
            ) : (
              <>
                <div className="dv-patient-idrow">
                  <PatientAvatar name={record.patientName} size={44} />
                  <div className="dv-minw0">
                    <p className="dv-row-name">
                      {record.patientName}
                    </p>
                    <p className="dv-row-sub">
                      {record.patientId} · {patient.age} y · {patient.gender}
                    </p>
                  </div>
                </div>

                <dl className="dv-info-grid">
                  <InfoItem label="Blood type" value={patient.bloodType} />
                  <InfoItem
                    label="Height / weight"
                    value={
                      patient.heightCm && patient.weightKg
                        ? `${patient.heightCm} cm · ${patient.weightKg} kg`
                        : "—"
                    }
                  />
                  <InfoItem label="Phone" value={patient.phone} span />
                </dl>

                <div className="dv-divider-block">
                  <p className="dv-block-label">
                    Conditions
                  </p>
                  <div className="dv-chips">
                    {patient.conditions.length === 0 ? (
                      <p className="dv-none-text">
                        None reported
                      </p>
                    ) : (
                      patient.conditions.map((c) => (
                        <span
                          key={c}
                          className="dv-chip-teal"
                        >
                          <HeartPulse className="dv-chip-icon" />
                          {c}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="dv-divider-block">
                  <p className="dv-block-label">
                    Allergies
                  </p>
                  <div className="dv-chips">
                    {patient.allergies.length === 0 ? (
                      <p className="dv-none-text">
                        No known allergies
                      </p>
                    ) : (
                      patient.allergies.map((a) => (
                        <span
                          key={a}
                          className="dv-chip-sand"
                        >
                          <AlertTriangle className="dv-chip-icon" />
                          {a}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="dv-divider-block">
                  <p className="dv-block-label">
                    Current medications
                  </p>
                  {patient.medications.length === 0 ? (
                    <p className="dv-none-text dv-none-text-mt">
                      None recorded
                    </p>
                  ) : (
                    <ul className="dv-medlist">
                      {patient.medications.map((m) => (
                        <li
                          key={m}
                          className="dv-meditem"
                        >
                          <Pill className="dv-medicon" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="dv-patient-note">
                  From the patient&apos;s self-reported history — open the full
                  profile for the complete record.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenPatientProfile}
                  className="dv-btn-profile"
                >
                  <User className="dv-btn-icon dv-icon-mr" />
                  Open Patient Profile
                </Button>
              </>
            )}
          </section>

          {/* Referenced documents */}
          <section className="dv-card">
            <h2 className="dv-card-title">
              <FileText className="dv-card-title-icon" />
              Medical documents
            </h2>
            {docs.length === 0 ? (
              <div className="dv-docs-empty">
                <FileText className="dv-docs-empty-icon" />
                <p className="dv-docs-empty-title">
                  No documents referenced
                </p>
                <p className="dv-docs-empty-text">
                  Attach labs, reports or prescriptions from the patient&apos;s
                  file while editing the record.
                </p>
              </div>
            ) : (
              <ul className="dv-doclist">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="dv-docitem"
                  >
                    <div className="dv-docitem-top">
                      <div className="dv-minw0">
                        <p className="dv-docname">
                          {d.name}
                        </p>
                        <p className="dv-docmeta">
                          {categoryLabel(d.category)} · {d.format} · {d.size}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDocPreview(d)}
                        className="dv-btn-viewdoc"
                      >
                        <Eye className="dv-btn-icon dv-icon-mr6" />
                        View
                      </Button>
                    </div>
                    {d.status !== "ready" && (
                      <span className="dv-processing">
                        <Loader2 className="dv-processing-icon" />
                        Processing
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {patient && patient.documents.length > 0 && (
              <p className="dv-docs-total">
                {patient.documents.length} document
                {patient.documents.length === 1 ? "" : "s"} in total on the
                patient&apos;s file.
              </p>
            )}
          </section>

          {/* Previous records for this patient */}
          <section className="dv-card">
            <h2 className="dv-card-title">
              <History className="dv-card-title-icon" />
              Previous visits
            </h2>
            {otherRecords.length === 0 ? (
              <p className="dv-prev-empty">
                No other visit records for this patient yet.
              </p>
            ) : (
              <ul className="dv-prevlist">
                {otherRecords.map((v) => (
                  <li key={v.id}>
                    <button
                      onClick={() => onOpenRecord(v.id)}
                      className="dv-prevbtn"
                    >
                      <span className="dv-prev-top">
                        <span className="dv-prev-name">
                          {prettyShort(v.dateISO)} · {v.visitId}
                        </span>
                        {v.status === "draft" ? (
                          <span className="dv-minichip-draft">
                            <PencilLine className="dv-minichip-icon" />
                            Draft
                          </span>
                        ) : (
                          <span className="dv-minichip-done">
                            <CheckCircle2 className="dv-minichip-icon" />
                            Done
                          </span>
                        )}
                      </span>
                      <span className="dv-prev-sub">
                        {v.diagnosis || v.reason}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      <DocumentPreviewDialog
        doc={docPreview}
        patientName={record.patientName}
        onClose={() => setDocPreview(null)}
      />
    </div>
  );
}

function InfoItem({
  label,
  value,
  span,
}) {
  return (
    <div className={cn("dv-info-item", span && "dv-info-item-span")}>
      <dt className="dv-info-dt">
        {label}
      </dt>
      <dd className="dv-info-dd">
        {value}
      </dd>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Create / edit visit record form
   ═══════════════════════════════════════════════════════════════════════════ */

function VisitForm({
  todayISO,
  roster,
  record,
  onBack,
  onSaveDraft,
  onRequestComplete,
}) {
  const isEdit = !!record;

  const [patientKey, setPatientKey] = useState(record?.patientKey ?? "");
  const [date, setDate] = useState(record?.dateISO ?? todayISO);
  const [time, setTime] = useState(record?.time ?? "10:00");
  const [reason, setReason] = useState(record?.reason ?? "");
  const [notes, setNotes] = useState(record?.notes ?? "");
  const [diagnosis, setDiagnosis] = useState(record?.diagnosis ?? "");
  const [treatment, setTreatment] = useState(
    record?.treatment.join("\n") ?? ""
  );
  const [prescriptions, setPrescriptions] = useState(
    record?.prescriptions.join("\n") ?? ""
  );
  const [followUpISO, setFollowUpISO] = useState(record?.followUpISO ?? "");
  const [docRefs, setDocRefs] = useState(record?.docRefs ?? []);
  const [error, setError] = useState("");

  const selected = roster.find((p) => p.key === patientKey) ?? null;

  const toLines = (s) =>
    s.split("\n").map((l) => l.trim()).filter(Boolean);

  const buildInput = () => ({
    patientKey,
    patientName: selected?.name ?? record?.patientName ?? "",
    patientId: selected?.patientId ?? record?.patientId ?? "",
    dateISO: date,
    time,
    reason: reason.trim(),
    diagnosis: diagnosis.trim(),
    notes: notes.trim(),
    treatment: toLines(treatment),
    prescriptions: toLines(prescriptions),
    followUpISO: followUpISO || undefined,
    docRefs,
  });

  const saveAsDraft = () => {
    setError("");
    if (!isEdit && !selected) {
      setError("Select the patient this record belongs to.");
      return;
    }
    if (!reason.trim() && !diagnosis.trim() && !notes.trim()) {
      setError(
        "Add a chief complaint, a clinical note or a diagnosis before saving the draft."
      );
      return;
    }
    onSaveDraft(buildInput(), isEdit ? record.id : undefined);
  };

  const requestComplete = () => {
    setError("");
    if (!diagnosis.trim()) {
      setError("A diagnosis is required to complete the visit.");
      return;
    }
    const input = buildInput();
    if (isEdit && record) {
      updateVisitDraft(record.id, input);
      onRequestComplete(record.id);
    } else {
      const created = createVisitDraft(input);
      onRequestComplete(created.id);
    }
  };

  return (
    <div className="dv-page dv-page-form">
      <button
        onClick={onBack}
        className="dv-back-btn"
      >
        <ArrowLeft className="dv-icon-14" />
        Back to Visit Records
      </button>

      <header className="dv-form-header">
        <p className="dv-eyebrow">
          {isEdit ? "Editing draft" : "New consultation"}
        </p>
        <h1 className="dv-title">
          {isEdit ? `Edit Draft — ${record.visitId}` : "New Visit Record"}
        </h1>
        <p className="dv-subtitle">
          Document the consultation, review the patient&apos;s history and
          reference their documents. Save as a private draft or complete the
          record to share it with the patient.
        </p>
      </header>

      {/* ── Section 1 — Patient ── */}
      <section className="dv-card dv-mt6">
        <h2 className="dv-card-title">
          <User className="dv-card-title-icon" />
          Patient
        </h2>

        {isEdit ? (
          <div className="dv-patient-box">
            <PatientAvatar name={record.patientName} size={44} />
            <div className="dv-minw0">
              <p className="dv-row-name">
                {record.patientName}
              </p>
              <p className="dv-row-sub">
                {record.patientId} — linked to this draft
              </p>
            </div>
          </div>
        ) : (
          <label className="dv-field dv-field-mt3">
            <span className="dv-field-label">
              Select patient <span className="dv-required">*</span>
            </span>
            <select
              value={patientKey}
              onChange={(e) => {
                setPatientKey(e.target.value);
                setError("");
              }}
              aria-label="Select patient"
              className="dv-select"
            >
              <option value="">Choose a patient…</option>
              {roster.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name} — {p.patientId}
                </option>
              ))}
            </select>
          </label>
        )}

        {selected && (
          <div className="dv-review-box">
            <p className="dv-review-label">
              Review the patient&apos;s history
            </p>
            <div className="dv-review-chips">
              <span className="dv-chip-accent">
                {selected.age} years · {selected.gender}
              </span>
              <span className="dv-chip-sand50">
                Blood {selected.bloodType}
              </span>
              {selected.conditions.map((c) => (
                <span
                  key={c}
                  className="dv-chip-teal"
                >
                  <HeartPulse className="dv-chip-icon" />
                  {c}
                </span>
              ))}
              {selected.allergies.map((a) => (
                <span
                  key={a}
                  className="dv-chip-sand"
                >
                  <AlertTriangle className="dv-chip-icon" />
                  {a}
                </span>
              ))}
            </div>
            <div className="dv-divider-block">
              <p className="dv-block-label">
                Current medications
              </p>
              {selected.medications.length === 0 ? (
                <p className="dv-none-text dv-none-text-mt1">
                  None recorded
                </p>
              ) : (
                <ul className="dv-medlist">
                  {selected.medications.map((m) => (
                    <li
                      key={m}
                      className="dv-meditem"
                    >
                      <Pill className="dv-medicon" />
                      {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="dv-review-note">
              <Info className="dv-review-note-icon" />
              History above is patient-reported. The record you are writing is
              clinical and stays separate from it.
            </p>
          </div>
        )}
      </section>

      {/* ── Section 2 — Consultation ── */}
      <section className="dv-card dv-mt4">
        <h2 className="dv-card-title">
          <Stethoscope className="dv-card-title-icon" />
          Consultation details
        </h2>

        <div className="dv-form-grid">
          <label className="dv-field">
            <span className="dv-field-label">
              Visit date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="dv-input"
            />
          </label>
          <label className="dv-field">
            <span className="dv-field-label">
              Start time
            </span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="dv-input"
            />
          </label>
        </div>

        <label className="dv-field dv-field-mt35">
          <span className="dv-field-label">
            Chief complaint
          </span>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            rows={2}
            placeholder="Why is the patient being seen today? e.g. Blood pressure review — readings high at home this week."
            className="dv-textarea"
          />
        </label>

        <label className="dv-field dv-field-mt35">
          <span className="dv-field-label">
            Clinical notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (error) setError("");
            }}
            rows={4}
            placeholder="Examination findings, patient-reported symptoms, advice given…"
            className="dv-textarea"
          />
        </label>

        <label className="dv-field dv-field-mt35">
          <span className="dv-field-label">
            Diagnosis{" "}
            <span className="dv-field-hint">
              (required to complete the visit)
            </span>
          </span>
          <textarea
            value={diagnosis}
            onChange={(e) => {
              setDiagnosis(e.target.value);
              if (error) setError("");
            }}
            rows={2}
            placeholder="e.g. Blood pressure controlled on the current dose…"
            className="dv-textarea"
          />
        </label>

        <label className="dv-field dv-field-mt35">
          <span className="dv-field-label">
            Treatment &amp; recommendations
            <span className="dv-field-hint dv-field-hint-ml">
              (one per line)
            </span>
          </span>
          <textarea
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            rows={3}
            placeholder={"Continue Metformin 850 mg twice daily\nHome BP log twice daily"}
            className="dv-textarea"
          />
        </label>

        <label className="dv-field dv-field-mt35">
          <span className="dv-field-label">
            Prescription
            <span className="dv-field-hint dv-field-hint-ml">
              (one per line, if issued)
            </span>
          </span>
          <textarea
            value={prescriptions}
            onChange={(e) => setPrescriptions(e.target.value)}
            rows={2}
            placeholder={"Metformin 850 mg — 1 tablet twice daily\nAtorvastatin 20 mg — 1 tablet at night"}
            className="dv-textarea"
          />
        </label>

        <label className="dv-field dv-field-mt35">
          <span className="dv-field-label">
            Follow-up date
            <span className="dv-field-hint dv-field-hint-ml">
              (optional)
            </span>
          </span>
          <input
            type="date"
            value={followUpISO}
            onChange={(e) => setFollowUpISO(e.target.value)}
            className="dv-input dv-input-followup"
          />
        </label>
      </section>

      {/* ── Section 3 — Documents ── */}
      <section className="dv-card dv-mt4">
        <h2 className="dv-card-title">
          <FileText className="dv-card-title-icon" />
          Reference medical documents
        </h2>
        <p className="dv-docs-desc">
          Attach labs, reports or prescriptions from the patient&apos;s file
          that belong to this consultation. After completion the patient can
          open the referenced documents from their own dashboard.
        </p>

        {!selected && !isEdit ? (
          <p className="dv-docs-hint">
            Select a patient to see their available documents.
          </p>
        ) : (selected ?? null) && (selected?.documents.length ?? 0) === 0 ? (
          <p className="dv-docs-hint">
            No documents on file for this patient yet.
          </p>
        ) : selected ? (
          <div className="dv-docrefs">
            {selected.documents.map((d) => {
              const checked = docRefs.includes(d.id);
              return (
                <label
                  key={d.id}
                  className={cn(
                    "dv-docref",
                    checked
                      ? "dv-docref-checked"
                      : "dv-docref-unchecked"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setDocRefs((refs) =>
                        e.target.checked
                          ? [...refs, d.id]
                          : refs.filter((r) => r !== d.id)
                      )
                    }
                    className="dv-docref-check"
                    aria-label={`Reference document ${d.name}`}
                  />
                  <span className="dv-docref-body">
                    <span className="dv-docref-name">
                      {d.name}
                    </span>
                    <span className="dv-docref-meta">
                      {categoryLabel(d.category)} · {d.format} · {d.size}
                    </span>
                  </span>
                  {d.status !== "ready" && (
                    <span className="dv-processing">
                      <Loader2 className="dv-processing-icon" />
                      Processing
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* ── Actions ── */}
      <div className="dv-actions-card">
        {error && (
          <p
            className="dv-form-error"
            role="alert"
          >
            <AlertTriangle className="dv-form-error-icon" />
            {error}
          </p>
        )}
        <div className="dv-form-actions">
          <Button
            variant="outline"
            onClick={saveAsDraft}
            className="dv-btn-flex"
          >
            <PencilLine className="dv-btn-icon dv-icon-mr" />
            Save as Draft
          </Button>
          <Button onClick={requestComplete} className="dv-btn-flex">
            <CheckCircle2 className="dv-btn-icon dv-icon-mr" />
            Complete Visit
          </Button>
        </div>
        <p className="dv-form-note">
          <Lock className="dv-form-note-icon" />
          Drafts stay private to you and can be edited any time. Completing the
          visit shares the finalised diagnosis, notes, recommendations and
          prescriptions with the patient — this cannot be undone.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Dialogs
   ═══════════════════════════════════════════════════════════════════════════ */

function CompleteVisitDialog({
  record,
  onCancel,
  onConfirm,
}) {
  return (
    <AlertDialog
      open={!!record}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="dv-confirm-title">
            Complete this visit record?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {record && (
              <>
                The record for{" "}
                <span className="dv-confirm-strong">
                  {record.patientName} ({record.visitId})
                </span>{" "}
                will be finalised. The diagnosis, patient-visible notes,
                recommendations and prescriptions will become available to{" "}
                {record.patientName.split(" ")[0]} in their{" "}
                <span className="dv-confirm-strong">My Visits</span>{" "}
                section. Completed records can no longer be edited — private
                drafts and internal remarks always stay visible to you alone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="dv-confirm-cancel">Keep as draft</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="dv-confirm-action"
          >
            <CheckCircle2 className="dv-confirm-icon" />
            Complete Visit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DocumentPreviewDialog({
  doc,
  patientName,
  onClose,
}) {
  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dv-dialog-scroll">
        {doc && (
          <>
            <DialogHeader>
              <DialogTitle className="dv-docdlg-title">
                {doc.name}
              </DialogTitle>
              <DialogDescription>
                {categoryLabel(doc.category)} · {patientName} · {doc.format} ·{" "}
                {doc.size}
                {doc.pageCount ? ` · ${doc.pageCount} page${doc.pageCount === 1 ? "" : "s"}` : ""}
              </DialogDescription>
            </DialogHeader>

            {doc.previewRows && doc.previewRows.length > 0 ? (
              <div className="dv-table-wrap">
                <table className="dv-doc-table">
                  <tbody>
                    {doc.previewRows.map((row) => (
                      <tr key={row.label} className="dv-doc-tr">
                        <td className="dv-doc-td-label">
                          {row.label}
                        </td>
                        <td className="dv-doc-td-value">
                          {row.value}
                          {row.note && (
                            <span className="dv-doc-td-note">
                              ({row.note})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dv-docdlg-empty">
                <FileText className="dv-docdlg-empty-icon" />
                <p className="dv-docdlg-empty-title">
                  Preview not available
                </p>
                <p className="dv-docdlg-empty-text">
                  {doc.note ??
                    "The extracted text for this document is not shown in the prototype."}
                </p>
              </div>
            )}

            {doc.note && doc.previewRows && doc.previewRows.length > 0 && (
              <p className="dv-docdlg-note">
                <Info className="dv-docdlg-note-icon" />
                {doc.note}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Small shared pieces
   ═══════════════════════════════════════════════════════════════════════════ */

function DraftChip({ large = false }) {
  return (
    <span
      className={cn(
        "dv-chip-draft",
        large ? "dv-chip-lg" : "dv-chip-sm"
      )}
    >
      <PencilLine className="dv-chip-icon" />
      Draft
    </span>
  );
}

function CompletedChip({ large = false }) {
  return (
    <span
      className={cn(
        "dv-chip-done",
        large ? "dv-chip-lg" : "dv-chip-sm"
      )}
    >
      <CheckCircle2 className="dv-chip-icon" />
      Completed
    </span>
  );
}

function PatientAvatar({ name, size }) {
  return (
    <span
      className="dv-avatar"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden
    >
      {name
        .split(" ")
        .map((w) => w[0])
        .join("")}
    </span>
  );
}

function categoryLabel(c) {
  switch (c) {
    case "lab-report":
      return "Lab Report";
    case "medical-report":
      return "Medical Report";
    case "prescription":
      return "Prescription";
    case "visit-document":
      return "Visit Document";
    default:
      return "Uploaded Document";
  }
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="dv-filter-select">
      <span className="dv-filter-select-label">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="dv-filter-select-control"
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

export default DoctorVisits;
