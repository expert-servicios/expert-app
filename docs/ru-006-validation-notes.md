# RU-006 — Validación de atribución por locale

Alcance implementado sin DDL:

- captura first-party de locale, source, campaign, UTM y originPath;
- inferencia semántica de intent/customerType desde rutas ES/RU;
- persistencia en `leads.metadata.acquisition` y `saas_leads.metadata.acquisition`;
- `source`/`source_key` reutilizan campos existentes en `leads`;
- Academy, presupuestos y SaaS leads reutilizan la misma taxonomía;
- Admin `/admin/leads` expone locale, campaña, intención y ruta de origen;
- filtro ES/RU/EN y funnel RU;
- no se modifica histórico financiero ni se crean productos/precios Stripe por idioma;
- leads legacy sin atribución permanecen sin reetiquetar.

Preflight producción confirmado antes de implementar: `leads.metadata` y `saas_leads.metadata` son `jsonb`; no fue necesaria migración.
