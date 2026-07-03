"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Send, Copy, Check, MoreHorizontal, RefreshCw, Ban } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminGuard } from "@/lib/hooks/useAdminGuard";
import {
  useAdminInvitations,
  useSendInvitation,
  useResendInvitation,
  useRevokeInvitation,
} from "@/lib/hooks/useAdmin";
import { toast } from "@/lib/toast";
import type { InvitationStatus } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const STATUS_META: Record<
  InvitationStatus,
  { label: string; variant: "accent" | "success" | "default" | "warning" }
> = {
  pending: { label: "En attente", variant: "accent" },
  accepted: { label: "Acceptée", variant: "success" },
  expired: { label: "Expirée", variant: "default" },
  revoked: { label: "Révoquée", variant: "warning" },
};

const FILTERS: { value: InvitationStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "accepted", label: "Acceptées" },
  { value: "expired", label: "Expirées" },
];

export default function AdminInvitationsPage() {
  const { isAdmin, isLoading } = useAdminGuard();
  const { data: invitations = [] } = useAdminInvitations();
  const sendInv = useSendInvitation();
  const resendInv = useResendInvitation();
  const revokeInv = useRevokeInvitation();

  const [email, setEmail] = React.useState("");
  const [filter, setFilter] = React.useState<InvitationStatus | "all">("all");
  const [lastLink, setLastLink] = React.useState<string | null>(null);
  const [lastEmailSent, setLastEmailSent] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (isLoading || !isAdmin) return null;

  const filtered =
    filter === "all"
      ? invitations
      : invitations.filter((i) => i.status === filter);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    try {
      const res = await sendInv.mutateAsync(value);
      setEmail("");
      setLastLink(res.url);
      setLastEmailSent(res.emailSent);
      if (res.emailSent) toast.success(`Invitation envoyée à ${value}`);
      else toast.success("Lien d'invitation généré — copie-le et partage-le");
    } catch (err) {
      toast.info(
        err instanceof Error ? err.message : "Invitation impossible.",
      );
    }
  }

  function copyLink(link: string) {
    void navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-text-primary">Invitations</h1>

      {/* Send form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              inputMode="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={sendInv.isPending}>
              <Send className="h-4 w-4" />
              {sendInv.isPending ? "Création…" : "Inviter"}
            </Button>
          </form>

          {lastLink ? (
            <div className="mt-3 flex flex-col gap-1.5">
              <p className="text-xs text-text-secondary">
                {lastEmailSent
                  ? "Email envoyé. Tu peux aussi partager le lien :"
                  : "Copie ce lien et partage-le (aucun email envoyé) :"}
              </p>
              <div className="flex items-center gap-2 rounded-md bg-surface-secondary/60 p-2">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary">
                  {lastLink}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyLink(lastLink)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copié" : "Copier"}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              filter === f.value
                ? "bg-accent/[0.08] font-medium text-accent"
                : "text-text-secondary hover:bg-surface-secondary",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border-light bg-surface-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Email</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Envoyé le</TableHead>
              <TableHead>Expire le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell className="py-8 text-center text-sm text-text-tertiary" colSpan={5}>
                  Aucune invitation.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => {
                const meta = STATUS_META[inv.status];
                const actionable =
                  inv.status === "pending" || inv.status === "expired";
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="text-sm text-text-primary">
                      {inv.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">
                      {format(new Date(inv.created_at), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">
                      {format(new Date(inv.expires_at), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {actionable ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="Actions"
                            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                          >
                            <MoreHorizontal className="h-[18px] w-[18px]" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={async () => {
                                const res = await resendInv.mutateAsync(inv.id);
                                if (res.emailSent)
                                  toast.success("Invitation renvoyée");
                                else {
                                  setLastLink(res.url);
                                  toast.success("Nouveau lien généré");
                                }
                              }}
                            >
                              <RefreshCw />
                              Renvoyer
                            </DropdownMenuItem>
                            {inv.status === "pending" ? (
                              <DropdownMenuItem
                                destructive
                                onSelect={() => revokeInv.mutate(inv.id)}
                              >
                                <Ban />
                                Révoquer
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-text-tertiary">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
