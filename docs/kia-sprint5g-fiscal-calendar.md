# KIA Visual Copilot — Sprint 5G · Calendario fiscal

Fecha: 2026-09-17
Base: Sprint 5F / PR #283
Superficie: `/dashboard/calendario-fiscal`

## Objetivo

Añadir orientación visual de KIA al calendario fiscal utilizando exclusivamente conteos y estados estructurados que la propia pantalla ya calcula.

## Señales permitidas

- número total de obligaciones visibles;
- número de obligaciones con `status = pending`;
- número de obligaciones `pending` cuya `deadline` ya ha pasado.

KIA no recibe ni interpreta `notes`, `description`, modelo, contenido documental ni texto libre asociado a la obligación.

## Mapping

```text
1+ pendientes vencidas
  -> alerta_fiscal

0 vencidas + 1+ pendientes
  -> seguimiento

0 pendientes + 1+ obligaciones visibles
  -> confianza

0 obligaciones visibles
  -> ayuda
```

## Significado de `alerta_fiscal`

El estado `alerta_fiscal` se utiliza porque existe una señal objetiva en el calendario: la obligación sigue marcada como pendiente y su fecha límite ya ha pasado.

No se deduce de ello:

- existencia de deuda;
- sanción;
- recargo;
- falta de presentación;
- incumplimiento material.

El mensaje obliga a revisar el registro y mantiene estas conclusiones fuera de la capa visual.

## Arquitectura

```text
obligations autorizadas
  -> pending / overdue counts existentes
  -> resolveFiscalCalendarGuidance
  -> KiaGuidanceCard
  -> KiaAvatar
```

No existe segunda llamada LLM ni ejecución de tools.

## Seguridad

- sin DDL;
- sin cambios de obligaciones;
- sin cambios en estados fiscales;
- sin modificaciones de Google Calendar/OAuth;
- sin presentación automática;
- sin lectura de notas o descripciones para inferir riesgo;
- sin acciones externas.

## Validación

Antes de integración:

- TypeScript;
- lint;
- tests;
- Vercel `app` y `ksenia-expert` Ready;
- smoke visual autenticado desktop/móvil.

Este bloque está apilado sobre Sprint 5F y debe integrarse en orden o consolidarse con los bloques 5E/5F cuando los gates visuales estén cerrados.
