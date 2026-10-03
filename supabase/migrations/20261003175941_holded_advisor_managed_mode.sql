-- Distinguish Holded accounts created/paid by EXPERT Asesoria from
-- collaborative accounts owned by the client.
alter table public.client_integrations
  drop constraint if exists client_integrations_mode_check;

alter table public.client_integrations
  add constraint client_integrations_mode_check
  check (mode = any (array[
    'expert_account'::text,
    'client_account'::text,
    'advisor_managed'::text
  ]));

comment on column public.client_integrations.mode is
  'Holded ownership mode: expert_account, client_account (collaborative/client-owned), advisor_managed (account created and managed by EXPERT Asesoria).';
