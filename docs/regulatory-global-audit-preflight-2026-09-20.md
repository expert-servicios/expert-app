# Auditoría global regulatoria — preflight v1.3–v1.5

Fecha: 20/09/2026  
Rama: `fix/regulatory-global-audit-preflight`  
Producción Supabase: `ybtpqscmqrrjjmuoryap`

## Resultado ejecutivo

La auditoría se realizó en modo read-only sobre producción. No se ejecutó DDL/DML, no se modificó `supabase_migrations` y no se aplicaron las migraciones v1.3–v1.5.

### Ledger de producción

- filas: **72**
- primera versión: `20260912000100`
- última versión: `20260920073758`
- filas con `statements` vacío: **0**

Se detectaron cinco migraciones regulatorias v1.0–v1.2 cuyo SQL local era idéntico al registrado en producción pero cuyo timestamp local no coincidía con el ledger remoto. Se alinearon los nombres locales con las versiones remotas, sin tocar producción.

Tras la alineación:

- migraciones locales: **81**
- migraciones remotas: **72**
- remotas sin archivo local: **0**
- pendientes reales: **9**, exactamente v1.3–v1.5.

## Migraciones pendientes

1. `20260920111500_regulatory_rulesets_v13.sql`
2. `20260920123000_regulatory_v14_fiscal_mercantil_lot1.sql`
3. `20260920133000_regulatory_v14_fiscal_recurrente_lot2.sql`
4. `20260920150000_regulatory_v14_mercantil_lot3.sql`
5. `20260920163000_regulatory_v14_mercantil_lot4.sql`
6. `20260920180000_regulatory_v15_property_dgt_lot1.sql`
7. `20260920201500_regulatory_v15_vehicle_registration_lot2.sql`
8. `20260920213000_regulatory_v15_property_isd_rent_lot3.sql`
9. `20260920230000_regulatory_v15_final_dgt_maritime.sql`

## Hallazgos corregidos

### P0 — bloqueante de constraint

`VALENCIA_RENTAL_DEPOSIT_2026` usaba `criticality='medium'`, pero producción admite únicamente `normal|high|critical`. Se cambia a `normal`.

### P0 — preflight de ledger obsoleto

El workflow seguía congelado en el estado previo a la reparación de septiembre y solo corría para PR #194. Se reemplaza por un preflight read-only que:

- valida las 72 filas actuales;
- comprueba las cinco versiones regulatorias ya reconciliadas;
- ejecuta `supabase migration list --linked`;
- ejecuta `supabase db push --linked --dry-run`;
- exige exactamente las nueve migraciones pendientes;
- no realiza escritura alguna.

### P1 — rendimiento

Se añaden índices para FKs regulatorias sin cobertura y para las nuevas FKs de `regulatory_rulesets`.

### P1 — fail-closed

`getCurrentRegulatoryValue` y `getCurrentRegulatoryRuleset` dejan de elegir silenciosamente una fila cuando existen dos vigencias simultáneas. Una ambigüedad pasa a requerir revisión humana.

### P1 — contenido vivo

Se eliminan residuos:

- Modelo 037 como documento actual en Admin/Holded;
- tabla autonómica estática de TPO/AJD;
- Valencia 10 % en contenido público;
- Modelo 720 resumido como simple umbral de 50.000 EUR;
- Beckham resumido como un único “tipo fijo 24 %”;
- plazo del Modelo 200 calculado desde una frase estática;
- Golden Visa presentada como vía abierta pese a su derogación para nuevas solicitudes desde 03/04/2025;
- larga duración nacional con requisitos económicos/seguro trasladados incorrectamente desde otras autorizaciones;
- reagrupación familiar con RD 557/2011 y cuantías aproximadas 2025;
- guía de arraigos con categoría antigua de arraigo laboral y formulario erróneo;
- segunda tabla VERI*FACTU con fechas 2025/2026;
- cuota RETA y metadatos de autónomos anclados a 2025;
- terminología residual CIF definitivo.

## Auditoría temporal de contenido 2026

La pasada final se contrastó con fuentes oficiales vigentes:

- RRSIF/VERI*FACTU: 01/01/2027 para contribuyentes del IS y 01/07/2027 para el resto de obligados del ámbito;
- residencia de larga duración nacional: no incorporar como requisito general 150 % IPREM ni seguro médico;
- reagrupación familiar: 150 % IPREM para unidad de dos miembros + 50 % por adicional, con reglas de minoración en determinados supuestos con menores;
- residencia no lucrativa: 400 % IPREM para solicitante + 100 % por familiar, usando el IPREM vigente;
- Golden Visa/inversores: artículos 63-67 Ley 14/2013 sin contenido desde 03/04/2025, salvo régimen transitorio;
- arraigos: nomenclatura vigente del RD 1155/2024.

## Integridad del grafo

Auditoría estática sobre v1.3–v1.5:

- rulesets definidos: **34**
- dependencias hacia rulesets: **128**
- dependencias con ruleset inexistente: **0**
- referencias de fuente de ruleset: **35**
- fuentes canónicas faltantes: **0**
- dependencias de tipo `service` comprobadas: **71**
- slugs de servicio huérfanos: **0**

## Seguridad

El Registry actual tiene RLS habilitado y políticas deny-by-default para navegador. Supabase Security Advisor no reporta hallazgos específicos sobre `regulatory_*`.

Los avisos globales preexistentes (Auth leaked-password protection, actualización de PostgreSQL y tablas legacy con RLS sin policy) quedan fuera de este despliegue regulatorio y no deben mezclarse con él.

## Gate para producción

Orden obligatorio:

1. CI verde.
2. Vercel `app` y `ksenia-expert` verdes.
3. `Supabase Ledger Preflight` verde.
4. Revisar artefacto de `db push --dry-run`: solo las 9 migraciones anteriores.
5. Aplicar migraciones forward-only en orden.
6. Verificar que el ledger pasa de 72 a **81** filas y termina en `20260920230000`.
7. Ejecutar health audit regulatorio.
8. Ejecutar Security Advisor y Performance Advisor.
9. Verificar RLS/policies de `regulatory_rulesets`.
10. Smoke test KIA: `get_regulatory_value` + `get_regulatory_ruleset`.
11. Si aparece cualquier duplicado de fuente/ruleset, solapamiento de vigencia o dependencia huérfana: detener y revisar; no publicar automáticamente.

## Regla de despliegue

No usar `migration repair` para este lote y no editar directamente `supabase_migrations.schema_migrations`. Tras la alineación de nombres, el despliegue correcto es exclusivamente forward-only sobre las nueve migraciones realmente pendientes.
