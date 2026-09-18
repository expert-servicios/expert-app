-- Historical ledger compatibility marker.
-- Production contains a duplicate semantic application of
-- kia_administrative_action_service at 20260915194210 and 20260915194211.
-- The actual schema effect is represented by 20260915194210.
-- This file is intentionally a no-op so fresh builds preserve the remote
-- tracking version without replaying duplicate DDL.
select 1;
