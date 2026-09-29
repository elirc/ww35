// Staff profile persistence and working-hours scaffolding.
// What calls this file: admin availability routes and appointment services.
// What it calls: Prisma queries on StaffProfile and related tables.
// Junior pitfall: creating staff metadata without linking it to a user record.

import { prisma } from "@/lib/db";

export async function createStaffProfile(input: {
  userId: string;
  displayName: string;
  timezone: string;
  appointmentDurationMinutes: number;
}) {
  return prisma.staffProfile.create({
    data: input,
  });
}

export async function findStaffProfileById(id: string) {
  return prisma.staffProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

export async function findStaffProfileByUserId(userId: string) {
  return prisma.staffProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
}

export async function listStaffProfiles() {
  return prisma.staffProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      displayName: "asc",
    },
  });
}
