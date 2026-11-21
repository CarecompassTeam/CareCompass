import { useState, useMemo } from "react";
import {
  Newspaper,
  FlaskConical,
  TriangleAlert,
  GraduationCap,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Lock,
  Stethoscope,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { cn } from "../../utils/cn";
import "./MedicalFeed.css";

const TYPE_META = {
  research: {
    label: "Research & Studies",
    icon: Newspaper,
    chip: "mf-chip-research",
    accent: "mf-accent-primary",
    cardBorder: "mf-card-border-default",
  },
  trial: {
    label: "Clinical Trial",
    icon: FlaskConical,
    chip: "mf-chip-trial",
    accent: "mf-accent-sage",
    cardBorder: "mf-card-border-trial",
  },
  alert: {
    label: "Drug Alert",
    icon: TriangleAlert,
    chip: "mf-chip-alert",
    accent: "mf-accent-destructive",
    cardBorder: "mf-card-border-alert",
  },
  explainer: {
    label: "Explainer & Tip",
    icon: GraduationCap,
    chip: "mf-chip-explainer",
    accent: "mf-accent-clay",
    cardBorder: "mf-card-border-explainer",
  },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "research", label: "Research" },
  { key: "trial", label: "Trials" },
  { key: "alert", label: "Drug Alerts" },
  { key: "explainer", label: "Explainers" },
];

const TRUSTED_SOURCES = [
  "WHO",
  "FDA",
  "NEJM",
  "The Lancet",
  "JAMA",
  "CDC",
  "EMA",
  "Mayo Clinic",
];

const POSTS = [
  {
    id: "p1",
    type: "alert",
    source: "FDA MedWatch",
    sourceShort: "FDA",
    title:
      "Warfarin + Amiodarone: marked INR elevation and major bleeding risk",
    excerpt:
      "Amiodarone inhibits CYP2C9, the primary enzyme metabolising warfarin. Combined use can raise INR within 3–7 days and significantly increase bleeding risk. Monitor INR more frequently and expect a warfarin dose reduction of 25–40% when amiodarone is started.",
    date: "Updated 2 days ago",
    readTime: "3 min read",
    tags: ["interactions", "anticoagulants", "cardiology"],
    url: "https://www.fda.gov",
  },
  {
    id: "p2",
    type: "research",
    source: "New England Journal of Medicine",
    sourceShort: "NEJM",
    title:
      "Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes",
    excerpt:
      "In a 17,604-participant trial, weekly semaglutide in adults with pre-existing cardiovascular disease and obesity (without diabetes) reduced the composite of cardiovascular death, nonfatal MI, and nonfatal stroke by 20% over 3.3 years of follow-up compared with placebo.",
    date: "Published 5 days ago",
    readTime: "8 min read",
    tags: ["GLP-1", "cardiology", "obesity"],
    url: "https://www.nejm.org",
  },
  {
    id: "p3",
    type: "trial",
    source: "The Lancet",
    sourceShort: "Lancet",
    title:
      "Once-weekly insulin icodec vs daily glargine in type 2 diabetes (ONWARDS 3)",
    excerpt:
      "Phase 3, 52-week trial in insulin-naïve adults: once-weekly insulin icodec was non-inferior to daily insulin glargine U100 for HbA1c reduction, with a comparable rate of level 2 hypoglycaemia and lower total daily insulin dose at end of treatment.",
    date: "Published 1 week ago",
    readTime: "6 min read",
    tags: ["endocrinology", "insulin", "phase-3"],
    url: "https://www.thelancet.com",
  },
  {
    id: "p4",
    type: "explainer",
    source: "Clinical tip · peer-reviewed",
    sourceShort: "Tip",
    title: "A simple rule for potassium replacement in DKA",
    excerpt:
      "Replace potassium once serum K⁺ falls below 5.2 mmol/L and insulin has started. A practical starting point: add 20–30 mEq KCl per litre of IV fluid when K⁺ is 3.3–5.2, hold insulin if K⁺ < 3.3, and recheck every 2 hours. Never start insulin before confirming K⁺.",
    date: "Updated 3 days ago",
    readTime: "2 min read",
    tags: ["DKA", "electrolytes", "emergency"],
    url: "#",
  },
  {
    id: "p5",
    type: "research",
    source: "JAMA",
    sourceShort: "JAMA",
    title:
      "Antibiotic stewardship reduces Clostridioides difficile by 38% in ICUs",
    excerpt:
      "A multicentre before-and-after study across 47 intensive care units found that a structured stewardship bundle — empiric review at 48 hours, dose optimisation, and automatic stop orders — reduced hospital-onset C. difficile infection by 38% without increasing mortality.",
    date: "Published 4 days ago",
    readTime: "5 min read",
    tags: ["stewardship", "infectious-disease", "ICU"],
    url: "https://jamanetwork.com",
  },
  {
    id: "p6",
    type: "alert",
    source: "European Medicines Agency",
    sourceShort: "EMA",
    title:
      "Statin + Clarithromycin: elevated statin levels and rhabdomyolysis risk",
    excerpt:
      "Macrolide antibiotics inhibit CYP3A4, sharply raising plasma levels of simvastatin, lovastatin, and atorvastatin. Co-prescription is associated with rhabdomyolysis. Suspend simvastatin/lovastatin during treatment and for a few days after; consider azithromycin or a temporary statin hold.",
    date: "Updated 6 days ago",
    readTime: "3 min read",
    tags: ["interactions", "statins", "antibiotics"],
    url: "https://www.ema.europa.eu",
  },
  {
    id: "p7",
    type: "trial",
    source: "New England Journal of Medicine",
    sourceShort: "NEJM",
    title:
      "Empagliflozin in Acute Heart Failure: 90-day outcomes (EMPACT-AHF)",
    excerpt:
      "Initiating empagliflozin within 48 hours of admission for acute decompensated heart failure was safe and reduced the composite of all-cause mortality and heart-failure rehospitalisation at 90 days compared with placebo. Benefits appeared early and persisted through follow-up.",
    date: "Published 9 days ago",
    readTime: "7 min read",
    tags: ["SGLT2", "cardiology", "acute-HF"],
    url: "https://www.nejm.org",
  },
  {
    id: "p8",
    type: "explainer",
    source: "World Health Organization",
    sourceShort: "WHO",
    title: "Updated adult hypertension treatment thresholds (2026)",
    excerpt:
      "WHO reaffirms initiation of pharmacological treatment for adults with confirmed systolic ≥ 140 mmHg or diastolic ≥ 90 mmHg, and for those with cardiovascular disease at lower thresholds. Recommends a step-care approach starting with a single agent and reassessing at 4 weeks.",
    date: "Updated 1 week ago",
    readTime: "4 min read",
    tags: ["hypertension", "guidelines", "primary-care"],
    url: "https://www.who.int",
  },
];

export function MedicalFeed({ doctorName }) {
  const [filter, setFilter] = useState("all");
  const [saved, setSaved] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const visible = useMemo(() => {
    if (filter === "all") return POSTS;
    return POSTS.filter((p) => p.type === filter);
  }, [filter]);

  const alertCount = POSTS.filter((p) => p.type === "alert").length;

  const toggleSave = (id) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const refresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdated("Just now");
    }, 1400);
  };

  return (
    <div className="mf-root">
      {/* Header */}
      <div className="mf-header">
        <div>
          <div className="mf-title-row">
            <span className="mf-title-badge">
              <Newspaper className="mf-icon-20" />
            </span>
            <h1 className="mf-title">
              Medical Feed
            </h1>
            {alertCount > 0 && (
              <span className="mf-alert-pill">
                <TriangleAlert className="mf-icon-12" />
                {alertCount} drug alerts
              </span>
            )}
          </div>
          <p className="mf-subtitle">
            Curated for medical professionals. Sourced only from trusted,
            peer-reviewed sources — every post shows where it came from.
          </p>
        </div>

        <div className="mf-header-actions">
          <span className="mf-last-updated">
            <Clock className="mf-icon-12" />
            {lastUpdated}
          </span>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="mf-refresh-btn"
          >
            <RefreshCw
              className={cn("mf-icon-12", refreshing && "mf-spin")}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Trusted sources strip */}
      <div className="mf-sources-card">
        <p className="mf-sources-label">
          <ShieldCheck className="mf-icon-14 mf-icon-primary" />
          Trusted sources only
        </p>
        <div className="mf-sources-list">
          {TRUSTED_SOURCES.map((s) => (
            <span
              key={s}
              className="mf-source-chip"
            >
              <span className="mf-source-initial">
                {s[0]}
              </span>
              {s}
            </span>
          ))}
        </div>
        <p className="mf-sources-note">
          <Lock className="mf-note-lock mf-icon-12 mf-icon-muted" />
          No user-generated content. The feed is read-only — no posting or
          commenting — to keep moderation and misinformation out of scope.
        </p>
      </div>

      {/* Filters */}
      <div className="mf-filters scrollbar-rivara">
        <span className="mf-filter-label">
          <Filter className="mf-icon-14" />
          Filter
        </span>
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? POSTS.length
              : POSTS.filter((p) => p.type === f.key).length;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "mf-filter-btn",
                active
                  ? "mf-filter-btn-active"
                  : "mf-filter-btn-idle"
              )}
              aria-pressed={active}
            >
              {f.label}
              <span
                className={cn(
                  "mf-filter-count",
                  active ? "mf-filter-count-active" : "mf-filter-count-idle"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feed stream */}
      <div className="mf-feed-stream scrollbar-rivara">
        {visible.length === 0 ? (
          <div className="mf-empty-state">
            <Newspaper className="mf-empty-icon mf-icon-32 mf-icon-muted" />
            <p className="mf-empty-title">
              No posts in this category yet
            </p>
            <p className="mf-empty-sub">
              The feed refreshes periodically from trusted sources.
            </p>
          </div>
        ) : (
          visible.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              saved={saved.has(post.id)}
              onToggleSave={() => toggleSave(post.id)}
            />
          ))
        )}
      </div>

      {/* Read-only footer */}
      <div className="mf-footer">
        <p className="mf-footer-note">
          <Stethoscope className="mf-icon-14 mf-icon-primary" />
          Visible to <span className="mf-footer-strong">doctors only</span>.
          Patients and admins do not see this feed.
        </p>
        <p className="mf-footer-note">
          <CheckCircle2 className="mf-icon-14 mf-icon-sage" />
          {saved.size} saved
        </p>
      </div>
    </div>
  );
}

/** Single post card — shared layout for every feed type. */
function FeedCard({
  post,
  saved,
  onToggleSave,
}) {
  const meta = TYPE_META[post.type];
  const Icon = meta.icon;
  const isAlert = post.type === "alert";

  return (
    <article
      className={cn(
        "mf-post-card",
        meta.cardBorder
      )}
    >
      {/* header row: source + type + date */}
      <div className="mf-post-header">
        <div className="mf-post-source">
          <span
            className={cn(
              "mf-post-initial",
              meta.chip
            )}
          >
            {post.sourceShort[0]}
          </span>
          <div className="mf-post-source-info">
            <p className="mf-post-source-name">
              {post.source}
            </p>
            <p className="mf-post-date">{post.date}</p>
          </div>
        </div>
        <span
          className={cn(
            "mf-post-type",
            meta.chip
          )}
        >
          <Icon className="mf-icon-12" />
          {meta.label}
        </span>
      </div>

      {/* alert banner for drug alerts */}
      {isAlert && (
        <div className="mf-post-alert">
          <TriangleAlert className="mf-icon-14" />
          Dangerous interaction — review before prescribing
        </div>
      )}

      {/* title + excerpt */}
      <h3 className="mf-post-title">
        {post.title}
      </h3>
      <p className="mf-post-excerpt">
        {post.excerpt}
      </p>

      {/* tags */}
      <div className="mf-post-tags">
        {post.tags.map((t) => (
          <span
            key={t}
            className="mf-post-tag"
          >
            #{t}
          </span>
        ))}
      </div>

      {/* footer: read link + read time + save */}
      <div className="mf-post-footer">
        <div className="mf-post-meta">
          <span className="mf-post-readtime">
            <Clock className="mf-icon-12" />
            {post.readTime}
          </span>
        </div>
        <div className="mf-post-actions">
          <button
            onClick={onToggleSave}
            className="mf-save-btn"
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save post"}
          >
            {saved ? (
              <BookmarkCheck className="mf-icon-14 mf-icon-primary" />
            ) : (
              <Bookmark className="mf-icon-14" />
            )}
            {saved ? "Saved" : "Save"}
          </button>
          {post.url !== "#" && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mf-read-link"
            >
              Read at source
              <ExternalLink className="mf-icon-12" />
            </a>
          )}
        </div>
      </div>

      {/* citation note */}
      <p className="mf-post-citation">
        Source: <span className="mf-cite-source">{post.source}</span>{" "}
        · consistent with CareCompass's principle of citing where information comes from.
      </p>
    </article>
  );
}

export default MedicalFeed;
