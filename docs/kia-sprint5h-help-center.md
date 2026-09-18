# KIA Visual Copilot — Sprint 5H · Centro de ayuda

Fecha: 2026-09-17
Base: Sprint 5G / PR #284
Superficies: `/dashboard/kia-ayuda` y `/ayuda/kia`

## Objetivo

Cerrar el bloque "formularios guiados / centro de ayuda" del issue #192 manteniendo coherentes las capacidades que ve el usuario con las reglas que utiliza Kia Auditor.

## Hallazgo corregido

La ayuda autenticada contenía una afirmación ya desfasada: indicaba que Kia no podía ver estado de expedientes, documentos ni información de cuenta.

La arquitectura actual de KIA puede disponer, según autenticación, canal y permisos, de contexto autorizado de perfil, empresas, expedientes y documentación pendiente. El límite correcto no es "Kia nunca ve estos datos", sino "Kia no puede salir del ámbito autenticado y autorizado del usuario y de la empresa correspondiente".

## Cambios

- se añade `KiaGuidanceCard` en estado `explicacion` a ambos centros de ayuda;
- se actualiza la ayuda autenticada para reflejar contexto autorizado y company scoping;
- se actualiza la ayuda pública con la misma distinción entre conversación pública y Espacio Cliente autenticado;
- se elimina la promesa genérica de clasificación documental automática;
- se refuerza que una operación no está completada hasta que el sistema autoritativo lo confirme;
- se eliminan afirmaciones innecesarias sobre proveedores externos como fuente de la política;
- se sincroniza `kia-auditor-public-guidelines.ts` con la política visible al usuario.

## Seguridad

La documentación mantiene explícitamente:

- no secretos, API keys, contraseñas, tokens, 2FA ni datos bancarios completos por conversación;
- no acceso fuera de autenticación/permisos/company scoping;
- no presentación fiscal, pago o trámite afirmado sin confirmación autoritativa;
- no operación sensible fuera de permisos y validaciones;
- revisión profesional cuando la materia lo requiere.

## Arquitectura visual

El centro de ayuda es una superficie explicativa conocida, por lo que usa directamente el estado canónico `explicacion`. No necesita una llamada al LLM ni un resolver de negocio adicional.

## Validación

Los tests comprueban que:

- no reaparezca la afirmación obsoleta sobre expedientes/documentos;
- ambas ayudas expresen límites de autenticación y empresa;
- la política visible y `KIA_PUBLIC_GUIDELINES_*` se mantengan alineadas;
- ninguna página de ayuda invoque `/api/ai/kia` ni `runKiaDecision`.

Antes de integrar: TypeScript, lint, tests, ambos previews Vercel y smoke visual autenticado cuando aplique.
