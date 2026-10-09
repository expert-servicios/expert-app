# KIA Work — ejecución supervisada dentro de EXPERT Workspace V2

Fecha: 09/10/2026. Estado: **diseño de ejecución aprobado para construcción incremental; ninguna escritura general habilitada**.

## Principio de producto

KIA Copiloto sigue como ventana adicional dentro de Admin y Cliente. A petición explícita del usuario puede **planificar, previsualizar, solicitar aprobación, ejecutar y comprobar cambios reales** usando APIs de EXPERT. No hace clic ciegamente en el DOM, no toma una sesión cliente y no reemplaza a ChatGPT Work en su totalidad: se construye un operador especializado dentro de EXPERT, con permisos verificables y conectores permitidos.

**Inbox 360 / Operations 360 es la bandeja unificada canónica existente**: `/admin/inbox`, `/api/admin/inbox`, `lib/admin/operations-360-inbox.ts`. Conecta correo, Telegram, web, KIA, Meta, Google, LinkedIn según fuentes reales disponibles. No crear una segunda bandeja «Vox» ni replicar hilos. Las acciones de KIA se asocian a las conversaciones/orígenes existentes y aparecen en timelines; el takeover humano existente tiene precedencia.

## Evidencia del estado actual (octubre 2026)

- `/api/ai/kia` ya aplica `resolveKiaActorCapabilities`, herramientas autorizadas y `runPolicyEnforcedKiaDecision`.
- `kia-tool-registry.ts` cataloga efectos `read/draft/write/external_action`, niveles R0–R5 y `requiresHumanApproval`.
- `kia-policy-profiles.ts`: `client_dashboard` y `admin_copilot` permiten **lecturas R1** y `autonomousOnly: true`; otros perfiles tienen límites específicos. No confundir la existencia de una herramienta con permiso efectivo de ejecución.
- `app/api/admin/tasks`, `app/api/profile` y `app/api/cases/[id]` ya poseen mutaciones operativas, pero no todas son transaccionales con auditoría y no se deben invocar indiscriminadamente con service_role.
- `AdminRightPanel` y `KiaCopilotWidget` deben mantenerse únicos por superficie; cambiar de empresa invalida contexto y evita cruzar conversaciones.
- `audit_logs`, `integration_sync_events`, `kia_conversations` e `internal_tasks` existen. Verificar política RLS e idempotencia antes de extenderlas.

## Capas

1. **Interpreter (sin autoridad):** convierte instrucciones en propuestas tipadas `WorkspaceActionProposal`. No recibe derechos en el prompt, ni añade actor_id, secretos o acceso a otra empresa.
2. **Resolver de objetos:** identifica entidad/expediente/contacto a partir de IDs canónicos, con verificación contra tablas. Si hay ambigüedad, solicita desambiguación.
3. **Policy engine:** servidor obtiene identidad Supabase, rol, tenant, compañía, membresía, capacidades y permiso de operación para *cada paso*. Admin soporte conserva actor real y consentimiento.
4. **Plan/Preview:** muestra cambios concretos, valores antiguos/nuevos, efectos externos, dependencia, costes y riesgos. Sin ejecutar desde el modelo.
5. **Aprobación:** vinculada al plan, versión, actor, empresa, expiración, nonce único y hash de payload. Nunca interpretar «sí» genérico o el propio texto generado por IA como aprobación de operaciones sensibles.
6. **Action adapters:** reutilizar servicios de dominio actuales (profile/cases/tasks/calendar/integrations/inbox). Los controladores HTTP siguen comprobando derechos; encapsular lógica compartida autorizada. No exportar un `execute SQL arbitrary`, `fetch URL` arbitrario o un conector global sin scope.
7. **Durable execution:** ejecución idempotente, límites de pasos/tiempo/coste, reintento solo para fallos seguros y compensaciones cuando procedan. Para workflows largos, evaluar cola persistente/workflows tras validar dependencias.
8. **Audit & verification:** guardar actor, sujeto, empresa, idempotency_key, motivo, origen inbox, herramienta, diff redactado, consentimiento, aprobación, versión previa, ejecución y comprobación posterior; nunca claves OAuth ni contenido excesivo.
9. **Chat action cards:** propuesto → aprobación → en curso → ejecutado/comprobado, denegado o pendiente de usuario. Abrir registro actualizado mediante enlace y permitir cancelación antes de efectos irreversibles.

## Matriz inicial (catálogo tipado `lib/ai/kia/workspace-actions/contract.ts`)

| Acción | Cliente | Admin/soporte | Aprobación | Estado |
| --- | --- | --- | --- | --- |
| Modificar teléfono/datos no críticos propios | Solo su perfil | Soporte autorizado | Confirmar en chat | Deshabilitado hasta completar adaptador |
| Crear tarea interna | No directamente (solicitud que escala) | Sí | Confirmar | Deshabilitado |
| Añadir nota interna a expediente | No | Sí | Confirmar | Deshabilitado |
| Responder desde Inbox 360 | No a terceros | Sí | Confirmación explícita de envío | Deshabilitado |
| Reprogramar cita propia | Sí, según titularidad | Soporte | Confirmación externa/calendario | Deshabilitado |
| Conectar cuenta OAuth | Consentimiento del titular | Preparar enlace, **no** autorizar por él | Titular autoriza | Deshabilitado |
| Emitir factura o modificar datos fiscales/contables | No | Admin con facultad profesional | Revisión profesional | Deshabilitado |

Las acciones fiscales, bancarias, destructivas, de pagos, de firma y envíos masivos no forman parte del MVP autónomo.

## Entregables por fase

**0. Contrato de acciones (este PR):** esquema, catálogo cerrado, riesgos, superficies, todos los flags apagados, pruebas. No migración de datos. 

**1. Primer flujo vertical:** desde KIA Admin se propone crear tarea interna o guardar nota sobre expediente; pantalla de revisión y confirmación, autorización backend, ejecución mediante dominio, respuesta auditada. Pruebas IDOR, CSRF, reintento, idempotencia y cambio concurrente. Solo después se activa el primer flag en piloto interno.

**2. Portal Cliente:** actualización autorizada de datos propios, documentos y servicios no sensibles, con scope empresa/persona. Impedir usar `companyId`/clientId del modelo como permiso y exigir validación servidor.

**3. Comunicación y agenda:** Inbox 360, respuestas con previa y envío confirmado, citas con comprobación de disponibilidad y consentimiento; takeover humano bloquea actuaciones automáticas.

**4. Integraciones y operaciones extendidas:** Holded/Stripe/Google únicamente mediante APIs existentes, acciones por tenant y grants; propuestas de operaciones contables antes de ejecución real; rollback y bitácora.

## Acceptance gates

- Respuesta KIA informa con precisión si **propuso**, **ejecutó** o **no pudo** actuar.
- Client A no lee/escribe en Client B; cambiar empresa invalida plan y conversación operativa.
- Admin soporte se identifica como Admin en registros y no modifica credenciales o sesión del cliente.
- Un plan no puede aprobarse si cambian inputs, versión de registro, actor, empresa o permisos.
- Doble clic, reintento y eventos repetidos no duplican tareas, citas, cobros o mensajes.
- Ningún email, firma, pago, factura, borrado, OAuth ni operación bancaria se ejecuta sin la aprobación concreta prevista.
- Logs correlacionan chat, inbox, acción y resultado; sin secretos.
- CI, regresión, RLS/Security Advisor, Vercel app/ksenia-expert y smoke por rol completos antes de cada fusión.

## Nota sobre tecnología

El proyecto utiliza actualmente su propio orquestador y proveedores; no imponer una migración prematura a AI SDK. La plataforma Vercel permite plantear agentes con llamadas a herramientas y flujos duraderos, pero verificar versiones/dependencias e implementación segura antes de adoptar un SDK. Las capacidades de ChatGPT Work no se transfieren automáticamente a KIA por usar un modelo OpenAI.
