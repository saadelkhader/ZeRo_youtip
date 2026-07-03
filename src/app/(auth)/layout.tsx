import type { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";

/** Centered, calm auth shell for login / register. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col items-center">
        <div className="mb-2">
          <Logo stacked className="items-center text-center" />
        </div>
        <p className="mb-8 text-center text-sm text-text-secondary">
          Écouter moins. Apprendre mieux. Agir davantage.
        </p>
        {children}
      </div>
    </div>
  );
}
