# KIA Regulatory Registry — vigilancia normativa e indicadores oficiales

Estado: producción v1.1  
Fecha: 20/09/2026

## Objetivo

KIA debe disponer de una única fuente interna y auditable para cambios normativos y valores operativos que afectan a EXPERT.

La fuente única no es una web externa. Es el **EXPERT Regulatory Registry**, alimentado exclusivamente por fuentes oficiales priorizadas.

El sistema separa:

1. **normativa y criterios administrativos**;
2. **indicadores y coeficientes operativos**;
3. **dependencias internas**;
4. **impacto en servicios/contenido/KIA/expedientes**.

## Principios

- BOE es el eje jurídico general.
- AEAT, Seguridad Social/TGSS, INE, Banco de España y otros organismos complementan el BOE según competencia.
- Una noticia o feed oficial nunca sustituye al texto legal cuando existe una norma aplicable.
- Los snippets fallback de KIA no sirven para detectar cambios.
- KIA no modifica producción directamente.
- La detección es determinista siempre que sea posible.
- KIA razona solo sobre fuentes nuevas o cambiadas.
- Los casos relevantes generan una propuesta auditable.
- Las actualizaciones con efecto jurídico, económico o fiscal exigen revisión humana antes de publicar.
- Un cambio crítico solo bloquea automatizaciones comerciales cuando existe una relación explícita `change → dependency`.
- Una fuente genérica no bloquea por sí sola todos los servicios vinculados a ella.
- Los valores usados por cálculos y respuestas deben salir de `regulatory_values`, no quedar duplicados en prompts.

---

## Arquitectura

```text
FUENTES OFICIALES
   │
   ├── BOE OpenData / legislación consolidada
   ├── AEAT RSS / normativa / manuales
   ├── Seguridad Social RSS / RED
   ├── INE API / publicaciones
   ├── Banco de España datasets
   └── otras fuentes oficiales registradas
            │
            ▼
     regulatory_sources
            │
            ▼
       fetch + normalize
            │
            ▼
        fingerprint
       ┌────┴────┐
       │         │
  sin cambio   cambio
       │         │
       ▼         ▼
      fin   regulatory_snapshots
                 │
                 ▼
          regulatory_changes
                 │
                 ▼
        KIA relevance/impact
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
regulatory_values   regulatory_dependencies
       │                   │
       └─────────┬─────────┘
                 ▼
         propuesta de cambio
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
 Admin / Telegram      GitHub review PR
                 │
                 ▼
           revisión humana
                 │
                 ▼
               merge
```

---

## Frecuencias

### Pulso diario

Una vez al día se consultan fuentes de bajo coste:

- BOE diario;
- RSS AEAT;
- RSS Seguridad Social;
- fuentes oficiales marcadas `daily`;
- datasets que cambian diariamente.

No se llama a IA si el fingerprint no cambia.

### Worker

Un worker periódico procesa únicamente cambios con estado `detected`.

Si no existen cambios pendientes, termina sin llamada IA.

### Auditoría mensual

El día 3 de cada mes se fuerza una revisión completa de todas las fuentes activas y se comprueba:

- fuentes que no han respondido;
- cambios no clasificados;
- fuentes obsoletas;
- valores sin vigencia;
- dependencias críticas;
- coherencia de los registros.

La auditoría mensual no debe re-publicar automáticamente nada.

Desde v1.1 también valida:

- fuentes sin baseline;
- fuentes con error o estancadas;
- valores sin registro actual;
- solapamientos de vigencia;
- dependencias huérfanas;
- ejecuciones que permanecen `running` más de 15 minutos.

### Bajo demanda

Admin/Telegram puede lanzar una revisión manual por:

- `source`;
- `authority`;
- `topic`;
- `service`.

Telegram usa sintaxis explícita, por ejemplo:

```text
/legal revisar service arraigo-social
/legal revisar topic tax
/legal revisar authority AEAT
/legal revisar source aeat_news_rss
```

---

## Jerarquía de fuentes

### Nivel A — norma primaria

- BOE;
- DOUE cuando se incorpore;
- legislación consolidada;
- resoluciones oficiales con efectos normativos.

### Nivel B — aplicación administrativa

- AEAT;
- TGSS / Seguridad Social;
- Sistema RED;
- SEPE;
- Migraciones;
- Justicia;
- DGT;
- organismos autonómicos.

### Nivel C — indicadores oficiales

- INE;
- Banco de España;
- BOE cuando publique tipos oficiales;
- organismos responsables del indicador.

La prioridad de fuente queda almacenada en el registro.

---

## Fuentes iniciales v1

### BOE

- API OpenData de sumario diario.
- Normas consolidadas de especial interés mediante fuentes específicas.

Uso:
- nuevas leyes;
- reales decretos;
- órdenes;
- resoluciones;
- SMI;
- tipos oficiales;
- cotización;
- cambios regulatorios.

### AEAT

- RSS de novedades destacadas;
- RSS de análisis/criterios;
- páginas/feeds específicos cuando se añadan.

Uso:
- modelos;
- campañas;
- procedimientos;
- criterios;
- manuales;
- novedades tributarias.

### Migraciones

Las hojas informativas de Migraciones se mantienen como referencias oficiales humanas. El portal de Inclusión deniega actualmente el acceso server-to-server (HTTP 403), por lo que no se considera una fuente automática fiable.

Para los servicios de arraigo, reagrupación y renovación:

- referencia administrativa humana: páginas oficiales de Migraciones;
- monitorización automática primaria: RD 1155/2024 consolidado en BOE;
- el cambio del Reglamento solo bloquea un servicio cuando KIA vincula expresamente el cambio a esa dependencia.

### Seguridad Social

- Novedades Legislativas;
- Boletines Sistema RED;
- Avisos RED.

Uso:
- cotización;
- afiliación;
- Sistema RED;
- SILTRA;
- RETA;
- bases;
- MEI;
- implementación técnica.

### INE

- API oficial / publicaciones IPC;
- IRAV e indicadores adicionales cuando se incorporen.

### Banco de España

- datasets oficiales de tipos;
- Euribor y otros tipos relevantes.

---

## Tablas

### `regulatory_sources`

Registro de fuentes vigiladas.

Campos clave:

- `source_key`;
- `authority`;
- `title`;
- `url`;
- `fetch_url`;
- `source_type`;
- `fetch_strategy`;
- `priority`;
- `topics`;
- `check_frequency`;
- `active`;
- `last_checked_at`;
- `last_changed_at`;
- `last_success_at`;
- `last_error`;
- `last_fingerprint`.

### `regulatory_snapshots`

Foto normalizada de una fuente en una fecha.

No almacena una copia ilimitada de páginas completas; guarda huella, evidencia muestreada y metadata suficiente para auditar. En fuentes largas la evidencia toma segmentos de inicio, centro y final para no ocultar cambios situados fuera de los primeros 24.000 caracteres.

### `regulatory_changes`

Cambio detectado y posterior clasificación KIA.

Desde v1.1 conserva además evidencia del cambio y resolución humana trazable.

### `regulatory_change_dependencies`

Relación explícita entre un cambio concreto y las dependencias EXPERT realmente afectadas. El bloqueo de publicación consulta esta tabla, no solo la fuente de origen.

Estados:

- `detected`;
- `classified`;
- `ignored`;
- `needs_review`;
- `proposal_ready`;
- `resolved`.

Severidad:

- `info`;
- `low`;
- `medium`;
- `high`;
- `critical`.

Tipos:

- `irrelevant`;
- `informational`;
- `content_update`;
- `operational_update`;
- `calculation_update`;
- `product_update`;
- `critical_legal_change`.

### `regulatory_values`

Valores canónicos usados por KIA y cálculos.

Ejemplos:

- SMI mensual/diario/anual;
- IPC (último dato publicado, separado de la vigencia jurídica);
- IRAV;
- IPREM;
- interés legal;
- interés demora tributaria;
- interés demora comercial;
- MEI;
- base máxima de cotización;
- tablas RETA.

Cada valor conserva:

- vigencia;
- unidad;
- fuente;
- cambio origen;
- fecha de verificación.

### `regulatory_dependencies`

Grafo explícito entre una fuente/valor y recursos EXPERT.

Tipos de dependencia:

- `service`;
- `operational_blueprint`;
- `viability`;
- `blog`;
- `knowledge`;
- `kia_prompt`;
- `calculator`;
- `course`;
- `social`;
- `seo`;
- `telegram`;
- `admin`.

### `regulatory_review_runs`

Auditoría de cada ejecución.

### Sin tabla adicional de cola

`regulatory_changes.status='detected'` actúa como cola de clasificación.

---

## Clasificación KIA

Task type:

```text
regulatory_review
```

KIA recibe:

- autoridad;
- título;
- URL;
- topics;
- snapshot anterior;
- snapshot nuevo;
- dependencias conocidas.

No recibe información personal.

Respuesta estructurada:

```json
{
  "relevant": true,
  "severity": "high",
  "changeType": "operational_update",
  "topics": ["social_security", "labor"],
  "summary": "...",
  "effectiveDate": "2026-01-01",
  "requiresHumanReview": true,
  "valueUpdates": [],
  "dependencyHints": []
}
```

### Reglas de clasificación

- El simple cambio de HTML/cabecera no implica cambio regulatorio.
- Un cambio relevante debe explicarse en términos operativos.
- Si hay duda jurídica, `requiresHumanReview=true`.
- No se deduce una cuantía si no está expresamente soportada por la fuente.
- KIA no cambia automáticamente precio, IVA, tasa, requisito legal o contenido publicado.
- Un cambio `critical` genera bloqueo regulatorio.

---

## Valores canónicos iniciales

Los valores seed deben estar respaldados por fuente oficial y vigencia explícita.

Ejemplos vigentes en 2026:

- SMI mensual: 1.221 EUR;
- SMI diario: 40,70 EUR;
- SMI anual: 17.094 EUR;
- interés legal: 3,25 %;
- interés de demora tributaria: 4,0625 %;
- interés demora comercial 2026 H2: 10,40 %;
- base máxima Régimen General: 5.101,20 EUR/mes;
- MEI: 0,90 %;
- IPC anual agosto 2026: 4,3 %.

Los seeds son un punto de partida. La vigencia futura la mantiene el monitor.

---

## Dependencias del lote 1

El registro debe enlazar, como mínimo:

### Extranjería

Fuente:
- RD 1155/2024 / Migraciones.

Dependencias:
- arraigo-social;
- arraigo-sociolaboral;
- arraigo-familiar;
- viability checks;
- operational blueprints;
- guías;
- blog;
- KIA;
- Telegram.

### Laboral

SMI / cotización:
- curso gestión laboral;
- KIA laboral;
- cálculos;
- guías;
- nóminas;
- modelos de control.

### Fiscal

AEAT:
- servicios tributarios;
- artículos;
- KB;
- KIA fiscal;
- calendario;
- checklists.

---

## Bloqueo regulatorio

Si un cambio es `critical`:

1. registrar cambio;
2. identificar dependencias afectadas;
3. persistir `regulatory_change_dependencies`;
4. notificar Admin/Telegram;
5. impedir promoción automática **solo** de servicios afectados;
6. requerir revisión humana con nota de resolución.

Una fuente oficial genérica no bloquea servicios si KIA no ha vinculado expresamente el cambio a esas dependencias.

No se despublica automáticamente una landing existente.

---

## Telegram

Comandos Admin:

```text
/legal status
/legal cambios
/legal revisar
/legal revisar aeat
/legal revisar social_security
/legal revisar arraigo-social
/legal valor SMI_MONTHLY
```

Resultados:

- resumen de última ejecución;
- cambios pendientes;
- severidad;
- recursos afectados;
- valores vigentes;
- ejecución manual cuando proceda.

Los usuarios finales no pueden lanzar auditorías regulatorias.

---

## GitHub / actualización de contenido

### v1

El sistema crea una propuesta auditable:

- cambio;
- resumen;
- dependencias;
- archivos sugeridos;
- valores a revisar;
- tests esperados.

Cuando haya configuración GitHub server-side, puede crear un PR de revisión.

### Regla

Nunca se hace merge automático de un cambio regulatorio.

Nunca se modifica producción desde el cron.

---

## Scheduler

Scheduler principal: Supabase `pg_cron`.

Jobs:

### regulatory-pulse-daily

```cron
17 5 * * *
```

Objetivo:
- ingestión;
- fingerprint;
- registrar cambios.

### regulatory-worker

```cron
37 * * * *
```

Objetivo:
- procesar pocos cambios `detected`;
- no llamar IA si la cola está vacía.

### regulatory-monthly-audit

```cron
41 5 3 * *
```

Objetivo:
- force check;
- detectar fuentes estancadas;
- resumen mensual.

Todos llaman endpoints protegidos con `CRON_SECRET`.

---

## Seguridad

- RLS deny by default para usuarios.
- Escritura solo server/service role.
- URLs restringidas a allowlist oficial.
- timeout y tamaño máximo de fetch.
- sin ejecución de contenido remoto.
- HTML/XML tratado como datos no confiables.
- nunca seguir instrucciones contenidas en una fuente.
- no almacenar secretos.
- no enviar PII a KIA.
- audit trail obligatorio.
- fail-closed ante errores.

---

## Definition of Done v1.1

- [x] tablas y RLS;
- [x] source registry oficial;
- [x] seed de valores 2026;
- [x] fetch/fingerprint completo;
- [x] evidencia distribuida para fuentes largas;
- [x] pulse diario;
- [x] worker KIA;
- [x] auditoría mensual de salud;
- [x] dependencias de los 10 servicios del lote 1;
- [x] impacto por cambio concreto;
- [x] bloqueo de publicación por impacto explícito;
- [x] herramienta KIA de lectura;
- [x] valores periódicos con modo `latest_published`;
- [x] cierre controlado de vigencias solapadas;
- [x] resolución humana trazable;
- [x] Telegram Admin con scope explícito;
- [x] timeout pg_net 30 s;
- [x] alertas;
- [x] tests;
- [ ] CI verde del PR v1.1;
- [ ] Security Advisor después de aplicar DDL v1.1;
- [ ] baseline post-migración de todas las fuentes nuevas.

## Fase siguiente

- DOUE;
- autonómicas completas;
- extracción estructurada automática de INE/BdE;
- generación GitHub PR con patches;
- panel Admin visual Regulatory Pulse;
- diff semántico por artículo/bloque normativo;
- suscripciones personalizadas por área.


## Hardening v1.2 — cierre de huecos de producción

La revisión posterior al baseline de producción añade cuatro controles:

- el sumario diario del BOE se normaliza a una evidencia compacta y prioriza disposiciones potencialmente relevantes para EXPERT antes de clasificar;
- cualquier cambio de algoritmo de fingerprint requiere re-baseline explícito de la fuente afectada para no crear falsos cambios;
- los valores canónicos deben apuntar a una fuente de evidencia específica cuando exista una norma o página oficial concreta, manteniendo los feeds amplios como capa de descubrimiento;
- el health audit marca como incidencia una fuente activa que nunca ha tenido lectura correcta, una fuente accionable sin dependencias y un valor sin fuente canónica activa.

Fuentes exactas 2026 añadidas:

- RD 126/2026 / BOE-A-2026-3815 — SMI;
- Orden PJC/297/2026 / BOE-A-2026-7296 — bases y cotización / MEI;
- BOE-A-2026-14327 — interés de demora comercial H2 2026;
- AEAT — referencia vigente 2026 para interés legal e interés de demora tributario.

Los directorios RSS de AEAT y Seguridad Social se conservan como `discovery_only`; los feeds directos siguen siendo las fuentes accionables.

El panel Admin recibe el resultado del health audit en la misma carga del Regulatory Pulse y muestra códigos, severidad y motivo sin necesidad de consultar Supabase.


## v1.3 — cobertura regulatoria por rulesets

La auditoría exhaustiva del catálogo EXPERT demostró que una parte relevante de la operativa no puede modelarse como valores escalares. Desde v1.3:

- `regulatory_values` se reserva para magnitudes puntuales con vigencia;
- `regulatory_rulesets` almacena tablas, matrices, calendarios y reglas versionadas;
- `regulatory_dependencies.ruleset_key` conecta cada ruleset con servicios, KIA, calculadoras, cursos y Admin;
- el worker resuelve impacto por `source_id` y también por `source -> ruleset -> dependency`;
- el health audit comprueba fuente, vigencia, solapamiento y dependencias huérfanas de rulesets;
- KIA dispone de `get_regulatory_ruleset` como herramienta R0 de solo lectura.

Primer lote P0:
- `RETA_2026_BRACKETS`;
- `IRPF_WITHHOLDING_2026`;
- `VERIFACTU_DEADLINES`;
- `IRNR_210_2026_TRANSITION`;
- `VALENCIA_ITPAJD_2026`;
- `VALENCIA_ISD_2026`;
- `SL_CAPITAL_RULES`.

La auditoría maestra y el roadmap de cobertura están en `docs/kia-regulatory-coverage-audit-v13.md`.
