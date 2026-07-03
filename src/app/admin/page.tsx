"use client";

import Link from "next/link";
import { Users, MailPlus, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminGuard } from "@/lib/hooks/useAdminGuard";
import { useAdminUsers, useAdminInvitations } from "@/lib/hooks/useAdmin";

export default function AdminOverviewPage() {
  const { isAdmin, isLoading } = useAdminGuard();
  const { data: users = [] } = useAdminUsers();
  const { data: invitations = [] } = useAdminInvitations();

  if (isLoading || !isAdmin) return null;

  const activeUsers = users.filter((u) => u.account_status === "active").length;
  const suspended = users.filter(
    (u) => u.account_status === "suspended",
  ).length;
  const pending = invitations.filter((i) => i.status === "pending").length;

  const cards = [
    {
      label: "Utilisateurs actifs",
      value: activeUsers,
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Invitations en attente",
      value: pending,
      icon: MailPlus,
      href: "/admin/invitations",
    },
    {
      label: "Comptes suspendus",
      value: suspended,
      icon: Ban,
      href: "/admin/users",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">
        Vue d&apos;ensemble
      </h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-shadow hover:shadow-card">
              <CardContent className="flex flex-col gap-3 p-4">
                <Icon className="h-[18px] w-[18px] text-text-tertiary" />
                <div>
                  <p className="font-mono text-2xl font-semibold text-text-primary nums-tabular">
                    {value}
                  </p>
                  <p className="text-sm text-text-secondary">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
