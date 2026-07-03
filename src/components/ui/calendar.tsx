"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface CalendarProps {
  selected?: Date | null;
  onSelect?: (date: Date) => void;
  className?: string;
}

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Minimal month calendar — no external dependency. Monday-first. */
export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [view, setView] = React.useState(() =>
    startOfMonth(selected ?? new Date()),
  );
  const today = new Date();

  const firstDay = startOfMonth(view);
  // JS getDay(): 0=Sun..6=Sat → shift to Monday-first index.
  const leading = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0,
  ).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1),
    ),
  ];

  return (
    <div className={cn("w-[252px] select-none", className)}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
          }
          aria-label="Mois précédent"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium capitalize text-text-primary">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() =>
            setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
          }
          aria-label="Mois suivant"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary hover:bg-surface-secondary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1 text-xs text-text-tertiary">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} />;
          const isSelected = selected ? sameDay(date, selected) : false;
          const isToday = sameDay(date, today);
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelect?.(date)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                isSelected
                  ? "bg-accent font-medium text-white"
                  : isToday
                    ? "bg-surface-secondary text-text-primary"
                    : "text-text-secondary hover:bg-surface-secondary",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
