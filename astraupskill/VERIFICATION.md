# Check records, migration requirements and scope

The accepted command records below contain the exact arguments, terminal exit codes and logs for the finite tests, TypeScript check, Prisma client generation and production build. Test totals refer to the actual Vitest result, not the number of shell commands. A process still collecting build traces is not counted as complete until its recorded exit status is zero.

Calendar regressions cover invalid intervals and steps, midnight formatting, local date changes, selected DST boundaries, half-open overlaps and agreement between preview and direct availability. Service regressions cover normalized cancellation, scoped lookup before state inspection, direct malformed input, corrupt stored duration, valid creation and narrow provider error translation. Repository regressions inspect the production where clauses and the conditional loser behavior.

Prisma client generation creates application types and query code. It does not apply the schema or migration to a database. The initial migration already contains btree_gist and the BOOKED-only half-open appointment exclusion constraint; this delivery preserves that existing protection. A database created with db push alone may lack the hand-written constraint. Follow the project's migration setup when creating a dedicated development database.

No original appointment database was reset or populated. The tests mock persistence and establish service orchestration and query contracts. They do not prove live PostgreSQL race behavior, migration deployment or browser end-to-end booking. The production build uses an inert database URL only where configuration is needed for compilation. The layout now uses the existing system sans-serif fallback directly, removing a Google-font download that prevented offline builds. This changes the typeface from Space Grotesk to the platform system font without changing page structure.

The scheduling policy is single-local-day working hours with an exact closing-midnight exception. It rejects a folded interval when its local end clock is not after its local start. Overnight working-hour rules and a richer DST ambiguity policy would require explicit product decisions and additional tests. Preserve these limits and the exact original snapshots when extending the scheduling model, and replace verification evidence after any later source changes.

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)

## Recorded command evidence

The full suite passed **33 tests**. Counts refer to tests, not commands.

| Check | Exact command arguments | Exit | Evidence |
|---|---|---:|---|
| `resume14-tests-03` | `["npm.cmd", "test", "--", "--pool", "threads", "--poolOptions.threads.singleThread", "--testTimeout", "30000"]` | 0 | [record](evidence/resume14-tests-03.json), [log](evidence/resume14-tests-03.log) |
| `resume14-types-03` | `["npm.cmd", "run", "typecheck"]` | 0 | [record](evidence/resume14-types-03.json), [log](evidence/resume14-types-03.log) |
| `resume14-build-02` | `["npm.cmd", "run", "build"]` | 0 | [record](evidence/resume14-build-02.json), [log](evidence/resume14-build-02.log) |
| `resume14-generate-01` | `["node", "node_modules/prisma/build/index.js", "generate"]` | 0 | [record](evidence/resume14-generate-01.json), [log](evidence/resume14-generate-01.log) |
