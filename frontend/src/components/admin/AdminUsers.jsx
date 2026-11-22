/* =====================================
   Admin · User management
=====================================
   Plain-CSS port of the workspace `admin-users.tsx`. Users table
   (name, email, role, status), create user form, change role,
   enable/disable, search. Every destructive or privilege change goes
   through a confirmation step, and an admin can never disable or
   re-role their own account.
===================================== */

import { useCallback, useEffect, useMemo, useState, useId } from "react";
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  RefreshCcw,
  UserPlus,
  MoreHorizontal,
  ShieldCheck,
  UserCog,
  Stethoscope,
  HeartPulse,
  Eye,
  EyeOff,
  KeyRound,
  Ban,
  CheckCircle2,
  Inbox,
  Info,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { adminApi as api } from "../../services/admin-api";
import { toast } from "../../hooks/use-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
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
import { passwordRules, EMAIL_RE } from "../../utils/verification";

import "./AdminUsers.css";

const ROLE_META = {
  DOCTOR: {
    icon: Stethoscope,
    label: "Doctor",
    tint: "au-role-doctor",
  },
  PATIENT: {
    icon: HeartPulse,
    label: "Patient",
    tint: "au-role-patient",
  },
  ADMIN: {
    icon: UserCog,
    label: "Admin",
    tint: "au-role-admin",
  },
};

function initialsOf(name) {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => (w[0] ? w[0].toUpperCase() : ""))
    .join("");
}

function createdLabel(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminUsers({ adminEmail }) {
  const [users, setUsers] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // create-user dialog
  const [createOpen, setCreateOpen] = useState(false);

  // row mutation targets
  const [roleTarget, setRoleTarget] = useState(null);
  const [disableTarget, setDisableTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const res = await api("/api/admin/users");
      setUsers(res.users);
    } catch (err) {
      setLoadError(err.message || "Could not load the user list.");
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      )
        return false;
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const isSelf = (u) => u.email.toLowerCase() === adminEmail.toLowerCase();

  const applyPatch = async (user, body, done) => {
    setBusyId(user.id);
    try {
      const res = await api("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id: user.id, kind: user.kind, ...body }),
      });
      if (res.user) {
        setUsers((prev) =>
          prev ? prev.map((u) => (u.id === res.user.id ? res.user : u)) : prev
        );
      } else {
        await load();
      }
      done();
    } catch (err) {
      toast({
        title: "Change failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="au-root">
      {/* header */}
      <div className="au-header">
        <div>
          <p className="au-eyebrow">Admin · User management</p>
          <h2 className="au-title">Users</h2>
          <p className="au-sub">
            Every account on the platform — created here or through the early
            access forms. Changing a role or disabling an account takes effect
            immediately and is written to the audit log.
          </p>
        </div>
        <div className="au-header-actions">
          <button
            type="button"
            onClick={() => void load()}
            className="au-refresh-btn"
            aria-label="Refresh users"
          >
            <RefreshCcw className="au-icon-14" />
            Refresh
          </button>
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="au-btn-new"
          >
            <UserPlus className="au-btn-icon" />
            New user
          </Button>
        </div>
      </div>

      {/* toolbar */}
      <div className="au-toolbar">
        <div className="au-search-wrap">
          <Search className="au-search-icon" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search users by name or email"
            className="au-search-input"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v)}>
          <SelectTrigger className="au-select-role" aria-label="Filter by role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All roles</SelectItem>
            <SelectItem value="DOCTOR">Doctors</SelectItem>
            <SelectItem value="PATIENT">Patients</SelectItem>
            <SelectItem value="ADMIN">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v)}
        >
          <SelectTrigger
            className="au-select-status"
            aria-label="Filter by status"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
        <p className="au-count" aria-live="polite">
          {users === null
            ? "Loading…"
            : `${filtered.length} of ${users.length} users`}
        </p>
      </div>

      {/* table card */}
      <div className="au-card">
        {users === null ? (
          <TableSkeleton />
        ) : loadError ? (
          <div role="alert" className="au-error-row">
            <span className="au-error-text">
              <AlertCircle className="au-icon-16" />
              {loadError}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyUsers search={search} />
        ) : (
          <div className="au-scroll scrollbar-rivara">
            <Table>
              <TableHeader className="au-thead">
                <TableRow className="au-tr-head">
                  <TableHead className="au-th">User</TableHead>
                  <TableHead className="au-th">Role</TableHead>
                  <TableHead className="au-th">Status</TableHead>
                  <TableHead className="au-th au-th-source">Source</TableHead>
                  <TableHead className="au-th au-th-created">Created</TableHead>
                  <TableHead className="au-th-actions">
                    <span className="au-sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const meta = ROLE_META[u.role] || ROLE_META.PATIENT;
                  const self = isSelf(u);
                  const busy = busyId === u.id;
                  const RoleIcon = meta.icon;
                  return (
                    <TableRow
                      key={`${u.kind}:${u.id}`}
                      className={cn(
                        "au-tr",
                        u.status === "disabled" && "au-tr-disabled"
                      )}
                    >
                      <TableCell className="au-cell-user">
                        <div className="au-user">
                          <span className="au-avatar">
                            {initialsOf(u.name)}
                          </span>
                          <div className="au-user-main">
                            <p className="au-user-name">
                              <span className="au-truncate">{u.name}</span>
                              {self && (
                                <span className="au-you-chip">You</span>
                              )}
                            </p>
                            <p className="au-user-email">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn("au-role-chip", meta.tint)}
                        >
                          <RoleIcon className="au-role-icon" />
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "au-status-chip",
                            u.status === "active"
                              ? "au-status-active"
                              : "au-status-disabled"
                          )}
                        >
                          <span
                            className={cn(
                              "au-status-dot",
                              u.status === "active"
                                ? "au-status-dot-active"
                                : "au-status-dot-off"
                            )}
                          />
                          {u.status === "active" ? "Active" : "Disabled"}
                        </span>
                      </TableCell>
                      <TableCell
                        className="au-cell-source"
                        title={u.source}
                      >
                        {u.source}
                      </TableCell>
                      <TableCell className="au-cell-created">
                        {createdLabel(u.createdAt)}
                      </TableCell>
                      <TableCell className="au-cell-actions">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="au-kebab"
                              aria-label={`Actions for ${u.name}`}
                            >
                              {busy ? (
                                <Loader2 className="au-icon-16 au-spin" />
                              ) : (
                                <MoreHorizontal className="au-icon-16" />
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="au-dd">
                            <DropdownMenuLabel className="au-dd-label">
                              {u.name}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {u.kind === "account" ? (
                              <DropdownMenuItem
                                disabled={self || busy}
                                onSelect={() => setRoleTarget(u)}
                              >
                                <KeyRound className="au-dd-icon" />
                                Change role
                                {self && (
                                  <span className="au-dd-hint">
                                    own account
                                  </span>
                                )}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled>
                                <Info className="au-dd-icon" />
                                Role from early-access signup
                              </DropdownMenuItem>
                            )}
                            {u.status === "active" ? (
                              <DropdownMenuItem
                                disabled={self || busy}
                                onSelect={() => setDisableTarget(u)}
                                className="au-dd-danger"
                              >
                                <Ban className="au-dd-icon" />
                                Disable account
                                {self && (
                                  <span className="au-dd-hint">
                                    that&apos;s you
                                  </span>
                                )}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                disabled={self || busy}
                                onSelect={() => setDisableTarget(u)}
                              >
                                <CheckCircle2 className="au-dd-icon au-dd-icon-sage" />
                                Re-enable account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <p className="au-footnote">
        <ShieldCheck className="au-footnote-icon" />
        Doctors from early-access signups appear here once their identity is
        verified; applications still under review live in the Verifications
        queue. Patients see only their own data either way.
      </p>

      {/* create user dialog */}
      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(u) => {
          setUsers((prev) =>
            prev
              ? [...prev, u].sort((a, b) => a.name.localeCompare(b.name))
              : [u]
          );
        }}
      />

      {/* change role dialog */}
      <ChangeRoleDialog
        target={roleTarget}
        onClose={() => setRoleTarget(null)}
        onSubmit={(user, role) =>
          applyPatch(user, { action: "set-role", role }, () => {
            setRoleTarget(null);
            toast({
              title: "Role updated",
              description: `${user.name} is now ${ROLE_META[role].label.toLowerCase()}. The change is in the audit log.`,
            });
          })
        }
      />

      {/* disable / enable confirmation */}
      <AlertDialog
        open={!!disableTarget}
        onOpenChange={(v) => !v && setDisableTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="au-dialog-title">
              {disableTarget?.status === "active"
                ? `Disable ${disableTarget?.name}?`
                : `Re-enable ${disableTarget?.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription className="au-dialog-desc">
              {disableTarget?.status === "active"
                ? "The account can no longer sign in, and any open session stops working at the next request. The action is written to the audit log."
                : "The account can sign in again with its existing credentials. The action is written to the audit log."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisableTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                disableTarget &&
                applyPatch(
                  disableTarget,
                  {
                    action: "set-status",
                    disabled: disableTarget.status === "active",
                  },
                  () => {
                    const disabling = disableTarget.status === "active";
                    setDisableTarget(null);
                    toast({
                      title: disabling ? "Account disabled" : "Account re-enabled",
                      description: disabling
                        ? `${disableTarget.name} can no longer sign in.`
                        : `${disableTarget.name} can sign in again.`,
                    });
                  }
                )
              }
              className={cn(
                disableTarget?.status === "active"
                  ? "au-alert-danger"
                  : "au-alert-primary"
              )}
            >
              {disableTarget?.status === "active"
                ? "Disable account"
                : "Re-enable account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Empty / loading states ────────────────────────────────────────────── */

function TableSkeleton() {
  return (
    <div className="au-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="au-sk-row">
          <span className="au-sk-avatar" />
          <div className="au-sk-lines">
            <span
              className="au-sk-line"
              style={{ width: `${28 + (i % 3) * 8}%` }}
            />
            <span className="au-sk-line-short" />
          </div>
          <span className="au-sk-chip" />
          <span className="au-sk-chip au-sk-chip-sm" />
        </div>
      ))}
    </div>
  );
}

function EmptyUsers({ search }) {
  return (
    <div className="au-empty">
      <span className="au-empty-icon">
        {search ? (
          <Search className="au-icon-24" />
        ) : (
          <Inbox className="au-icon-24" />
        )}
      </span>
      <p className="au-empty-title">
        {search ? "No users match your search" : "No users yet"}
      </p>
      <p className="au-empty-text">
        {search
          ? "Try a different name or email — the search covers every account on the platform."
          : "Accounts created through the early-access forms will appear here."}
      </p>
    </div>
  );
}

/* ─── Create user dialog ────────────────────────────────────────────────── */

function RuleRow({ rule }) {
  return (
    <li className={cn("au-rule", rule.pass && "au-rule-pass")}>
      {rule.pass ? (
        <CheckCircle2 className="au-rule-icon" />
      ) : (
        <span className="au-rule-circle" />
      )}
      {rule.label}
    </li>
  );
}

function CreateUserDialog({ open, onOpenChange, onCreated }) {
  const nameId = useId();
  const emailId = useId();
  const pwId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PATIENT");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const rules = passwordRules(password);
  const allValid = rules.every((r) => r.pass);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("PATIENT");
    setPassword("");
    setShowPw(false);
    setFieldErrors({});
    setFormError("");
  };

  const clientValidate = () => {
    const errs = {};
    if (name.trim().length < 2) errs.name = "Enter the user's full name.";
    if (!EMAIL_RE.test(email.trim()))
      errs.email = "Enter a valid email address.";
    if (!allValid) errs.password = "Password does not meet the requirements.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setFormError("");
    if (!clientValidate()) return;

    setSaving(true);
    try {
      const res = await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          password,
        }),
      });
      if (res.user) onCreated(res.user);
      toast({
        title: "User created",
        description: `${name.trim()} can sign in now as ${ROLE_META[role].label.toLowerCase()}. The creation is in the audit log.`,
      });
      onOpenChange(false);
      reset();
    } catch (err) {
      if (err.fields) setFieldErrors(err.fields);
      setFormError(err.message || "Could not create the user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="au-dialog">
        <DialogHeader>
          <DialogTitle className="au-dialog-title">Create a user</DialogTitle>
          <DialogDescription>
            The account signs in with these credentials immediately. This
            action is written to the audit log.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="au-form" noValidate>
          {/* name */}
          <div className="au-field">
            <Label htmlFor={nameId} className="au-label">
              Full name
            </Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder="e.g. Nour Khaled"
              aria-invalid={!!fieldErrors.name}
              className={cn(fieldErrors.name && "ui-input-invalid")}
            />
            {fieldErrors.name && (
              <p className="au-field-error">
                <AlertCircle className="au-error-icon" />
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* email */}
          <div className="au-field">
            <Label htmlFor={emailId} className="au-label">
              Email
            </Label>
            <Input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="name@carecompass.app"
              aria-invalid={!!fieldErrors.email}
              className={cn(fieldErrors.email && "ui-input-invalid")}
            />
            {fieldErrors.email && (
              <p className="au-field-error">
                <AlertCircle className="au-error-icon" />
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* role */}
          <div className="au-field">
            <Label className="au-label">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v)}>
              <SelectTrigger className="au-select-full" aria-label="Account role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PATIENT">
                  Patient — sees own records
                </SelectItem>
                <SelectItem value="DOCTOR">
                  Doctor — sees assigned patients
                </SelectItem>
                <SelectItem value="ADMIN">
                  Admin — manages users and audit
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* password */}
          <div className="au-field">
            <Label htmlFor={pwId} className="au-label">
              Temporary password
            </Label>
            <div className="au-pw-wrap">
              <Input
                id={pwId}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, password: "" }));
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.password}
                className={cn(
                  "au-pw-input",
                  fieldErrors.password && "ui-input-invalid"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="au-pw-toggle"
                aria-label={showPw ? "Hide password" : "Show password"}
                aria-pressed={showPw}
              >
                {showPw ? (
                  <EyeOff className="au-icon-16" />
                ) : (
                  <Eye className="au-icon-16" />
                )}
              </button>
            </div>
            <ul className="au-rules">
              {rules.map((r) => (
                <RuleRow key={r.label} rule={r} />
              ))}
            </ul>
            {fieldErrors.password && (
              <p className="au-field-error">
                <AlertCircle className="au-error-icon" />
                {fieldErrors.password}
              </p>
            )}
          </div>

          {formError && (
            <div role="alert" className="au-form-error">
              <AlertCircle className="au-form-error-icon" />
              <p>{formError}</p>
            </div>
          )}

          <div className="au-form-actions">
            <Button
              type="submit"
              disabled={saving}
              className="au-btn-submit"
            >
              {saving ? (
                <>
                  <Loader2 className="au-btn-icon au-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <UserPlus className="au-btn-icon" />
                  Create user
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="au-btn-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Change role dialog ────────────────────────────────────────────────── */

function ChangeRoleDialog({ target, onClose, onSubmit }) {
  return (
    <Dialog
      open={!!target}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="au-dialog">
        <DialogHeader>
          <DialogTitle className="au-dialog-title">
            Change role — {target?.name}
          </DialogTitle>
          <DialogDescription>
            Privilege change: it takes effect immediately and is written to
            the audit log with your name on it.
          </DialogDescription>
        </DialogHeader>
        {/* keyed remount: the select resets to the row's current role */}
        {target && (
          <ChangeRoleBody
            key={target.id}
            target={target}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChangeRoleBody({ target, onClose, onSubmit }) {
  const [role, setRole] = useState(target.role);

  return (
    <div className="au-form">
      <Select value={role} onValueChange={(v) => setRole(v)}>
        <SelectTrigger className="au-select-full" aria-label="New role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PATIENT">Patient — sees own records</SelectItem>
          <SelectItem value="DOCTOR">Doctor — sees assigned patients</SelectItem>
          <SelectItem value="ADMIN">Admin — manages users and audit</SelectItem>
        </SelectContent>
      </Select>

      {role !== target.role && (
        <div className="au-role-warning">
          <AlertCircle className="au-role-warning-icon" />
          <p>
            {target.name} loses{" "}
            {ROLE_META[target.role].label.toLowerCase()} permissions and gains{" "}
            {ROLE_META[role].label.toLowerCase()} permissions the moment you
            confirm.
          </p>
        </div>
      )}

      <div className="au-form-actions">
        <Button
          type="button"
          disabled={role === target.role}
          onClick={() => onSubmit(target, role)}
          className="au-btn-submit"
        >
          Confirm role change
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="au-btn-cancel"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
