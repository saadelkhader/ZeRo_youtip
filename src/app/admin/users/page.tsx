"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal, Ban, CircleCheck, ShieldPlus, ShieldMinus } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAdminGuard } from "@/lib/hooks/useAdminGuard";
import { useProfile } from "@/lib/hooks/useProfile";
import {
  useAdminUsers,
  useSuspendUser,
  useActivateUser,
  useSetUserRole,
} from "@/lib/hooks/useAdmin";
import type { AdminUser } from "@/lib/actions/admin";

type Confirm =
  | { kind: "suspend"; user: AdminUser }
  | { kind: "promote"; user: AdminUser }
  | { kind: "demote"; user: AdminUser }
  | null;

function initials(name: string | null) {
  return (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminUsersPage() {
  const { isAdmin, isLoading } = useAdminGuard();
  const { data: me } = useProfile();
  const { data: users = [] } = useAdminUsers();
  const suspend = useSuspendUser();
  const activate = useActivateUser();
  const setRole = useSetUserRole();

  const [confirm, setConfirm] = React.useState<Confirm>(null);

  if (isLoading || !isAdmin) return null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-text-primary">Utilisateurs</h1>

      <div className="rounded-lg border border-border-light bg-surface-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-6 w-6">
                        {u.avatar_url ? (
                          <AvatarImage src={u.avatar_url} alt={u.name ?? ""} />
                        ) : null}
                        <AvatarFallback className="text-[10px]">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-text-primary">
                          {u.name ?? "—"}
                          {isSelf ? (
                            <span className="text-text-tertiary"> (toi)</span>
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-text-tertiary">
                          {u.videoCount} vidéos · {u.noteCount} notes
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "accent" : "default"}>
                      {u.role === "admin" ? "Admin" : "Utilisateur"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.account_status === "suspended" ? "warning" : "success"
                      }
                    >
                      {u.account_status === "suspended" ? "Suspendu" : "Actif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-text-secondary">
                      {format(new Date(u.created_at), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Actions"
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                      >
                        <MoreHorizontal className="h-[18px] w-[18px]" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {u.account_status === "suspended" ? (
                          <DropdownMenuItem
                            onSelect={() => activate.mutate(u.id)}
                          >
                            <CircleCheck />
                            Réactiver le compte
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            destructive
                            disabled={isSelf}
                            onSelect={() =>
                              setConfirm({ kind: "suspend", user: u })
                            }
                          >
                            <Ban />
                            Suspendre le compte
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {u.role === "user" ? (
                          <DropdownMenuItem
                            onSelect={() =>
                              setConfirm({ kind: "promote", user: u })
                            }
                          >
                            <ShieldPlus />
                            Promouvoir admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            disabled={isSelf}
                            onSelect={() =>
                              setConfirm({ kind: "demote", user: u })
                            }
                          >
                            <ShieldMinus />
                            Rétrograder en utilisateur
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

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={
          confirm?.kind === "suspend"
            ? "Suspendre ce compte ?"
            : confirm?.kind === "promote"
              ? "Promouvoir en administrateur ?"
              : "Rétrograder en utilisateur ?"
        }
        description={
          confirm?.kind === "promote"
            ? "Es-tu sûr ? Cette action donne un accès complet à l'administration."
            : confirm?.kind === "suspend"
              ? "L'utilisateur sera déconnecté et ne pourra plus se connecter."
              : "Cet utilisateur perdra l'accès à l'administration."
        }
        confirmLabel={
          confirm?.kind === "suspend" ? "Suspendre" : "Confirmer"
        }
        destructive={confirm?.kind === "suspend"}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === "suspend") suspend.mutate(confirm.user.id);
          if (confirm.kind === "promote")
            setRole.mutate({ id: confirm.user.id, role: "admin" });
          if (confirm.kind === "demote")
            setRole.mutate({ id: confirm.user.id, role: "user" });
          setConfirm(null);
        }}
      />
    </div>
  );
}
