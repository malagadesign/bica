"use client";

import { useMemo, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import type { AdminAuditEntry, AdminUserRow } from "@/modules/admin/users/types";
import {
  adminActionInitial,
  computeUserStats,
  isExpiringSoon,
} from "@/modules/admin/users/types";
import {
  updateUserAccessStatus,
  updateUserProfile,
} from "@/modules/admin/users/actions/admin-user-actions";
import { createUserByAdmin } from "@/modules/admin/users/actions/create-user-by-admin";
import {
  AccessStatusBadge,
  RoleBadge,
  ExpiringSoonBadge,
} from "@/components/admin/access-badges";
import { formatLastUpdated } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type UsersPanelProps = {
  users: AdminUserRow[];
  auditByUserId: Record<string, AdminAuditEntry[]>;
};

type StatusFilter = "all" | "active" | "pending" | "suspended";
type RoleFilter = "all" | "admin" | "member";

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function formatAuditAction(action: string): string {
  switch (action) {
    case "role_changed":
      return "Rol";
    case "access_status_changed":
      return "Estado";
    case "access_expires_at_changed":
      return "Vencimiento";
    default:
      return action;
  }
}

function formatAuditValue(entry: AdminAuditEntry): string {
  const value = entry.new_value;
  if (!value || typeof value !== "object") return "—";
  const val = Object.values(value)[0];
  if (val == null) return "—";
  if (typeof val === "string" && val.includes("T")) {
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(
      new Date(val)
    );
  }
  return String(val);
}

export function UsersPanel({ users, auditByUserId }: UsersPanelProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createState, createFormAction, createPending] = useActionState(
    createUserByAdmin,
    adminActionInitial
  );

  const stats = useMemo(() => computeUserStats(users), [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((user) => {
        if (statusFilter !== "all" && user.access_status !== statusFilter) {
          return false;
        }
        if (roleFilter !== "all" && user.role !== roleFilter) return false;
        if (!q) return true;
        const haystack = [user.email, user.full_name, user.whatsapp, user.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        const aTime = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const bTime = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return bTime - aTime;
      });
  }, [users, query, statusFilter, roleFilter]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Activos", value: stats.active, tone: "text-[var(--badge-success-text)]" },
          { label: "Pendientes", value: stats.pending, tone: "text-[var(--badge-warning-text)]" },
          { label: "Suspendidos", value: stats.suspended, tone: "text-destructive" },
          { label: "Expiran pronto", value: stats.expiringSoon, tone: "text-[var(--badge-info-text)]" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border/60 bg-card px-4 py-3"
          >
            <p className={cn("text-2xl font-semibold tabular-nums", item.tone)}>
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por email, nombre o WhatsApp…"
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-9 rounded-lg border bg-background px-2 text-xs"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="pending">Pendientes</option>
            <option value="suspended">Suspendidos</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="h-9 rounded-lg border bg-background px-2 text-xs"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="member">Miembro</option>
          </select>
          <Button
            type="button"
            variant={createOpen ? "secondary" : "default"}
            onClick={() => setCreateOpen((v) => !v)}
            className="gap-2"
          >
            <UserPlus className="size-4" />
            {createOpen ? "Cancelar" : "Crear usuario"}
          </Button>
        </div>
      </div>

      {createOpen && (
        <form
          action={createFormAction}
          className="space-y-4 rounded-xl border bg-card p-5"
        >
          <h3 className="font-medium">Alta manual de usuario</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-fullName">Nombre</Label>
              <Input id="create-fullName" name="fullName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-whatsapp">WhatsApp</Label>
              <Input id="create-whatsapp" name="whatsapp" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Contraseña temporal</Label>
              <Input
                id="create-password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Rol</Label>
              <select
                id="create-role"
                name="role"
                defaultValue="member"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="member">Miembro</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-accessStatus">Estado de acceso</Label>
              <select
                id="create-accessStatus"
                name="accessStatus"
                defaultValue="active"
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="active">Activo</option>
                <option value="pending">Pendiente</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="create-accessExpiresAt">Vencimiento (opcional)</Label>
              <Input
                id="create-accessExpiresAt"
                name="accessExpiresAt"
                type="date"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="create-notes">Notas</Label>
              <Input id="create-notes" name="notes" placeholder="Notas internas" />
            </div>
          </div>
          {createState.error && (
            <p className="text-sm text-destructive">{createState.error}</p>
          )}
          {createState.success && (
            <p className="bica-form-success">
              {createState.success}
            </p>
          )}
          <Button type="submit" disabled={createPending}>
            {createPending ? "Creando…" : "Crear usuario"}
          </Button>
        </form>
      )}

      <p className="text-sm text-muted-foreground">
        {filtered.length.toLocaleString("es-AR")} usuarios · ordenados por última
        actividad
      </p>

      <div className="space-y-3">
        {filtered.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            auditLog={auditByUserId[user.id] ?? []}
            expanded={expandedId === user.id}
            onToggle={() =>
              setExpandedId((id) => (id === user.id ? null : user.id))
            }
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          No hay usuarios que coincidan con los filtros.
        </p>
      )}
    </div>
  );
}

function UserRow({
  user,
  auditLog,
  expanded,
  onToggle,
}: {
  user: AdminUserRow;
  auditLog: AdminAuditEntry[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [updateState, updateFormAction, updatePending] = useActionState(
    updateUserProfile,
    adminActionInitial
  );
  const [quickError, setQuickError] = useState<string | null>(null);

  async function handleQuickStatus(
    status: "active" | "suspended" | "pending"
  ) {
    setQuickError(null);
    const result = await updateUserAccessStatus(user.id, status);
    if (result.error) {
      setQuickError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{user.full_name ?? "Sin nombre"}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          {user.whatsapp && (
            <p className="text-xs text-muted-foreground">{user.whatsapp}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Actividad: {formatLastUpdated(user.last_seen_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AccessStatusBadge status={user.access_status} />
          <RoleBadge role={user.role} />
          {isExpiringSoon(user.access_expires_at) && <ExpiringSoonBadge />}
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t bg-muted/10 px-4 py-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Último ingreso</dt>
              <dd>{formatLastUpdated(user.last_login_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Última actividad</dt>
              <dd>{formatLastUpdated(user.last_seen_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Registro</dt>
              <dd>
                {new Intl.DateTimeFormat("es-AR", {
                  dateStyle: "medium",
                }).format(new Date(user.created_at))}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vencimiento</dt>
              <dd>
                {user.access_expires_at
                  ? new Intl.DateTimeFormat("es-AR", {
                      dateStyle: "medium",
                    }).format(new Date(user.access_expires_at))
                  : "Sin vencimiento"}
              </dd>
            </div>
          </dl>

          {auditLog.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Historial administrativo</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {auditLog.map((entry) => (
                  <li key={entry.id} className="rounded-lg bg-background/60 px-3 py-2">
                    <span className="font-medium text-foreground">
                      {formatAuditAction(entry.action)}
                    </span>
                    {" → "}
                    {formatAuditValue(entry)}
                    {" · "}
                    {formatLastUpdated(entry.created_at)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleQuickStatus("active")}
            >
              Activar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleQuickStatus("suspended")}
            >
              Suspender
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleQuickStatus("pending")}
            >
              Marcar pendiente
            </Button>
          </div>

          {quickError && (
            <p className="text-sm text-destructive">{quickError}</p>
          )}

          <form action={updateFormAction} className="space-y-4">
            <input type="hidden" name="userId" value={user.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input name="fullName" defaultValue={user.full_name ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input name="whatsapp" defaultValue={user.whatsapp ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <select
                  name="role"
                  defaultValue={user.role}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="member">Miembro</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <select
                  name="accessStatus"
                  defaultValue={user.access_status}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Vencimiento</Label>
                <Input
                  name="accessExpiresAt"
                  type="date"
                  defaultValue={toDateInputValue(user.access_expires_at)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notas</Label>
                <Input name="notes" defaultValue={user.notes ?? ""} />
              </div>
            </div>
            {updateState.error && (
              <p className="text-sm text-destructive">{updateState.error}</p>
            )}
            {updateState.success && (
              <p className="bica-form-success">
                {updateState.success}
              </p>
            )}
            <Button type="submit" size="sm" disabled={updatePending}>
              {updatePending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}
