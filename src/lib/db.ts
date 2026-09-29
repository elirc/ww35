// Prisma client singleton.
// What calls this file: repositories and seed scripts.
// What it calls: PrismaClient constructor from @prisma/client.
// Junior pitfall: creating a new client per import and leaking connections in dev.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
