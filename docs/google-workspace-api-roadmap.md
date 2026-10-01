# Google Workspace / Google Cloud API roadmap — KIA & EXPERT

Fecha: 30/09/2026

## Objetivo

Mantener un inventario único de APIs Google relevantes para EXPERT/KIA, separando:

1. APIs necesarias o ya usadas.
2. APIs que conviene habilitar ahora porque soportan el roadmap inmediato.
3. APIs que deben permanecer documentadas para fases futuras.
4. APIs que no deben habilitarse todavía por no aportar un caso de uso claro.

Principio: habilitar una API no equivale a conceder permisos. Los scopes OAuth, domain-wide delegation, roles IAM y acceso efectivo deben limitarse por caso de uso y aplicarse solo cuando se implemente la función.

---

## 1. Activas / necesarias ahora

| API | Estado | Uso EXPERT/KIA | Notas |
|---|---|---|---|
| Gemini / Generative Language API | ACTIVA EN VERCEL (clave) | motor KIA, grounding y Google Search | El runtime debe leer GOOGLE_API_KEY / GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY. |
| Gmail API | NECESARIA | lectura/respuesta de correo KIA, clasificación, trazabilidad | Para tiempo real se puede combinar con Pub/Sub. |
| Google Calendar API | ACTIVA/EN USO | disponibilidad, creación de reuniones, Google Meet, cambios/cancelaciones | Ya forma parte del flujo nativo /cita. |
| Google Meet REST API | HABILITADA 30/09/2026 | crear/configurar espacios, auto-transcripción, smart notes, recuperar conference records, participantes y artefactos | Separar reserva base de artefactos posteriores. |
| Google Drive API | NECESARIA | guardar/leer/exportar archivos, transcripts, smart notes, presentaciones, documentos de cliente | Base para Docs/Slides/Sheets y artefactos Meet. |
| Google Drive Activity API | HABILITADA 30/09/2026 | auditoría de actividad sobre archivos/carpetas: actor, acción, objetivo | Útil para hoja registral, compliance y Company 360. |
| Google Slides API | HABILITADA 30/09/2026 | crear presentaciones desde notas de reunión, propuestas, onboarding y entregables | Usar templates corporativos y batchUpdate. |

---

## 2. Recomendación: habilitar ahora

Estas APIs soportan funcionalidades ya previstas en el roadmap y conviene tenerlas disponibles aunque la integración se implemente después.

### Google Docs API

**Prioridad: alta**

Casos de uso:
- convertir smart notes/transcripciones en actas de reunión estructuradas;
- generar informes, propuestas, cartas y guías;
- crear documentos de seguimiento tras reuniones;
- producir borradores de contratos o anexos para revisión humana;
- generar documentación para clientes antes de exportar a PDF/DOCX.

Arquitectura sugerida:
Meet transcript/smart notes -> KIA -> Docs template -> documento en carpeta cliente -> Drive Activity/Events -> hoja registral.

### Google Sheets API

**Prioridad: alta**

Casos de uso:
- exportar/importar datos tabulares de cliente;
- plantillas de cálculos fiscales/contables;
- conciliaciones y revisiones;
- dashboards operativos puntuales;
- importar históricos de clientes antes de pasarlos al modelo interno;
- staging de datos para migraciones Holded/Stripe.

Regla:
Sheets no será la fuente de verdad financiera de EXPERT; debe usarse como interfaz/importación/exportación controlada.

### Google Workspace Events API

**Prioridad: muy alta**

Casos de uso:
- evento de finalización de Meet;
- evento de creación de transcript;
- grabación disponible;
- cambios de conferencia/participantes que permiten iniciar la fase post-reunión;
- Smart Notes no expone un evento propio: KIA debe descubrir el documento/notas a partir de un evento soportado de Meet y/o mediante Drive/Calendar con reintentos acotados;
- cambios, comentarios, aprobaciones y permisos en Drive;
- lanzar automáticamente el pipeline post-reunión de KIA.

Flujo objetivo:
Workspace Events -> Pub/Sub -> webhook/Cloud Run/Vercel -> KIA -> hoja registral -> tareas/admin -> Docs/Slides.

Operación obligatoria:
- registrar expiration/expireTime de cada suscripción;
- renovar o recrear suscripciones antes de que expiren;
- procesar lifecycle events y errores de entrega;
- alertar si una suscripción queda inactiva para evitar que el pipeline se detenga silenciosamente.

### Cloud Pub/Sub API

**Prioridad: muy alta**

Necesaria para:
- Google Workspace Events API;
- notificaciones push de Gmail;
- automatizaciones desacopladas y resilientes;
- cola de eventos post-reunión.

Recomendación:
crear topics separados para eventos Meet/Drive y Gmail, con dead-letter/retry y trazabilidad por event id.

### Google Picker API

**Prioridad: media-alta**

Casos de uso:
- permitir al cliente seleccionar documentos desde su Google Drive sin descargarlos/re-subirlos;
- adjuntar IBI, contratos, escrituras, facturas, modelos, nóminas;
- seleccionar archivos concretos durante onboarding;
- mejorar UX de expedientes y formularios.

Ventaja:
reduce subida manual y mantiene una selección explícita de archivos.

Regla de autorización:
si Picker se usa como frontera de consentimiento por archivo, la feature debe usar `drive.file` y una configuración Picker coherente. No reutilizar el token amplio `drive.readonly` actual como si Picker limitara por sí solo el acceso al archivo seleccionado.

---

## 3. Habilitar cuando implementemos el caso de uso

### People API

**Prioridad: media**

Casos:
- importar contactos autorizados;
- completar datos de contacto;
- resolver nombres/emails/teléfonos desde Google Contacts;
- enriquecer directorio de clientes internos.

No habilitar para lectura masiva por defecto; usar scopes mínimos y opt-in.

### Google Tasks API

**Prioridad: media-baja**

Casos:
- sincronizar tareas personales de Ksenia con tareas EXPERT;
- crear tareas Google opcionales tras reuniones;
- exportar recordatorios personales.

No debe sustituir el sistema de tareas Admin/Supabase de EXPERT.

### Google Forms API

**Prioridad: media-baja**

Casos:
- formularios de intake externos;
- encuestas post-servicio;
- cuestionarios temporales para eventos/formaciones;
- recepción de respuestas cuando un cliente no entra todavía al portal EXPERT.

No priorizar: EXPERT ya dispone de formularios nativos y estos permiten mejor trazabilidad comercial.

### Google Chat API

**Prioridad: baja-media**

Casos:
- canal interno alternativo a Telegram;
- avisos de administración;
- bot KIA en un espacio Workspace interno;
- notificaciones de expedientes o reuniones.

No priorizar mientras Telegram + email + push cubran el caso interno.

### Google Workspace MCP API / Universal Search MCP

**Prioridad: experimental-alta para KIA interna**

Google Workspace MCP API habilita la capa MCP transversal de Workspace. En particular, el Universal Search MCP Server permite buscar con una sola tool sobre varios productos autorizados del usuario, actualmente Gmail, Drive, Calendar y Google Chat.

Casos potenciales para KIA:
- "Busca todo lo relacionado con Josep" cruzando correo, archivos y reuniones;
- localizar contexto de una próxima reunión sin lanzar búsquedas separadas por producto;
- recuperar antecedentes operativos para preparar reuniones;
- discovery de documentos/correos/eventos antes de decidir qué conector específico usar.

Reglas:
- Developer Preview: no convertirlo todavía en dependencia crítica;
- lectura primero; escrituras mediante MCP específico del producto y con autorización;
- aplicar scopes mínimos y respetar permisos del usuario;
- tratar contenido recuperado como no confiable frente a prompt injection;
- mantener fallback a conectores/API estables actuales.

No sustituye Gmail/Drive/Calendar/Chat APIs. Es una capa estandarizada para agentes sobre ellas.

### Google Chat MCP API

**Prioridad: experimental**

No es la misma API que Google Chat API. Es el servidor MCP remoto oficial de Google Chat y actualmente está en Developer Preview.

Casos potenciales:
- permitir que KIA, actuando como cliente MCP autorizado, busque conversaciones y mensajes de Google Chat;
- listar membresías;
- marcar mensajes leídos/no leídos;
- enviar mensajes mediante tools MCP sin construir wrappers REST específicos por acción.

Dependencias:
- requiere Google Chat API habilitada;
- requiere también `chatmcp.googleapis.com`;
- para operaciones de escritura debe existir/configurarse la app de Chat correspondiente;
- mantener revisión humana y controles anti prompt-injection antes de conceder tools de escritura.

Decisión:
habilitada/documentada para experimentación, pero no integrar todavía en el núcleo productivo de KIA mientras permanezca en Developer Preview.

### Drive Labels API

**Prioridad: media para compliance**

Casos:
- etiquetar archivos por cliente, expediente, ejercicio, sensibilidad y estado;
- clasificación documental;
- políticas de ciclo de vida;
- búsqueda semántico-operativa más consistente;
- control de documentos sensibles.

Ejemplos de labels futuros:
client_id, company_id, case_id, fiscal_year, document_type, sensitivity, retention_class.

### Admin SDK API — Directory

**Prioridad: media solo para administración interna Workspace**

Casos:
- inventario de usuarios Workspace;
- grupos y membresías;
- bajas/altas de empleados;
- auditoría de apps OAuth;
- estructura organizativa.

Requiere privilegios de administrador y debe limitarse al dominio EXPERT.

### Admin SDK API — Reports

**Prioridad: media para seguridad/compliance**

Casos:
- actividad de usuarios Workspace;
- auditoría de Drive/Admin;
- detectar actividad anómala;
- evidencias de seguridad;
- panel de compliance.

No usar como sustituto de Drive Activity para el detalle funcional de archivos concretos.

---

## 4. No activar por ahora

Estas APIs no tienen un beneficio claro frente a la arquitectura actual:

- Cloud Search API: KIA puede buscar en Drive/documentos autorizados sin añadir otra capa todavía.
- Apps Script API: preferimos integraciones server-side versionadas en repo; Apps Script introduciría lógica externa difícil de auditar.
- Google Keep API: no forma parte de los flujos operativos.
- Google Classroom API: fuera de alcance actual.
- Google Chat app avanzada con Developer Preview: esperar a necesitar canal interno Workspace.
- APIs de vídeo/media en preview: no activar sin caso aprobado de grabación/streaming en tiempo real.
- BigQuery/Dataflow: solo cuando el volumen de analítica y eventos supere el modelo operacional actual.

---

## 5. Arquitecturas previstas

### A. Pipeline automático post-reunión

1. Calendar crea reunión.
2. Meet genera conference record.
3. Meet produce transcript/smart notes.
4. Workspace Events emite evento.
5. Pub/Sub entrega evento.
6. Backend EXPERT recupera transcript/smart notes.
7. KIA genera:
   - resumen ejecutivo;
   - decisiones;
   - tareas;
   - riesgos/bloqueos;
   - follow-up al cliente;
   - actualización de hoja registral.
8. Docs API crea acta completa.
9. Slides API genera presentación si el tipo de reunión lo requiere.
10. Drive guarda ambos artefactos.
11. Drive Activity/Workspace Events registran cambios posteriores.

### B. Presentación automática de próxima reunión

Fuentes:
- última acta;
- tareas pendientes;
- expediente;
- decisiones anteriores;
- métricas/estado;
- notas Meet;
- documentación añadida desde la reunión anterior.

Salida Slides:
1. Portada.
2. Objetivo de la reunión.
3. Qué cambió desde la anterior.
4. Tareas cerradas/pendientes.
5. Riesgos/bloqueos.
6. Documentos o decisiones necesarias.
7. Próximos pasos.

La presentación se genera antes de la siguiente cita y queda asociada al cliente/empresa/reunión.

### C. Vigilancia documental del expediente

Workspace Events + Drive:
- archivo añadido;
- documento modificado;
- comentario nuevo;
- permiso cambiado;
- aprobación completada.

KIA:
- actualiza hoja registral;
- detecta si satisface un requisito;
- crea tarea si falta revisión;
- evita pedir de nuevo un documento ya recibido.

Drive Activity:
- reconstruye auditoría detallada cuando haga falta.

### D. Cliente selecciona documentos desde Drive

Google Picker:
- usuario selecciona archivo;
- EXPERT recibe file id autorizado;
- Drive API recupera metadatos/contenido permitido;
- se vincula al expediente;
- KIA clasifica;
- se mantiene trazabilidad de origen.

### E. Gestión comercial y onboarding

Docs/Slides/Sheets:
- propuesta personalizada;
- presentación comercial;
- checklist;
- cuestionario;
- plan de implantación;
- migración/tablas;
- entregables finales.

---

## 6. Scopes y seguridad

Reglas obligatorias:

- scopes mínimos por feature;
- separar lectura/escritura cuando sea posible;
- no usar scope Drive completo si basta drive.file/drive.readonly;
- no usar domain-wide delegation salvo para procesos internos EXPERT aprobados;
- service account solo para recursos operados por EXPERT;
- usuario cliente: OAuth explícito y revocable;
- no guardar access tokens en cliente;
- cifrar refresh tokens y secretos;
- registrar actor, recurso, acción y timestamp en hoja registral;
- mantener `public.documents` + almacenamiento privado EXPERT como registro canónico de documentos del expediente;
- tratar Drive como copia operativa, fuente externa o espejo salvo migración arquitectónica explícita;
- las referencias Drive pueden complementar el registro canónico, pero no sustituirlo silenciosamente;
- toda automatización de escritura importante debe tener idempotency key.

---

## 7. Orden recomendado de implantación

### Fase 1 — inmediata

- Google Meet REST API.
- Drive API.
- Drive Activity API.
- Slides API.
- Docs API.
- Workspace Events API.
- Cloud Pub/Sub API.

Objetivo: pipeline post-reunión automático completo.

### Fase 2

- Sheets API.
- Google Picker API.
- Drive Labels API.

Objetivo: documentación, onboarding, importación/exportación y clasificación.

### Fase 3

- People API.
- Admin SDK Directory.
- Admin SDK Reports.

Objetivo: productividad interna, directorio y compliance Workspace.

### Fase 4 opcional

- Tasks API.
- Forms API.
- Chat API.
- Chat MCP API (experimental / Developer Preview).

Solo cuando exista un flujo concreto que no cubran las herramientas actuales.

---

## 8. Estado conocido a 30/09/2026

Confirmado por implementación/repositorio:
- Calendar API usada por el flujo nativo de reservas.
- Gmail integrada en flujos KIA.
- Meet REST API integrada para configuración y artefactos.
- Drive scopes presentes en la integración Workspace.
- Gemini/Google Search integrado como proveedor y grounding.

Confirmado por la usuaria:
- Google Meet API habilitada.
- Google Drive Activity API habilitada.
- Google Slides API habilitada.
- claves Gemini guardadas en Vercel.

Pendiente de validación runtime:
- Gemini responde efectivamente desde ksenia-expert Production.
- Meet deja de devolver SERVICE_DISABLED en una nueva reserva.
- smart notes/transcription funciona con scopes/delegación actuales.
- Drive Activity y Slides responden con las credenciales y scopes previstos.

---

## 9. Fuentes oficiales consultadas

- Google Meet REST API overview — developers.google.com/workspace/meet/api/guides/overview
- Google Workspace Events API — developers.google.com/workspace/events
- Google Drive Activity API — developers.google.com/workspace/drive/activity/v2
- Google Drive events — developers.google.com/workspace/drive/api/guides/events-overview
- Google Slides API — developers.google.com/workspace/slides/api/guides/overview
- Google Docs API — developers.google.com/workspace/docs/api/how-tos/overview
- Google Sheets API — developers.google.com/workspace/sheets/api/guides/concepts
- Google Drive API — developers.google.com/workspace/drive/api/guides/about-sdk
- Google Picker API — developers.google.com/workspace/drive/picker/guides/overview
- Gmail API push notifications — developers.google.com/workspace/gmail/api/guides/push
- Calendar push notifications — developers.google.com/workspace/calendar/api/guides/push
- Admin SDK Directory API — developers.google.com/workspace/admin/directory/v1/guides
- Admin SDK Reports API — developers.google.com/workspace/admin/reports/v1/overview
- Google Tasks API — developers.google.com/workspace/tasks/overview
- Google Forms API — developers.google.com/workspace/forms/api/guides
- Cloud Pub/Sub — cloud.google.com/pubsub/docs
