# Flow Traces

## Flow: Client booking an appointment
1. `src/components/BookingDashboard.tsx` - user selects a slot and calls `useBookAppointmentMutation()`.
2. `src/hooks/useAppointments.ts` - `useBookAppointmentMutation()` posts the slot to `/api/appointments`.
3. `src/app/api/appointments/route.ts` - `POST` parses the body with `bookAppointmentSchema`.
4. `src/lib/http/request.ts` - `readJsonBody()` parses the JSON payload.
5. `src/lib/auth/with-auth.ts` - the session cookie is resolved into a `RequestActor`, and anonymous users are rejected with 401.
6. `src/services/appointmentService.ts` - `bookAppointment()` checks role, future time, and slot availability.
7. `src/lib/availability/schedule.ts` - `isSlotOpen()` checks working hours plus time-off and booked windows.
8. `src/repositories/appointmentRepository.ts` - `findConflictingAppointment()` and `createAppointment()` issue the Prisma queries.
9. Returns `201` with `{ appointment }`.

## Flow: Client cancelling an appointment
1. `src/components/AppointmentList.tsx` - user clicks `Cancel`.
2. `src/hooks/useAppointments.ts` - `useCancelAppointmentMutation()` sends `POST /api/appointments/:id/cancel`.
3. `src/app/api/appointments/[appointmentId]/cancel/route.ts` - the body is validated with `cancelAppointmentSchema`.
4. `src/lib/http/request.ts` - `readJsonBody()` parses the JSON payload.
5. `src/lib/auth/with-auth.ts` - the session is checked before any update logic runs.
6. `src/services/appointmentService.ts` - `cancelAppointment()` parses the fields, loads the appointment through `findScopedAppointmentById()` (actor-scoped, line 92), and rejects an already-cancelled row (98-100).
7. `src/repositories/appointmentRepository.ts` - `cancelAppointment()` runs `updateMany` on id + actor scope + `status: "BOOKED"` (lines 150-160); a count of 0 becomes a 409 `ConflictAppError` in the service (line 106). The unscoped `findAppointmentById()` is no longer used on this path.
8. Returns `200` with `{ appointment }`.

## Flow: Admin creating a staff member
1. `src/components/BookingDashboard.tsx` - admin submits `AdminStaffForm`.
2. `src/hooks/useStaff.ts` - `useCreateStaffMutation()` sends `POST /api/admin/staff`.
3. `src/app/api/admin/staff/route.ts` - request body is validated.
4. `src/lib/http/request.ts` - `readJsonBody()` parses the JSON payload.
5. `src/lib/auth/with-role.ts` - `requireRole(["ADMIN"])` runs before the handler body.
6. `src/services/availabilityService.ts` - `createStaffMember()` creates the user and staff profile.
7. `src/repositories/userRepository.ts` - `createUser()` writes the user row.
8. `src/repositories/staffRepository.ts` - `createStaffProfile()` writes the staff row.
9. Returns `201` with `{ staff }`.

## Flow: Permission rejection on an admin endpoint
1. `src/hooks/useStaff.ts` - a client or staff user still posts to `/api/admin/staff` if they try the UI or call the endpoint directly.
2. `src/app/api/admin/staff/route.ts` - the handler is wrapped by `withRole(["ADMIN"], ...)`.
3. `src/lib/auth/with-role.ts` - `requireRole()` throws `ForbiddenAppError`.
4. `src/lib/http.ts` - `errorResponse()` turns the thrown error into JSON.
5. Returns `403` with `{ error: { code: "FORBIDDEN", message: ... } }`.

## Flow: Validation rejection for a bad schedule
1. `src/components/AdminAvailabilityForms.tsx` - an admin enters a broken schedule range.
2. `src/hooks/useStaff.ts` - `useCreateWorkingHoursMutation()` posts to `/api/admin/working-hours`.
3. `src/app/api/admin/working-hours/route.ts` - the body is parsed with `createWorkingHoursRuleSchema`.
4. `src/lib/http/request.ts` - `readJsonBody()` parses the JSON payload.
5. `src/lib/validation/appointmentSchemas.ts` - the `refine()` rule rejects `endMinute <= startMinute`.
6. Returns `400` with `{ error: { code: "VALIDATION_ERROR", message: ... } }`.
