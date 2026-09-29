// User persistence boundary.
// What calls this file: authService and admin staff creation flows.
// What it calls: Prisma queries on the User model.
// Junior pitfall: loading a user without the role or staff profile relation and then guessing authorization later.

import { prisma } from "@/lib/db";
import type { Role } from "@/types/domain";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      staffProfile: true,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      staffProfile: true,
    },
  });
}

export async function createUser(input: {
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: input,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function listUsersByRole(role: Role) {
  return prisma.user.findMany({
    where: { role },
    orderBy: { name: "asc" },
  });
}
