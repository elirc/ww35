# Calendar and cancellation review exercises

Exercise one: construct a UTC appointment from 23:30 to 00:30 the following day and a 09:00 through 17:00 working rule. Explain how comparing only clock minutes could accept it, then assert the completed predicate rejects it. Repeat with an endpoint exactly at midnight and a rule ending at 1440. Include one endpoint a millisecond beyond midnight to test the precision boundary.

Exercise two: use America/New_York on the spring daylight-saving transition date. Identify the UTC instant representing the following local midnight and test a half-hour appointment ending there. Then extend it by thirty minutes. The first can fit an all-day rule; the second crosses the permitted local-day boundary. Explain why adding a fixed twenty-four hours is not a general way to find a local midnight.

Exercise three: build two adjacent appointments and one overlapping appointment. Verify the half-open predicate permits the adjacent starts while rejecting positive overlap. Locate the matching bracket convention in the existing SQL migration and explain why canceled rows do not participate in that constraint.

Exercise four: simulate a BOOKED scoped read followed by an updateMany result with count zero. Assert the service returns a conflict and does not retry an unrestricted write. Repeat with a foreign client's scoped lookup returning null. The latter must stop before any write and must not reveal terminal state through a different error.

Exercise five: create a typed Prisma P2004 error for a different constraint and a plain network error containing the word conflict. Neither should become a slot-taken response. Finally write an integration-test plan for a disposable PostgreSQL database that applies the real migration and races overlapping inserts. Keep that proposed evidence separate from the mocked checks already recorded here.

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
