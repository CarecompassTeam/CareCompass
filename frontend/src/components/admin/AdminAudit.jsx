/* =====================================
   Admin · Audit log
=====================================
   Plain-CSS port of the workspace `admin-audit.tsx`. Read-only table
   of time, user, role, action, resource and result — paginated,
   filterable by user, action and date range. Times render in the
   viewer's locale with the raw ISO value on hover.
===================================== */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollText,
  Loader2,
  AlertCircle,
  RefreshCcw,
  SearchX,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { adminApi as api } from "../../services/admin-api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";

import "./AdminAudit.css";

const PAGE_SIZE = 12;

const ROLE_CHIP = {
  DOCTOR: "aa-role-doctor",
  PATIENT: "aa-role-patient",
  ADMIN: "aa-role-admin",
};

function resultChip(result) {
  if (result === "success")
    return { className: "aa-result-success", label: "Success" };
  if (result === "denied")
    return { className: "aa-result-denied", label: "Denied" };
  return { className: "aa-result-error", label: "Error" };
}

function localTime(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminAuditLog() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    user: "",
    action: "",
    from: "",
    to: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (filters.user) params.set("user", filters.user);
      if (filters.action) params.set("action", filters.action);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      const res = await api(`/api/admin/audit?${params.toString()}`);
      setData(res);
    } catch (err) {
      setError(err.message || "Could not load the audit log.");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasActiveFilters = useMemo(
    () => !!(filters.user || filters.action || filters.from || filters.to),
    [filters]
  );

  const setFilter = (patch) => {
    setPage(1); // filters reset pagination
    setFilters((f) => ({ ...f, ...patch }));
  };

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="aa-root">
      {/* header */}
      <div className="aa-header">
        <div>
          <p className="aa-eyebrow">Admin · Audit log</p>
          <h2 className="aa-title">Activity log</h2>
          <p className="aa-sub">
            Read-only record of every sensitive action: who, what, when, and
            the result. Sign-ins, record access, verification decisions and
            account changes all land here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="aa-refresh-btn"
          aria-label="Refresh audit log"
        >
          <RefreshCcw
            className={cn("aa-icon-14", loading && "aa-spin")}
          />
          Refresh
        </button>
      </div>

      {/* filters */}
      <div className="aa-filters">
        <div className="aa-filters-row">
          <span className="aa-filters-label">
            <Filter className="aa-icon-14" />
            Filters
          </span>

          <Select
            value={filters.action || "ALL"}
            onValueChange={(v) => setFilter({ action: v === "ALL" ? "" : v })}
          >
            <SelectTrigger
              className="aa-select-action"
              aria-label="Filter by action"
            >
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent className="aa-select-content">
              <SelectItem value="ALL">All actions</SelectItem>
              {(data?.actions ?? []).map((a) => (
                <SelectItem key={a} value={a} className="aa-select-item">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.user || "ALL"}
            onValueChange={(v) => setFilter({ user: v === "ALL" ? "" : v })}
          >
            <SelectTrigger
              className="aa-select-user"
              aria-label="Filter by user"
            >
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent className="aa-select-content">
              <SelectItem value="ALL">All users</SelectItem>
              {(data?.actors ?? []).map((a) => (
                <SelectItem key={a} value={a} className="aa-select-item">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <label className="aa-date-label">From</label>
            <Input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => setFilter({ from: e.target.value })}
              aria-label="From date"
              className="aa-date-input"
            />
          </div>
          <div>
            <label className="aa-date-label">To</label>
            <Input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => setFilter({ to: e.target.value })}
              aria-label="To date"
              className="aa-date-input"
            />
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="aa-btn-clear"
              onClick={() =>
                setFilter({ user: "", action: "", from: "", to: "" })
              }
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* table card */}
      <div className="aa-card">
        {loading && data === null ? (
          <div className="aa-skeleton">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="aa-sk-row">
                <span className="aa-sk-time" />
                <span className="aa-sk-line" />
                <span className="aa-sk-chip" />
                <span className="aa-sk-chip" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="aa-error-row">
            <span className="aa-error-text">
              <AlertCircle className="aa-icon-16" />
              {error}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="aa-empty">
            <span className="aa-empty-icon">
              <SearchX className="aa-icon-24" />
            </span>
            <p className="aa-empty-title">
              {hasActiveFilters
                ? "No entries match these filters"
                : "The audit log is empty"}
            </p>
            <p className="aa-empty-text">
              {hasActiveFilters
                ? "Loosen the user, action or date filters to see more of the record."
                : "Entries appear as users sign in, upload documents, and records change."}
            </p>
          </div>
        ) : (
          <div className="aa-scroll scrollbar-rivara">
            <Table>
              <TableHeader>
                <TableRow className="aa-tr-head">
                  <TableHead className="aa-th">Time</TableHead>
                  <TableHead className="aa-th">User</TableHead>
                  <TableHead className="aa-th">Role</TableHead>
                  <TableHead className="aa-th">Action</TableHead>
                  <TableHead className="aa-th aa-col-resource">Resource</TableHead>
                  <TableHead className="aa-th">Result</TableHead>
                  <TableHead className="aa-th aa-col-detail">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => {
                  const chip = resultChip(e.result);
                  return (
                    <TableRow key={e.id} className="aa-tr">
                      <TableCell className="aa-cell-time">
                        <time dateTime={e.createdAt} title={e.createdAt}>
                          {localTime(e.createdAt)}
                        </time>
                      </TableCell>
                      <TableCell
                        className="aa-cell-actor"
                        title={e.actor}
                      >
                        {e.actor}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "aa-role-chip",
                            ROLE_CHIP[e.actorRole] ?? "aa-role-default"
                          )}
                        >
                          {e.actorRole.toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell className="aa-cell-action">
                        {e.action}
                      </TableCell>
                      <TableCell
                        className="aa-cell-resource"
                        title={e.resource}
                      >
                        {e.resource}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "aa-result-chip",
                            chip.className
                          )}
                        >
                          <span className="aa-result-dot" />
                          {chip.label}
                        </span>
                      </TableCell>
                      <TableCell
                        className="aa-cell-detail"
                        title={e.detail || undefined}
                      >
                        {e.detail ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* pagination */}
        {entries.length > 0 && (
          <div className="aa-pagination">
            <p className="aa-page-info" aria-live="polite">
              Showing{" "}
              <span className="aa-strong">
                {showingFrom}–{showingTo}
              </span>{" "}
              of{" "}
              <span className="aa-strong">{total}</span> entries
            </p>
            <div className="aa-pager">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="aa-btn-page"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="aa-page-icon-l" />
                Prev
              </Button>
              <span className="aa-page-text">
                Page <span className="aa-strong">{page}</span> of{" "}
                <span className="aa-strong">{pageCount}</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="aa-btn-page"
                disabled={page >= pageCount || loading}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
                <ChevronRight className="aa-page-icon-r" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="aa-footnote">
        <ScrollText className="aa-footnote-icon" />
        This log is read-only for admins — entries can never be edited or
        deleted from the interface. Times show in your local timezone; hover
        a timestamp for the exact ISO value.
      </p>
    </div>
  );
}
