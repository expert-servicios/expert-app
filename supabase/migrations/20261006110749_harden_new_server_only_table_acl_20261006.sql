-- New operational/mentoring/editorial tables are server-only.
-- Keep RLS enabled and remove browser-role grants; service_role remains the sole data API writer/reader.

revoke all privileges on table
  public.company_intake_profiles,
  public.mentoring_artifacts,
  public.mentoring_engagements,
  public.mentoring_publications,
  public.mentoring_sessions,
  public.social_channel_accounts,
  public.social_content_items,
  public.social_publication_jobs
from anon, authenticated;

grant all privileges on table
  public.company_intake_profiles,
  public.mentoring_artifacts,
  public.mentoring_engagements,
  public.mentoring_publications,
  public.mentoring_sessions,
  public.social_channel_accounts,
  public.social_content_items,
  public.social_publication_jobs
to service_role;
