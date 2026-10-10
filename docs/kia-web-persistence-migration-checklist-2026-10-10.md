# KIA web anonymous persistence — migration release gates

Migration file: `supabase/migrations/20261010102630_kia_public_web_sessions_messages.sql`.

## Current status
- Migration file committed for review ONLY.
- Not applied to EXPERT production or any development database.
- Supabase CLI executable was unavailable in the working container, so the file was created in GitHub with a UTC timestamp verified at authoring; the CLI generator could not be run. Reconcile the filename and migration history in a proper CLI-equipped checkout before deployment.

## Required validation
1. Provision a separate nonproduction Supabase branch, subject to cost approval. Never use live client data for tests.
2. Run CLI migration list and drift check, apply in the isolated database, and verify constraints, indexes and ACLs.
3. Test that anon/authenticated cannot SELECT/INSERT/UPDATE/DELETE; service_role can work through server-side authenticated calls only.
4. Test session A/B isolation, replay of `client_message_id`, expirations, foreign-key restrictions, delete cascades, and errors.
5. Run Supabase security and performance advisors; triage new findings separately from existing warnings.
6. Apply to production only after approval and staging verification. Feature flag for public chat persistence remains OFF until the backend routes pass their own audit.

## Notes
- `token_hash` stores only a server-derived digest, not a raw cookie.
- Neither sessions nor messages are tied to a person by email, phone, name or IP.
- A cleanup scheduler and data retention policy are separate audited implementation steps.
