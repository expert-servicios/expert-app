create unique index if not exists companies_cif_nif_normalized_uidx
on public.companies (
  upper(regexp_replace(cif_nif,'[^A-Za-z0-9]','','g'))
)
where cif_nif is not null
  and btrim(cif_nif) <> '';
