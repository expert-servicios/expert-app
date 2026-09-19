# KIA Regulatory Registry — vigilancia normativa e indicadores oficiales

Estado: arquitectura e implementación v1  
Fecha: 19/09/2026

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
- Un cambio crítico bloquea automatizaciones comerciales dependientes hasta revisión.
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

### Bajo demanda

Admin/Telegram puede lanzar una revisión manual por:

- autoridad;
- topic;
- source key;
- service slug.

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

No almacena una copia ilimitada de páginas completas; guarda huella, extracto relevante y metadata suficiente para auditar.

### `regulatory_changes`

Cambio detectado y posterior clasificación KIA.

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
- IPC;
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
2. marcar dependencias afectadas;
3. notificar Admin/Telegram;
4. impedir promoción automática de servicios afectados;
5. requerir revisión humana.

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

## Definition of Done v1

- [ ] tablas y RLS;
- [ ] source registry oficial;
- [ ] seed de valores 2026;
- [ ] fetch/fingerprint;
- [ ] pulse diario;
- [ ] worker KIA;
- [ ] auditoría mensual;
- [ ] dependencias lote 1;
- [ ] herramienta KIA de lectura;
- [ ] Telegram Admin;
- [ ] alertas;
- [ ] tests;
- [ ] CI verde;
- [ ] Security Advisor después de DDL.

## Fase siguiente

- DOUE;
- autonómicas completas;
- extracción estructurada automática de INE/BdE;
- generación GitHub PR con patches;
- panel Admin visual Regulatory Pulse;
- diff semántico por artículo/bloque normativo;
- suscripciones personalizadas por área.
