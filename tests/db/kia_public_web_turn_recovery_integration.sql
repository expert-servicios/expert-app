-- Isolated PostgreSQL 15 test, run after baseline and recovery migrations.
DO $$
DECLARE
  v_session uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_message uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  v_claim uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  v_other uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  v jsonb;
BEGIN
  IF has_function_privilege('anon', 'public.kia_web_claim_turn(uuid,uuid,text,uuid)', 'execute')
  OR has_function_privilege('authenticated', 'public.kia_web_complete_turn(uuid,uuid,uuid,text)', 'execute')
  THEN RAISE EXCEPTION 'Public roles can execute server-only recovery functions'; END IF;

  INSERT INTO public.kia_public_web_sessions (id,token_hash,expires_at)
    VALUES (v_session,repeat('d',64),now()+interval '7 days');

  v := public.kia_web_claim_turn(v_session,v_message,'hola',v_claim);
  IF v->>'outcome' <> 'acquired' THEN RAISE EXCEPTION 'Initial claim failed: %',v; END IF;
  v := public.kia_web_claim_turn(v_session,v_message,'hola',v_other);
  IF v->>'outcome' <> 'busy' THEN RAISE EXCEPTION 'Concurrent claim was accepted: %',v; END IF;
  v := public.kia_web_claim_turn(v_session,v_message,'different body',v_other);
  IF v->>'outcome' <> 'mismatch' THEN RAISE EXCEPTION 'Mismatched body reused id: %',v; END IF;

  IF public.kia_web_renew_turn(v_session,v_message,v_other) THEN
    RAISE EXCEPTION 'Unauthorized claim renewal succeeded';
  END IF;
  IF NOT public.kia_web_renew_turn(v_session,v_message,v_claim) THEN
    RAISE EXCEPTION 'Owner could not renew claim';
  END IF;
  IF NOT public.kia_web_fail_turn(v_session,v_message,v_claim) THEN
    RAISE EXCEPTION 'Owner could not mark turn failed';
  END IF;
  v := public.kia_web_claim_turn(v_session,v_message,'hola',v_other);
  IF v->>'outcome' <> 'acquired' THEN RAISE EXCEPTION 'Failed turn not recoverable: %',v; END IF;
  v := public.kia_web_complete_turn(v_session,v_message,v_claim,'stale response');
  IF v->>'outcome' <> 'lost_claim' THEN RAISE EXCEPTION 'Stale worker could publish: %',v; END IF;
  v := public.kia_web_complete_turn(v_session,v_message,v_other,'respuesta final');
  IF v->>'outcome' <> 'complete' OR v->>'reply' <> 'respuesta final' THEN
    RAISE EXCEPTION 'Recovered worker could not finish: %',v;
  END IF;
  v := public.kia_web_claim_turn(v_session,v_message,'hola',v_claim);
  IF v->>'outcome' <> 'replay' OR v->>'reply' <> 'respuesta final' THEN
    RAISE EXCEPTION 'Completed retry did not replay: %',v;
  END IF;
  IF (SELECT count(*) FROM public.kia_public_web_messages
      WHERE session_id=v_session) <> 2 THEN RAISE EXCEPTION 'Duplicated persisted turns'; END IF;
END
$$;
