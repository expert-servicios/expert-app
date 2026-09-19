-- Restore tenant_admin read-only access for cases/documents.
-- Production preflight on 2026-09-19 confirmed stale FOR ALL policies.
-- Keep the existing SELECT policy on cases unchanged; only remove the stale ALL
-- policy. Documents currently lack a SELECT-only tenant_admin policy, so create
-- one with the same tenant scoping predicate used by the stale ALL policy.
-- Client document uploads remain allowed by the separate client INSERT policy.

DROP POLICY IF EXISTS "tenant_admin all cases" ON public.cases;

DROP POLICY IF EXISTS "tenant_admin all documents" ON public.documents;
DROP POLICY IF EXISTS "tenant_admin select documents" ON public.documents;

CREATE POLICY "tenant_admin select documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (
    public.is_tenant_admin()
    AND client_id IN (
      SELECT id
      FROM public.profiles
      WHERE tenant_id = public.auth_tenant_id()
    )
  );

-- Keep authenticated INSERT on documents because client uploads rely on
-- "client insert own documents". No grant cleanup is mixed into this repair.
