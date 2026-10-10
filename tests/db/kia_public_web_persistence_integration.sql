-- Integration test executed in a fresh PostgreSQL 15 CI service, with test data only.
-- Run after the migration has been applied.
DO $checks$
DECLARE
  policies_count integer;
BEGIN
  SELECT count(*) INTO policies_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('kia_public_web_sessions', 'kia_public_web_messages');
  IF policies_count <> 0 THEN
    RAISE EXCEPTION 'Public-chat storage must not contain browser policies';
  END IF;
  IF NOT (
    SELECT bool_and(c.relrowsecurity)
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('kia_public_web_sessions', 'kia_public_web_messages')
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled for both tables';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM (VALUES ('kia_public_web_sessions'), ('kia_public_web_messages')) AS t(name)
    CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(role_name)
    WHERE has_table_privilege(r.role_name, 'public.' || t.name, 'SELECT')
       OR has_table_privilege(r.role_name, 'public.' || t.name, 'INSERT')
       OR has_table_privilege(r.role_name, 'public.' || t.name, 'UPDATE')
       OR has_table_privilege(r.role_name, 'public.' || t.name, 'DELETE')
  ) THEN
    RAISE EXCEPTION 'Browser roles must not have direct table privileges';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.kia_public_web_sessions', 'SELECT,INSERT,UPDATE,DELETE')
     OR NOT has_table_privilege('service_role', 'public.kia_public_web_messages', 'SELECT,INSERT,UPDATE,DELETE')
  THEN
    RAISE EXCEPTION 'Server service role must have explicit permissions';
  END IF;
END
$checks$;

-- Two independent visitors with independent opaque hashes.
INSERT INTO public.kia_public_web_sessions(id, token_hash, expires_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', repeat('a', 64), now() + interval '7 days'),
  ('22222222-2222-4222-8222-222222222222', repeat('b', 64), now() + interval '7 days');

INSERT INTO public.kia_public_web_messages
  (session_id, client_message_id, role, body)
VALUES
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'user', 'first visitor')
ON CONFLICT (session_id, client_message_id, role) DO NOTHING;

-- Duplicate delivery is idempotent.
INSERT INTO public.kia_public_web_messages
  (session_id, client_message_id, role, body)
VALUES
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'user', 'first visitor')
ON CONFLICT (session_id, client_message_id, role) DO NOTHING;

-- Assistant may use the same message id but a distinct role.
INSERT INTO public.kia_public_web_messages
  (session_id, client_message_id, role, body)
VALUES
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'assistant', 'first reply');

-- Same request UUID is valid in a different isolated session.
INSERT INTO public.kia_public_web_messages
  (session_id, client_message_id, role, body)
VALUES
  ('22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', 'user', 'second visitor');

DO $checks$
BEGIN
  IF (SELECT count(*) FROM public.kia_public_web_messages) <> 3 THEN
    RAISE EXCEPTION 'Expected three distinct persisted turns';
  END IF;
  IF (SELECT count(*) FROM public.kia_public_web_messages
      WHERE session_id = '11111111-1111-4111-8111-111111111111') <> 2 THEN
    RAISE EXCEPTION 'Visitor A must have two turns';
  END IF;
  IF (SELECT count(*) FROM public.kia_public_web_messages
      WHERE session_id = '22222222-2222-4222-8222-222222222222') <> 1 THEN
    RAISE EXCEPTION 'Visitor B must remain separate';
  END IF;

  BEGIN
    INSERT INTO public.kia_public_web_sessions(token_hash, expires_at)
    VALUES (repeat('x',64), now() + interval '7 days');
    RAISE EXCEPTION 'Non-hex token hash must fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.kia_public_web_sessions(token_hash, expires_at)
    VALUES (repeat('c',64), now() + interval '9 days');
    RAISE EXCEPTION 'Session with excessive lifetime must fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  BEGIN
    INSERT INTO public.kia_public_web_messages
      (session_id, client_message_id, role, body)
    VALUES (
      '11111111-1111-4111-8111-111111111111',
      '44444444-4444-4444-8444-444444444444', 'system', 'hidden prompt'
    );
    RAISE EXCEPTION 'System role message must fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END
$checks$;

-- Cascading deletion must only affect the selected visitor.
DELETE FROM public.kia_public_web_sessions
WHERE id = '11111111-1111-4111-8111-111111111111';

DO $checks$
BEGIN
  IF (SELECT count(*) FROM public.kia_public_web_messages) <> 1 THEN
    RAISE EXCEPTION 'Cascade deleted the wrong number of messages';
  END IF;
  IF (SELECT count(*) FROM public.kia_public_web_messages
      WHERE session_id = '22222222-2222-4222-8222-222222222222') <> 1 THEN
    RAISE EXCEPTION 'Cascade must preserve unrelated visitor content';
  END IF;
END
$checks$;
