# Appointment booking system

## Appointment boundary course

[Start the source-based course](astraupskill/README.md) for local-day and midnight rules, conditional actor-scoped cancellation and verification evidence. The existing SQL exclusion constraint requires the hand-written migration; Prisma db push alone does not recreate it. Tests use mocked persistence and do not claim live database concurrency verification.
