# Request Lifecycle

Request: client books an appointment
1. `src/components/BookingDashboard.tsx` - the user clicks the booking button after selecting a slot.
2. `src/hooks/useAppointments.ts` - `useBookAppointmentMutation()` posts the slot to `/api/appointments`.
3. `src/app/api/appointments/route.ts` - `POST` parses the body with `bookAppointmentSchema`.
4. `src/lib/http/request.ts` - `readJsonBody()` parses the JSON payload.
5. `src/lib/auth/with-auth.ts` - the session cookie is resolved into a `RequestActor`, and anonymous users are rejected with 401.
6. `src/services/appointmentService.ts` - `bookAppointment()` checks role, future time, and slot availability.
7. `src/lib/availability/schedule.ts` - `isSlotOpen()` checks working hours plus time-off and booked windows.
8. `src/repositories/appointmentRepository.ts` - `findConflictingAppointment()` and `createAppointment()` issue the Prisma queries.
9. Returns `201` with `{ appointment }`.

Request: client cancels their own appointment
1. `src/components/AppointmentList.tsx` - the user clicks the cancel button on a booked item.
2. `src/hooks/useAppointments.ts` - `useCancelAppointmentMutation()` posts to `/api/appointments/:id/cancel`.
3. `src/app/api/appointments/[appointmentId]/cancel/route.ts` - `POST` validates the cancellation payload.
4. `src/lib/http/request.ts` - `readJsonBody()` parses the JSON payload.
5. `src/lib/auth/with-auth.ts` - the session is checked before any update logic runs.
6. `src/services/appointmentService.ts` - `cancelAppointment()` loads the appointment and checks the transition.
7. `src/repositories/appointmentRepository.ts` - `findAppointmentById()` and `cancelAppointment()` perform the read/update.
8. Returns `200` with `{ appointment }`.

Request: admin creates a staff member
1. `src/components/BookingDashboard.tsx` - the admin submits the staff form.
2. `src/hooks/useStaff.ts` - `useCreateStaffMutation()` posts to `/api/admin/staff`.
3. `src/app/api/admin/staff/route.ts` - `POST` parses with `createStaffMemberSchema`.
4. `src/lib/http/request.ts` - `readJsonBody()` parses the JSON payload.
5. `src/lib/auth/with-role.ts` - the request is rejected here if the actor is not `ADMIN`.
6. `src/services/availabilityService.ts` - `createStaffMember()` creates the user and staff profile.
7. `src/repositories/userRepository.ts` and `src/repositories/staffRepository.ts` - the database rows are created.
8. Returns `201` with `{ staff }`.

Request: unauthorized role hits an admin route
1. `src/hooks/useStaff.ts` - a client or staff user still posts to `/api/admin/staff` if they try the UI or call the endpoint directly.
2. `src/app/api/admin/staff/route.ts` - the handler is wrapped by `withRole(["ADMIN"], ...)`.
3. `src/lib/auth/with-role.ts` - `requireRole()` throws `ForbiddenAppError`.
4. `src/lib/http.ts` - `errorResponse()` maps the thrown error into JSON.
5. Returns `403` with `{ error: { code: "FORBIDDEN", message: ... } }`.

Request: invalid working-hours payload
1. `src/components/AdminAvailabilityForms.tsx` - an admin enters a broken schedule range.
2. `src/hooks/useStaff.ts` - `useCreateWorkingHoursMutation()` posts to `/api/admin/working-hours`.
3. `src/app/api/admin/working-hours/route.ts` - the body is parsed with `createWorkingHoursRuleSchema`.
4. `src/lib/http/request.ts` - `readJsonBody()` parses the JSON payload.
5. `src/lib/validation/appointmentSchemas.ts` - the `refine()` rule rejects `endMinute <= startMinute`.
6. Returns `400` with `{ error: { code: "VALIDATION_ERROR", message: ... } }`.
