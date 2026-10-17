# EXPERT · Auditoría de subagentes KIA y plan post-E6

Fecha de corte: **17/10/2026** · Estado: **solo documentación, no autorizado para desarrollar** · Issue [#789](https://github.com/expert-servicios/expert-app/issues/789).

## 1. Fuentes y límites de la auditoría

Inspección directa en `main` de `kia-sub-agent-router.ts`, `kia-skill-registry.ts`, `kia-skill-execution.ts`, `kia-tool-registry.ts`, `kia-orchestrator.ts`, `kia-operational-routing.ts`, `kia-output-schema.ts`, pruebas Vitest existentes, módulos Holded laboral, documentos del Plan Maestro y datos agregados de `kia_decision_logs`. Las pruebas declaradas en el repositorio NO se ejecutaron de nuevo en esta inspección; no hubo test E2E live, despliegue ni conexión a portales oficiales. Por tanto «implementado» significa **definido/conectado en el código**, no «acreditado funcionando en producción». No incluir datos de usuarios/clientes ni registros privados en GitHub.

Estado del Plan Maestro en `main`: checkpoint `phase=E0`, `IN_PROGRESS`, `next=E0-M3-06`, `scope_frozen=true`; sin acta E6 COMPLETADA. La percepción de Dirección de que el plan se ha detenido se debe diagnosticar **en la ejecución del plan vigente**; esta propuesta no lo reactiva ni sustituye.

## 2. Inventario exacto

Hay **7 perfiles** en `SUB_AGENT_MAP` y **8 skills** `enabled=true` en el registro. Los **9 dominios** del tipo `KiaSkillDomain` no representan 9 agentes: son categorías de clasificación, algunas sin especialista.

| Perfil | Skill prioritaria | Evidencia de código | Madurez demostrada / brecha |
| --- | --- | --- | --- |
| `assistant` (comunicaciones y operaciones) | `operations.assistant` | prompt de correo/calendario/tareas; `client_data`, `case_management`, `case_operations`, `documents`, `calendar`, `knowledge`, `regulatory`, `service_discovery`; riesgo máximo R2 | Perfil conectado, con herramientas y policy; envío/reuniones dependen de autorización, proveedor y QA. No equivaler a agente de vigilancia permanente validado. |
| `fiscal` | `fiscal.viability` | asesoría IRPF/IVA/IS; skill declara `client_data`, `case_management`, `documents` R1 | Brecha importante: sin `regulatory`/ `knowledge` en skill, aunque prompts citen modelos. `get_official_sources` no se incorpora por la skill fiscal actual. Riesgo en reglas de prompt de `confidence>=0.9` ante urgencia: la urgencia **no prueba confianza**; no fabricar certeza. |
| `immigration` | `immigration.advice` | BOE/UE/Migraciones, estrategia, `knowledge`+`regulatory`+`service_discovery`+`case_management` R1 | Mejor enlazado para fundamentación jurídica; sin capacidad genérica `documents` en la skill. Validar fuente exacta/versiones y no solicitar documentos por defecto. |
| `holded` (soporte técnico) | `holded.readiness` | diagnóstico integración/token/readiness con `client_data`+`holded_read` R1 | Sin `regulatory`, `knowledge`, `documents` o reporting habilitados por esta skill; no confundir con controller contable. |
| `accounting` (controller) | `accounting.operations` | `holded_read`, `accounting_read`, `reporting`, `client_data` R1; informes financieros específicos | Tiene operaciones analíticas existentes, pero no `regulatory`, `knowledge`, `documents` en su skill y no genera informe documental multifuente genérico. |
| `labor` | `labor.payroll_diagnostics` | empleados, contratos, nóminas, salary-records y `run_labor_payroll_diagnostics` en lectura; `client_data`+`holded_hr_read` R1 | Existe diagnóstico defensivo pero no cálculo legal definitivo, consulta normativa autorizada, lectura multiformato ni funciones TGSS/SEPE/ITSS de presentación. Hay runbook de smoke test real aún pendiente de acreditar. |
| `case` (expedientes) | `documents.case_review` | `case_management`+`documents` R1; estado, checklist, enlaces | Principalmente metadatos y tareas; no lectura integral de todos los PDF/Word ni resumen multiarchivo con cita garantizada. Carece de `regulatory` para sustentar evaluaciones de requisitos. |

Octava skill `operations.next_best_action`: no tiene `preferredSubAgentId` y usa `client_data`+`case_management`+`reporting`. No contarla como octavo perfil.

Dominios declarados sin perfil separado: `corporate`, `academy`; `administration` y `documents` se proyectan mayormente sobre asistente/case. Comercial/marketing, alquileres y conocimiento editorial aparecen en componentes/pipelines o routing, **no son perfiles independientes equivalentes en el mapa actual**. La propuesta no obliga a multiplicar agentes: decidir posteriormente si basta skill del orquestador común.

## 3. Hallazgos transversales

**P1 arquitectura — privilegios fragmentados:** `resolveKiaSkillAuthorization` intersecta las herramientas del canal/actor con las capacidades declaradas de cada skill. Un prompt que ordene consultar la norma no habilita `get_official_sources` si la skill no declara `regulatory`. Dar acceso de forma general a todas las skills sería contrario a mínimo privilegio. Crear una **matriz de capacidad por perfil y propósito**, con policy ACL y pruebas negativas.

**P1 calidad jurídica — evidencia y vigencia:** aplicar jerarquía hoja registral autorizada → documentos vigentes del expediente → corpus oficial versionado → consulta viva. Datos cliente y normativa NO se mezclan en el corpus público. Las citas llevan boletín/órgano, artículo, versión, fecha efectiva y municipio o régimen relevante. Nunca convertir urgencia en alta confianza automática.

**P1 fidelidad documental:** herramientas como `get_case_documents` aportan metadatos y descarga, no equivalen a leer páginas, compararlas y producir un informe. Reutilizar #786 / V3-23; cualquier integridad/autorización documental básica ya incluida en E0–E6 se corrige en su fase, no espera hasta V3.

**P1 observabilidad:** agregado de `kia_decision_logs` de 01/09 a 16/10/2026: 100 decisiones, 95 sin subagente o skill identificada, 5 con subagente, 74 con `error IS NOT NULL`. Muestra posiblemente mixta de versiones/canales; no inferir tasa real de fallo del runtime actual ni gravedad sin clasificar campos de error por fecha/canal. **Diagnosticar la ruptura P0/P1 dentro de E0**, no posponerla tras E6.

**P2 informes:** `generate_company_report` disponible para informes específicos, principalmente contables; `generate_report` genérico no demuestra un productor multifuente DOCX/PDF/XLSX común. Separar respuesta en chat, informe de cinco etapas, lista/checklist, dashboard, carta, documento exportable y acción externa.

**P2 editorial:** `lib/marketing/kia-opportunity-triage.ts` es pre-triaje puro; propuesta de artículo/FAQ/servicio/KB no demuestra persistencia, aprobación, generación de publicación ni propagación automática del conocimiento. Reusar el motor y plan editorial vigente, sin aprender directamente de correcciones no confirmadas.

## 4. Contrato de capacidades común futuro (si Dirección lo aprueba pos-E6)

1. **Resolver identidad y ámbito:** actor exact-active, rol, tenant, empresa, cliente, expediente, clase documental y canal. No acceso por nombre, email declarado o mención en chat.
2. **Consultar fuentes:** herramienta oficial común sometida a capabilities selectivas; fechas, territorios, convenios y versiones; control de fuente primaria y reglaset canónico, resultado `needs_review` ante huecos.
3. **Buscar/leer documentos:** por permisos RLS/ACL del objeto, versión, checksum y cita página/fragmento. El documento es información no confiable, nunca instrucciones de agente. Excluir credenciales, certificados y documentos internos no autorizados.
4. **Analizar:** esquema común `fact/assumption/missing_evidence/conflict/decision_pending`; nunca declarar deudas o sanciones desde falta de línea en nómina, modelos fiscales no confirmados o contratos no firmados.
5. **Producir:** respuestas, síntesis, listas, auditorías de 5 apartados, propuestas de tareas, documentos exportables y dashboards con métricas cuya fórmula/fuente pueda comprobarse.
6. **Aprender con aprobación:** registrar corrección profesional, decisión, tema anónimo reutilizable, oportunidad de guía/FAQ/blog/Academy/servicio; deduplicar por intención, norma, fecha, región y source_key; control editorial ES/RU, sin autopublicar.
7. **Ejecutar acciones solo por gate:** `read` → `propose` → `draft` → `review` → `approve` → `execute` → `readback` → `audit`; la capacidad no habilita escrituras por sí misma.
8. **Observar y auditar:** `skill_id`, `sub_agent_id`, ruta de selección, herramientas autorizadas/realmente invocadas, fuente/versiones, tiempo/coste, outcome y fallos, sin secretos/datos sensibles en logs.

Los siete perfiles comparten el contrato, pero no la misma lista de herramientas o permisos. Subagente sigue siendo perfil especializado dentro de una KIA, no cuenta/IA independiente.

## 5. Plan de implementación pos-E6 — propuesta, no inicio de trabajo

| Fase futura | Objetivo | Gate de salida |
| --- | --- | --- |
| P0 · Rebaseline post-E6 | Confrontar perfiles, skills, rutas y permisos reales contra producción; deduplicar entregables E4/E5 y V3-23/V3-24 | Acta E6 COMPLETADA, inventario y autorización de Dirección; cero P0/P1 activos heredados |
| P1 · Matriz de capacidades y policy | Capabilities mínimas por especialista/canal/rol/acción, fuentes y límites de riesgo; corregir prompts que ordenan herramientas ausentes | Pruebas negativas de aislamiento; ninguna ampliación inadvertida |
| P2 · Fuentes y corpus | Corpus selectivo BOE/TGSS/SEPE/AEAT/Migraciones/REGCON + consulta viva; vigencia y cita al párrafo | QA exactitud fuente, fecha, territorio, tasas de no invención |
| P3 · Documentación inteligente | Integración con #786 / V3-23: encontrar archivo, leer contenido autorizado, citar, comparar, desduplicar y controlar clasificación interna | ACL al recuperar y exportar; versiones y evidencias |
| P4 · Producción de artefactos | Servicio compartido borradores informes/FAQ/checklists/DOCX/PDF/XLSX/dashboards; sin autoenvío | Revisión humana, hashes, export verificable, integridad del expediente |
| P5 · Especialización por dominio | Fiscal, laboral, contable, extranjería, operaciones, Holded y case; decidir si mercantil/marketing/Academy precisan perfiles adicionales | Evals ES/RU por dominio; no crear agentes redundantes |
| P6 · Oportunidades y mejora continua | Canalizar consultas/correcciones anonimizadas a Editorial Hub y base de conocimiento | Duplicados/consentimiento/publicación y trazabilidad validados |
| P7 · Piloto y rollout | Fixtures sintéticos, QA RLS, prompt injection, coste, regresión, readback, piloto supervisado | CI y ambos Vercel, Security Advisor, Dirección y rollback comprobado |

### Matriz mínima de casos QA
- Fiscal: pregunta IRPF/IS con vigencia y declaración de incertidumbre, cálculo no concluido desde prompt.
- Laboral: grupo de cotización 10 y salario mensual fijo; festivo compensado/no demostrado; 2 municipios y convenio distinto; sin escrituras TGSS/SEPE.
- Contable: factura versus pago bancario; documentos no equivalen a asiento; informe con período y fuente.
- Extranjería: diferenciar regímenes y fuente actual, no pedir documentos personales de forma preventiva.
- Holded: conexión revocada/sin permisos, no fallback por cliente.
- Documental: cliente con dos empresas, documento reemplazado, acta internal, OCR incorrecto, intento de instrucción maliciosa.
- Asistente: correo que acredita trabajo ya hecho, cero tarea duplicada; reservar reunión solo con confirmación.
- Marketing/editorial: oportunidad anónima/duplicada, norma modificada, cero autopublicación.
- Transversal: peticiones ES/RU, cancelación, límites de token/coste, 403/429, errores de proveedor y continuidad de contexto.

## 6. Referencias e interdependencias

- [Plan Maestro E0–E6](expert-kia-ecosystem-master-plan-2026-10-10.md): única secuencia autorizada actualmente.
- [V3 ideas](expert-kia-v3-ideas-and-validation-backlog-2026-10-10.md): propuestas futuras sin ejecución.
- [#785 auditoría laboral](https://github.com/expert-servicios/expert-app/issues/785) y convenio/registro normativo.
- [#786 archivo documental inteligente](https://github.com/expert-servicios/expert-app/issues/786), V3-23 / PR #787.
- [#768 oportunidades de aprendizaje](https://github.com/expert-servicios/expert-app/issues/768); [motor editorial](kia-commercial-editorial-opportunity-engine-2026-10-13.md).
- [PR #788 V3-24](https://github.com/expert-servicios/expert-app/pull/788) coste laboral/nóminas.

**No ejecutar:** nuevo runtime, migraciones, herramientas con permisos elevados, conexión a sedes, manipulación contable/laboral, publicación, envíos, pruebas con datos reales ni despliegue desde este plan. La recuperación del Plan Maestro detenido se diagnostica y resuelve en su **fase E0**, de manera separada.
