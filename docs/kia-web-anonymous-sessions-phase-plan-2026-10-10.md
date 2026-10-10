# KIA Web: sesiones anónimas seguras — Fase de base

## Alcance de esta PR
- Funciones puras para emitir/verificar un identificador aleatorio de sesión con HMAC-SHA256, expiración y cookie HttpOnly.
- No se modifica la respuesta del chat web ni se crea ningún lead o usuario: **base técnica, no funcionalidad activa**.
- La firma exige un secreto independiente `KIA_PUBLIC_SESSION_SECRET` (32+ caracteres, server-side, nunca `NEXT_PUBLIC_`). Sin configuración la integración futura falla cerrado.
- El identificador identifica solamente una sesión de navegador, jamás a una persona.

## Siguiente PR (requiere revisión y migración)
1. Crear registro de sesión aislado en Supabase con token opaco identificado por hash, vencimiento, fecha de última actividad y política de retención. Proteger con RLS sin grants directos a visitantes.
2. Asociar mensajes a esa sesión en un canal web público propio. No modificar los permisos de `kia_conversations` existentes hasta migrar los CHECK de canal/origen y revisar la constraint de perfil/lead.
3. Exponer solo respuesta del propio turno; para recuperar historial se debe verificar token firmado y propiedad de la sesión. Probar session fixation, IDOR, expiración y dos visitantes concurrentes.
4. Ofrecer **identificación voluntaria** (formulario o login verificado). No crear lead con cada mensaje ni asociar conversaciones previas por email/teléfono/nombre.
5. Respetar reCAPTCHA, rate limit, modo humano y no registrar adjuntos íntegros en logs; evitar duplicados por idempotencia de mensaje.
6. Verificar consentimiento, aviso de privacidad, retención y borrado conforme a las políticas EXPERT.
7. Sólo después, habilitar el uso desde `app/api/ai/kia/public/route.ts` con feature flag, CI, pruebas de seguridad, ambas previews y verificación en producción.

## Auditoría de salida
- Pruebas unitarias de cookies: aleatoriedad, manipulación, expiración, secreto y HttpOnly.
- Typecheck, lint, build, suite completa, migraciones y previews.
- Prohibido fusionar a producción sin controles verdes.
