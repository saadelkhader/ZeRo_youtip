"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/lib/stores/playerStore";
import { formatDuration } from "@/lib/utils/time";
import { toast } from "@/lib/toast";

/**
 * Sober daily-limit prompt. Fires once when today's listening reaches the
 * limit; never alarmist. Three calm choices.
 */
export function DailyLimitDialog() {
  const router = useRouter();
  const limitReached = usePlayerStore((s) => s.limitReached);
  const todayListenedSeconds = usePlayerStore((s) => s.todayListenedSeconds);
  const overrideLimit = usePlayerStore((s) => s.overrideLimit);
  const resetLimit = usePlayerStore((s) => s.resetLimit);
  const stopVideo = usePlayerStore((s) => s.stopVideo);

  // Informative (non-alarmist) toast the moment the limit trips.
  React.useEffect(() => {
    if (limitReached) toast.limitReached();
  }, [limitReached]);

  function finishForToday() {
    resetLimit();
    stopVideo();
    router.push("/");
  }

  function blockUntilTomorrow() {
    resetLimit();
    stopVideo();
    try {
      const tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      localStorage.setItem("zy_block_until", tomorrow.toISOString());
    } catch {
      // storage unavailable — best effort
    }
    router.push("/");
  }

  return (
    <Dialog open={limitReached} onOpenChange={(o) => (o ? null : resetLimit())}>
      <DialogContent showClose={false} className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Tu as atteint ta limite d&apos;écoute pour aujourd&apos;hui.
          </DialogTitle>
          <DialogDescription>
            Tu as écouté{" "}
            <span className="font-medium text-text-primary">
              {formatDuration(todayListenedSeconds)}
            </span>{" "}
            aujourd&apos;hui. C&apos;est un bon moment pour mettre en pratique.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
          <Button onClick={finishForToday}>Terminer pour aujourd&apos;hui</Button>
          <Button variant="outline" onClick={overrideLimit}>
            Continuer exceptionnellement
          </Button>
          <Button
            variant="ghost"
            onClick={blockUntilTomorrow}
            className="text-error hover:bg-error/10 hover:text-error"
          >
            Bloquer jusqu&apos;à demain
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
