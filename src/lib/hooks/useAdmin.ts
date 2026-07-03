"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getAllUsers,
  getAllInvitations,
  sendInvitation,
  revokeInvitation,
  resendInvitation,
  suspendUser,
  activateUser,
  setUserRole,
  type AdminUser,
} from "@/lib/actions/admin";
import type { Invitation, UserRole } from "@/lib/types";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async (): Promise<AdminUser[]> => {
      try {
        return await getAllUsers();
      } catch {
        return [];
      }
    },
  });
}

export function useAdminInvitations() {
  return useQuery({
    queryKey: ["admin", "invitations"],
    queryFn: async (): Promise<Invitation[]> => {
      try {
        return await getAllInvitations();
      } catch {
        return [];
      }
    },
  });
}

export function useSendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => sendInvitation(email),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "invitations"] }),
  });
}

export function useRevokeInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "invitations"] }),
  });
}

export function useResendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resendInvitation(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin", "invitations"] }),
  });
}

function invalidateUsers(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["admin", "users"] });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspendUser(id),
    onSuccess: () => invalidateUsers(qc),
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateUser(id),
    onSuccess: () => invalidateUsers(qc),
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      setUserRole(id, role),
    onSuccess: () => invalidateUsers(qc),
  });
}
