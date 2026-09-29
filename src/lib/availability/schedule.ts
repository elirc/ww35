// Time-slot evaluation for staff calendars and booking checks.
// What calls this file: availabilityService and appointmentService.
// What it calls: nothing; it stays pure so the rules are easy to test.
// Junior pitfall: treating working hours as if they were timezone-free when the UI is not.

import { ValidationAppError } from "@/lib/errors";

type TimeWindow = {
  startsAt: Date;
  endsAt: Date;
};

type WorkingHoursRuleLike = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  active: boolean;
};

type CalendarWindow = TimeWindow & {
  timezone: string;
  slotMinutes: number;
  workingHoursRules: WorkingHoursRuleLike[];
  blockedWindows: TimeWindow[];
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: get("weekday") as (typeof DAY_NAMES)[number],
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

export function validateTimeWindow(window: TimeWindow) {
  if (!(window.startsAt instanceof Date) || !(window.endsAt instanceof Date) ||
      !Number.isFinite(window.startsAt.getTime()) || !Number.isFinite(window.endsAt.getTime()) || window.endsAt <= window.startsAt)
    throw new ValidationAppError("Calendar intervals require valid increasing timestamps.");
}
function validateCalendar(window: Pick<CalendarWindow, "timezone" | "workingHoursRules" | "blockedWindows">) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: window.timezone }).format(0); }
  catch { throw new ValidationAppError("A valid IANA timezone is required."); }
  if (!window.timezone || window.workingHoursRules.some(rule =>
    ![rule.dayOfWeek, rule.startMinute, rule.endMinute].every(Number.isSafeInteger) ||
    rule.dayOfWeek < 0 || rule.dayOfWeek > 6 || rule.startMinute < 0 || rule.endMinute > 1440 || rule.endMinute <= rule.startMinute))
    throw new ValidationAppError("Working hours require an ordered single-day minute range.");
  window.blockedWindows.forEach(validateTimeWindow);
}

function overlaps(left: TimeWindow, right: TimeWindow) {
  return left.startsAt < right.endsAt && left.endsAt > right.startsAt;
}

function isWithinWorkingHours(
  slot: TimeWindow,
  timeZone: string,
  workingHoursRules: WorkingHoursRuleLike[],
) {
  const start = getZonedParts(slot.startsAt, timeZone);
  const end = getZonedParts(slot.endsAt, timeZone);
  const localDayIndex = DAY_NAMES.indexOf(start.weekday);
  const localStart = start.hour * 60 + start.minute + slot.startsAt.getUTCSeconds() / 60 + slot.startsAt.getUTCMilliseconds() / 60_000;
  let localEnd = end.hour * 60 + end.minute + slot.endsAt.getUTCSeconds() / 60 + slot.endsAt.getUTCMilliseconds() / 60_000;
  if (start.dateKey !== end.dateKey) {
    // A midnight endpoint belongs to the preceding day only when it ends that day exactly.
    const preceding = getZonedParts(new Date(slot.endsAt.getTime() - 1), timeZone);
    if (localEnd !== 0 || preceding.dateKey !== start.dateKey) return false;
    localEnd = 1440;
  }
  // An interval that travels backward on a folded local clock is not offered by this policy.
  if (localEnd <= localStart) return false;

  return workingHoursRules.some((rule) => {
    if (!rule.active || rule.dayOfWeek !== localDayIndex) {
      return false;
    }

    return localStart >= rule.startMinute && localEnd <= rule.endMinute;
  });
}

export function isSlotOpen(
  slot: TimeWindow,
  window: Pick<CalendarWindow, "timezone" | "workingHoursRules" | "blockedWindows">,
) {
  validateTimeWindow(slot);
  validateCalendar(window);
  if (!isWithinWorkingHours(slot, window.timezone, window.workingHoursRules)) {
    return false;
  }

  return !window.blockedWindows.some((blocked) => overlaps(slot, blocked));
}

export function buildAvailabilitySlots(window: CalendarWindow) {
  validateTimeWindow(window);
  validateCalendar(window);
  if (!Number.isSafeInteger(window.slotMinutes) || window.slotMinutes <= 0 || window.slotMinutes > 1440 ||
      window.endsAt.getTime() - window.startsAt.getTime() > 90 * 86_400_000)
    throw new ValidationAppError("Calendar queries require a positive minute interval and at most 90 days.");
  const slots: Array<TimeWindow & { isOpen: boolean; reason: string | null }> = [];
  let cursor = new Date(window.startsAt);

  while (cursor < window.endsAt) {
    const slot = {
      startsAt: new Date(cursor),
      endsAt: new Date(cursor.getTime() + window.slotMinutes * 60 * 1000),
    };

    if (slot.endsAt > window.endsAt) {
      break;
    }

    const open = isSlotOpen(slot, window);

    slots.push({
      ...slot,
      isOpen: open,
      reason: open ? null : "blocked",
    });

    cursor = new Date(cursor.getTime() + window.slotMinutes * 60 * 1000);
  }

  return slots;
}

export function getSlotWindowLabel(slot: TimeWindow, timeZone: string) {
  const start = getZonedParts(slot.startsAt, timeZone);
  const end = getZonedParts(slot.endsAt, timeZone);
  return `${start.dateKey} ${String(start.hour).padStart(2, "0")}:${String(start.minute).padStart(2, "0")} - ${String(end.hour).padStart(2, "0")}:${String(end.minute).padStart(2, "0")}`;
}
