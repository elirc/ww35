import { Prisma } from "@prisma/client";

const constraint = "Appointment_staffProfileId_time_window_excl";
export function isAppointmentExclusionViolation(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2004") return false;
  const detail = error.meta?.database_error;
  // Prisma wraps PostgreSQL exclusion errors in P2004. Match the named constraint,
  // never arbitrary prose containing the word conflict or another integrity failure.
  return typeof detail === "string" && detail.includes(constraint) &&
    (detail.includes("23P01") || detail.includes("exclusion constraint"));
}
