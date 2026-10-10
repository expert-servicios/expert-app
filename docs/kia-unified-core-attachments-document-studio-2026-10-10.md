# KIA — Núcleo único, adjuntos y estudio documental
**Decisión de producto:** 10/10/2026 · **Estado:** diseño aprobado conceptualmente / ejecución pendiente de gates.  
**Ampliación 10/10/2026:** [proveedores de IA, subagentes y artefactos](kia-ai-providers-artifacts-subagents-audit-2026-10-10.md).  
**Referencias canónicas:** [KIA 2.0](kia-2-strategy.md), [Admin/Cliente v2](expert-admin-v2-plan-maestro-2026-10-09.md), [Google Workspace roadmap](google-workspace-api-roadmap.md).

## 1. Decisión vinculante
KIA tiene **un solo cerebro/orquestador** y una única cadena de conocimiento, identidad, recuperación regulatoria, selección de modelos, subagentes, herramientas, evaluación, redacción y auditoría. Las superficies son **adaptadores**: chat web anónimo, cliente autenticado (Copilot), Admin Copilot, Admin KIA workspace, Telegram y futuras interfaces. Evitar mantener dos prompts y dos políticas regulatorias divergentes; conservar diferencias de experiencia/UX y permisos únicamente.

No confundir «mismo cerebro» con «mismo permiso»: TODA decisión/tool/file/export se vuelve a autorizar server-side en cada invocación según actor, empresa, expediente, origen y alcance. Lo enviado por navegador y los adjuntos son no confiables. No permitir que el canal público acceda a datos personales, expedientes, Holded, correos, escritura o generación a partir de datos privados de terceros.

## 2. Auditoría de partida comprobada en main
- `components/site/KiaPublicWidget.tsx` + `app/api/ai/kia/public/route.ts`: usa `runKiaProviderRequest` y prompt simplificado. Solo `attachment?: {fileName,mimeType,analysis}`; un archivo en estado React y en `FormData`.
- `lib/ai/kia/kia-attachment.ts`: MIME PDF, PNG, JPEG, WEBP, TXT, CSV y 8 MiB; extractor Gemini de resumen de archivo. El upload público analiza sin guardarlo en el expediente. No admitir DOCX/XLSX/PPTX ni varios adjuntos todavía.
- `components/KiaCopilotWidget.tsx` y `app/(protected)/admin/kia/AdminKiaCopilotWorkspace.tsx`: sin input de adjuntos; `app/api/ai/kia/route.ts` valida entrada sin archivos. Sí hay voz. La consulta a documentos existentes por herramientas no equivale a adjuntar desde chat.
- `lib/ai/kia/kia-tool-registry.ts`, `kia-policy-profiles.ts` y `kia-tool-executor.ts`: modelo de capacidades/R0–R5 y autorización real para Copilot. El chat público aún no usa el mismo orquestador.
- `generate_company_report` YA genera un informe empresa autorizado con enlace. Sus exportadores existentes son `/api/reports/[id]/word` (DOCX), `/excel` (XLSX), `/pdf` (PDF), protegidos por `canAccessFinancialReport`. NO son una fábrica general de documentos ni hay generador PPTX general.

## 3. Arquitectura objetivo (sin duplicar motores)
```text
Adaptadores Web pública / Cliente / Admin / Telegram
  -> ChannelContext (identity, session, locale, verified provenance)
  -> KIA Unified Gateway
      -> AuthorizedContextResolver (company/case/lead, feature flags, grants)
      -> Central Orchestrator (knowledge, regulation, models, specialists, safety)
      -> Policy Engine (per-tool, per-data-scope, per-action, R0..R5)
      -> Tools (case, calendar, Holded, document ingestion, Document Studio)
  -> Common presentation schema (text formatted, citations, actions, artifacts,
      attachments with states, generated documents, audio)
  -> Channel presentation adapters with small UX differences
```
Mantener un API canónico interno que **no acepte rol, tenant ni autorización declarados por el cliente**. En la web pública, resolver únicamente contexto anónimo y recursos oficiales/públicos. Evitar unificar rutas saltándose auth. Presentación ES/RU según preferencia y lenguaje del último mensaje; normalización tipográfica accesible; mismos criterios de evaluación.

## 4. Adjuntos unificados: ingestión, límites y seguridad
- Tipo: `KiaInputArtifactRef` con `artifactId`, tenant/actor o sesión anónima verificada, `sha256`, mime validado, extensión, nombre visible saneado, tamaño, idioma detectado, estado (`pending/scanning/parsed/failed/expired`), expiración, procedencia. Nunca confiar en MIME o nombre del navegador: verificar magic bytes/tipo real y rechazar archivos cifrados/ejecutables, ZIP bombs y macros. No transmitir enlaces arbitrarios al modelo.
- Selector múltiple, quitar un archivo individualmente, carga paralela con límite/concurrencia, progreso y reintentos por archivo; mensaje no se envía si adjuntos esenciales fallan. Orden y referencia estables entre preparación, envío y recuperación. Limitar tokens y gastos; resumir con señal de truncado/páginas/hojas excluidas.
- Formatos P0 a soportar por **parser seguro y verificable**: PDF (texto + escaneado bajo política), PNG/JPEG/WEBP, TXT/CSV, DOCX, XLSX; P1 PPTX, ODT/ODS si demanda. Los `.doc`/`.xls` legacy sólo con convertidor aislado explícitamente aprobado, no como soporte implícito. Nada de macros VBA. Textos ES/RU y detección de otros idiomas sin confundir idioma de documento con el solicitado para la respuesta.
- **Límites objetivo iniciales a validar, no disponibles hoy:** público hasta 5 archivos/turno y 8 MiB cada uno, cuota total de 20 MiB; cliente/Admin hasta 10 archivos/turno con límites según plan, duración, coste y políticas de privacidad. Ajustar según pruebas; límites configurados y aplicados SERVER-SIDE.
- Público: fichero temporal, sin asociación a cliente por el nombre/email, sin persistencia larga; avisos de privacidad claros, TTL y supresión verificable; no registrar contenido en logs. El resultado de análisis no se aceptará como «archivo verificado» sin recibo de ingestión firmado/validado por backend.
- Autenticado: Storage privado y metadatos por actor/empresa/expediente con RLS y autorización server-side. Descargar sólo mediante endpoint autorizado o URL temporal; no usar URLs firmadas como referencias permanentes. Vigilar el lifecycle (retención, borrado y derechos RGPD) y trazabilidad de quién subió/leyó/exportó/compartió.
- Aislamiento y prompt injection: archivos son pruebas no confiables; prohibido seguir instrucciones embebidas para enviar emails, ejecutar herramientas, cambiar permisos o copiar secretos. Deduplicación usa huella de **todos** los inputs relevantes; no incluir ficheros completos ni PII sin tratamiento en logs.
- La nueva funcionalidad no debe mezclar/activar las migraciones todavía abiertas de PR #705; resolver previamente sus hallazgos P1 de sensibilidad, identidad de turno, lease y same-origin.

## 5. Document Studio: creación multi-formato
**Objetivo:** la misma KIA podrá redactar desde la conversación, enseñar una previsualización y entregar ficheros descargables sin que el usuario abra Word/Excel. **Separar**:
1. `DocumentIntent`: tipo (carta, guía, solicitud, contrato borrador, análisis, presupuesto, informe, tabla, presentación), destinatario, idioma, plantilla, entradas y fuentes autorizadas;
2. `DocumentDraft`: contenido estructurado tipado (bloques/tablas/celdas/secciones/diapositivas), pruebas de consistencia, origen de datos, avisos sobre información pendiente;
3. `DocumentRender`: `docx`, `xlsx`, `pdf` como P0; `pptx` P1; `txt`/`csv` como exportadores simples. Nunca afirmar que se puede generar un formato hasta tener renderizador + pruebas;
4. `DocumentArtifact`: original estructurado para editar y versionar, archivo renderizado, checksum, tipo, propietario, empresa/expediente, trazabilidad, TTL, estado borrador/aprobado y URL de descarga autorizada.
- Reutilizar librerías y endpoints existentes de informes (DOCX, XLSX, PDF) sin reutilizar acceso de una empresa en otra ni mezclar informe financiero con plantilla de carta. Crear contrato/plantillas comunes antes de exponer herramienta genérica.
- Word: estilos corporativos, títulos, párrafos, listas, tablas, cabeceras, anexos ES/RU, plantillas y revisión previa. Excel: formatos locales españoles (coma decimal), fórmulas deterministas permitidas, hoja de premisas, comprobaciones de conciliación, protección de inyección de fórmulas y referencias erróneas. PDF: convertir renderizado aprobado o renderizador directo verificando fuentes, paginación y fidelidad. PPTX: tema corporativo, diapositivas, diagramas y notas; habilitar después de validar portabilidad y diseño.
- Acción `create_document_draft` clasificada como `draft` por motor de política; generar borrador no equivale a enviar/publicar/presentar/archivar o firmar. `approve_document`, `send_document`, `file_document` y `sign_document` separados con confirmación, permisos y auditoría. En chat público sólo documentos genéricos sin contexto privado, límites de coste y no firma.
- Para documentos fiscales, laborales, mercantiles o jurídicos: citas a fuentes oficiales y fecha, advertencia de revisión profesional cuando proceda, NO inventar datos/leyes/firmas, casillas marcadas cuando falten datos; nunca presentar borradores como documentos oficiales emitidos.
- Un modelo no debe generar binarios arbitrarios ni ejecutar macros/código suministrado por usuarios: renderizadores deterministas construyen el archivo desde estructuras validadas.

## 5A. Artifact Studio y especialistas — ampliación confirmada el 10/10/2026

**Documento técnico de investigación y backlog:** [Auditoría de OpenAI, Anthropic, Gemini, subagentes y artefactos](kia-ai-providers-artifacts-subagents-audit-2026-10-10.md).

### Artefactos (además de archivos Office)
Incorporar **una única API interna de artefactos** reutilizable por web público, Copilot cliente, Admin y Telegram: documento DOCX/PDF, Excel/CSV, PPTX, tabla, gráfico, dashboard, infografía, diagrama, cronología, calculadora con reglas deterministas, formulario/checklist y código *solo previsualizado en sandbox*. Separar KiaArtifactSpec (spec validada), KiaArtifactEntity (propietario, empresa/expediente, versionado, fuentes, hash, coste, retención) y renderers/exportadores/adaptadores por canal.

Ya existen KiaCopilotArtifact (report/table/link/image) y exportadores de informes; evolucionar **sin romper esos cuatro tipos**. Los componentes interactivos se crean desde una DSL validada y componentes permitidos, **no** ejecutando JS/HTML arbitrario del modelo en la web de EXPERT. Telegram entrega archivos/fotos y enlaces o Mini App segura para interacción; su integración en main todavía requiere una acción sendDocument y controles de autorización.

### Subagentes: conservar, no duplicar
La revisión de kia-sub-agent-router.ts, kia-skill-registry.ts, kia-orchestrator.ts y kia-skill-execution.ts confirma perfiles assistant, fiscal, immigration, holded, accounting, labor, case, con ocho skills habilitadas en el **registro de código** y trazabilidad. No confundir perfiles/prompt con agentes autónomos ejecutándose en paralelo. Conservar estos módulos como el núcleo y mejorar:

- **Nivel normal:** selección de un especialista y herramientas para la tarea; sin crear procesos independientes.
- **Handoff acotado:** un especialista como tool con entradas mínimas y salida estructurada cuando mejora la resolución.
- **Paralelo excepcional:** hasta dos especialistas para tareas de análisis independientes; coordinador KIA consolida, presupuesto/timeout/consentimiento fijados.
- **Operaciones duraderas:** únicamente con cola real, reintento/idempotencia, autorizaciones y auditoría; nunca prometer ejecución continua sin infraestructura.

Añadir al registro de skills, **sin abrir agentes autónomos por defecto**, investigación normativa/fuentes oficiales, Document/Artifact Studio, Growth (comercial/marketing), QA de cálculos/citas y asistencia omnicanal. Mantener especialización fiscal, extranjería, laboral, contabilidad y Holded existente.

### Proveedores y novedades API verificadas
- **OpenAI:** Agents SDK (handoffs, guardrails, tracing), Agents API (subagentes/sandboxes/archivos publicados), Responses API web_search/file_search y Code Interpreter. Comparar antes de adoptar un runtime gestionado.
- **Anthropic:** Managed Agents multiagent beta, memoria gestionada beta, Agent Skills oficiales DOCX/XLSX/PDF/PPTX por API con code execution y Files API, prompt caching. Claude Artifacts de claude.ai no es un renderer embebible directamente.
- **Google:** ADK coordinador y grafos/flujos secuenciales/paralelos, Gemini function calling, búsqueda con citas Google Search, Code Execution y caching. Gemini Canvas tampoco es API embebible.
- **No acoplar el contrato KIA a un proveedor**: evaluar latencia/calidad/ES-RU/coste/privacidad, usar renderers y fuente de verdad propios y habilitar mediante capability detection y feature flags.

### Nuevos gates
Exigir pruebas de artefactos por formato y permisos, citación verificable y fecha normativa, aislamiento multi-tenant, inyección por documento, importación/exportación Office, preview sandbox, no exposición de credenciales, límites de tokens/tiempo/costes y Telegram end-to-end. No publicar un formato/capacidad sin prueba real. Mantener desactivados despliegues multiagente generalizados hasta superar comparativa sobre casos reales anonimizados.

---

## 6. Orden de ejecución / gates
**Bloque de higiene en curso (NO saltar):**
0. Cerrar PR #683 de reservas si CI/review/Vercel verdes; auditar y corregir PR #705 P1/P2 y su esquema, sin activar producción ni migraciones prematuras.

**Fase A — unificación funcional (sin romper clientes existentes):**
1. Caracterizar decisiones iguales (mismo mensaje y fuente pública) entre público/Copilot/Admin, incl. fuentes fiscales en ES/RU.
2. Extraer prompt/regulatory resolver/model selection/presentation a módulos compartidos y añadir perfil `anonymous_public` con auth de denegación por defecto; mantener rutas adapter de compatibilidad.
3. Pruebas de no filtración entre usuarios, tenants, sesiones y canales; pruebas de igualdad de respuesta y diferencias de permisos. Flags independientes para rollout/rollback.

**Fase B — carga múltiple común:**
4. Contrato `KiaInputArtifactRef[]`, validador MIME+firma, carga multifichero, parsers P0 y resumidor con límites. Integrar primero Copilot sandbox, luego público con retención efímera. Reintentos correctos y no pérdida de adjuntos tras reload.
5. Smoke tests reales por formato (incl. fichero ruso/cirílico, varios documentos, hoja con fórmulas, PDF escaneado, documento malicioso, expiración, fallos Gemini), móviles Android/iOS y seguridad. No declarar formato soportado sólo porque aparece en `accept`.

**Fase C — documentos generados:**
6. Hacer visibles y utilizables los exports Word/Excel/PDF de informes existentes cuando el actor tenga autorización. Confirmar que el enlace a informe expone la barra de exportación y no filtra IDs privados.
7. Crear `DocumentIntent`/`Draft`/`Render` compartidos; plantillas piloto **carta Word**, **presupuesto Excel** y **guía PDF**, con descargas y revisión previa; las herramientas no crean expedientes ni envían documentos sin consentimiento.
8. Añadir PPTX de propuestas/reuniones, versionado, plantillas, exportación PDF; integrar Google Slides API como **opción** de edición externa, no dependencia central.
8A. Implementar Artifact Studio tipado con previsualización segura de tablas, gráficos, dashboards, simuladores y formularios; adaptadores web/Telegram, sin HTML/JS arbitrario.
9. Instrumentar métricas de éxito de descarga, errores, costes, tiempo, correcciones, satisfacción, uso de modelos y privacidad. Revisión humana antes de puesta en producción de plantillas jurídicas/fiscales.

## 7. Criterios de aceptación
- Mismo core y conocimiento en todos los canales: mismos hechos oficiales, distinto acceso según perfil.
- Visitante no puede leer/crear artefactos privados ni vincularse por coincidencia de email; cliente no puede ver empresa ajena; Admin soporte se registra como actor real.
- 5 adjuntos variados se procesan por separado y conjuntamente en entorno de prueba; errores identifican archivo, sin perder los demás; el proveedor ve sólo el resumen autorizado y las citas de procedencia.
- Para el usuario autorizado, carta DOCX, Excel de presupuesto y PDF de guía son documentos reales, legibles, descargables, auditados y reutilizables. Presentación PPTX debe pasar QA antes de marcar disponible.
- Exportación no implica publicación ni efecto jurídico. Envío/firma/registro requieren acción y aprobación independientes.
- Check obligatorio: typecheck, lint, tests por perfil y parser, ficheros maliciosos, CI, Vercel ambos proyectos, revisión seguridad, políticas Storage/RLS, pruebas de rollback, smoke mobile, no rotura en rutas previas.
- No afirmar «activo en producción» hasta disponer de evidencia de estos gates.

## 8. Estado de este documento
Esta es una **especificación de implementación**, no activación de nuevas herramientas ni habilitación de subida múltiple o conversión general. Los informes de empresa DOCX/XLSX/PDF son el único caso de generación multi-formato verificado actualmente. Mantener esta distinción visible en UI, comunicaciones y hoja registral.
