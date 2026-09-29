// Visual calendar that exposes open and blocked slots.
// What calls this file: the dashboard booking screen.
// What it calls: nothing; the parent passes in the already-fetched slots.
// Junior pitfall: re-computing slot state in the component instead of trusting the service output.

"use client";

export function AvailabilityCalendar({
  slots,
  onSelectSlot,
  selectedSlot,
  timeZone,
}: {
  slots: Array<{ startsAt: string; endsAt: string; isOpen: boolean; reason?: string }>;
  onSelectSlot?: (slot: { startsAt: string; endsAt: string }) => void;
  selectedSlot?: string | null;
  timeZone?: string;
}) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Availability</h2>
        <span className="text-xs uppercase tracking-[0.24em] text-ink-500">
          {slots.filter((slot) => slot.isOpen).length} open slots
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {slots.map((slot) => {
          const key = `${slot.startsAt}-${slot.endsAt}`;
          const open = slot.isOpen;
          const active = selectedSlot === slot.startsAt;

          return (
            <button
              key={key}
              type="button"
              className={[
                "rounded-2xl border px-4 py-3 text-left transition",
                open ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100" : "border-ink-200 bg-ink-100 text-ink-400",
                active ? "ring-2 ring-sky-300" : "",
              ].join(" ")}
              onClick={() => open && onSelectSlot?.({ startsAt: slot.startsAt, endsAt: slot.endsAt })}
              disabled={!open}
            >
              <div className="text-sm font-medium">{formatter.format(new Date(slot.startsAt))}</div>
              <div className="text-xs text-ink-500">{open ? "Open" : slot.reason ?? "Blocked"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
