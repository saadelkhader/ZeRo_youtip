"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";

/**
 * Client-side admin guard for /admin pages. Redirects non-admins home.
 * The middleware is the real gate; this is a UX backstop.
 */
export function useAdminGuard() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const isAdmin = profile?.role === "admin";

  React.useEffect(() => {
    if (!isLoading && profile && !isAdmin) {
      router.replace("/");
    }
  }, [isLoading, profile, isAdmin, router]);

  return { isAdmin, isLoading };
}
