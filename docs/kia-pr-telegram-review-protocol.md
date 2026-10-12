# EXPERT KIA — protocolo de revisión de PR y aviso privado por Telegram

Estado: preparado en una PR independiente; no activo en main hasta fusión y activación manual. No activa el agente de desarrollo.

## Identidades y responsabilidades

- Cuenta autora habitual de PR: **expertestudiospro**.
- Cuenta de validación funcional y de negocio: **kiabusiness2025**, con permiso WRITE en expert-servicios/expert-app verificado el 2026-10-12.
- Ambas cuentas pueden pertenecer a la misma persona. Por ello, la aprobación desde kiabusiness2025 **no satisface** la regla interna de revisión humana independiente.
- Para una revisión independiente se requiere una segunda persona real, con acceso y permisos válidos, que inspeccione el diff y sus riesgos.
- Telegram sirve exclusivamente para **notificar** y enlazar a GitHub. Pulsar, responder o escribir "apruebo" en Telegram no registra una aprobación GitHub ni habilita merge.

## Control de fusión

1. Abrir inicialmente la PR como draft. Identificar autor, alcance, riesgos, commit HEAD y checks.
2. Completar CI y comprobar las previews de Vercel app y ksenia-expert, todas sobre el HEAD exacto.
3. Marcar ready for review solo cuando los checks estén completos y sean correctos.
4. Solicitar validación funcional a kiabusiness2025 mediante GitHub y aviso Telegram privado.
5. Obtener aparte una revisión humana independiente. No se permite sustituirla con otra cuenta propia ni con un agente de IA.
6. Un responsable con permisos correspondientes decide si fusiona en una operación futura expresamente autorizada. No se habilitan merge, auto-merge, migrations, activación de agentes ni producción por este flujo.

## Automatización de aviso (desactivada por defecto)

Workflow: .github/workflows/kia-pr-review-telegram.yml

- Se dispara al pasar una PR a ready_for_review en main, solo con la variable de activación verdadera. Se admite reintento manual `workflow_dispatch` con modo `check_pr` y número de PR desde main.
- No usa checkout ni ejecuta código de la PR. En pull_request_target únicamente consulta API GitHub con permisos de lectura.
- Comprueba PR abierta, no draft, rama y repositorio confiables, HEAD exacto, cuatro jobs CI conocidos correctos y **ambos** estados Vercel correctos.
- Si falta alguna verificación, **no avisa**. En ese caso, ejecutar la comprobación manual cuando hayan acabado los jobs (no existe sondeo automático).
- Si ya consta APPROVED de kiabusiness2025 sobre el HEAD, no repite el aviso de validación funcional.
- Notificación de texto y enlace exclusivamente a un chat privado configurado. Sin botones de aprobación, ni credenciales visibles.
- No se añade cron, webhook público, GitHub write token, envío desde la app o despliegue de producción.
- Solo envía cuando la variable de repositorio KIA_PR_REVIEW_TELEGRAM_ENABLED es exactamente true (por defecto ausente o false).

## Configuración necesaria por el propietario, sin compartir secretos en conversaciones

En https://github.com/expert-servicios/expert-app/settings/secrets/actions :

- Crear secret KIA_PR_REVIEW_TELEGRAM_BOT_TOKEN con el token del bot exclusivo **@expert_devops_bot**, no del bot KIA de clientes ni del bot Radha.
- Crear secret KIA_PR_REVIEW_TELEGRAM_CHAT_ID con el ID del chat privado del administrador. Verificar primero que el bot puede enviar mensajes y que se trata del chat correcto; no usar grupos.
- En https://github.com/expert-servicios/expert-app/settings/variables/actions establecer KIA_PR_REVIEW_TELEGRAM_ENABLED=false hasta completar validación.
- Una vez el workflow esté en main, realizar una prueba aislada `workflow_dispatch` con modo `test_delivery`, desde `expertestudiospro` o `kiabusiness2025`; prueba la entrega sin necesitar PR elegible y sin activar la variable general. Cuando se reciba el mensaje correcto en el chat privado, activar la variable de avisos solo mediante autorización expresa. No activar otros workflows.
- Restringir acceso a secretos/variables y registrar quién realizó la activación; rotar credenciales si se sospecha exposición.
- Configurar en Settings > Branches / Rulesets la protección de main con los checks requeridos, al menos una aprobación de **otra persona** y bloqueo de merges sin revisión. Este workflow de avisos no impone la protección de rama por sí solo.

## Caso actual: PR #742

URL: https://github.com/expert-servicios/expert-app/pull/742

Autor: expertestudiospro. Sigue siendo una PR draft en la última comprobación 2026-10-12; no debe generar aviso hasta que sea ready, todos los checks pasen y el flujo esté configurado en main. Se mantiene sin fusión.

## Límites y seguimiento

El canal Telegram existente en EXPERT usa TELEGRAM_BOT_TOKEN y TELEGRAM_ADMIN_CHAT_ID en la app, pero los secretos de GitHub Actions son diferentes y **no** se copian de forma automática desde Vercel. Se necesitan acciones humanas en GitHub para conectar el bot sin revelar las credenciales a ChatGPT. Para este workflow no se necesita configurar el token en Vercel. Ninguna aprobación por Telegram implica permiso para crear PR, activar Codex, ejecutar SQL o desplegar a producción.

## Configuración confirmada (2026-10-12)

La administradora ha creado `@expert_devops_bot`. Se usa en exclusiva para supervisión de desarrollo. El bot EXPERT de atención al cliente conserva sus credenciales sin cambios. Las credenciales DevOps quedan sin configurar hasta introducirlas en GitHub Actions UI. El job de prueba manual de entrega está restringido a las identidades GitHub permitidas y no accede a PR ni ejecuta operaciones de escritura.
