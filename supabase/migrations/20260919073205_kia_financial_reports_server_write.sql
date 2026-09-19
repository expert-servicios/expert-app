-- Harden public.kia_financial_reports after production preflight on 2026-09-19.
-- Browser roles are read-only; all writes remain server-side via service_role.

ALTER TABLE public.kia_financial_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_service_insert" ON public.kia_financial_reports;
DROP POLICY IF EXISTS "reports_service_update" ON public.kia_financial_reports;
DROP POLICY IF EXISTS "reports_select_own" ON public.kia_financial_reports;

CREATE POLICY "reports_select_own"
  ON public.kia_financial_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

REVOKE ALL PRIVILEGES ON TABLE public.kia_financial_reports FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.kia_financial_reports
  FROM authenticated;
GRANT SELECT ON TABLE public.kia_financial_reports TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.kia_financial_reports
  TO service_role;
