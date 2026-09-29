import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await hashPassword("Admin123!");
  const staffPassword = await hashPassword("Staff123!");
  const clientPassword = await hashPassword("Client123!");

  const admin = await prisma.user.upsert({
    where: { email: "admin@acme.test" },
    update: {},
    create: {
      email: "admin@acme.test",
      name: "Admin User",
      role: Role.ADMIN,
      passwordHash: adminPassword,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@acme.test" },
    update: {},
    create: {
      email: "staff@acme.test",
      name: "Staff User",
      role: Role.STAFF,
      passwordHash: staffPassword,
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: staffUser.id },
    update: {},
    create: {
      userId: staffUser.id,
      displayName: "Primary Clinician",
      timezone: "America/Los_Angeles",
      appointmentDurationMinutes: 30,
    },
  });

  await prisma.user.upsert({
    where: { email: "client@acme.test" },
    update: {},
    create: {
      email: "client@acme.test",
      name: "Client User",
      role: Role.CLIENT,
      passwordHash: clientPassword,
    },
  });

  console.log("Seeded demo users:", admin.email, staffUser.email, "client@acme.test");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
