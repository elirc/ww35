// Validation for login and account-creation boundaries.
// What calls this file: auth route handlers and seed-adjacent admin flows.
// What it calls: Zod only.
// Junior pitfall: validating email/password shape in the service after a database lookup has already been attempted.

import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  role: z.enum(["ADMIN", "STAFF", "CLIENT"]),
  password: z.string().min(8).max(128),
});

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(["ADMIN", "STAFF", "CLIENT"]),
  }),
});
