// Session persistence and lookup.
// What calls this file: authService and the request-auth guard.
// What it calls: Prisma queries on the Session model.
// Junior pitfall: looking up sessions by raw token instead of a hash.

import { prisma } from "@/lib/db";

export async function createSession(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return prisma.session.create({
    data: input,
  });
}

export async function findActiveSessionByTokenHash(tokenHash: string) {
  return prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          staffProfile: true,
        },
      },
    },
  });
}

export async function revokeSessionByTokenHash(tokenHash: string) {
  return prisma.session.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
