import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Administration",
};

/** Minimalist admin shell, visually distinct from the main dashboard. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F7F6F3] dark:bg-[#161513]">
      <header className="sticky top-0 z-20 border-b border-border-light bg-[#F7F6F3]/90 backdrop-blur dark:bg-[#161513]/90">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <span className="text-sm font-medium text-text-primary">
            Administration ·{" "}
            <span className="font-semibold">ZeRo</span>{" "}
            <span className="font-normal text-text-tertiary">youtip</span>
          </span>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
