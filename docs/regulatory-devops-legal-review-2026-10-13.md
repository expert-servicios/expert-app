# Revisión jurídica por Expert DevOps Bot

Estado: **opt-in y desactivado por defecto**; no implica aprobación vía Telegram ni despliegue.

Bot único: `@expert_devops_bot` ya utilizado por el flujo de supervisión DevOps (PR #743, todavía independiente). Este flujo reutiliza las identidades de sus secretos, **no** el bot de clientes `@kia_expert_bot`.

## Operativa

1. KIA clasifica evidencia oficial y crea un cambio con huella, fechas y dependencias.
2. Si un cambio relevante requiere revisión humana, se notifica desde **Expert DevOps Bot** a un chat privado previamente verificado.
3. Telegram muestra el identificador, resumen, vigencia propuesta, fuente y enlace al panel `/admin/regulatory`. **No** admite botones de aprobar, ignorar ni fusionar.
4. La persona revisora inicia sesión como admin/owner, consulta texto oficial, publicación, fecha de vigencia, dependencias e impacto. Documenta evidencia y nota con el flujo `resolve_change`. El flujo existente de aplicación de valores es una decisión aparte.
5. La revisión de código sigue requiriendo GitHub CI, dos previews Vercel y un revisor humano independiente. La revisión jurídica no equivale a un permiso para hacer merge.

## Credenciales y activación

Configurar en Vercel, proyecto `app`, mediante interfaz segura y sin pegar tokens en chats:
- `KIA_PR_REVIEW_TELEGRAM_BOT_TOKEN`: token reservado del bot `@expert_devops_bot` (no `TELEGRAM_BOT_TOKEN`).
- `KIA_PR_REVIEW_TELEGRAM_CHAT_ID`: ID numérico del chat privado de administrador.
- `KIA_REGULATORY_DEVOPS_TELEGRAM_ENABLED=false` hasta comprobar entrega e identidad.

GitHub Actions mantiene **sus propios** secretos con los dos primeros nombres para la notificación de PR #743; no se heredan de Vercel. No reutilizar tokens con otras aplicaciones ni copiarlos a archivos o logs.

Para validar la integración: usar previsualización y pruebas sintéticas sin credenciales; después verificar `getMe` = `expert_devops_bot`, `getChat.type` = `private`, enviar prueba controlada y activar exclusivamente la bandera normativa en producción. Los errores de Telegram no deben alterar el estado de revisión ni producir falsa confirmación.

## Seguridad y trazabilidad

- Notificaciones solo de cambios relevantes marcados para revisión.
- Comprobaciones de bot y chat antes de enviar datos.
- Sin acceso de escritura a GitHub/Supabase desde la conversación Telegram.
- La alerta no incluye documentos de clientes ni secretos.
- Mensaje confirma explícitamente **NO aprobado**.
- Conservar nota y evidencia de resolución en `regulatory_changes`; seguir auditando cambios de estado y permisos del Admin.
- La cuenta `kiabusiness2025` no sustituye una segunda persona independiente para revisión de código aunque sea otra identidad GitHub de la misma propietaria.

## Pendientes

- Prevenir avisos duplicados mediante huella/registro persistente de entregas antes de activar en producción.
- Añadir una ficha específica de dictamen jurídico con estado, responsable, fecha y evidencias antes de permitir aplicación de valores; la resolución actual de Admin es el control provisional.
- Verificar despliegue y comportamiento end-to-end, sin fusionar esta rama antes de CI y revisión.
