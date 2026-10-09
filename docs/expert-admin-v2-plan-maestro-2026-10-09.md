# EXPERT Admin V2 — Plan maestro de rediseño integral

**Fecha:** 09/10/2026  
**Decisión:** Aprobado el diseño objetivo y su ejecución por fases. **Este documento es especificación; no supone un despliegue ni una migración de datos.**  
**Propietario de producto:** Dirección EXPERT  
**Alcance:** diseño transversal EXPERT Workspace con **Panel Admin** y **Portal Cliente** separados; KIA, Contactos 360, operaciones, comunicaciones, agenda, facturación, contenido y administración. Se documenta además la compatibilidad con el panel específico de administradores de tenant.  
**Estado:** LISTO PARA INICIAR FASE 0. Implementación bajo PRs independientes, CI, seguridad y verificación de producción.  
**Plan rector:** este documento prevalece sobre los borradores visuales anteriores; conserva sus requisitos operativos válidos.

## 1. Decisión de diseño: EXPERT Workspace

Diseño seleccionado: **Kiranism / Next Shadcn Dashboard Starter**, repositorio público MIT:
- Código: https://github.com/Kiranism/next-shadcn-dashboard-starter
- Demo: https://shadcn-dashboard.kiranism.dev/
- Licencia: https://github.com/Kiranism/next-shadcn-dashboard-starter/blob/main/LICENSE

**Tomar como referencia patrones y componentes**, no incorporar la aplicación completa. Reutilizar, tras revisar versiones y licencia, navegación, tabla de datos, formularios, panel contextual, búsqueda, estados y criterios responsive. **No** incorporar Clerk (autenticación), facturación de ejemplo, organizaciones, autorizaciones del template, servicios de IA o bases de datos del ejemplo. EXPERT conserva Next.js 16 / React 19 / Tailwind 4, Supabase Auth y RLS, Stripe, Holded, Google Calendar/Meet, correo y KIA.

**Lenguaje visual elegido:** consola profesional y compacta; no un mosaico de tarjetas ni un ERP con cincuenta pestañas. Blanco cálido para zona de trabajo, barra lateral azul marino EXPERT, tipografía legible, dorado usado solo en acciones y selección; alertas mediante estados accesibles. No desplegar un tema ajeno ni reemplazar el branding.

## 2. Diagnóstico del sistema actual (código auditado)

Fuentes consultadas:
- components/admin/AdminSidebar.tsx y AdminMobileNav.tsx
- components/admin/AdminRightPanel.tsx y app/(protected)/admin/layout.tsx
- app/(protected)/admin/page.tsx, directorio/page.tsx, clientes/page.tsx, empresas/page.tsx y leads/page.tsx
- app/api/admin/directorio/route.ts y app/api/admin/leads/route.ts
- docs/admin-360-unified-directory-plan.md, docs/admin-360-compact-redesign-backlog-2026-10-09.md y docs/admin-improvement-plan.md.

Hallazgos:
1. Navegación en siete categorías de iconos pequeños; para llegar a una pantalla hay que adivinar el grupo, y hay rutas duplicadas y solapadas.
2. Directorio 360 combina profiles y companies pero **no** los leads; Clientes, Empresas, Leads y Suscripciones tienen recorridos paralelos.
3. Directorio actual carga hasta 2.000 registros por fuente y filtra en navegador; no escala adecuadamente ni garantiza un total global filtrado.
4. Tarjetas grandes para registros y scroll extenso en fichas; exceso de cabeceras y métricas sin acción inmediata.
5. KIA abierto resta unos 360 px o hasta el 45 % de ancho a la zona central; complica vistas densas.
6. La funcionalidad operativa valiosa sí existe: ficha Cliente 360, expediente, agenda, email, Stripe, Holded, tareas y KIA. Debe **reutilizarse**, no rehacerse.
7. CRM ya guarda en metadata crm_segment, crm_summary, crm_review y crm_needs_attention; evitar crear otro etiquetado incompatible.

Instantánea del 09/10/2026 (revalidar al comenzar Fase 0): 811 filas leads, 7 profiles, 7 companies, 86 internal_tasks; al menos 4 coincidencias de email entre leads y perfiles. **No sumar estas filas como personas únicas**, ni fusionar identidades de forma automática.

## 2 bis. Dos aplicaciones de trabajo, un solo sistema de diseño (ampliación 09/10/2026)

**Decisión aprobada:** reutilizar la plantilla Kiranism y los tokens/componentes visuales para **dos shells independientes**: EXPERT Admin Workspace (`/admin`) y EXPERT Client Workspace (`/dashboard`). No compartir una navegación con botones ocultos según rol ni basar autorización en un `isAdmin` del navegador. Los productos deben parecer parte de la misma marca, pero tener objetivos, jerarquías y acciones distintas.

### 2 bis.1. Arquitectura de superficies

| Área | Audiencia | Ruta base | Propósito |
| --- | --- | --- | --- |
| Admin Workspace | owner/admin, personal autorizado | `/admin` | Operación global, CRM, inbox omnicanal, marketing, contenidos, facturación, equipo, integraciones y auditoría |
| Client Workspace | cliente/autónomo, representante de empresas vinculadas | `/dashboard` | Sus expedientes, documentos, mensajes, empresas, servicios, calendario fiscal, citas, facturas, suscripciones y acceso a KIA |
| Delegación desde Admin | administrador real que revisa un cliente | `/admin/clientes/[id]/portal` (mientras dure la transición) | Vista del contexto cliente **sin suplantación de sesión**, con banner «Modo Admin», auditoría de actor real y alcance de lectura correcto |
| Tenant/partner (existente, fuera de rediseño MVP) | tenant_admin | `/tenant/dashboard` | Administración limitada al tenant; tercera configuración posible sobre los mismos tokens, nunca reutilizar permisos globales del Admin EXPERT |

Los layouts ya existentes (`app/(protected)/admin/layout.tsx`, `app/(protected)/dashboard/layout.tsx`, `app/(protected)/tenant/layout.tsx`) respaldan esta separación. El nuevo diseño **no** convierte el Client Workspace en una subsección visual del Admin.

**Capas propuestas:**

```text
EXPERT Design System (tokens EXPERT, tablas, formularios, dialogs, filtros, encabezados)
   ├── AdminWorkspaceShell     /admin       (navigation schema + admin guard + admin context)
   ├── ClientWorkspaceShell    /dashboard   (navigation schema + client guard + active company)
   └── TenantWorkspaceShell    /tenant      (futuro; tenant-scoped)
          │
          └── Feature components compartidos SOLO en presentación;
              los servicios/consultas/mutaciones permanecen autorizados por superficie y empresa.
```

### 2 bis.2. Un mismo diseño, distintas experiencias

**Panel Admin:**
- Inicio «Mi jornada» con pendientes, citas, errores de KIA, solicitudes humanas, cobros y expedientes bloqueados.
- **Contactos** único de personas, empresas, leads, clientes, antiguas relaciones comerciales, suscripciones e identidades con acceso. Tabla y filtros globales; CRM `crm_segment` visible.
- Agenda y tareas de todos los contextos autorizados; expedientes/documentos; Inbox 360 y correo humano; Facturación/Stripe/Holded por empresa; Marketing editorial, blog, reseñas, campañas, SEO, mentorías y Academy; Sistema, equipo, seguridad, autorizaciones e integraciones.
- KIA opera como **asistente de back-office**: búsquedas transversales limitadas por permisos, resúmenes, preparación de emails/publicaciones, clasificación y tareas. Acciones sensibles requieren confirmación; nunca usa una credencial global indistinta para bancario/contable.
- Las métricas deben mostrar lo que requiere una acción, no limitarse a tarjetas de ingresos.

**Portal Cliente:**
- Inicio «Mi EXPERT» mostrando próximo paso, estado de expedientes, documentos pendientes, citas, notificaciones y facturas propias.
- Menú **más simple**: (1) Mi inicio; (2) Mis empresas/datos; (3) Mis expedientes y documentos; (4) Mensajes y citas; (5) Presupuestos y servicios; (6) Facturación y suscripción; (7) Informes e impuestos cuando correspondan; (8) Perfil y ayuda. Academy puede mostrarse por entitlement, no como sección universal. Ordenar por frecuencia de uso; en móvil priorizar «Inicio, Trámites, Mensajes, Facturación, Más».
- Selección explícita de empresa activa; una persona puede gestionar varias entidades autorizadas, y cada expediente, documento, suscripción, pago y conexión Holded corresponde a su empresa. Cuando no existe empresa, ofrecer estado personal y onboarding sin bloquear servicios para personas físicas.
- Cliente puede: solicitar servicio, aprobar presupuesto, completar datos, adjuntar documentos, consultar expediente, reservar/cambiar cita dentro de reglas, descargar facturas y acceder a su portal de pagos; no puede gestionar terceros, bandeja global, campañas o publicaciones.
- KIA actúa como **asistente del cliente**: ayuda sobre trámites y estado que realmente puede leer, presenta guías verificadas y pide autorización antes de compartir datos, solicitar servicios o cambiar registros. No puede conocer el motivo de contacto sin expediente o contexto real.
- Priorizar guía progresiva y mensajes claros frente a densidad profesional. Tabla compacta cuando aporte valor (documentos, facturas); cards/resumen solo para acciones personales.

### 2 bis.3. Matriz de componentes compartidos y componentes exclusivos

| Componente | Compartir código de UI | Datos y permisos |
| --- | --- | --- |
| Color, tipografía, botones, inputs, select, tablas, modals/drawers, estados y toasts | **Sí**: paquete interno `components/workspace/ui` y tokens únicos | No contienen permisos |
| Shell, menú, buscador y navegación móvil | **Base visual compartida; configuración distinta** (`AdminWorkspaceShell`, `ClientWorkspaceShell`) | Menús resueltos por rol/capacidad en servidor |
| Contact card y ficha 360 | Compartir piezas de presentación, no el directorio Admin completo | Admin ve relaciones autorizadas; cliente únicamente su identidad/entidades |
| Expediente, documento, calendario, presupuesto, suscripción y factura | Compartir status, filas y editor de visualización | Endpoints separados o guardas explícitas, campos/acciones adaptados a actor |
| KIA Dock / Chat UI | Compartir interfaz de chat, voz, adjuntos y citas | **Agentes/herramientas/contexto distintos**, cada uno con policy server-side |
| Inbox / correspondencia | Compartir visor de hilo cuando proceda | Admin omnicanal; cliente solo su conversación |
| Marketing, campañas, publicación, conciliación, equipo, auditoría | **Solo Admin** | Nunca incluir API pública/cliente para su gestión |
| Conexiones Holded / Stripe | Compartir indicadores de estado y formularios permitidos | Autoridad/tenant y permisos de escritura por empresa, no globales |

**Definición de reutilización:** plantilla y primitives visuales compartidos; **shells, navegación, loaders, API y políticas separados**. No confundir el hecho de reutilizar React components con autorizar el acceso a los mismos registros.

### 2 bis.4. Hallazgos específicos del portal actual y deuda a resolver

1. `components/dashboard/DashboardNav.tsx` tiene once entradas; puede compactarse por tareas reales. `MobileNav.tsx` tiene una selección distinta: definir una taxonomía semántica coherente escritorio/móvil.
2. `app/(protected)/dashboard/page.tsx` usa banners, KPI y flujos de onboarding; simplificar sin perder los «próximos pasos» automáticos (documentos pendientes, presupuestos, empresa).
3. Ya existe `CompanySwitcher` que actualiza empresa activa y limpia contexto visible de KIA; conservar esa barrera e introducir pruebas contra referencias de otra empresa.
4. La vista delegada de `/admin/clientes/[id]/portal` es deliberadamente **Admin**, con banda explícita y endpoints Admin; no usarla como sustituto literal del verdadero `/dashboard` del cliente.
5. `app/(protected)/layout.tsx` monta `KiaCopilotWidget` global y el layout Admin monta adicionalmente `AdminRightPanel` con su propio widget KIA: auditar **riesgo de dos interfaces/estados KIA** y elegir un dock por superficie. No asumir que ambas monturas son visibles hasta verificarlo en navegador.
6. Existe `/tenant/dashboard` protegido para tenant_admin: conservarlo estable, revisar sus rutas y guards en inventario, y evaluar adaptación visual después de estabilizar Admin y Cliente.
7. **No** migrar autenticación, suscripciones, facturación ni roles por imitar la plantilla.

### 2 bis.5. Autorización y navegación entre superficies

- `/admin` comprueba owner/admin habilitado; `/dashboard` aplica cliente y membresía de empresa; `/tenant` se limita a tenant_admin. Verificación obligatoria en cada API, no solo layout.
- Personal Admin puede acceder a su propio portal como usuario autorizado, pero un botón «Ver portal del cliente» debe abrir **vista delegada administrativamente auditada**. Nunca producir token/sesión del cliente ni suplantar identidad.
- Cada superficie tiene namespace de UI, caché, selección de entidad y permisos; invalidar datos/contexto al cambiar empresa o cerrar sesión. No heredar la empresa «seleccionada en Admin» dentro del portal cliente por accidente.
- Una empresa creada en `companies` puede no tener `auth.users`; no fabricar credenciales para mostrarla.
- Errores de autorización muestran rechazo verificable; no exponer datos en HTML o payload previo a ocultar un botón. Pruebas BOLA/IDOR y RLS obligatorias.

### 2 bis.6. Ampliación de fases y entregables

**Diseño base:** dos rutas con feature flags independientes `admin_v2` y `client_v2` (configuración segura server-side). Ambos usan `EXPERTWorkspaceTokens` y la biblioteca visual, no comparten navegación ni endpoints.

- **Fase 0 — inventario doble:** ruta, datos, acciones y permisos tanto de Admin como de Cliente; mapear `tenant_admin` y estado de KIA global; mapa comparativo de navegación y prototipos de escritorio/móvil de las dos superficies.
- **Fase 1 — Design System compartido:** tokens, layouts base, tablas, formularios, drawers, estados, accesibilidad, identidad de marca y licencia MIT; PR propia, sin tocar datos ni auth.
- **Fase 2A — Admin Shell + Contactos** (manteniendo el cronograma Admin del plan original).
- **Fase 2B — Client Shell + «Mi inicio»** con navigation simplificada, selector de empresa, notificaciones propias, KIA client-scoped y flujos de onboarding/borrador de presupuestos, con flag separado. No bloquear Admin por Client ni viceversa.
- **Fases funcionales restantes:** reutilizar por feature componentes del sistema de diseño, pero integrar cada flujo y permiso según superficie; pruebas y publicación independientes.
- **Cutover:** Admin y Cliente tienen checklist, métricas, rollback y aceptación **separados**; no sustituir `/admin` y `/dashboard` simultáneamente.

**Nuevas pruebas obligatorias:**
1. Cliente autenticado que solicita `/admin/contactos`, API Admin, campañas, mailing, cuentas de otros y herramientas KIA Admin ⇒ denegado, sin fuga de registros.
2. Admin que abre vista cliente delegada conserva sesión de Admin y todo envío/modificación queda auditado como Admin.
3. Usuario con dos empresas: cambiar empresa afecta exclusivamente al contexto autorizado y resetea KIA; documentos, facturas, pagos, Holded y reuniones no cruzan entidad.
4. Cliente sin empresa puede usar consultas/servicios personales sin crear una SL ficticia; empresa sin usuario es visible en Admin con derechos apropiados.
5. Mobile de ambas superficies: navegación y KIA sin solapamientos; prueba de lectura, subida de archivos, citas, pagos, ES/RU.
6. Cliente ve su próximo paso y estado correcto; Admin ve tarea global y canal de origen sin exponer datos ajenos.
7. Banner de delegación siempre visible en Admin cuando se consulta contexto de cliente; nunca aparece en sesión real de cliente.
8. Rollback `admin_v2` no desactiva `client_v2`, ni viceversa; las funciones compartidas permanecen compatibles.

**Decisión de alcance:** EXPERT Admin V2 sigue siendo prioridad operativa. El rediseño cliente no debe quedar fuera del diseño maestro; implementar la biblioteca visual una sola vez y planificar las dos superficies en paralelo sin despliegues acoplados.

---

## 3. Objetivos y reglas no negociables

- Una única entrada visible **Contactos** en la navegación: personas, empresas, leads, prospectos, clientes, exclientes, suscripciones, empleados/staff y directorios externos mediante filtros combinables.
- Un contacto no requiere tener portal; una empresa puede existir sin usuario asociado; empresa, persona, lead y tenant no son sinónimos.
- Máximo dos clics para localizar y actuar sobre una solicitud entrante; no perder filtros ni contexto al volver de una ficha.
- Inicio orientado al **trabajo pendiente**, no a gráficos decorativos.
- Bandeja KIA/correo, agenda, tareas y expedientes enlazados a contacto/empresa/servicio.
- Escalar de cientos a decenas de miles de registros: filtros, orden y paginación en servidor.
- Conservar origen, fuente, fecha, resumen, consentimiento y trazas sin alterar históricos contables/financieros.
- Controles por usuario, rol, empresa, operación y tenant; sin accesos laterales entre clientes.
- Ninguna acción ficticia o botón que no funcione. Todos los estados tienen carga/error/reintento/vacío.
- Mobile usable, accesibilidad AA, teclado, zoom 200 %, ES/RU y formato español de fecha/número.
- No abrir nuevo trabajo funcional ajeno al rediseño durante la fase; integrar flujos ya existentes.

**Fuera de alcance inicial:** cambiar la contabilidad de Holded, rehacer KIA, migrar Auth, migrar Stripe, rediseñar la web pública, fusionar registros automáticamente, activar campañas de marketing y habilitar EXPERT MCP (aplazado).

## 4. Sistema visual (tokens propuestos)

| Elemento | Regla de diseño |
| --- | --- |
| Estilo | Kiranism adaptado a EXPERT; componentes tipo shadcn/Base UI reutilizados selectivamente |
| Fondo | #F7F8FA, superficies #FFFFFF, separadores #E5E7EB |
| Navegación | Azul marino #0D1B2A; texto visible, no categorías solo con iconos |
| Acción primaria | Dorado EXPERT #C59A32 con contraste revisado; botones críticos no dependerán solo del color |
| Texto | #162235 principal, #617083 secundario; escala base 14-16 px |
| Alertas | Semánticas y accesibles; evitar exceso de badges coloreados |
| Densidad | Filas 44–52 px; encabezado sticky; espacios repetibles de 4/8/12/16/24 px |
| Sidebar | 232–248 px expandido, 64–72 px compacto; menú estable |
| Topbar | 56–64 px; búsqueda, empresa/contexto, notificaciones, cuenta y KIA |
| Panel 360 | Drawer 420–520 px adaptable; pantalla completa para edición compleja |
| KIA | Botón flotante + drawer temporal superpuesto, redimensionable; no reducir la anchura permanente |
| Responsive | Escritorio tabla; tablet sidebar plegada; móvil vista de filas y detalles accesibles |
| Gráficos | Solo KPI accionables; priorizar tablas y tareas sobre gráficos |
| Modo oscuro | Fase posterior; no bloquear el MVP por diseño duplicado |

Todos los componentes deben cumplir contraste, foco visible, labels, navegación de teclado y contenido responsivo. El template es guía, no fuente de permisos ni reglas de negocio.

## 5. Arquitectura de navegación definitiva

**Menú lateral persistente, ocho entradas legibles (algunas con submenú):**

| Entrada principal | Qué incluye | Principales destinos actuales a reutilizar |
| --- | --- | --- |
| 01. Inicio | Vista de jornada, alertas, próximas citas, trabajo pendiente, actividad y métricas accionables | /admin, /admin/executive, /admin/operaciones |
| 02. Contactos | **Único directorio** de personas, empresas, leads, clientes, planes, usuarios y relaciones | /admin/directorio, /admin/leads, /admin/clientes, /admin/empresas, /admin/usuarios |
| 03. Agenda y tareas | Hoy/semana, reuniones, Meet, tareas, recordatorios, seguimiento y calendario fiscal | /admin/citas, /admin/tareas, /admin/calendario-fiscal |
| 04. Expedientes | Trámites, presupuestos, documentos, checklists, RGPD y calidad documental | /admin/expedientes, /admin/presupuestos, /admin/documentos, /admin/rgpd-revisiones |
| 05. Comunicaciones | **Inbox 360** de correo, web, Telegram, formularios y escalaciones; KIA como operador | /admin/inbox, /admin/correo, /admin/emails |
| 06. Facturación | Suscripciones, facturas, pagos, Stripe, cobros, impuestos y Holded por entidad | /admin/suscripciones, /admin/pagos, /admin/rentabilidad; enlaces company-scoped |
| 07. Marketing y conocimiento | Campañas, contenidos/editorial, reseñas, mentorías, Academy, SEO, catálogo y normativa | /admin/marketing-hub, /admin/editorial, /admin/resenas, /admin/mentorias, /admin/regulatory, /admin/academy-* |
| 08. Sistema | Equipo, roles, tenants, permisos, KIA, integraciones, automatizaciones, salud y auditoría | /admin/equipo, /admin/tenants, /admin/configuracion, /admin/kia-*, /admin/seguridad |

**No** mostrar en la barra principal enlaces separados Clientes / Empresas / Leads / Usuarios / Suscripciones. Suscripciones es un filtro de Contactos y además una función operativa de Facturación, sin duplicar personas. Mantener enlaces profundos del módulo anterior con redirecciones controladas después de validar.

La barra superior dispone de: búsqueda global con tecla de acceso, ruta/breadcrumb, selector de contexto empresa solo cuando corresponda, tareas y avisos humanos, y acceso compacto a KIA.

## 6. Wireframe de escritorio (objetivo)

    ┌────────────────┬─────────────────────────────────────────────────────┐
    │ EXPERT         │ Buscar (Ctrl/⌘ K)      Empresa    Avisos   KIA      │
    │                ├─────────────────────────────────────────────────────┤
    │ Inicio         │ CONTACTOS                          + Nuevo  Exportar│
    │ Contactos  ◀   │ [Buscar persona/NIF/email/empresa…             ]   │
    │ Agenda/tareas  │ [Tipo v] [Relación v] [Origen v] [Plan v] [Más] │
    │ Expedientes    │-----------------------------------------------------│
    │ Comunicaciones │ Nombre      Tipo    Relación  Plan   Último  ⋯    │
    │ Facturación    │ Rafael…     Persona Lead      —      Hoy     >    │
    │ Marketing      │ Isabela…    Persona Mentoría  —      Oct     >    │
    │ Sistema        │ DGM S.L.    Empresa Cliente   —      Sep     >    │
    │                │-----------------------------------------------------│
    │                │ 1–50 de N; páginas | vista guardada | columnas     │
    └────────────────┴─────────────────────────────────────────────────────┘

Al seleccionar una fila, mostrar **detalle 360 en drawer**; la ruta completa se usa para operaciones complejas, conservando estado de filtros, orden, página y scroll. En móvil no usar tablas anchas sin adaptación: filas o tarjetas compactas con mismas acciones.

## 7. Especificación por pantalla y flujos

### 7.1 Inicio — mi jornada de trabajo

Orden visual: (1) obligaciones y citas de hoy; (2) conversaciones humanas que requieren respuesta; (3) tareas vencidas/urgentes; (4) expedientes bloqueados; (5) riesgos de cobro o integración; (6) indicadores por periodo. Cada fila abre el objeto original, no un panel informativo sin acción. Contador de notificaciones solo por evento nuevo significativo, no cada respuesta automática KIA.

Acciones rápidas: responder, agendar, crear tarea vinculada, completar, abrir expediente, ver empresa, revisar cobro. Se mostrarán responsables y fechas.

### 7.2 Contactos — único punto de entrada CRM/360

**Ruta canónica:** /admin/contactos. **API prevista:** /api/admin/contactos (modelo leído, autorizado, paginado).

- Un listado, **filtrado por facetas combinables**: tipo (persona/empresa); relación (lead/prospecto/cliente/excliente/contacto histórico/staff); origen (web/email/Telegram/Stripe/MentorDay/CiberEmprende/manual/red social); estado (activo/inactivo/pendiente/spam probable/prueba); cliente con suscripción (sí/no, activa/pausada/cancelada); plan; portal; Holded; país/idioma; responsable; expediente; fecha y último movimiento.
- Conservar segmentos ya guardados crm_segment y crm_summary y distinguir historial de Stripe/mentoring de peticiones activas.
- **Por defecto** vista «Por atender»; mostrar «Todos» y vistas guardadas «Clientes», «Empresas», «Históricos Stripe», «MentorDay», «Suscritos», «Spam en revisión». No convertir histórico sin actividad en lead nuevo.
- Tabla compacta: nombre o razón social, contacto principal/empresa vinculada, tipo, relación comercial, origen, situación de suscripción, siguiente tarea, última interacción, asignado y menú de acciones. Columnas configurables, buscar por nombre, email, teléfono, NIF/CIF (en servidor; datos oficiales con acceso controlado).
- «Crear» ofrece persona, empresa, lead o vincular existente; antes de crear, comprobación de posibles coincidencias por ID fiscal oficial, referencias Stripe/Holded, email/teléfono con puntuación de confianza.
- No fusionar automáticamente por email: personas distintas pueden compartir buzón. Coincidencias (en la auditoría hay 4 coincidencias de email entre leads/profiles) se presentan como **posibles relaciones** con confirmación administrativa y auditoría.
- Ficha 360: cabecera con persona/empresa y rol; Resumen, Relaciones, Tareas y citas, Comunicaciones, Expedientes, Documentos, Facturación, Integraciones, Hoja registral, Historial. Cargar paneles de forma diferida, guardar contexto al volver.
- Una persona puede representar varias empresas; una empresa puede tener varios contactos; la entidad tiene sus propias suscripciones, permisos bancarios y tenant Holded.
- Casos guía: **Rafael Corvillo e Isabela Pallarés** son dos contactos distintos relacionados con proyecto ComfyApp, sin fusionar; el expediente/reunión está vinculado a Rafael. **Josep** puede estar vinculado a SL y autónomo con planes separados. **DGM** aparece como empresa operable sin crear un usuario artificial.
- Suscripciones se consultan en Contactos y se gestionan desde Facturación. Un contacto puede tener varios planes por distintas entidades; no mostrar una única suscripción «global».
- Consentimiento marketing es un atributo independiente: conservar antiguos contactos para futuras campañas no equivale a autorización automática para envíos. La elegibilidad se determina por consentimiento/base legal acreditada, finalidad y derecho de oposición.

### 7.3 Agenda y tareas

Vista «Hoy» y «Semana» con reuniones, Google Meet, tareas creadas por KIA, fuentes y entidades. Crear tarea por reunión confirmada; solo se crean citas reales después de disponibilidad y validación. Alertas de fallos de reserva, email y calendario. Cada acción enlaza con lead/cliente y calendario. Modificar o cancelar exige permisos y notificación verificable.

### 7.4 Expedientes / Documentos / Obligaciones

Bandeja con estado, responsable, vencimiento, empresa y siguiente acción; acciones de iniciar, asignar, revisar, vincular correo/Drive, completar checklist, generar borrador y cerrar con evidencia. Documentos con procedencia, clasificación, versiones, permisos, fuente original y acceso seguro. No pedir documentos sensibles antes de necesidad operativa.

### 7.5 Comunicaciones e Inbox 360

Inbox único para correo humano, formularios, webchat KIA y Telegram, con hilo y origen (artículo, servicio, formulario, campaña), empresa y expediente. Diferenciar automáticamente respuesta KIA y mensaje humano. Escalar a humano solo cuando se necesita acción; crear tarea y notificación push. Historial de envío y respuesta en la ficha; no responder automáticamente a newsletters, no-reply, spam o avisos bancarios sin revisión.

### 7.6 Facturación y Contabilidad

Estados de contratos/planes, Stripe, Holded, cobros, facturas, vencimientos, conciliaciones y evidencias por entidad. Acciones financieras con aprobación, auditoría y control de roles. Respetar **EXPERT Asesorías** como entorno de prueba y **Expert Consulting** como contabilidad propia; nunca usar el mismo NIF para decidir tenant. No recrear ni reescribir facturas, pagos, apuntes o histórico.

### 7.7 Marketing, contenido y Academy

Campañas solo con segmentos jurídicamente habilitados; segmentación por actividad/origen/interés separada del permiso de contacto. Repositorio de artículos y servicios (ES/RU), SEO, revisión editorial, reseñas y respuestas, mentorías y Academy. Mantener fuentes oficiales para normativa y separar borrador de publicado. Métricas de conversión por procedencia, no solo número bruto de leads.

### 7.8 Sistema, seguridad e integraciones

Equipo y perfiles; permisos; organizaciones/tenants; conexiones Google/Holded/Stripe; salud KIA; automatizaciones, cron y webhooks; auditoría. Mostrar estado de conexión, fecha de última sincronización, capacidades efectivas del token y quién lo autorizó. Secretos nunca visibles. KIA puede preparar acciones, pero las sensibles requieren confirmación.

## 8. Modelo de datos y API (sin migración prematura)

**Mantener fuentes de verdad existentes:** auth.users/profiles; companies; profile_companies; leads; subscriptions; internal_tasks; appointments; cases; client_integrations; lead_stripe_customers; email_threads/email_inbox_cache; documentos y registros de KIA.

Crear en capa de servicio de lectura un **contact-directory resolver** (por ejemplo lib/admin/contacts-directory/) que devuelve objetos normalizados:

| Campo de lectura | Semántica |
| --- | --- |
| entity_key | Clave estable con tipo + ID de origen (persona, lead o empresa) |
| subject_type | person / company |
| source_ref | Fuente original e ID; nunca inferidos del nombre |
| display_name / contact_methods | Datos visibles según rol y privacidad |
| relationships | IDs validados entre persona, empresa, proyecto, lead y suscripción |
| commercial_roles | lead, prospect, customer, historical, staff; roles pueden coexistir |
| source / source_key / crm_segment / crm_summary | Procedencia inmutable y clasificación reversible |
| subscription_summary | Derivada de suscripciones activas por empresa/persona con fuente y fecha |
| activity_summary | Última interacción real y siguiente acción, sin inventar motivo |
| security_scope | Empresa, permisos y origen de las operaciones autorizadas |
| potential_duplicates | Solo sugerencias, nunca fusión implícita |
| marketing_status | Estado legal separado de clasificación comercial |

**Primer enfoque:** unir fuentes lógicamente sin escribir migraciones de identidad. Crear relaciones persistentes adicionales solo cuando una evaluación de casos reales demuestre necesidad; migraciones verificables, RLS, índices y Security Advisor.

**API:** listado con filtros aplicados en servidor, cursores o páginas con límites, count coherente, orden estable por última interacción/ID, búsquedas normalizadas, respuestas tipadas, autorizadas y sin credenciales. Evitar cargar las 811+ filas al navegador y hacer joins ambiguos por email. Ningún endpoint admin expone datos al público.

**Contratos:** control de empresa/usuario por cada llamada; validación Zod de parámetros y acciones; idempotencia para creación de tareas, reuniones y pagos; eventos/audit log de mutaciones; métricas por segmento derivadas de consulta idéntica.

## 9. Arquitectura de componentes (reutilización)

Implementar bajo componentes/admin/v2/ y lib/admin/contacts-directory/ en PRs acotadas:
- AdminWorkspaceShell: navegación textual y topbar, responsive, breadcrumb, estados.
- AdminDataTable: encabezados configurables, filtros URL, selección, paginación server-side, exportación autorizada.
- ContactFilters + SavedViews: facetas, chips, vista actual y URL copiable.
- ContactDrawer + Contact360Tabs: relación persona/empresa, acciones y historial.
- WorkQueue: tareas/citas/casos/avisos con prioridades.
- UnifiedInbox: hilo, contacto y derivación KIA.
- KiaDock: botón persistente discreto + panel contextual superpuesto, foco y cierre por teclado.
- ConfirmActionDialog, ProvenanceLabel, StatusIndicator, PermissionGate: validaciones y evidencias compartidas.

No introducir una biblioteca completa sin necesidad. Evaluar TanStack Table y piezas shadcn solamente si ahorran código y se prueban con las versiones exactas del proyecto. Mantener dependencias bloqueadas en package-lock y registrar copyright/licencia cuando se copie código significativo.

## 10. KIA, productividad y seguridad

- KIA recibe contexto de la fila/empresa/expediente desde selección explícita; la ausencia de expediente nunca autoriza inferir por qué escribe un usuario.
- KIA ayuda a buscar, resumir, preparar respuestas, clasificar, crear borradores y tareas; solicita confirmación antes de enviar, cobrar, editar registros oficiales, conciliar o escribir en Holded.
- KIA no tapa la tabla; en escritorio abre drawer o modal redimensionable por encima de la vista. En móvil, pantalla completa accesible.
- Proteger RBAC del Admin y las autorizaciones company-scoped incluso al ejecutar herramientas KIA; no depender del filtro de pantalla para la seguridad.
- No duplicar notificaciones por cada interacción. Alertar por lead humano, error serio, tarea nueva y reunión confirmada/cancelada.
- Auditar acciones y origen real; redactar logs de PII, preservar consentimiento marketing y permitir exportación/borrado legalmente procedente.

## 11. Migración de rutas: con compatibilidad

**Nueva ruta canónica de directorio:** /admin/contactos. No eliminar rutas actuales en Fases 0–2:
- /admin/directorio → Contactos (cuando esté completo y probado).
- /admin/leads → Contactos con filtro CRM.
- /admin/clientes → Contactos con filtro cliente.
- /admin/empresas → Contactos con filtro empresa.
- /admin/usuarios → Contactos con filtro usuario/portal.
- /admin/suscripciones → **mantener operativa dentro de Facturación** y enlazar desde la ficha del contacto.

Preservar /admin/clientes/[id], /admin/empresas/[id] y rutas subordinadas hasta migrar y validar todas las acciones. Los deep links con ID no deben convertirse en redirecciones ciegas sin mapeo de tipo. Mantener rutas y API actuales mientras el nuevo módulo se valida. Corregir búsqueda global, navegación móvil y CTA internos al nuevo destino solo tras pasar aceptación.

**PR #684:** reutilizar su lectura de crm_segment y filtros, **pero no consolidar otra pantalla de Leads como destino definitivo**; adaptar funcionalidad al directorio unificado antes de jubilar rutas.

## 12. Plan de implementación por fases, con PRs pequeñas

| Fase | Entregable | Riesgo / dependencia | Salida exigida |
| --- | --- | --- | --- |
| 0. Inventario y UX | Matriz ruta → propietario → datos → acciones → permisos; captura de flujos existentes, diseño de componentes, tokens y mockups escritorio/móvil | No alterar producción | Plan de contratos y pruebas aprobado |
| 1. Shell V2 | Sidebar, topbar, KiaDock, navegación con feature flag admin_v2, sin eliminar shell actual | Mantener Admin Auth y móvil | Pruebas visuales + accesibilidad y rutas |
| 2. Contactos | Resolver de lectura, filtros server-side, tabla compacta, vistas guardadas, drawer 360 inicial | Identidad y CRM, PR #684 | Muestras/contadores consistentes con fuentes, 811 leads accesibles, sin fusionar |
| 3. Agenda e Inbox | Lista «Mi jornada», reuniones/tareas, escalaciones y notificaciones | Calendar/Email/KIA ya existentes | E2E evento → lead → tarea → aviso |
| 4. Expedientes | Ficha 360 contextual, docs, tareas, checklists y acciones | Autorización por cliente/empresa | Enlaces de ida y vuelta sin pérdida de contexto |
| 5. Finanzas | Planes y pagos enlazados al contacto y entidad; vistas Holded/Stripe | Integridad financiera y permisos | Cero cruce de tenants; solo escritura autorizada |
| 6. Marketing/Sistema | Reorganizar edición, reseñas, Academy, contenidos, integraciones y equipo | Filtros marketing legales | Sin duplicar herramientas ni crear falsas oportunidades |
| 7. Cutover y limpieza | Activación gradual, redirecciones, quitar accesos antiguos, documentación | Regresión integral | Métricas estables, rollback ensayado |

Cada fase en PRs separadas: **infraestructura visual → lectura/API → UI y acciones → pruebas → habilitación**. No fusionar una reescritura masiva. Evitar crear un nuevo «mega-dashboard» antes de completar la navegación y Contactos.

## 13. Criterios de aceptación funcionales y de calidad

1. Solo existe una entrada visible «Contactos» en escritorio y móvil; desde ella se encuentran todos los perfiles, 811 leads históricos y todas las empresas autorizadas.
2. Búsqueda por nombre/email/teléfono/NIF recupera resultados relevantes y filtrados en servidor; combina filtros (empresa + cliente + suscripción activa + Holded).
3. Los 811 registros clasificados mantienen crm_segment, crm_summary, source y source_key; sin borrados o reescrituras de eventos Stripe.
4. Cuatro coincidencias de correo del corte auditado generan alerta de posible duplicado, pero ninguna fusión automática.
5. Desde Rafael/ComfyApp se abre cita, tarea y expediente y vuelve a Contactos conservando filtro. Isabela conserva ficha separada y vínculo al proyecto cuando esté validado.
6. Desde empresa con dos contactos se ven relaciones correctas; empresa sin portal abre Company 360; persona con varias empresas no mezcla documentos, cobros ni planes.
7. Contabilidad propia EXPERT va a Expert Consulting; pruebas de Asesorías no aparecen en ella. Un token ajeno produce 403, no resultados vacíos de otra empresa.
8. Usuario sin permiso Admin no puede leer API ni ejecutar acciones desde KIA; RLS y autorización comprobados en servidor.
9. Móvil: búsqueda, tabla compacta, filtro, drawer y KIA utilizables sin textos cortados ni scroll horizontal global.
10. KIA cerrado deja anchura completa. KIA abierto no tapa formularios ni impide completar una acción; Esc/foco accesibles.
11. Cada CTA navega o muta de verdad; errores y estados vacíos explicados. Confirmación de reuniones incluye Meet/email/tarea e informe de fallo recuperable.
12. Exportación Excel de 500+ resultados: filas y columnas filtradas por permisos, formato español y trazabilidad; sin datos de otro tenant.
13. Permisos de marketing no cambian por el simple hecho de importar contactos históricos; campañas solo a públicos jurídicamente habilitados.
14. CI: typecheck, lint, unit/integration, tests por módulo, Vercel app y ksenia-expert verdes. Pruebas manuales de móvil y escritorio y verificación posdespliegue documentadas.
15. Presupuesto operativo de respuesta: primer render y filtrado suficientemente rápidos con 1.000/10.000 registros sintéticos; p95 API de listado objetivo < 800 ms en entorno adecuado, medido y no supuesto.

## 14. Riesgos, controles y rollback

| Riesgo | Prevención |
| --- | --- |
| Mezcla accidental persona/empresa/lead | Identidad con tipo+ID y coincidencias como sugerencias; auditoría de vínculo |
| Duplicar o perder historial | Resolver de solo lectura inicialmente; no mover ni eliminar filas; pruebas de reconciliación |
| Pérdida de deep links | Compatibilidad de rutas y fallback hasta cutover |
| Cambios financieros involuntarios | Reutilizar endpoints autorizados; confirmación; sin escrituras durante rediseño |
| Acceso entre tenants Holded | Resolver company-scoped; tests negativos DGM/EXPERT/Asesorías |
| Credenciales en el cliente | Nunca; los tokens se resuelven server-side |
| Datos históricos usados para spam publicitario | Marketing_status independiente; consentimiento/base legal verificables |
| Nuevo panel más complejo que anterior | Medir tareas frecuentes: localizar, responder, agendar, crear expediente, cobrar |
| Regresión por pegar template completo | Selección de componentes, revisión de dependencias, MIT attribution |
| Interrupción de producción | Feature flag por rol/admin, despliegue progresivo y rollback simple al shell anterior |

**Rollback:** si el nuevo panel falla, desactivar admin_v2 y restablecer navegación previa, sin revertir datos ni permisos; retirar redirecciones solamente después del cutover verificado. Mantener logs y snapshot funcional de la etapa anterior.

## 15. Definition of Done y secuencia inmediata

Para declarar una pantalla lista deben estar completos: UI responsive, datos reales, permisos de servidor, estados vacíos/error, edición y confirmación cuando proceda, enlaces contextuales, auditoría, pruebas automatizadas, manual móvil/desktop, traducciones necesarias y rollback.

**Primera implementación aprobada por este plan:**
1. Crear inventario final y pruebas de rutas y permisos de Admin; documentar capturas del diseño antiguo.
2. Preparar design tokens y shell EXPERT V2 detrás de feature flag, usando únicamente componentes MIT de Kiranism que aporten valor.
3. Implementar modelo de lectura Contactos que incluya leads, perfiles, empresas, relaciones y suscripciones, con filtros server-side.
4. Probar flujos Rafael/Isabela, Josep, DGM e identidades duplicadas antes de ocultar Clientes/Empresas/Leads.
5. Presentar versión previa escritorio y móvil; tras aceptación, continuar con Agenda e Inbox.

**Responsabilidades:** dirección EXPERT aprueba experiencia y prioridades; desarrollo integra código, migra rutas y mantiene tests; KIA actúa como asistente contextual bajo las mismas autorizaciones. No se comprometen fechas calendario sin medir dependencias.

## 16. Referencias y decisiones relacionadas

- docs/admin-360-unified-directory-plan.md — identidades, vínculos, delegación Admin.
- docs/admin-360-compact-redesign-backlog-2026-10-09.md — requisitos CRUD, navegación y Excel; reinterpretar «NO IMPLEMENTAR AHORA» como antecedente anterior a la nueva autorización de planificación por fases.
- docs/admin-improvement-plan.md — IMP-025..033 y flujos existentes.
- docs/expert-os-data-model.md — fuentes existentes, revisar actualidad frente a migraciones reales.
- PR #684 — filtros de leads creados antes de la decisión de Contactos unificado: aprovechar los cambios, no adoptar su destino como nuevo módulo separado.
- Kiranism Next Shadcn Dashboard Starter — MIT, referencia técnica, no base de autenticación ni de facturación.

### Historial de decisiones

- 09/10/2026: elegir **Kiranism adaptado a EXPERT**; una sola entrada **Contactos**; nuevo shell integral, datos canónicos conservados y migración segura por fases.
- 09/10/2026 (ampliación): definir **dos productos con un design system común** (Admin Workspace y Client Workspace), shells, navegación, KIA y permisos específicos; preservar vista cliente delegada y tercera superficie tenant.
- EXPERT MCP continúa **aplazado** y fuera de alcance de este plan hasta decisión explícita.
