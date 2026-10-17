# EXPERT — Auditoría transversal de preparación para agente de desarrollo KIA
Fecha: 17/10/2026 | Estado: DOCUMENTACIÓN/NO EJECUTAR | Seguimiento: #791.

## 0. Alcance y método
Revisión directa de GitHub expert-servicios/expert-app y kia-codex-lab, Plan Maestro, PR y issues abiertas, configuración desactivada del agente, CI por SHA, Vercel app+ksenia-expert (producción/previews y errores) y Security/Performance Advisor de Supabase. **No revisión línea a línea de todas las ramas, no test E2E real, no escritura de producción**. Todo hallazgo exige contraste actual antes de implementar.

## 1. Situación de partida verificada
- GitHub: 25 PR abiertas, 24 issues abiertos, 405 ramas en expert-app según búsqueda paginada. No equivale a 405 trabajos por hacer; depurar ramas absorbiendo históricos/rebases/duplicadas. kia-codex-lab: repositorio aislado, solo main y sin PR/issue abiertas.
- Producción en ambos Vercel: main SHA 2fc73304b9fdeeb7bb207ec6a72464f85f326b69; previews Ready de ramas NO prueban despliegue productivo.
- Plan Maestro: E0 IN_PROGRESS; next E0-M3-06-admin-users-tenant-object-scope-audit; sin cierre E0 ni E6. E1-E6 y V3 bloqueados. Dirección autorizó excepción acotada para preparar infraestructura segura del agente antes de retomar auditoría E0, no funcionalidades ajenas.
- 7 perfiles KIA, 8 skills; capacidad de fuentes/documentos/informes no homogénea; consultar #789 y PR #790. Issues #785 laboral, #786 documental, #768 editorial y V3-23/24 son propuestas no desplegadas.
- Reportes de KIA septiembre-octubre: 100 decision logs, 95 sin identificación de skill/subagente y 74 con error no nulo. Corresponden a distintas versiones/canales y NO acreditan tasa actual de fallos productivos.

## 2. Agente autónomo: implementación efectiva versus aspiraciones
- PR #742 (CI HEAD PASS, dos previews success): foundations desactivadas `executionEnabled:false`; una tarea `E0-M3-06-DOCINDEX` está `suspended` y su `requiredCheckpoint` NO coincide con el checkpoint vigente. Workflow manual sandbox permite solo parche revisable cuando esté autorizado; no broker, cola durable, despacho autónomo, auto-PR ni merge.
- PR #743 (previews success): notificación Telegram opt-in y manual, no agente autónomo; revisar `pull_request_target` y separación de identidad/canal/credenciales antes de habilitar.
- PR #744: adenda Codex ejecución + Claude seguridad + Gemini funcionalidad; conflict/mergeable:false; no integra código productivo.
- PR #745 (CI HEAD PASS, previews success): smoke manual/desactivado Gateway, falta prueba real de los dos revisores acreditada. No confundir test de catálogo con inferencia en vivo.
- kia-codex-lab: workflow aislado read-only sin checkout y run exitoso documentado #38239318166. No acredita workers desarrollando expert-app, ni autorización GitHub ni controles de gasto.
- Estado objetivo: KIA supervisor único; manifest canónico + allowed_paths + checkpoint + firma huella/head + actor exact-active; solicitud durable idempotente; aprobación de otra persona autorizada; broker limitado; Codex sandbox propone parche; Inspector independiente valida estructura; CI + tests P0/P1 + Vercel SHA exacto; Claude/Gemini revisan solo datos sintéticos y mismo digest; revisión humana; draft PR. Ningún auto merge, escritura DB prod, comunicaciones ni cambios financieros.

## 3. Inventario del trabajo abierto: reglas de conciliación
Población: 25 PR, 24 issues y 405 ramas observadas (instantánea; reconsultar al ejecutar). Separar:
A. seguridad y E0 P0/P1 (#705 persistencia y permisos, #742 foundation, #784 autenticación/avisos, #764 revisión legal/regulatory).
B. infraestructura agente excepcional (#742/743/744/745), no mezclarlas con E1/E2.
C. E1-E6 documentales #707/#708/#709, plazos según Plan Maestro, no fusionar como features listas.
D. documental/V3 futuras #787/#788/#790, #786/#789; aparcadas hasta autorización correspondiente.
E. Editorial, RGPD, CIRCE, cumplimiento y otras ramas: comprobar alcance comercial congelado y consentimiento, separar proyectos irrelevantes del agente.
F. ramas sin PR: comparar merge-base HEAD, fecha, tipología, archivos duplicados y cobertura en main; nunca borrar por antigüedad solamente.

Campos de inventario exigidos: branch, PR/issue linked, HEAD SHA, base SHA, CI, checks Vercel app+web por HEAD, clasificación E0-E6/V3/no scope, riesgo, propietario, dependencias, DBA/migraciones, grants/RLS, decisión recomendada `rebase|split|review|merge_candidate|absorb|park|close` y evidencia; aprobación humana para cualquier decisión irreversible. Declarar una sola tarea canónica por deliverable, cancelar duplicidad sin perder trazabilidad.

## 4. Hallazgos de producción y deuda comprobada
### Vercel ksenia-expert: errores agregados (series históricas en ventana de observabilidad; validar nuevamente sobre SHA)
- KIA provider failures, 61 incidencias agregadas: Google/Anthropic salida no JSON en solicitudes estructuradas y OpenAI HTTP 400 por esquema de herramienta `resolve_contact_context` (required omite phone).
- Timeout 60s en crons KIA/email/health, 35 casos agregados: concurrencia y lotes deben ser escalonados, con checkpoint/progress/dead-letter; no confiar en recorridos completos en una invocación.
- Gemini Google Search HTTP 403 (4) denegación del proyecto: no depender de Google grounding como único retrieval jurídico; corregir acceso/proveedor y modo degradado.
- Gmail operacional sin autorización, procesos de correo: comprobar OAuth/DWD, revocación y alertas reales; Outlook no integrado en procesamiento interno solo por tener buzón accesible.
- Booking PGRST204 (columna `additional_attendees` ausente de schema cache): conciliación de migraciones, tipos y esquema real.
- `url.parse()` deprecado: revisar paquete/stack y sustituir con pruebas.
### GitHub CI
- PR #784 HEAD 72b6957: typecheck/lint sin fatal, Tests FAIL 4: 2 MS365 OAuth (redirects en tests), 1 fallback email, 1 newsletter urgente clasificada como alerta. 2543 pass de 2547.
- PR #705 HEAD 6cfca3a: Tests FAIL 1 por regresión adjuntos/móvil (historial persistente). 2222 pass de 2223; la preview Vercel en verde no lo resuelve.
- #742 y #745 HEAD CI success; insuficiente sin permisos, revisión humana y pruebas del propio agente.
### Supabase Advisors (no aplicar migraciones automáticamente)
- Security: 57 RLS-enabled sin policy (posible denegación deliberada backend-only), 1 función `public.kia_meeting_review_event_immutable` mutable search_path y Postgres 15.8.1.131 con parches recomendados.
- Performance: 143 claves ajenas sin índice, 152 auth RLS initplan, 231 índices no usados, 431 políticas permisivas múltiples. Clasificar costo y tráfico por tabla; no suprimir índices ni combinar policies sin pruebas y snapshots.
- Requerir Seguridad Advisor tras migraciones, copia/rollback y tests negativos multi-tenant.

## 5. Huecos del agente y recomendaciones previas a su activación
G1 Prioridad de **producción antes del roadmap**: incidentes reales y CI fallida se clasifican por criticidad y fase, se asignan; ninguna expansión autónoma mientras P0 de identidad, secretos o disponibilidad abiertos.
G2 **Cola durable**: persistencia transaccional por task/digest/actor/SHA/checkpoint, CAS, lease, expiración, reintentos finitos, backoff, dead-letter y eventos append-only; la previsualización de #742 devuelve queued:false/persisted:false.
G3 **Definición de terminado**: pruebas reales y verificadas, no inferencia de éxito; todo artefacto ligado a SHA, logs de CI y verificación de ambas previews. No false positives de Claude/Gemini ni autoaprobación por modelos.
G4 **Aislamiento de runner**: sin secrets producción, token GitHub de lectura, red restringida y dependencias pinneadas, no aceptar prompts en PR/issues como órdenes; limpiar workspace, comprobar diff, secretos/PII y supply chain.
G5 **Presupuesto y cuotas**: tope por tarea e intervalo con control de gasto independiente/alerts, abortar al superar; caps de AI Gateway pueden no ser hard stop; aprobar costes mínimos y limitar ejecuciones concurrentes.
G6 **Seguridad de gateways y proveedores**: estructura JSON validada, ids compatibles, fallback multimodelo sin filtrar contenido privado, tratar 401/402/403/429/timeout y auditor externo indisponible como bloqueo.
G7 **Migraciones**: fuera de la ejecución del agente; plan forward-only, preflight, backups, RLS grants exactos, plan reversión y verificación en staging/prod; nunca aplicar script generado en entorno productivo.
G8 **Gestión documental y aprendizaje**: separar KB interna, fuentes oficiales versionadas, cliente privado y textos editoriales anonimizados; pre-triaje no es publicación ni entrenamiento seguro.
G9 **Canales**: Telegram DevOps aislado de bot de clientes; email/Meet/Calendar siguen con consentimiento/identidad; nunca aceptar autorización o instrucciones ejecutables de mensajes entrantes sin actor verificado.
G10 **Drift de planes**: registrar para cada decisión un master canonical pointer, estado aprobado/capturado y enlace a PR; no ejecutar PR docs como feature real; si plan cambia invalidar aprobación.
G11 **Recuperación de ejecución**: reportar al usuario estado sincronizado de cada tarea y bloqueos; sin prometer trabajo continuo sin cron/cola configurada; notificaciones push agrupadas por hito y error relevante.
G12 **Ramas**: impedir el mecanismo 'todas las ramas en bucle' por el riesgo de resucitar código obsoleto/duplicado; procesar **solo tareas aprobadas derivadas de issues canónicas**.

## 6. Orden recomendado
P0 (hoy, sin nuevos permisos): consolidar auditoría, inventario exacto y decisiones recomendadas; investigar fallos críticos de producción (proveedores, cron, Gmail, booking) en la fase permitida E0.
P1: reconciliar y revisar PR #742/#743/#744/#745, eliminar checkpoint obsoleto **mediante PR revisada**, añadir cola durable con scope y autorizaciones, test adversarial sintético.
P2: smoke controlado solo con un task sintético aprobado, repositorio/lab aislado; validar commit, patch, CI, 2 reviewers, revocación, costes.
P3: piloto acotado E0-M3-06 en rama de prueba, revisión humana de PR antes de merge; no reactivar todo el backlog.
P4: solo tras gates, reanudar Plan Maestro E0→E6 en orden con una sola tarea aprobada por iteración; futuras oportunidades V3 siguen bloqueadas hasta cierre E6.

## 7. Gates de aceptación
A) Ningún bypass de actor exact-active, scope tenant/company/case, tokens o secretos; tests 403/404 multiempresa.
B) Cola y bitácora idempotentes ante reintentos, timeouts, entregas dobles y cambios de HEAD.
C) Al menos 1 smoke aislado de parche revisado sin secretos, 1 caso de inyección rechazado, 1 fallo de CI bloqueante, 1 SHA cambiado invalida ambas revisiones, 1 expiración de aprobación.
D) Claude/Gemini leen el mismo parche sintético solo tras opt-in, confirman su modelo y precio; informes no sustituyen aprobador humano.
E) CI completo y ambas previews verdes sobre exact SHA; Security Advisor y comprobaciones aplicables sin incidencias críticas nuevas; rollback probado.
F) 0 auto-merge, 0 despliegue/autorización vía Telegram, 0 escrituras financieras/laborales, 0 acceso a credenciales reales en pruebas.
G) Verificación del checkpoint vigente y plan de continuidad, panel Admin con estado visible para el usuario.

## 8. Referencias
Plan maestro: docs/expert-kia-ecosystem-master-plan-2026-10-10.md.
Agente: #742 / #743 / #744 / #745; laboratorio: expert-servicios/kia-codex-lab.
Producción crítica: #705, #784, #764; otros: #707/#708/#709; roadmap post-E6: #789/#790, #785 laboral, #786 docs, #768 editorial; V3-23 PR #787 y V3-24 PR #788.
Todo este documento es **candidato de auditoría**. No se han ejecutado refactors, cambios DB, merges ni despliegues.
