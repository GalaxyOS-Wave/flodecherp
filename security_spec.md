# Flodech Security Specification (ABAC & Zero-Trust)

This specification defines the security invariants and malicious payloads tested during Phase 0 of our Security-Driven Development for the **Flodech** Academy Platform.

## 1. Data Invariants
1. **User Ownership**: A user document is readable/writable ONLY by the authenticated user matching the document ID (`request.auth.uid`). No privilege escalation.
2. **Academy Control**: An Academy document is writable ONLY by its designated `ownerId` which must match the current authenticated user's UID.
3. **Master Gate Enforcement for Students**: Students can only be created, deleted, or modified by the authenticated teacher who owns the student's hosting academy.
4. **Student Access**: Students can only read their own student record, matchable securely by their authenticated Google login email.
5. **PII and Financial Isolation**: Fee records and portfolio feedbacks are private. Only the specific student and their corresponding academy teacher have access.
6. **No Client Query Scraping (Allow List Isolation)**: Blanket Reads (such as listing all fee logs, all students) are strictly forbidden; any list request must match relational filters.
7. **Temporal Integrity**: All primary creation and update operations must seal their timestamp values using `request.time`.

---

## 2. The "Dirty Dozen" Malicious Payloads
The following 12 specific JSON payloads are designed to challenge our Zero-Trust architecture:

1. **Identity Spoofing - User Creation**: A user attempts to create a document with a custom admin role inside `users/` to bypass limits.
2. **Ghost Field / Shadow Update**: Updating an academy configuration but injecting `isVerified: true` or `isAdmin: true`.
3. **Orphaned Write - Student without Academy**: Creating a student document referencing a non-existent or un-owned academy.
4. **Privilege Escalation - Cross-Academy Modification**: Teacher `A` attempts to delete a student belonging to Academy `B`.
5. **PII Leakage - Harvesting Student Records**: Authenticated student `S1` attempts to `get` the full PII record of student `S2`.
6. **Financial Tampering - Forging Payment Status**: Student edits their own `Fee` record, switching status from `"pending"` to `"paid"`.
7. **Unbounded List Injection - Denial of Wallet**: Injecting massive arrays (10k items) into list fields (e.g. `gallery` in portfolios) to trigger resource exhaustion.
8. **Malicious ID Poisoning**: Attempting to create documents with a 1.5KB junk-character string as the document ID.
9. **Relational Sync Breakage - Unlinked Messages**: Posting a message to a student chat room with a mock `senderId` that does not exist or matches another user.
1. **Notice Hijacking**: A student attempts to create or edit an academy-wide notice Bulletin.
11. **Timestamp Hijacking**: Pre-dating or post-dating `createdAt` on an invoice to appear paid or past due before the real server timestamp.
12. **Public Portfolio Vandalism**: Anonymous user attempting to update progress reports or photos in a student's public portfolio.

---

## 3. Security Rules Test Spec
All 12 payloads must return a rigorous `PERMISSION_DENIED` error when processed. The final security rules must enforce these gates completely.
