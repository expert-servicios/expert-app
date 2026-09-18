# KIA Visual Copilot — Sprint 5

Fecha: 2026-09-17
Tracking: #192
Dependencias completadas: #172, #174, #177, #179, #187, #189
Implementación actual: PR #274 + Sprint 5C + Sprint 5D en ramas encadenadas

## Objetivo

Extender KIA fuera del chat flotante para que acompañe al usuario en superficies operativas del Espacio Cliente. La misma gramática visual de 12 estados debe reutilizarse allí donde el sistema ya conoce un estado fiable de UI o backend.

## Regla de arquitectura

No se añade una segunda llamada al LLM para elegir una expresión.

```text
estado UI / dato backend ya autorizado
  -> resolver KIA determinista
  -> KiaGuidanceCard
  -> KiaAvatar existente
```

KIA sigue siendo una capa de orientación. No modifica datos, permisos, expedientes, Holded, Stripe ni acciones del usuario.

## Componente compartido

`components/kia/KiaGuidanceCard.tsx` presenta una orientación breve con el avatar contextual. El componente no ejecuta `fetch`, tools ni `runKiaDecision`; el estado llega ya resuelto por la capa llamadora.

`lib/ai/kia/kia-surface-guidance.ts` centraliza las reglas deterministas para evitar que cada pantalla invente su propio mapping.

Sprint 5C añade un campo opcional `detail` para exponer únicamente contadores autorizados de documentación, sin inferencias nuevas.

## Sprint 5A — lista de expedientes

Superficie: `/dashboard/expedientes`.

Mapping:

- uno o más expedientes activos -> `seguimiento`;
- cero activos y uno o más finalizados -> `exito`;
- ningún expediente -> `ayuda`.

El contenido mostrado deriva únicamente del resultado ya autorizado de `/api/cases` para ese usuario. No se añade ninguna llamada al modelo.

## Sprint 5B — onboarding

Superficie: `/dashboard/onboarding`.

Mapping:

- inicio/perfil -> `bienvenida`;
- explicación de entidad -> `explicacion`;
- entidad omitida -> `duda`;
- guardado/operación en curso -> `pensando`;
- validación o error -> `aviso`;
- configuración completa -> `exito`.

### Precedencia

La regla es fail-safe:

```text
error
  > loading
  > completado / estado del paso
```

La tarjeta KIA no sustituye los mensajes de validación existentes ni modifica los endpoints `/api/profile`, `/api/companies` o `/api/dashboard/onboarding/complete`.

## Sprint 5C — detalle de expediente

Superficie: `/dashboard/expedientes/[id]`.

La pantalla ya dispone de estado de expediente, checklist y documentos autorizados. KIA reutiliza exclusivamente estas señales estructuradas y mantiene la guía operativa existente de la pantalla.

Mapping implementado:

- `nuevo` -> `ayuda`;
- `docs_pendientes` / `pendiente_documentacion` -> `aviso` cuando el checklist conocido tiene menos archivos subidos que elementos solicitados; en otro caso `duda`;
- `docs_recibidos` / `en_revision` / `en_tramitacion` / `en_proceso` / `pendiente_externo` -> `seguimiento`;
- `resolucion_recibida` / `presentado` -> `confianza`, porque el estado backend confirma ese hito;
- `entregado` / `finalizado` -> `exito`;
- estado desconocido -> `seguimiento` fail-safe;
- `celebracion` continúa reservada a una señal de milestone más fuerte y no se deduce de una etiqueta genérica.

Los contadores de documentos subidos/revisados pueden mostrarse como detalle auxiliar. No se compara contenido, nombre ni texto libre de los documentos.

## Sprint 5D — integración Holded

Superficie: `components/integrations/HoldedConnectionCard.tsx` dentro de `/dashboard/integraciones/holded`.

KIA consume únicamente señales ya presentes en la UI de integración:

- `integration.status`;
- fase local de verificación del token (`idle`, `testing`, `verified`, `error`);
- operación de desconexión en curso;
- error local ya mostrado por la propia tarjeta.

Mapping implementado:

- sin integración / estado inactivo -> `ayuda`;
- verificación, `pending` o desconexión en curso -> `pensando`;
- API Token verificado o integración `active` -> `confianza`;
- `failed`, fallo de verificación o error local -> `aviso`;
- `disabled` / `revoked` -> `ayuda`.

### Precedencia 5D

La regla visual es fail-safe:

```text
error
  > operación en curso
  > integración activa / token verificado
  > estado inactivo
```

Por tanto, KIA nunca muestra `confianza` si la propia UI está señalando un error, ni anticipa una conexión activa mientras una comprobación sigue en curso.

### Separación respecto a #272

Sprint 5D no modifica:

- consulta o selección de la integración;
- `client_integrations`;
- permisos detectados o habilitados;
- consentimiento;
- secretos o API keys;
- company scoping;
- endpoints de conexión/desconexión;
- capacidad de lectura/escritura de Holded.

El hardening de esos límites permanece exclusivamente en PR #272. La capa visual sólo observa el resultado que ya expone la integración existente.

## Accesibilidad

- el texto siempre explica el estado por sí mismo;
- el avatar es decorativo junto al mensaje;
- el componente reutiliza `KiaAvatar`, incluido `prefers-reduced-motion`;
- no se añade movimiento permanente;
- los errores y validaciones continúan presentes como texto.

## Seguridad y privacidad

- no se guardan nuevas inferencias emocionales;
- no se crea telemetría nueva en este bloque;
- no DDL;
- no datos financieros nuevos;
- no llamadas API nuevas desde `KiaGuidanceCard`;
- no se utiliza texto libre para concluir riesgo, éxito o cumplimiento;
- la capa visual nunca ejecuta acciones externas;
- no se expone ni persiste la API key desde la lógica KIA.

## Validación

PR #274 (5A/5B):

- CI: success;
- Vercel `app`: Ready;
- Vercel `ksenia-expert`: Ready;
- smoke visual autenticado desktop/móvil: pendiente antes de merge.

Sprint 5C y 5D deben pasar los mismos controles antes de integrarse.

## Criterios de aceptación antes de merge

- componente reusable presente;
- `/dashboard/expedientes` muestra KIA con estado derivado de counts autorizados;
- `/dashboard/onboarding` respeta `error > loading > paso`;
- `/dashboard/expedientes/[id]` deriva su estado KIA sólo de estado/checklist/contadores autorizados;
- Holded deriva su estado KIA únicamente de estado de integración y fases locales existentes;
- ninguna superficie llama al LLM para seleccionar estado;
- KIA no modifica permisos, consentimiento ni endpoints Holded;
- los flujos, enlaces, validaciones y CTAs existentes permanecen intactos;
- typecheck, lint y tests pasan;
- Vercel previews están Ready;
- smoke visual autenticado desktop/móvil completado.
