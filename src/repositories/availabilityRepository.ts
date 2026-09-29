// Availability rule and time-off persistence.
// What calls this file: availabilityService and admin route handlers.
// What it calls: Prisma queries on WorkingHoursRule and TimeOffBlock.
// Junior pitfall: scattering availability reads across appointment code and admin code.

import { prisma } from "@/lib/db";

export async function createWorkingHoursRule(input: {
  staffProfileId: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  active?: boolean;
}) {
  return prisma.workingHoursRule.create({
    data: input,
  });
}

export async function listWorkingHoursRules(staffProfileId: string) {
  return prisma.workingHoursRule.findMany({
    where: {
      staffProfileId,
      active: true,
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { startMinute: "asc" },
    ],
  });
}

export async function createTimeOffBlock(input: {
  staffProfileId: string;
  startsAt: Date;
  endsAt: Date;
  reason?: string | null;
}) {
  return prisma.timeOffBlock.create({
    data: input,
  });
}

export async function listTimeOffBlocks(staffProfileId: string, from: Date, to: Date) {
  return prisma.timeOffBlock.findMany({
    where: {
      staffProfileId,
      startsAt: { lt: to },
      endsAt: { gt: from },
    },
    orderBy: { startsAt: "asc" },
  });
}
