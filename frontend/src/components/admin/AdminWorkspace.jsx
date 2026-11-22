/* =====================================
   Admin workspace — dashboard shell
=====================================
   Plain-CSS port of the workspace `admin-workspace.tsx`. Same shell
   as the doctor and patient workspaces: sticky topbar, collapsible
   sidebar, section views. Sections follow the graduation spec for
   the admin role: manage user accounts, review the doctor identity
   verification queue, and read the activity (audit) log.
===================================== */

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ScrollText,
  Menu,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  UserCog,
  AlertCircle,
  RefreshCcw,
  ArrowRight,
  Clock,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { adminApi as api } from "../../services/admin-api";
import { Logo } from "../doctor/Logo";
import { VerificationQueuePanel } from "./AdminReviewDialog";
import { AdminUsers } from "./AdminUsers";
import { AdminAuditLog } from "./AdminAudit";

import "./AdminWorkspace.css";

const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    hint: "Platform overview and recent activity",
  },
  {
    key: "users",
    label: "User Management",
    icon: Users,
    hint: "Create, edit and disable accounts",
  },
  {
    key: "verifications",
    label: "Verifications",
    icon: ShieldCheck,
    hint: "Doctor identity review queue",
  },
  {
    key: "audit",
    label: "Audit Log",
    icon: ScrollText,
    hint: "Who accessed what — and when",
  },
];

export function AdminWorkspace({ admin, onSignOut }) {
  const [view, setView] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState(null);

  // Badge count for the Verifications nav item — cheap: reuse the overview.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await api("/api/admin/overview");
        if (alive) setPendingVerifications(res.verifications.pending);
      } catch {
        // badge is decorative; ignore failures
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [view]); // refresh whenever the admin switches sections

  return (
    <div className="aw-root">
      {/* Top bar */}
      <header className="aw-topbar">
        <div className="aw-topbar-inner">
          <div className="aw-topbar-left">
            {/* mobile nav toggle */}
            <button
              onClick={() => setNavOpen((o) => !o)}
              className="aw-nav-toggle"
              aria-label="Toggle navigation"
              aria-expanded={navOpen}
            >
              <Menu className="aw-icon-16" />
            </button>
            <a href="#" className="aw-logo-link">
              <Logo size={28} wordmarkClassName="lg-wordmark-xl" />
              <span className="aw-admin-badge">Admin</span>
            </a>
          </div>

          <div className="aw-topbar-right">
            {/* search */}
            <button
              className="aw-search-btn"
              aria-label="Search"
            >
              <Search className="aw-icon-14" />
              Search users, applications…
              <kbd className="aw-search-kbd">
                /
              </kbd>
            </button>
            <button
              className="aw-bell-btn"
              aria-label="Notifications"
            >
              <Bell className="aw-icon-16" />
              {pendingVerifications ? (
                <span className="aw-bell-dot" />
              ) : null}
            </button>

            {/* admin chip */}
            <div className="aw-admin-chip">
              <span className="aw-admin-avatar">
                {admin.name === "Admin" || !admin.name
                  ? "A"
                  : admin.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
              </span>
              <div className="aw-admin-meta">
                <p className="aw-admin-name">
                  {admin.name || "Admin"}
                  <UserCog className="aw-admin-name-icon" />
                </p>
                <p className="aw-admin-email">{admin.email}</p>
              </div>
            </div>

            <button onClick={onSignOut} className="aw-signout-btn">
              <LogOut className="aw-icon-14" />
              <span className="aw-signout-label">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="aw-body">
        {/* Sidebar */}
        <aside
          className={cn("aw-sidebar", navOpen && "aw-sidebar-open")}
        >
          <nav className="aw-nav">
            <p className="aw-nav-label">Admin workspace</p>
            {NAV.map((item) => {
              const active = view === item.key;
              const badge =
                item.key === "verifications" && pendingVerifications
                  ? String(pendingVerifications)
                  : undefined;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    setNavOpen(false);
                  }}
                  className={cn(
                    "aw-nav-item",
                    active && "aw-nav-item-active"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="aw-nav-icon" />
                  <span className="aw-nav-text">
                    <span className="aw-nav-item-label">{item.label}</span>
                    <span
                      className={cn(
                        "aw-nav-item-hint",
                        active && "aw-nav-item-hint-active"
                      )}
                    >
                      {item.hint}
                    </span>
                  </span>
                  {badge && (
                    <span
                      className={cn(
                        "aw-nav-badge",
                        active && "aw-nav-badge-active"
                      )}
                    >
                      {badge}
                    </span>
                  )}
                  {active && !badge && (
                    <ChevronRight className="aw-nav-chevron" />
                  )}
                </button>
              );
            })}

            <div className="aw-info-card">
              <p className="aw-info-title">
                <ShieldCheck className="aw-icon-14" />
                Every action is logged
              </p>
              <p className="aw-info-text">
                Role changes, disabling accounts and verification decisions are
                written to the audit log with your name on them.
              </p>
            </div>
          </nav>
        </aside>

        {/* mobile backdrop */}
        {navOpen && (
          <div
            className="aw-backdrop"
            onClick={() => setNavOpen(false)}
            aria-hidden
          />
        )}

        {/* Main content */}
        <main className="aw-main">
          {view === "dashboard" ? (
            <AdminOverview onNavigate={setView} />
          ) : view === "users" ? (
            <AdminUsers adminEmail={admin.email} />
          ) : view === "verifications" ? (
            <div className="aw-section">
              <VerificationQueuePanel variant="panel" />
            </div>
          ) : (
            <AdminAuditLog />
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── Dashboard overview ────────────────────────────────────────────────── */

const ROLE_CHIP = {
  DOCTOR: "aw-chip-doctor",
  PATIENT: "aw-chip-patient",
  ADMIN: "aw-chip-admin",
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function StatCard({ icon: Icon, label, value, sub, loading }) {
  return (
    <div className="aw-stat">
      <div className="aw-stat-top">
        <span className="aw-stat-icon">
          <Icon className="aw-icon-20" />
        </span>
        {loading ? (
          <span className="aw-stat-sk" />
        ) : (
          <span className="aw-stat-value">{value}</span>
        )}
      </div>
      <p className="aw-stat-label">{label}</p>
      <p className="aw-stat-sub">{sub}</p>
    </div>
  );
}

export function AdminOverview({ onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reloading, setReloading] = useState(false);

  const load = async () => {
    setError("");
    setReloading(true);
    try {
      const res = await api("/api/admin/overview");
      setData(res);
    } catch (err) {
      setError(err.message || "Could not load the overview.");
    } finally {
      setReloading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = data === null && !error;

  return (
    <div className="aw-section">
      {/* header */}
      <div className="aw-header">
        <div>
          <p className="aw-eyebrow">Admin · Dashboard</p>
          <h2 className="aw-title">Platform overview</h2>
          <p className="aw-sub">
            Accounts, identity verifications and platform activity — the three
            things the admin keeps honest.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="aw-refresh-btn"
          aria-label="Refresh overview"
        >
          <RefreshCcw
            className={cn("aw-icon-14", reloading && "aw-spin")}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="aw-error">
          <span className="aw-error-text">
            <AlertCircle className="aw-icon-16" />
            {error}
          </span>
          <Buttonish onClick={() => void load()} label="Retry" />
        </div>
      )}

      {/* stat cards */}
      <div className="aw-stats">
        <StatCard
          icon={Users}
          label="Total users"
          value={data?.users.total ?? "—"}
          sub={
            data
              ? `${data.users.active} active · ${data.users.disabled} disabled`
              : "Loading…"
          }
          loading={loading}
        />
        <StatCard
          icon={ShieldCheck}
          label="Pending verifications"
          value={data?.verifications.pending ?? "—"}
          sub={
            data
              ? `${data.verifications.verifiedTotal} doctors verified to date`
              : "Loading…"
          }
          loading={loading}
        />
        <StatCard
          icon={ScrollText}
          label="Audit events today"
          value={data?.audit.today ?? "—"}
          sub={
            data
              ? `${data.audit.last7Days} in the last 7 days`
              : "Loading…"
          }
          loading={loading}
        />
        <StatCard
          icon={UserCog}
          label="Admins"
          value={data?.users.byRole.admin ?? "—"}
          sub="Platform administrators"
          loading={loading}
        />
      </div>

      {/* middle grid: role distribution + quick actions */}
      <div className="aw-middle">
        {/* role distribution */}
        <div className="aw-panel aw-panel-1">
          <h3 className="aw-panel-title">Users by role</h3>
          <p className="aw-panel-sub">
            Across managed and self-registered accounts.
          </p>
          <div className="aw-roles">
            {["doctor", "patient", "admin"].map((role) => {
              const count = data ? data.users.byRole[role] : 0;
              const pct =
                data && data.users.total > 0
                  ? Math.round((count / data.users.total) * 100)
                  : 0;
              return (
                <div key={role}>
                  <div className="aw-role-row">
                    <span className="aw-role-name">{role}s</span>
                    <span className="aw-role-value">
                      {loading ? "—" : `${count} · ${pct}%`}
                    </span>
                  </div>
                  <div className="aw-bar-track">
                    <div
                      className={cn(
                        "aw-bar",
                        role === "doctor" && "aw-bar-doctor",
                        role === "patient" && "aw-bar-patient",
                        role === "admin" && "aw-bar-admin"
                      )}
                      style={{ width: `${loading ? 0 : pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* quick actions */}
        <div className="aw-panel aw-panel-2">
          <h3 className="aw-panel-title">Quick actions</h3>
          <p className="aw-panel-sub">
            Jump straight into the two queues the admin owns.
          </p>
          <div className="aw-qa-grid">
            <button
              onClick={() => onNavigate("users")}
              className="aw-qa"
            >
              <span className="aw-qa-icon">
                <Users className="aw-icon-20" />
              </span>
              <span className="aw-qa-body">
                <span className="aw-qa-title">Manage users</span>
                <span className="aw-qa-sub">
                  Create, change roles, disable accounts
                </span>
              </span>
              <ArrowRight className="aw-qa-arrow" />
            </button>
            <button
              onClick={() => onNavigate("verifications")}
              className="aw-qa"
            >
              <span className="aw-qa-icon">
                <ShieldCheck className="aw-icon-20" />
              </span>
              <span className="aw-qa-body">
                <span className="aw-qa-title">Review verifications</span>
                <span className="aw-qa-sub">
                  {data && data.verifications.pending > 0
                    ? `${data.verifications.pending} application${data.verifications.pending === 1 ? "" : "s"} waiting`
                    : "Doctor identity documents"}
                </span>
              </span>
              {data && data.verifications.pending > 0 && (
                <span className="aw-qa-count">
                  {data.verifications.pending}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* recent activity */}
      <div className="aw-recent">
        <div className="aw-recent-head">
          <div>
            <h3 className="aw-panel-title">Recent activity</h3>
            <p className="aw-panel-sub">
              The latest entries from the audit log.
            </p>
          </div>
          <button
            onClick={() => onNavigate("audit")}
            className="aw-open-audit"
          >
            Open audit log
            <ArrowRight className="aw-icon-14" />
          </button>
        </div>

        {loading ? (
          <div className="aw-recent-sk">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="aw-sk-row"
                style={{ width: `${100 - i * 4}%` }}
              />
            ))}
          </div>
        ) : error ? (
          <p className="aw-recent-empty">
            Activity is unavailable right now.
          </p>
        ) : data && data.recent.length === 0 ? (
          <p className="aw-recent-empty">
            No activity recorded yet — entries appear as users sign in and
            work with records.
          </p>
        ) : (
          <ul className="aw-activity">
            {data?.recent.map((e) => (
              <li key={e.id} className="aw-activity-item">
                <span className="aw-activity-icon">
                  <Clock className="aw-icon-14" />
                </span>
                <span className="aw-activity-action">{e.action}</span>
                <span
                  className={cn(
                    "aw-activity-role",
                    ROLE_CHIP[e.actorRole]
                  )}
                >
                  {e.actorRole.toLowerCase()}
                </span>
                <span className="aw-activity-detail">
                  {e.detail ?? e.resource}
                </span>
                <span
                  className={cn(
                    "aw-activity-result",
                    e.result === "success" && "aw-result-success",
                    e.result === "denied" && "aw-result-denied",
                    e.result === "error" && "aw-result-error"
                  )}
                >
                  {e.result}
                </span>
                <span className="aw-activity-time">
                  {timeAgo(e.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Tiny button (keeps the JSX above readable)
function Buttonish({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aw-retry-btn"
    >
      {label}
    </button>
  );
}
