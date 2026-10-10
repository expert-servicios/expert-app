# KIA EXPERT — Auditoría de subagentes y tecnologías AI 2026
**Fecha:** 10/10/2026 · **Alcance:** investigación/documentación, no implementación ni activación en producción.
**PR:** #707; documento dependiente del plan maestro: [KIA unificada, adjuntos y documentos](kia-unified-core-attachments-document-studio-2026-10-10.md).

## 1. Hallazgo: los subagentes ya existen en código

**NO duplicar el sistema ni descartarlo**. Hay tres piezas reutilizables:
1. lib/ai/kia/kia-sub-agent-router.ts: perfiles especializados que añaden instrucciones (systemPromptAddendum), maxTokensOverride y routing por skill/intent/tarea/canal.
2. lib/ai/kia/kia-skill-registry.ts: ocho habilidades versionadas y enabled:true en código; no implica activación o disponibilidad final en cada despliegue.
3. lib/ai/kia/kia-orchestrator.ts + kia-skill-execution.ts: clasificación, selección de especialista, intersección con herramientas/policy, fail-closed y traza. Existe migration 20261006110512_kia_subagent_observability.sql y tests de selección/observabilidad; no equivale a agentes con hilos concurrentes o permisos propios.

**Estado real por especialidad**

| Perfil de código | Registro/ámbito observado | Conservar y avanzar |
|---|---|---|
| assistant | operations.assistant: correo, calendario, tareas, evitar duplicados | Sí; convertir en especialista omnicanal con inbox/agenda y aprobaciones |
| fiscal | fiscal.viability | Sí; normas vivas, fuentes oficiales, cálculos verificables, revisión |
| immigration | immigration.advice | Sí; normativa y estrategia de extranjería, selección autorizada |
| holded | holded.readiness | Sí; integración/tokens/capacidades técnicas, no alteración contable |
| accounting | accounting.operations | Sí; controller fiscal-contable, facturas/conciliación/impagos en borrador |
| labor | labor.payroll_diagnostics | Sí; nómina/contrato/convenios y HR company-scoped |
| case | documents.case_review | Sí; expedientes, clasificación y checklists |
| — | operations.next_best_action (habilidad, sin perfil de agente específico) | Conservar como workflow transversal |

**Especialidades aún no configuradas como perfiles autónomos en el mapa**: marketing editorial, comercial/CRM, investigación de fuentes oficiales, Document Studio/Artifact Studio, coordinación de calidad. En fase piloto, hacerlas **skills + herramientas + flujos deterministas**, no necesariamente más procesos LLM independientes. Distinguir claramente habilidades para redactar de tools para ejecutar.

**Advertencia de diseño**: los perfiles actuales son principalmente selección de prompt/skills dentro del motor. No hay evidencia de subagentes autónomos separados en paralelo en el flujo principal. No inferir que KIA pública utiliza el mismo router; hoy depende de un handler simplificado separado. Corregir en unificación, no abrir una segunda arquitectura.

## 2. Investigación comparada de novedades oficiales (verificada 10/10/2026)

### OpenAI
- **Agents SDK**: orquestación con handoffs, agentes como herramientas, guardrails, revisión humana, tracing y MCP; apropiado cuando EXPERT desea administrar el ciclo/estado y herramientas.
- **Agents API**: harness gestionado con sesiones, subagentes paralelos, sandbox, archivos/artefactos; útil para tareas complejas asíncronas internas o de documentos. No sustituye sin más el router KIA actual; evaluar fase piloto separada, coste, beta/disponibilidad y residencia/datos.
- **Responses API**: File Search, web_search con anotaciones citadas; Code Interpreter para producir archivos/gráficos, outputs validados. El renderizado, ownership, accesos y persistencia de artefactos siguen siendo de EXPERT.
- **Decisión KIA**: no migrar todas las consultas al harness gestionado; comparar SDK code-first/Responses en tareas piloto con métricas, no por moda. Para normas fiscales, las citas requieren contraste con fuente oficial/fecha y enlaces visibles.

Fuentes:
- https://developers.openai.com/api/docs/guides/agents/sdk
- https://developers.openai.com/api/docs/guides/agents-api/overview
- https://developers.openai.com/api/docs/guides/agents-api/multi-agent
- https://developers.openai.com/api/docs/guides/agents-api/environments/files
- https://developers.openai.com/api/docs/guides/tools-code-interpreter
- https://developers.openai.com/api/docs/guides/tools-web-search
- https://developers.openai.com/api/docs/guides/tools-file-search

### Anthropic
- **Managed Agents (beta)**: agentes configurados y versionados con multiagent; hilos/contextos aislados, sandbox/credenciales compartidos (especial atención a delegación, scopes y data minimization).
- **Agent Skills**: habilidades predefinidas docx/xlsx/pdf/pptx y custom skills por API; code execution + Files API devuelve archivos. No equivale a insertar la interfaz Claude Artifacts en EXPERT.
- **Memory stores (beta)**: memoria persistente gestionada, pero la **hoja registral/Supabase es la fuente canónica de EXPERT**; no introducir memorias externas de datos de clientes sin evaluación de privacidad, retención y control de borrado.
- **Prompt caching**: optimización de prefijos estables, reglas y conocimientos públicos, sin cruzar tenants en cachés del producto. Datos sensibles no se mezclan para obtener ahorro.
- **Decisión KIA**: posible motor especializado de artefactos/Skills documentales y segunda opinión, nunca autoridad para escrituras privilegiadas sin política propia.

Fuentes:
- https://platform.claude.com/docs/es/managed-agents/agent-setup
- https://platform.claude.com/docs/es/managed-agents/multiagent-orchestration
- https://platform.claude.com/docs/es/managed-agents/memory
- https://platform.claude.com/docs/es/agents-and-tools/agent-skills/overview
- https://platform.claude.com/docs/es/agents-and-tools/agent-skills/quickstart
- https://platform.claude.com/docs/es/build-with-claude/prompt-caching

### Google Gemini / ADK
- **ADK workflows**: coordinador con sub-agentes, flujos secuenciales, paralelos o deterministas; ADK 2.0 permite grafos/dinámicos. Es un **candidato para comparar**, no dependencia obligatoria porque KIA ya tiene un router TS y policies.
- **Gemini API function calling**: herramientas con esquema y ejecución a cargo de backend, no autorización concedida por el modelo.
- **Gemini Google Search grounding**: resultados con URL citations; extracción normalizada hacia fuentes oficiales canónicas y registro de fecha.
- **Code Execution**: Python, procesamiento de imágenes/documentos y gráficas; no prometer una fábrica Office completa nativa.
- **Context caching**: ahorro de contenido público compartido frecuente; atención a diferencias Interactions API (implícito) frente a generateContent (caché explícita) y límites concretos.
- **Decisión KIA**: mantener Gemini como proveedor seleccionable para documentos, búsqueda/grounding y análisis; evaluar ADK solo si simplifica el mantenimiento y preserva policies, tracing y servicios TS.

Fuentes:
- https://adk.dev/workflows/patterns/
- https://github.com/google/adk-docs/blob/main/docs/workflows/index.md
- https://ai.google.dev/gemini-api/docs/function-calling
- https://ai.google.dev/gemini-api/docs/google-search/
- https://ai.google.dev/gemini-api/docs/code-execution
- https://ai.google.dev/gemini-api/docs/caching

## 2A. Restricciones verificadas y decisiones por proveedor (10/10/2026)

**Hallazgo relevante para privacidad europea:** la documentación oficial de OpenAI indica que **Agents API hoy solo admite residencia de datos en Estados Unidos y no es compatible con Zero Data Retention (ZDR)**. Los entornos autohospedados de Agents API no hacen elegible a esa API para ZDR. **No enviar expedientes reales, nóminas, datos fiscales, bancarios ni documentos identificables a Agents API gestionada mientras no se aprueben región, DPA, transferencias, retención, subencargados, autorización contractual y finalidad.** Evaluarla únicamente con datos sintéticos/desidentificados durante el piloto. Esto NO prueba que todas las demás APIs de OpenAI tengan las mismas condiciones; evaluar servicio por servicio.

**OpenAI Agents SDK** se ejecuta en la infraestructura propia del producto y permite conservar backend, autorización y persistencia de EXPERT. Es candidato para un *prototipo aislado* de handoffs/tracing sin cambiar de proveedor toda la plataforma; sigue sujeto a las condiciones de tratamiento de los modelos/API invocados. **Agents API artefactos**: ficheros de `openai_hosted` publicados desde `/workspace/outputs`; hay que descargarlos a EXPERT, verificar contenido/MIME y aplicar retención propia. Un entorno `self_hosted` no publica ficheros mediante esa API: se recuperan del almacenamiento administrado por el anfitrión.

**Anthropic Managed Agents** está etiquetado Beta; los especialistas ejecutan hilos separados, pero comparten *sandbox/filesystem y credenciales vault*, por lo que la separación de prompts no da aislamiento de secretos o clientes. Adoptar solo si scope de credenciales, ubicación del procesamiento, retención y logs cumplen la política EXPERT. Las Agent Skills prediseñadas Word, Excel, PDF y PowerPoint **sí** figuran en documentación de Claude API; deben invocarse con code execution e integrarse/descargarse los archivos, no asumirse como controles del entorno Claude.ai.

**Google ADK** dispone de flujos coordinator/dispatcher y agentes workflow en TypeScript; los grafos de ADK 2.0 actualmente están documentados para Python y Go, por lo que **no** proponer adopción inmediata de grafos ADK 2.0 TypeScript sin comprobar compatibilidad real. Gemini Code Execution ejecuta **Python**, no un motor Office nativo: admite análisis de archivos/gráficos según modelo. Su búsqueda con Google Search ofrece anotaciones de cita y genera coste por consulta según modelo y número de búsquedas; mostrar y verificar las referencias al responder sobre normativa española.

**Fuentes oficiales de estas restricciones:**
- OpenAI Agents API residencia, ZDR y entorno: https://developers.openai.com/api/docs/guides/agents-api/overview
- OpenAI ficheros/artefactos publicados: https://developers.openai.com/api/docs/guides/agents-api/environments/files
- OpenAI SDK y control backend: https://developers.openai.com/api/docs/guides/agents/sdk
- Anthropic Managed Agents multiagente: https://platform.claude.com/docs/en/managed-agents/multi-agent
- Anthropic Skills: https://platform.claude.com/docs/es/agents-and-tools/agent-skills/overview
- ADK workflow: https://adk.dev/agents/workflow-agents/ y https://adk.dev/workflows/patterns/
- Gemini Code Execution: https://ai.google.dev/gemini-api/docs/code-execution
- Gemini Google Search/citaciones: https://ai.google.dev/gemini-api/docs/google-search/

### Matriz de decisión para pruebas piloto

| Caso KIA | Primera ruta a probar | Por qué | Validaciones antes de producción |
|---|---|---|---|
| Consulta pública con BOE/AEAT | Core existente + retrieval oficial; Gemini grounding u OpenAI web_search como complemento | Factualidad y fuentes actuales | Citas con fecha y comparación oficial; coste por búsqueda |
| Borrador DOCX/XLSX/PDF cliente | Renderizador determinista EXPERT; Claude Skills en sandbox sintético como benchmark | Control documental; proveedor optativo | Fuentes, fórmula, estilos ES/RU, acceso tenant, retención |
| Revisión de 5 adjuntos | Core + ingestor independiente + verificador; especialistas como tools | Trazabilidad y mínima exposición de ficheros | Tipos/idiomas, reintentos, inyección, permisos y costes |
| Subagentes fiscal/laboral | Routing ya implementado + evaluator/handoff TS opcional | No duplicar sistemas | Casos difíciles, tiempo p95, mejora de precisión |
| Campaña comercial | skill Growth + CRM de borradores, sin envío automático | Consentimiento y autorización | Identidad, marketing_status, aprobación y auditoría |
| Proceso administrativo duradero | Workflow persistente EXPERT con jobs, no solo prompt de agente | Control de estados / aprobaciones / reintentos | Idempotencia y rollback; nunca simular una tarea background |

**Regla de cierre:** benchmark contra el orquestador actual antes de incorporar frameworks nuevos. Un modelo con más prestaciones no mejora por sí solo calidad, control y coste para KIA.

---

## 3. Artifact Studio común: plan ampliado

No confundir **artefacto** con adjunto ni con un texto de chat. KIA dispondrá de:
- **documentos**: Word, Excel, PDF, PPTX en fases, CSV y TXT;
- **visualizaciones**: tablas con filtros, gráficos interactivos, series contables, cronologías, diagramas, infografías, vistas de expedientes;
- **simuladores**: calculadoras fiscales/financieras con versión normativa, fecha y cálculo determinista verificable;
- **UI interactiva**: formularios guiados/checklists/borradores, con controles y acciones server-side autorizadas;
- **código**: contenido fuente explicable y exportable; solo ejecutable en sandbox aislado, nunca como JS arbitrario en el origen EXPERT.

Contrato canónico propuesto: KiaArtifactSpec(version, kind, title, locale, contentSpec, evidenceIds, authorizedActions, renderingOptions) -> validar Zod + policy -> KiaArtifactEntity(artifactId, actorId, tenantId, companyId/caseId, state, version, hash, provenance, model/provider, retention, storageRef) -> adaptador de salida.

**No permitir** que un modelo escriba HTML/JS libre ejecutable en el dominio EXPERT, consulte APIs con credenciales desde preview ni genere vínculos de descarga externos sin validación. Componentes interactivos internos construidos a partir de DSL allowlisted, cálculos deterministas y previews read-only. Para código sandbox: aislamiento de origen, CSP, no network por defecto, cuotas de CPU/memoria, sin acceso a secretos o datos de otros clientes.

**Ciclo**: crear borrador -> preview -> iterar versiones -> verificar estructura, fórmulas/cifras, idioma, fuentes y permisos -> aprobar cuando proceda -> exportar -> descargar por URL temporal autorizada -> compartir/enviar solo por acción separada. Conservar versiones y fuente de datos. Los avisos legales/tributarios son revisables por profesional y nunca “presentado oficialmente” por haber producido un PDF.

**Interfaces**:
- Web público: artefactos genéricos no privados; límites pequeños, TTL corto y cuota por IP/sesión. No vincular por email.
- Cliente: documentos e interactivos propios vinculables a empresa/expediente con permisos; sin acceso transversal.
- Admin/Copilot: artefactos operativos/empresariales con actor de soporte real, roles y aprobación para efectos externos.
- Telegram: foto/archivo real por Bot API (sendDocument, sendPhoto), tarjeta como texto/enlaces seguros, botones, Mini App HTTPS con auth explícita para interactivos; no incorporar código no confiable a mensajes. Estado actual del repo: lib/integrations/telegram.ts tiene sendMessage y sendPhoto, **NO** sendDocument general. El enlace a visualización privada no debe ser una URL pública reutilizable.

Código que ya sirve de base: lib/ai/kia/kia-copilot-artifacts.ts define los tipos report/table/link/image; components/KiaCopilotWidget.tsx los muestra; app/api/reports/[id]/word, /excel y /pdf generan formatos ya verificables para informes.

**Proveedor**: la selección Claude/OpenAI/Gemini se hace *por capacidad real/latencia/coste/idioma/seguridad*, no por nombre. Ningún retorno de API es el registro canónico del artefacto: validar MIME/bytes/estructura con renderizador propio, subir a almacenamiento autorizado, generar hash/auditoría, exponer a canales con política. Descarga de artefactos desde contenedor externo antes de caducidad cuando se use proveedor gestionado.

## 4. ¿Cuándo separar subagentes reales?

**Nivel 0 (estándar):** un solo motor con perfil seleccionado y herramientas. Recomendado para preguntas simples; minimiza latencia y coste.

**Nivel 1 (especialista como herramienta):** invocar un subagente con contexto mínimo para una misión concreta, resultado estructurado y sin acciones externas. Ej.: fiscal revisa tratamiento IVA y laboral analiza convenio, KIA responde de forma conjunta. Especialista no hereda token administrador/tenant global.

**Nivel 2 (paralelo con coordinador):** solo misiones independientes justificadas (p. ej. investigación normativa oficial + análisis documental, comparación de 5 facturas + verificación de registros). Máximo 2 especialistas en MVP; presupuesto tokens/tiempo/coste y política de cancelación.

**Nivel 3 (agentes durables):** inbox/agenda, alertas, reconciliaciones, generación de documentos largos o campañas; cola persistente, jobs idempotentes, resume/retry, approval gates y notificación a usuario solo por cambios relevantes. No ejecutar “en background” fuera de un job/trigger realmente configurado.

Señales para promoción: complejidad > umbral, errores por contexto insuficiente, necesidad verificable de aislamiento/contexto, acciones por etapas, mejora demostrada en evals. No convertir a agentes autónomos marketing/contabilidad solo porque hay prompt especializado.

## 5. Backlog priorizado, con ownership

| Orden | Entregable | Dueño de trabajo | Gate |
|---|---|---|---|
| P0 | Cerrar #683 y reparar P1/P2 #705 | CI/Seguridad | No fusionar rojo, no migración sin ledger |
| P0 | Consolidar un KIA core para público y Copilot con permisos distintos | KIA Core | Igualdad conocimiento + no filtración |
| P0 | Registrar tareas/subagentes/skills reales y pruebas de selección observables | KIA Orchestrator | Routing/flags/trace correctos |
| P1 | Artifact DSL tipado y preview read-only de tablas/gráficos y documentos existentes | Artifact Studio | No JS externo, no tenant leaks |
| P1 | Carga múltiple con parser seguro y memoria de idempotencia | Document Ingestion | Trazabilidad, malware, formatos ES/RU |
| P1 | Exportación Word/Excel/PDF genérica desde plantillas estructuradas | Document Studio | QA visual, fórmulas deterministas y auth |
| P1 | Especialista fuentes oficiales y verificador de citas | Regulatory | URL/fecha/artículo/caducidad probados |
| P2 | Especialista comercial/marketing y CRM de borradores | Growth Ops | Consentimiento marketing y aprobación |
| P2 | Handoffs/parallel low-risk con un proveedor piloto | Orchestrator | Evals comparativas y coste |
| P2 | Adaptadores Telegram sendDocument/Mini App | Channel | Verificar identidad/enlace privado |
| P3 | Agent API/Managed Agents/ADK administrados | Arquitectura | Solo tras prueba A/B vs orquestador propio y evaluación RGPD |

### Protocolo de evaluación técnica
Crear un benchmark de al menos 30 casos anonimizados (10 ES, 10 RU, 10 documentos/multiformato), incluidos: preguntas fiscales dependientes de fecha; dos empresas de un mismo usuario; usuario público pidiendo datos privados; 3 adjuntos cruzados; simulación de IVA/IRPF; PDF/DOCX/XLSX; consulta multispecialista; fallo de proveedor; prueba de inyección por documento y link; reintentos de turno. Comparar modelo, coste, tokens, tiempo p50/p95, tasa de alucinación/cita errónea, estructura de artefactos, permisos y necesidad de revisión profesional. A/B con feature flags y rollback; no pasar a producción si cualquiera de los casos de privacidad falla.

### Cautelas de proveedores
- **API/producto** son capas distintas: Claude Artifacts en Claude.ai y Gemini Canvas no se embeben como APIs en EXPERT.
- Servicios beta (Managed Agents, Agents API, ADK 2.0 según versión) requieren verificar availability, límites, pricing, residencia/región, tratamiento de datos y contratos antes de adoptarlos.
- Mantener identidad/datos/hoja registral/auditoría en EXPERT; memorias, sandbox y archivos alojados por tercero son temporales y siguen política externa.
- No comunicar que hay generación multiagente o PPTX general “activa” hasta pasar implementación, smoke end-to-end, revisión seguridad y despliegues.
