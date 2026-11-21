/* =====================================
   MyRecords — patient personal health archive
   Plain-JS port of the workspace my-records.tsx.
   List, search, filter, preview, download and upload medical
   documents. Upload is simulated (progress timer, no network);
   processing records auto-flip to "ready" after a few seconds.
===================================== */

import { useState, useMemo, useEffect, useRef } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileHeart,
  FileImage,
  FileText,
  FlaskConical,
  Loader2,
  Pill,
  RotateCcw,
  Search,
  SearchX,
  Stethoscope,
  Upload,
  UploadCloud,
  User,
  X,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/Dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/Select";
import { toast } from "../../hooks/use-toast";
import "./MyRecords.css";

/* ── Category & status metadata ──────────────────────────────── */
const CATEGORY_META = {
  "lab-report": { singular: "Lab Report", plural: "Lab Reports", icon: FlaskConical, tile: "mr-tile-teal", chip: "mr-chip-teal" },
  prescription: { singular: "Prescription", plural: "Prescriptions", icon: Pill, tile: "mr-tile-sand", chip: "mr-chip-sand" },
  "medical-report": { singular: "Medical Report", plural: "Medical Reports", icon: Stethoscope, tile: "mr-tile-teal", chip: "mr-chip-teal" },
  "visit-document": { singular: "Visit Document", plural: "Visit Documents", icon: ClipboardList, tile: "mr-tile-sand", chip: "mr-chip-sand" },
  other: { singular: "Other Document", plural: "Other Documents", icon: FileText, tile: "mr-tile-accent", chip: "mr-chip-accent" },
};
const CATEGORY_ORDER = ["lab-report", "prescription", "medical-report", "visit-document", "other"];

const STATUS_META = {
  ready: { label: "Ready", icon: CheckCircle2, className: "mr-chip-teal", spin: false },
  processing: { label: "Processing", icon: Loader2, className: "mr-chip-sand", spin: true },
  failed: { label: "Failed", icon: AlertTriangle, className: "mr-chip-failed", spin: false },
};

/* ── Sample records (verbatim from the workspace) ────────────── */
const SAMPLE_RECORDS = [
  { id: "rec-vitd", name: "Vitamin D (25-OH) Blood Test", category: "lab-report", format: "PDF", size: "305 KB", uploadedBy: "Patient (you)", uploaderRole: "patient", uploadedOn: "Today", status: "processing", note: "Fasting sample collected at the lab this morning — results are being processed." },
  { id: "rec-cbc", name: "Complete Blood Count (CBC) — Routine Panel", category: "lab-report", format: "PDF", size: "412 KB", uploadedBy: "Patient (you)", uploaderRole: "patient", uploadedOn: "18 Dec 2024", relatedVisit: "Dr. Hana Kamal — Cardiology · 18 Dec 2024", status: "ready", note: "Routine blood work taken before the quarterly diabetes review.", pageCount: 2, previewRows: [{ label: "Haemoglobin", value: "11.8 g/dL", note: "12.0 – 16.0" }, { label: "White blood cells", value: "6.2 ×10⁹/L", note: "4.0 – 10.0" }, { label: "Platelets", value: "248 ×10⁹/L", note: "150 – 400" }, { label: "Haematocrit", value: "36.2 %", note: "36.0 – 46.0" }] },
  { id: "rec-hba1c", name: "HbA1c — Glycated Haemoglobin", category: "lab-report", format: "PDF", size: "298 KB", uploadedBy: "Dr. Hana Kamal", uploaderRole: "doctor", uploadedOn: "18 Dec 2024", relatedVisit: "Dr. Hana Kamal — Cardiology · 18 Dec 2024", status: "ready", note: "Three-month blood sugar average, attached by your doctor after the review.", pageCount: 1, previewRows: [{ label: "HbA1c", value: "7.1 %", note: "target < 7.0" }, { label: "Fasting glucose", value: "132 mg/dL", note: "70 – 99" }, { label: "eGFR (kidney)", value: "96 mL/min", note: "> 90" }] },
  { id: "rec-metformin", name: "Metformin 500 mg — Repeat Prescription", category: "prescription", format: "PDF", size: "96 KB", uploadedBy: "Dr. Hana Kamal", uploaderRole: "doctor", uploadedOn: "18 Dec 2024", relatedVisit: "Dr. Hana Kamal — Cardiology · 18 Dec 2024", status: "ready", pageCount: 1, previewRows: [{ label: "Metformin 500 mg", value: "1 tablet · twice daily", note: "after meals" }, { label: "Vitamin D3 1000 IU", value: "1 capsule · once daily", note: "with breakfast" }] },
  { id: "rec-atorvastatin", name: "Atorvastatin 20 mg — Prescription", category: "prescription", format: "PDF", size: "88 KB", uploadedBy: "Dr. Hana Kamal", uploaderRole: "doctor", uploadedOn: "04 Nov 2024", relatedVisit: "Dr. Hana Kamal — Cardiology · 04 Nov 2024", status: "ready", pageCount: 1, previewRows: [{ label: "Atorvastatin 20 mg", value: "1 tablet · at bedtime", note: "3-month course" }] },
  { id: "rec-followup", name: "Follow-up Notes — Internal Medicine", category: "visit-document", format: "PDF", size: "220 KB", uploadedBy: "Dr. Hana Kamal", uploaderRole: "doctor", uploadedOn: "04 Nov 2024", relatedVisit: "Dr. Hana Kamal — Cardiology · 04 Nov 2024", status: "ready", pageCount: 1, previewRows: [{ label: "Reason", value: "Routine diabetes follow-up" }, { label: "Findings", value: "Stable; mild fatigue reported" }, { label: "Plan", value: "Continue current dose; recheck HbA1c in 6 weeks" }] },
  { id: "rec-thyroid", name: "Thyroid Ultrasound — Scan Images", category: "medical-report", format: "JPG", size: "2.4 MB", uploadedBy: "Patient (you)", uploaderRole: "patient", uploadedOn: "22 Sep 2024", relatedVisit: "Radiology — Neck ultrasound · 22 Sep 2024", status: "ready", note: "Scan images from the neck ultrasound examination." },
  { id: "rec-endo", name: "Endocrinology Consultation Report", category: "medical-report", format: "PDF", size: "780 KB", uploadedBy: "Dr. Hana Kamal", uploaderRole: "doctor", uploadedOn: "22 Sep 2024", relatedVisit: "Dr. Hana Kamal — Endocrinology · 22 Sep 2024", status: "ready", pageCount: 3, previewRows: [{ label: "Assessment", value: "Type 2 diabetes — controlled" }, { label: "Recommendation", value: "Lifestyle review; repeat labs annually" }] },
  { id: "rec-flu", name: "Vaccination Certificate — Influenza 2024", category: "other", format: "PDF", size: "180 KB", uploadedBy: "Patient (you)", uploaderRole: "patient", uploadedOn: "15 Oct 2024", status: "ready", note: "Seasonal flu vaccination certificate issued at the pharmacy clinic.", pageCount: 1 },
  { id: "rec-cardio", name: "Cardiology Visit Summary — Referred", category: "visit-document", format: "PDF", size: "354 KB", uploadedBy: "Dr. Omar Fathy", uploaderRole: "doctor", uploadedOn: "02 Jul 2024", relatedVisit: "Dr. Omar Fathy — Cardiology (referred) · 02 Jul 2024", status: "ready", pageCount: 2, previewRows: [{ label: "Reason", value: "Pre-treatment cardiac clearance" }, { label: "ECG", value: "Normal sinus rhythm" }, { label: "Plan", value: "No further cardiology follow-up needed" }] },
  { id: "rec-insurance", name: "Insurance Pre-Approval Letter", category: "other", format: "PDF", size: "154 KB", uploadedBy: "Patient (you)", uploaderRole: "patient", uploadedOn: "15 May 2024", status: "failed", note: "File appears to be corrupted — please re-upload a clear scan." },
];

const ACCEPTED_EXT = ["pdf", "jpg", "jpeg", "png", "doc", "docx"];
const MAX_SIZE_MB = 10;

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
function extToFormat(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "JPG";
  if (ext === "png") return "PNG";
  if (ext === "doc" || ext === "docx") return "DOCX";
  return "PDF";
}
function isImageFormat(format) { return format === "JPG" || format === "PNG"; }

/* ── Sub-components ───────────────────────────────────────────── */
function StatusChip({ status }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return <span className={cn("mr-chip", meta.className)}><Icon className={cn("mr-icon-12", meta.spin && "mr-spin")} /> {meta.label}</span>;
}
function CategoryChip({ category }) {
  const meta = CATEGORY_META[category];
  return <span className={cn("mr-chip", meta.chip)}>{meta.singular}</span>;
}
function RecordTile({ record, size = "sm" }) {
  const meta = CATEGORY_META[record.category];
  const Icon = meta.icon;
  return <span className={cn("mr-tile", meta.tile, size === "lg" && "mr-tile-lg")}><Icon className={size === "lg" ? "mr-icon-20" : "mr-icon-16"} /></span>;
}

export function MyRecords() {
  const [records, setRecords] = useState(SAMPLE_RECORDS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Auto-flip processing records to ready after a short delay.
  useEffect(() => {
    if (!records.some((r) => r.status === "processing")) return;
    const t = setTimeout(() => {
      setRecords((rs) => rs.map((r) => (r.status === "processing" ? { ...r, status: "ready" } : r)));
    }, 4500);
    return () => clearTimeout(t);
  }, [records]);

  const searchFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      `${r.name} ${CATEGORY_META[r.category].singular} ${r.note || ""} ${r.relatedVisit || ""} ${r.uploadedBy}`
        .toLowerCase().includes(q)
    );
  }, [records, query]);

  const filtered = useMemo(() => category === "all" ? searchFiltered : searchFiltered.filter((r) => r.category === category), [searchFiltered, category]);

  const counts = useMemo(() => {
    const c = { all: searchFiltered.length };
    for (const k of CATEGORY_ORDER) c[k] = searchFiltered.filter((r) => r.category === k).length;
    return c;
  }, [searchFiltered]);

  const filtersActive = query !== "" || category !== "all";
  function resetFilters() { setQuery(""); setCategory("all"); }

  function handleDownload(record) {
    toast({ title: "Download started", description: `"${record.name}.${record.format.toLowerCase()}" is being saved to your device.` });
  }

  const selectedRecord = records.find((r) => r.id === selectedId) || null;

  if (selectedRecord) {
    return <RecordDetail record={selectedRecord} onBack={() => setSelectedId(null)} onDownload={handleDownload} />;
  }

  return (
    <div className="mr-page">
      {/* Header */}
      <div className="mr-header">
        <div>
          <p className="mr-eyebrow">Personal health archive</p>
          <h1 className="mr-title">My Records</h1>
          <p className="mr-subtitle">Access and manage all of your medical documents in one secure place — lab reports, prescriptions and visit summaries shared between you and your doctor.</p>
        </div>
        <Button onClick={() => setUploadOpen(true)}><Upload className="mr-icon-14" /> Upload Record</Button>
      </div>

      {/* Search & category filters */}
      <div className="mr-filters-card">
        <div className="mr-search-wrap">
          <Search className="mr-icon-16 mr-search-icon" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search records by name or type…" aria-label="Search records by name or type" className="mr-search-input" />
          {query && <button onClick={() => setQuery("")} className="mr-clear-search" aria-label="Clear search">×</button>}
        </div>
        <div className="mr-cat-row">
          <button onClick={() => setCategory("all")} className={cn("mr-cat-pill", category === "all" && "mr-cat-pill-active")}>All Records <span className="mr-cat-count">{counts.all}</span></button>
          {CATEGORY_ORDER.map((k) => (
            <button key={k} onClick={() => setCategory(k)} className={cn("mr-cat-pill", category === k && "mr-cat-pill-active")}>
              {CATEGORY_META[k].plural} <span className="mr-cat-count">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="mr-result-row">
          <span className="mr-result-count">{filtered.length} of {records.length} record{records.length === 1 ? "" : "s"} shown{filtersActive ? " · filters applied" : ""}</span>
          {filtersActive && <button onClick={resetFilters} className="mr-reset-btn"><RotateCcw className="mr-icon-12" /> Reset filters</button>}
        </div>
      </div>

      {/* Records list */}
      {records.length === 0 ? (
        <EmptyState icon={FileHeart} title="No records yet" body="Upload your first lab report, prescription or visit document and it will appear here — ready to share with your doctor." actionLabel="Upload Record" onAction={() => setUploadOpen(true)} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={SearchX} title="No records found" body="No record matches your search or category right now. Try a different keyword, or clear the filters to see everything." actionLabel="Reset all filters" onAction={resetFilters} />
      ) : (
        <ul className="mr-list">
          {filtered.map((r) => (
            <li key={r.id} className="mr-card">
              <RecordTile record={r} />
              <div className="mr-card-main">
                <div className="mr-card-name-row">
                  <h3 className="mr-card-name">{r.name}</h3>
                  <StatusChip status={r.status} />
                </div>
                <div className="mr-card-meta">
                  <CategoryChip category={r.category} />
                  <span className="mr-card-meta-item">{r.format} · {r.size}</span>
                </div>
                {r.note && <p className="mr-card-note">{r.note}</p>}
                <div className="mr-card-meta2">
                  <span className={cn("mr-card-meta-item", r.uploaderRole === "doctor" ? "mr-meta-primary" : "mr-meta-clay")}><User className="mr-icon-12" /> Uploaded by {r.uploadedBy}</span>
                  <span className="mr-card-meta-item"><FileText className="mr-icon-12" /> {r.uploadedOn}</span>
                  {r.relatedVisit && <span className="mr-card-meta-item"><Stethoscope className="mr-icon-12" /> {r.relatedVisit}</span>}
                </div>
              </div>
              <div className="mr-card-actions">
                <Button size="sm" onClick={() => { setSelectedId(r.id); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }}><Eye className="mr-icon-14" /> View</Button>
                <Button variant="outline" size="sm" disabled={r.status === "failed"} title={r.status === "failed" ? "File unavailable — please re-upload" : undefined} onClick={() => handleDownload(r)}><Download className="mr-icon-14" /> Download</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mr-footer">Your records are encrypted at rest and visible only to you and your assigned doctor.</p>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={(rec) => setRecords((rs) => [rec, ...rs])} />
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, actionLabel, onAction }) {
  return (
    <div className="mr-empty">
      <span className="mr-empty-icon"><Icon className="mr-icon-24" /></span>
      <h2 className="mr-empty-title">{title}</h2>
      <p className="mr-empty-text">{body}</p>
      {actionLabel && <Button onClick={onAction} className="mr-empty-btn">{actionLabel}</Button>}
    </div>
  );
}

function RecordDetail({ record, onBack, onDownload }) {
  const meta = CATEGORY_META[record.category];
  return (
    <div className="mr-detail">
      <button onClick={onBack} className="mr-back-btn"><ArrowLeft className="mr-icon-14" /> Back to my records</button>
      <div className="mr-detail-header">
        <div className="mr-detail-head-main">
          <div className="mr-card-name-row">
            <RecordTile record={record} size="lg" />
            <h1 className="mr-detail-name">{record.name}</h1>
            <StatusChip status={record.status} />
          </div>
          <div className="mr-card-meta" style={{ marginTop: 10 }}>
            <CategoryChip category={record.category} />
            <span className="mr-card-meta-item">{record.format} · {record.size}</span>
          </div>
          {record.note && <p className="mr-detail-note">{record.note}</p>}
          <div className="mr-card-meta2" style={{ marginTop: 10 }}>
            <span className={cn("mr-card-meta-item", record.uploaderRole === "doctor" ? "mr-meta-primary" : "mr-meta-clay")}><User className="mr-icon-12" /> Uploaded by {record.uploadedBy}</span>
            <span className="mr-card-meta-item"><FileText className="mr-icon-12" /> {record.uploadedOn}</span>
          </div>
        </div>
        <div className="mr-detail-head-action">
          <Button onClick={() => onDownload(record)} disabled={record.status === "failed"}><Download className="mr-icon-14" /> Download</Button>
          <p className="mr-detail-format">{record.format} · {record.size}</p>
        </div>
      </div>

      <dl className="mr-detail-grid">
        <div><dt>Document type</dt><dd>{meta.singular}</dd></div>
        <div><dt>Format</dt><dd>{record.format}</dd></div>
        <div><dt>File size</dt><dd>{record.size}</dd></div>
        <div><dt>Uploaded by</dt><dd>{record.uploadedBy}</dd></div>
        <div><dt>Uploaded on</dt><dd>{record.uploadedOn}</dd></div>
        <div><dt>Related visit</dt><dd>{record.relatedVisit || "—"}</dd></div>
      </dl>

      <section className="mr-detail-section">
        <h2 className="mr-detail-section-title">Document preview</h2>
        {record.status === "processing" ? (
          <div className="mr-preview-box mr-preview-processing">
            <Loader2 className="mr-icon-20 mr-spin mr-icon-primary" />
            <p className="mr-preview-title">Processing document…</p>
            <p className="mr-preview-text">The preview will appear here as soon as the file finishes processing.</p>
          </div>
        ) : record.status === "failed" ? (
          <div className="mr-preview-box mr-preview-failed">
            <AlertTriangle className="mr-icon-20" />
            <p className="mr-preview-title">Preview unavailable</p>
            <p className="mr-preview-text">This file could not be processed. Remove it and upload a clear scan to try again.</p>
          </div>
        ) : isImageFormat(record.format) ? (
          <ImagePreview record={record} />
        ) : (
          <PaperPreview record={record} />
        )}
        {record.status === "ready" && <p className="mr-preview-foot">Prototype preview generated from sample data — the original {record.format} opens in the secure viewer on the live platform.</p>}
      </section>
    </div>
  );
}

function ImagePreview({ record }) {
  return (
    <div className="mr-image-preview" role="img" aria-label={`Preview of ${record.name}`}>
      <FileImage className="mr-icon-32" />
      <p className="mr-image-name">{record.name.length > 40 ? record.name.slice(0, 38) + "…" : record.name}</p>
      <p className="mr-image-meta">{record.format} image · {record.size}</p>
    </div>
  );
}

function PaperPreview({ record }) {
  return (
    <div className="mr-paper-preview">
      <div className="mr-paper-letterhead">
        <span className="mr-tile mr-tile-teal"><FileHeart className="mr-icon-16" /></span>
        <div>
          <p className="mr-paper-brand">CareCompass</p>
          <p className="mr-paper-sub">Medical record</p>
        </div>
        <span className="mr-paper-right">{record.format} · {record.size}</span>
      </div>
      <p className="mr-paper-name">{record.name}</p>
      <p className="mr-paper-date">{record.uploadedOn} · {record.pageCount ? `${record.pageCount} page${record.pageCount === 1 ? "" : "s"}` : "1 page"}</p>
      {record.previewRows && record.previewRows.length > 0 ? (
        <dl className="mr-paper-rows">
          {record.previewRows.map((row, i) => (
            <div key={i}>
              <dt>{row.label}</dt>
              <dd>{row.value}{row.note ? <span className="mr-paper-note"> {row.note}</span> : null}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="mr-paper-skeleton">
          {[92, 100, 78, 96, 64].map((w, i) => <span key={i} style={{ width: `${w}%` }} />)}
        </div>
      )}
      <p className="mr-paper-footer">CareCompass secure document preview</p>
    </div>
  );
}

/* ── Upload dialog ───────────────────────────────────────────── */
function UploadDialog({ open, onOpenChange, onUploaded }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [cat, setCat] = useState("lab-report");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (phase !== "uploading") return;
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + 8 + Math.random() * 12;
        if (next >= 100) { clearInterval(id); setPhase("success"); return 100; }
        return next;
      });
    }, 130);
    return () => clearInterval(id);
  }, [phase]);

  // Reset state when the dialog closes.
  useEffect(() => {
    if (!open && phase !== "uploading") {
      setFile(null); setError(null); setDragging(false); setCat("lab-report");
      setTitle(""); setDescription(""); setPhase("idle"); setProgress(0);
    }
  }, [open, phase]);

  function acceptFile(picked) {
    if (!picked) return;
    const ext = picked.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXT.includes(ext)) { setError("Unsupported file type. Please choose a PDF, JPG, PNG or DOC file."); return; }
    if (picked.size > MAX_SIZE_MB * 1024 * 1024) { setError(`File is too large. The maximum size is ${MAX_SIZE_MB} MB.`); return; }
    setError(null);
    setFile(picked);
  }

  function removeFile() {
    if (phase !== "idle") return;
    setFile(null); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startUpload() {
    if (!file) return;
    setPhase("uploading"); setProgress(0);
  }

  function finishUpload() {
    if (!file) return;
    const displayName = (title.trim() || file.name.replace(/\.[^.]+$/, ""));
    const rec = {
      id: `rec-${Date.now()}`,
      name: displayName,
      category: cat,
      format: extToFormat(file.name),
      size: formatBytes(file.size),
      uploadedBy: "Patient (you)",
      uploaderRole: "patient",
      uploadedOn: "Just now",
      status: "processing",
      note: description.trim() || undefined,
    };
    onUploaded(rec);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => phase !== "uploading" && onOpenChange(o)}>
      <DialogContent className="mr-upload-dialog">
        {phase === "success" ? (
          <div className="mr-upload-success">
            <span className="mr-upload-success-icon"><CheckCircle2 className="mr-icon-32" /></span>
            <h2 className="mr-upload-success-title">Record uploaded</h2>
            <p className="mr-upload-success-text">"{file ? (title.trim() || file.name) : ""}" has been added to your records. It will be ready in a moment.</p>
            <Button onClick={finishUpload}>View my records</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Upload Record</DialogTitle>
              <DialogDescription>Add a medical document to your records — lab reports, prescriptions, visit documents and more.</DialogDescription>
            </DialogHeader>

            <div className="mr-upload-body">
              {file ? (
                <div className="mr-upload-file-row">
                  <span className="mr-tile mr-tile-teal"><FileText className="mr-icon-16" /></span>
                  <div className="mr-upload-file-meta">
                    <p className="mr-upload-file-name">{file.name}</p>
                    <p className="mr-upload-file-size">{formatBytes(file.size)}</p>
                    {phase === "uploading" && (
                      <div className="mr-upload-progress">
                        <div className="mr-upload-progress-bar" style={{ width: `${progress}%` }} />
                        <span className="mr-upload-progress-label">Uploading… {Math.round(progress)}%</span>
                      </div>
                    )}
                  </div>
                  {phase === "idle" && (
                    <button onClick={removeFile} className="mr-upload-remove" aria-label="Remove selected file"><X className="mr-icon-16" /></button>
                  )}
                </div>
              ) : (
                <div
                  className={cn("mr-dropzone", dragging && "mr-dropzone-dragging")}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0]); }}
                >
                  <UploadCloud className="mr-icon-24 mr-icon-primary" />
                  <p className="mr-dropzone-text">Drag & drop your file here</p>
                  <p className="mr-dropzone-or">or</p>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
                  <p className="mr-dropzone-helper">PDF, JPG, PNG or DOC — up to {MAX_SIZE_MB} MB</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="mr-file-input" onChange={(e) => acceptFile(e.target.files?.[0])} />
                </div>
              )}

              {error && (
                <p className="mr-upload-error"><AlertTriangle className="mr-icon-14" /> {error}</p>
              )}

              <div className="mr-upload-fields">
                <div className="mr-field">
                  <label className="mr-field-label">Document category</label>
                  <Select value={cat} onValueChange={setCat}>
                    <SelectTrigger className="mr-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_ORDER.map((k) => <SelectItem key={k} value={k}>{CATEGORY_META[k].singular}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mr-field">
                  <label className="mr-field-label">Document title <span className="mr-field-optional">(optional)</span></label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Complete Blood Count — June panel" className="mr-input" disabled={phase === "uploading"} />
                </div>
                <div className="mr-field">
                  <label className="mr-field-label">Description <span className="mr-field-optional">(optional)</span></label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} placeholder="e.g. Blood test taken before the diabetes review…" className="mr-textarea" disabled={phase === "uploading"} />
                </div>
              </div>
            </div>

            <div className="mr-upload-footer">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={phase === "uploading"}>Cancel</Button>
              <Button onClick={startUpload} disabled={!file || phase === "uploading"}>
                {phase === "uploading" ? <><Loader2 className="mr-icon-14 mr-spin" /> Uploading…</> : <><Upload className="mr-icon-14" /> Upload Record</>}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MyRecords;
