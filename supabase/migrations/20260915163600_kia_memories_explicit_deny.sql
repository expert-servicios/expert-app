-- KIA M5.1: make browser denial explicit for the KIA memory store.
-- Runtime access remains server-side through service_role only.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_memories'
      and policyname = 'kia_memories_deny_browser'
  ) then
    create policy "kia_memories_deny_browser"
      on public.kia_memories
      for all
      to anon, authenticated
      using (false)
      with check (false);
  end if;
end
$$;
