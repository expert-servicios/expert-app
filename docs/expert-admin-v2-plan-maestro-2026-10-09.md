# EXPERT Admin V2 — Plan maestro de rediseño integral

**Fecha:** 09/10/2026  
**Decisión:** Aprobado el diseño objetivo y su ejecución por fases. **Este documento es especificación; no supone un despliegue ni una migración de datos.**  
**Propietario de producto:** Dirección EXPERT  
**Alcance:** diseño transversal EXPERT Workspace con **Panel Admin** y **Portal Cliente** separados; KIA, Contactos 360, operaciones, comunicaciones, agenda, facturación, contenido y administración. Se documenta además la compatibilidad con el panel específico de administradores de tenant.  
**Estado:** LISTO PARA INICIAR FASE 0. Implementación bajo PRs independientes, CI, seguridad y verificación de producción.  
**Plan rector:** este documento prevalece sobre los borradores visuales anteriores; conserva sus requisitos operativos válidos.

**Ampliación aprobada 09/10/2026 — KIA Work + Inbox 360 + Finanzas Holded + Hoja Registral:** requisitos vinculantes en §§17–22. Se completa **primero la planificación y validación**, antes de activar nuevos ejecutores, automatizaciones o métricas financieras. La implementación no está declarada operativa por el mero hecho de documentarla.

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

## 2 ter. Modo soporte: operar en el portal del cliente desde Admin (decisión 09/10/2026)

**Decisión de producto:** implementar **«Abrir portal del cliente · Modo soporte»** como vía principal para dar de alta y configurar el espacio del cliente desde EXPERT, **sin exigir que el cliente haga por sí mismo todas las operaciones** y sin generar un segundo conjunto de pantallas de configuración Admin. Mantener una ficha Contacto 360 mínima para búsqueda, identidad, relaciones, historial y acciones rápidas. Reutilizar componentes de las pantallas reales del portal cliente en vez de duplicarlos.

### 2 ter.1. Auditoría de lo que existe hoy

- `/admin/clientes/[id]/portal` YA existe y muestra una vista delegada identificada, cargada desde `/api/admin/clientes/[id]`. Mantiene la sesión del Admin y enlaza a expedientes, documentos, suscripciones, integración, etc.; **no es todavía el portal real completo ni integra todos los formularios operativos en línea**.
- `/admin/clientes/[id]/integraciones` y `/admin/empresas/[id]/integraciones` ya ofrecen conexiones Holded administradas: selección de entidad, comprobación del token, cifrado, permisos y confirmación de autorización. Esas capacidades se deben reutilizar, no reconstruir.
- `/dashboard` y sus pantallas actuales llaman a endpoints de cliente como `/api/profile`, `/api/companies`, `/api/subscriptions`, `/api/cases`. **No basta con redirigir a un Admin hacia `/dashboard`: seguiría viendo su propia identidad, no la del cliente**. Tampoco debe modificarse el cliente HTTP para que admita IDs arbitrarios.
- `/api/admin/clientes/[id]` ya implementa algunos PATCH administrativos sobre datos de perfil y valida pertenencia al cambiar empresa activa. Mantener controles de servidor y auditoría, endurecer donde sea necesario.
- `/dashboard` tiene un selector de empresa y KIA contextual; el modo soporte debe usar **un contexto delegado independiente**, sin cambiar el `active_company_id` del cliente ni el del administrador.

### 2 ter.2. Cómo se usa

1. Desde **Contactos**, buscar una persona o empresa y pulsar **«Abrir portal · Modo soporte»**. Solo usuarios owner/admin o staff con permiso específico podrán hacerlo; nunca un cliente.
2. Abrir un workspace con **barra persistente y visible**: «Modo soporte · Estás trabajando con [persona/empresa] · Administrador [actor]», selector de empresa autorizada y botón **«Salir del modo soporte»**.
3. Mostrar el mismo **contenido y navegación de portal** que vería ese cliente, con elementos adicionales autorizados «Configurar», «Verificar», «Editar datos permitidos» y «Crear tarea». No superponer pantallas Admin inconexas.
4. Cambiar entre Resumen, Empresas, Integraciones, Documentos, Expedientes, Citas, Facturación y Suscripción sin abandonar el contexto del cliente. Mantener filtros, empresa seleccionada y retorno a Contactos.
5. Al guardar, mostrar resultado real y auditoría; si la integración requiere actuar por parte de un tercero, mostrar estado **«Requiere autorización del titular»**, generar enlace/instrucciones y tarea, no simular éxito.

### 2 ter.3. Arquitectura de reutilización sin impersonación

**Reutilizar pantallas de presentación, no sesiones, credenciales ni privilegios.**

```text
Admin (/admin/contactos) ──▶ Abrir portal · Modo soporte
                                    │
                                    ▼
                  /admin/soporte/[tipo]/[id]?companyId=...
                  [SupportSession: actor=admin, subject, company, audit]
                                    │
                ClientPortalFeature Components (UI compartida)
                      /                              \
            ClientDataAdapter                   AdminSupportAdapter
       auth.uid + membresía RLS          actor auth.uid + permiso de delegación
         /api/* del cliente              /api/admin/soporte/* company-scoped
                      \                              /
                         Servicios de dominio
         (integraciones, expediente, docs, suscripciones, citas)
```

- La ruta propuesta `/admin/soporte/[tipo]/[id]` es ilustrativa, a validar en Fase 0 frente a los enlaces profundos existentes. Preservar `/admin/clientes/[id]/portal` como compatibilidad y punto de entrada inicial.
- **SupportContext**: actor autenticado, sujeto original con tipo e ID canónico, empresa seleccionada, modo read/write según política, scopes efectivos y correlation_id. Todos validados **en servidor por petición**, no solo al abrir el portal.
- **Adapters separados**: `ClientDataAdapter` resuelve sus propios datos; `AdminSupportAdapter` valida actor/sujeto/compañía. Ambos comparten componentes, validación de formularios y servicios de negocio autorizados; los endpoints Admin nunca quedan disponibles desde el cliente.
- Sin JWT de cliente, sin contraseña de cliente, sin `auth.signInAsUser`, sin inyección de una `user_id` controlada por navegador en consultas privilegiadas; la sesión que ejecuta cada acción **es siempre la del Admin**.
- No compartir caché o estado local entre sujetos; clave de caché incorpora actor, tipo/ID, companyId y modo; invalidar al cambiar de contexto. No persistir tokens sensibles ni datos de terceros en browser storage.

### 2 ter.4. ¿Qué puede configurar realmente el Admin?

| Función | Desde modo soporte | Condición |
| --- | --- | --- |
| Alta/edición de datos operativos, contactos, direcciones, vincular empresa | **Sí** | Validación server-side, identidad oficial verificada bloqueada o con proceso de rectificación |
| Crear expediente, tarea, checklist, solicitud documental, seguimiento | **Sí** | Empresa, actor y fuente identificables; guardar auditoría |
| Preparar reserva, confirmar/reprogramar cita y comunicaciones | **Sí** | Disponibilidad real, consentimiento/confirmación cuando aplique, Meet e invitaciones verificadas |
| Activar productos y planes EXPERT, consultar pagos, resolver incidencia Stripe | **Sí, según permisos** | Respetar términos, facturas y reglas de cobro; no facturar en nombre del cliente sin base/confirmación |
| Conectar/configurar Holded de una empresa | **Sí** | Cuenta/tenant correcto, token autorizado por titular o licencia asesoría administrada, permisos y alcance empresa, auditados. Solo lectura inicialmente |
| Google/Meta/OAuth de cuentas **del cliente** | **No automáticamente** | Si el proveedor exige login/consentimiento del titular, debe completar OAuth él mismo o conceder delegación válida. Admin prepara el enlace y verifica el estado |
| Acceso a documentos sensibles o datos laborales | **Según autorización específica** | Minimización, rol, finalidad, empresa, RGPD y consentimiento/mandato cuando proceda |
| Escritura contable, banca, bajas, borrado, cambios fiscales oficiales | **Solo flujos ya autorizados y con confirmación** | No ampliar permisos por estar en modo soporte; prohibir operaciones irreversibles no implementadas |

**Permiso EXPERT ≠ permiso de tercero**: tener rol Admin no concede automáticamente acceso a banca, Google, Meta, Holded ni información laboral. El panel debe explicar qué autorización falta y permitir una solicitud verificable sin pedir contraseñas.

### 2 ter.5. Seguridad, UX y supervisión

- Mostrar una banda de «Modo soporte» siempre, con nombre de cliente/empresa, empresa activa, identidad del operador y atajo «Volver a Contactos»; jamás camuflarse como sesión real de cliente.
- No permitir entrar al portal de un cliente solo con sustituir ID en la URL (BOLA/IDOR). Validar permiso de **staff + subject + company + acción**; protección RLS y auditoría para cada lectura/escritura sensible.
- `support_action_log` (concepto: registro de auditoría o tabla existente compatible) con actor, sujeto, entidad, tipo de cambio, origen, antes/después permitidos, fecha, IP/trace según política. Crear migración **solo si** el inventario muestra que las tablas de auditoría existentes son insuficientes.
- Evitar dualidad de «modo read-only» y «modo edición» implícita: permisos granulares por acción y confirmaciones explícitas en destructivas, externas o económicas.
- En caso de cliente con varias empresas, seleccionar entidad explícitamente, no resolver por coincidencia de CIF/nombre ni por la última API key Holded usada.
- Entorno de prueba: EXPERT Asesorías; contabilidad propia EXPERT Consulting es conexión distinta; nunca mezclar su contexto o permitir mutación por simple cambio de cliente.
- Conservar portal real ligero y seguro: el cliente no ve barras de soporte, listas globales, campañas ni botones internos. No duplicar widget KIA; usar configuración KIA por superficie y permisos reales.

### 2 ter.6. Diseño y fases concretas

**Fase 0 (inventario):** enumerar qué pantallas de `/dashboard` pueden compartir contenido con modo soporte; identificar qué rutas Admin existentes ya permiten CRUD; mapear acciones que necesitan OAuth/mandato; pruebas de identidades y empresas. Sin escrituras contables.

**Fase 1 (base):** componente `SupportWorkspaceShell`, bandera `support_mode_v1`, barra de identidad, salida al mismo filtro de Contactos, permisos y auditoría de evento de entrada/cambio/salida. Primer prototipo **solo lectura** de Resumen / Mis empresas / estado Holded.

**Fase 2 (configuración):** reutilizar el formulario operativo de perfil y la conexión Holded autorizada desde **el contexto de portal**, apuntando a endpoints Admin existentes; idempotencia, validación y logs. No intentar OAuth como cliente.

**Fase 3 (operaciones):** citas, documentos, expedientes, suscripciones/Stripe y comunicaciones en el mismo portal; nuevas APIs solo si falta acción real, no clonar UI ya disponible.

**Fase 4 (cierre):** consolidar enlaces desde Contactos y fichas 360, dejar accesos legacy como alias o redirect tras pruebas; comprobar responsive, roles, exportación y KIA.

**Criterios de aceptación:**
1. Owner abre a Rafael desde Contactos y ve ComfyApp, reunión, tareas y próxima acción; vuelve conservando el filtro.
2. Admin abre Josep, cambia empresa entre su SL y su contexto de autónomo sin modificar la empresa activa real del cliente; conexiones/planes son independientes.
3. Admin abre DGM, que puede ser empresa sin usuario, y configura un tenant Holded permitido sin crear un perfil ficticio.
4. Un cliente, tenant_admin o staff sin permiso delegado que intenta `/admin/soporte/*` y su API recibe 403. Cambiar IDs/companyId manipulando URL no devuelve información ni modifica registros.
5. Entrada, selección de empresa, configuración, salida y fallo quedan atribuidos al operador real en auditoría; no se registran secretos.
6. OAuth de cuenta privada bloquea configuración automática sin autorización y ofrece solicitud al titular.
7. El portal del cliente conserva exactamente sus permisos y no muestra controles Admin, aunque comparta componentes.
8. Todo botón de guardar refleja persistencia real y el mismo cambio puede verificarse desde otra vista. Rollback independiente mediante feature flag.
9. KIA en modo soporte usa el contexto de empresa explícitamente seleccionado y no puede ejecutar acciones de cliente en un tenant distinto.

**Consecuencia en el plan:** se reduce el alcance de los formularios duplicados de «Ficha 360 administrativa». La ficha de Contactos es una **tarjeta de identidad + relaciones + timeline + acciones**, mientras que la configuración completa se realiza desde **Portal en modo soporte**. Esto **no elimina** las funciones de back-office que nunca deberían existir en un portal cliente (campañas, Inbox general, conciliaciones globales, auditoría del equipo), ni convierte el soporte en impersonación.

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
- 09/10/2026 (modo soporte): la configuración cotidiana se realizará desde **Portal del cliente en modo soporte** por Admin autorizado, reutilizando la UI Cliente y APIs Admin, con actor real y trazabilidad, evitando desarrollar formularios duplicados.
- EXPERT MCP continúa **aplazado** y fuera de alcance de este plan hasta decisión explícita.


---

## 17. Decisión transversal: KIA Work, Inbox 360, Holded y Hoja Registral (ampliación 09/10/2026)

**Orden de ejecución solicitado por Dirección:** actualizar y consolidar este plan maestro **antes** de iniciar los nuevos desarrollos funcionales. La creación de este documento no habilita escrituras, notificaciones masivas, reuniones automáticas ni sincronizaciones adicionales. Mantener las PR #686 (auditoría de soporte), #687 (KIA dock) y #688 (contrato fail-closed de acciones) como incrementos separados sujetos a CI y aceptación; este plan les da encaje transversal sin introducir cambios de API.

**Decisiones de producto:**

1. Un **único EXPERT Workspace** con shells de Admin y Cliente diferenciados, design system común y KIA Copiloto en panel contextual persistente, replegable y responsive. La interfaz KIA se reutiliza; no duplicar conversación ni instancia por superficie.
2. **Operations 360 / Inbox 360** en /admin/inbox es la bandeja omnicanal canónica. «Vox» es el nombre mencionado en la conversación, **no** justifica crear una segunda bandeja, esquema ni ruta. Verificar internamente si existe denominación comercial Vox antes de renombrar elementos.
3. KIA podrá **leer, razonar, proponer, solicitar aprobación, ejecutar una capacidad autorizada, verificar y auditar** desde chat Admin o chat Cliente, según sus permisos. Un mensaje no otorga privilegios especiales ni equivale siempre a consentimiento suficiente.
4. La **Hoja Registral v2** es el contexto persistente por cliente/persona, empresa y expediente; contiene hechos confirmados, eventos y **reglas de trabajo/instrucciones operativas**, con procedencia y versiones. No crear un campo de texto descontrolado que se inyecte como «system prompt».
5. Holded permanece **fuente contable** de cada empresa; EXPERT centraliza un **servicio de métricas autorizado** que consumen exactamente los mismos componentes de Admin, Cliente y KIA, filtrado por empresa, periodo y derechos.
6. **Un motor KIA compartido, perfiles virtuales distintos por entidad**, no una instancia desplegada de IA por cliente. Contexto e instrucciones se resuelven en el servidor por sujeto canónico, compañía y expediente. Los subagentes profesionales actuales se pueden reutilizar, sin crear copias por cliente.

**Inventario real contrastado antes de esta decisión:**

- Bandeja y orquestación: app/api/admin/inbox/route.ts, lib/admin/operations-360-inbox.ts, /api/admin/inbox/control, /reply, /reassign, /escalate y /timeline; canal Telegram con takeover humano.
- Notificaciones: lib/integrations/push.ts, public/sw.js, push_subscriptions, lib/admin/case-admin-notifications.ts y app/api/cron/email-sync/route.ts; existen rutas que ya generan avisos, por lo que integrar una capa de deduplicación sin doble envío.
- KIA: app/api/ai/kia/route.ts, kia-tool-definitions, kia-tool-registry, kia-policy-profiles, kia-actor-capability-resolver y kia-workspace-actions/contract.ts (si se fusiona #688). «client_dashboard» y «admin_copilot» siguen principalmente en lectura R1.
- Holded: lib/integrations/holded/holded-gateway.ts, lib/holded/quarter-data.ts, lib/reports/report-generator.ts, /dashboard/estado-empresa y componentes dashboard/company-status; hay lecturas e informes reales, **no un estado contable universal de pérdidas y ganancias validado**.
- Hoja Registral: docs/kia-client-ledger.md, docs/kia-2-strategy.md, tablas client_registry_subjects/events/facts/instructions/period_summaries, endpoint app/api/admin/empresas/[id]/registro/route.ts y editor CompanyRegistryPanel. Las instrucciones confirmadas tienen scope, priority, source_ref, vigencia y sustitución.

## 18. Inbox 360 como centro de operaciones KIA

### 18.1. Flujo canónico único y trazable

Evento entrante (correo, Telegram, formulario, webchat, chat portal, Meta/Google/LinkedIn solo si hay conector operativo autorizado)
→ ingestión y deduplicación
→ resolver identidad sin uniones automáticas débiles
→ vincular lead/cliente/empresa/expediente si existe evidencia suficiente
→ cargar hoja registral e instrucciones válidas
→ clasificar intención, urgencia, necesidad humana y consentimiento
→ actualizar **el hilo existente** Inbox 360
→ generar resumen, propuesta de respuesta y *next best action*
→ materializar tarea interna idempotente cuando exista obligación operativa
→ programar/solicitar cita según política
→ emitir notificación apropiada
→ registrar evidencias, entregas, error/reintento y estados.

**Fuente canónica:** email_threads/email_inbox_cache, kia_conversations, leads, internal_tasks, appointments y eventos KIA. «Vista Inbox» es una proyección de estas fuentes, no nuevo sistema de mensajería. Se debe evitar que un correo se cuente como un lead nuevo cada vez que se sincroniza. Mantener origen de captación (artículo/formulario/campaña/red social) y vínculo a expediente. Cualquier conflicto de identidad produce elemento pendiente de revisión, no contacto unido automáticamente.

### 18.2. Reglas de automatización e intervención

| Evento o condición | KIA puede automatizar | Revisión/aprobación requerida |
| --- | --- | --- |
| Mensaje humano entrante nuevo y verificable | Registrar, clasificar, enlazar y resumir; propuesta de respuesta; badge de actividad | Respuesta externa cuando sea sensible, ambigua, regulada o requiera consentimiento |
| Solicitud de trámite/documentación | Detectar siguiente paso, crear tarea de back-office con owner y prioridad si policy lo permite | Pedir documentación al cliente solo si es pertinente y proporcional; sin asumir motivo de contacto |
| Mensaje con cita expresamente solicitada | Consultar disponibilidad; proponer slots/Meet; generar propuesta de reserva | No confirmar cita con terceros ni invitación externa sin fecha/hora y consentimiento verificables |
| Trabajo interno que requiere una reunión | Crear borrador/recordatorio o bloqueo interno conforme a reglas aprobadas | Convocatoria externa, cambios o cancelaciones importantes requieren confirmación |
| Respuesta automática de KIA o sincronización repetida | Actualizar hilo y log sin reabrir oportunidad | No disparar un push de «mensaje humano nuevo» ni crear tarea duplicada |
| Requerimiento administrativo, banco, cobros, conflicto legal | Clasificar como riesgo/fecha límite y escalar con prioridad alta | Sin respuesta jurídica concluyente ni actuaciones irreversibles automáticas |

**Notificaciones push:** reutilizar PushApp VAPID y las suscripciones existentes; emitir *un solo aviso relevante* por nuevo mensaje humano, lead nuevo o tarea que requiera acción. Añadir correlación event_id/source_key, destinatario/rol, dedupe, cooldown por conversación, preferencias y agrupación; proteger PII en el texto de push. Notificar especialmente errores silenciosos de KIA, escalaciones, tareas críticas y reuniones confirmadas. No avisar por cada respuesta automática KIA, lectura, polling o renovación de sync. Mostrar notificaciones en «Mi jornada» y badge Inbox incluso si el navegador deniega push; registrar delivery_state y enlaces profundos con comprobación de permisos al abrir. Integrar con notificación por correo/Telegram únicamente cuando esté configurada, sin duplicidad no deseada.

**Tareas:** ID correlacionado con mensaje/hilo/expediente, responsable, vencimiento, prioridad, motivo y reglas de dependencia. Dedupe por intención + origen/periodo, no solo hash del texto. Distinguir tarea propuesta, aprobada, abierta, bloqueada, finalizada; no cerrar por una mera respuesta del modelo. El propio Workspace mostrará agenda diaria combinando tareas y citas.

**Reuniones:** usar el proveedor de calendario conectado como única autoridad para disponibilidad, timezone Europe/Madrid, idempotencia de reserva y confirmación real de Calendar/Meet/correos. «Cita creada» solo después de verificar ID proveedor y hora. Al cancelar o cambiar, actualizar la misma referencia y enviar notificaciones correctas. Si no existe permiso de escritura, preparar borrador con botón «Confirmar» o derivar a persona.

**Cierre de fase:** recorridos E2E correo, Telegram y web → Inbox → KIA → tarea/aviso/cita; mensaje duplicado y webhook repetido no multiplican push/tareas; takeover manual desactiva el envío automático KIA; permisos cross-client fail-closed. No promocionar como «todos los canales activos» los conectores que no estén operativos.

## 19. Finanzas Holded: fuente única para Admin, Cliente y KIA

### 19.1. Separar producto y métricas

**No crear dos pipelines contables.** Implementar un servicio interno, por ejemplo \`lib/finance/company-metrics\`, sobre el gateway Holded e informes actuales. El servicio expone lecturas autorizadas de una **empresa concreta** y periodo (mes, trimestre, año), agregando solo en vistas Admin cuando sea lícito y solicitado. Una empresa puede estar vinculada a varias personas y usar tenant Holded exclusivo; nunca escoger tenant por coincidencia de nombre/CIF ni por último token utilizado.

**Tres consumidores con datos y permisos distintos:**

- **Admin / Operación financiera:** selector de empresa, ventas, compras, cobros/pagos, tesorería accesible, incidencias, conciliación, conectividad y evolución. La rentabilidad de **EXPERT propia** se obtiene únicamente de su empresa contable correcta; los totales de cartera de clientes se etiquetan «cartera gestionada», **nunca ingresos de EXPERT**.
- **Cliente / Mi empresa:** solo entidades vinculadas que tenga derecho a consultar, indicadores del periodo, gráfica, deudores/pagos si autorizado, pendientes y fecha de actualización. Sin exponer sueldos/PII laboral ni información bancaria por defecto. Si no tiene contrato/capability o conexión autorizada, estado sin datos y acción adecuada; no forzar suscripción mensual abolida del catálogo comercial.
- **KIA / Tool de métricas:** leer exactamente el mismo resultado normalizado y autorizado por empresa/periodo; incluir fecha, origen, completeness y notas de cálculo; responder sin inventar números ni crear datos en Holded. No recoger métricas raspando DOM ni confiar en un cálculo generado libremente por el LLM.

### 19.2. Definiciones contables explícitas

| Indicador | Cálculo/fuente aceptada | Presentación |
| --- | --- | --- |
| Ventas / ingresos facturados | Documentos emitidos válidos del periodo, separación base imponible, impuestos, abonos, moneda, fechas y estados | Facturación documental, no cobros |
| Compras / gastos facturados | Documentos recibidos válidos, excluyendo anulados, con su tratamiento contable y clasificación | Gastos documentados; no coste total de la empresa |
| Cobrado/pendiente | Vencimientos y conciliación de cobros de la fuente autorizada | Separado del devengo; no sumar dos veces |
| IVA repercutido/soportado | Importes verificados de documentos, con exclusiones/ajustes pertinentes | Indicativo, no Modelo 303 definitivo |
| Tesorería | Saldo de cuentas habilitadas según fecha y permisos de Holded | Con marca de cobertura, no deducir «beneficio» |
| Diferencial simple | Ventas documentadas menos compras documentadas a igual base y periodo | Etiqueta «diferencial documental», **nunca «beneficio»** |
| Resultado contable / beneficio | Pérdidas y ganancias o mayor verificado y conciliado: ingresos, gastos reales, personal, amortizaciones, ajustes, periodificaciones y otros conceptos aplicables | Mostrar «resultado provisional» solo si cobertura suficiente; si no, «No disponible» |
| Margen, evolución y tendencia | Fórmulas explícitas sobre series comparables | Indicar límites y origen; sin pronósticos presentados como hechos |

**Riesgos a evitar:** cifras con IVA frente a netas; signo de rectificativas; borradores, duplicados, créditos; compras que no son gastos; gasto salarial/amortizaciones no documentadas como facturas; saldo ≠ beneficio; moneda no EUR; empresa patrimonial con arrendamientos y amortización; periodos contables cerrados; informes P&L incompletos. Un fallo de Holded parcial no equivale a cero. No sobrescribir contabilidad ni históricos para «hacer cuadrar» el dashboard.

### 19.3. Contrato de datos, cache y UI

Propuesta \`CompanyFinancialSnapshot\`: companyId, integrationId (no token), periodo/inicio/fin, timezone, currency, basis (invoice/ledger/pnl), salesNet, purchasesNet, cashReceived, cashPaid, receivables, payables, vatBalances, bankBalance, accountingProfit *nullable*, profitQuality (verified/provisional/unavailable), completeness, warnings, lastSuccessfulSyncAt, generatedAt, sourceRefs y provenanceVersion.

Implementar adaptadores separados \`HoldedDocumentsAdapter\` y \`HoldedAccountingAdapter\`; reconciliar datos comparables con calidad por campo. Snapshots/cache **company_id + integration_id + periodo + versión**, TTL documentado, sincronización segura incremental y reintento acotado. Panel muestra «última actualización», diferencia entre dato cacheado y refrescado y error parcial. Reusar las gráficas actuales (SalesPurchasesChart, informes trimestrales) y construir nuevos componentes compartidos de métricas; Admin/Cliente con columnas y permisos distintos. No habilitar automáticamente scope de labor/bancos.

**Seguridad de acceso:** servidor comprueba actor, pertenencia/representación, tenant, contrato/entitlement efectivo, permisos Holded **habilitados** (no meramente detectados), RLS y secrets server-side. No exponer dataset bruto a KIA ni a un rol sin capability. Pruebas negativas multiempresa incluyendo distintas conexiones Holded bajo un mismo usuario. Controles de coste/cupo, paginación de documentos, sincronización de varias divisas y errores con estado recuperable.

## 20. Hoja Registral como «manual vivo» de KIA por cliente, empresa y expediente

**Decisión:** la «hoja registral que contiene el prompt de trabajo» se modela como **instrucciones operativas versionadas**, no como un prompt total que pueda sustituir las reglas del sistema. Reutilizar \`client_registry_instructions\` y \`client_registry_facts\` de Hoja Registral v2. Mantener ledger append-only y snapshot de contexto, sin repetir adjuntos, correos enteros, claves ni finanzas.

**Perfiles contextuales virtuales** (una configuración dinámica del mismo KIA, no infraestructura IA separada por cliente):

- **EXPERT global**: políticas de seguridad, privacidad, fuentes oficiales, estilo de respuesta y catálogo de herramientas. No editable por cliente.
- **Instrucciones profesionales internas de EXPERT** por servicio/rol: por ejemplo, cobros, fiscal, mercantil, laboral, extranjería, comunicaciones, firma KIA y escalación. Acceso profesional.
- **Ficha personal** del cliente: identidad confirmada, idioma, preferencias de comunicación verificadas, casos, alertas, instrucciones aprobadas, alcance para sus propios datos.
- **Ficha empresarial**: razón social, CIF autorizado, representantes y permisos, tenant Holded, actividad y régimen, propiedades/empleados si aplica, reglas operativas aprobadas y objetivos. Empresa sin usuario también tiene subject.
- **Contexto del expediente**: hechos, estado real, documentos, próximos pasos, plazos, instrucciones de ese expediente, confidencialidad y responsables.
- **Sesión y solicitud actual**: conversación y ventana de trabajo actual, con alcance temporal. Texto de correo, documentos de terceros o páginas web son **datos no confiables**, no instrucciones con autoridad.

### 20.1. Modelo mínimo para instrucciones por cliente

Se propone vista/editor «Instrucciones de trabajo de KIA» en Cliente 360 / Company 360 / expediente, derivada del registro vigente: \`subject_id\`, \`company_id\`/ \`case_id\` cuando proceda, \`scope\`, \`instruction_key\`, \`instruction_text\`, prioridad, fuente/autor, destinatarios permitidos, estado borrador→confirmado→sustituido/revocado, \`valid_from/to\`, \`confirmed_by\`, \`version\`, \`requires_approval\`, fecha de revisión y referencias de evidencia. **Antes de proponer nuevas columnas**, inspeccionar migraciones/tablas actuales y mantener compatibilidad con \`replace_client_registry_instruction\`.

Ejemplos de instrucciones confirmables: «Enviar la respuesta firmada KIA en nombre de EXPERT», «Nunca solicitar documentos hasta evaluar la consulta», «Para esta empresa revisar alquileres y deuda de residuos», «Este expediente exige revisión humana antes de remitir solicitud». Las instrucciones no pueden ordenar revelar datos de otros clientes, activar herramientas de riesgo, deshabilitar auditoría o eludir consentimiento.

**Jerarquía inalterable:** normas aplicables/políticas de seguridad y permisos de plataforma → reglas internas aprobadas EXPERT → instrucciones confirmadas de entidad/expediente dentro de scope → preferencias confirmadas del cliente → solicitud actual; datos de correos/documentos/web sin autoridad para modificar la política. Conflictos, instrucciones caducadas o revocadas y hechos no verificados → solicitar revisión o usar la fuente canónica viva. El cliente puede proponer preferencias propias, **no** modificar instrucciones profesionales confidenciales; Admin confirma cambios de política operativa. Separar instrucciones internas de las aptas para mostrarse al cliente.

**Carga en KIA:** resolver subject/persona y compañía/expediente reales, recuperar solo instrucciones confirmadas y vigentes, aplicar \`scope\`, \`priority\` y capacidades del actor, resumir con procedencia y redacción, consultar herramientas vivas cuando se trate de estados financieros, calendario o expedientes. Evitar mezclar el historial de dos empresas del mismo titular. Las instrucciones pueden influir en el **plan propuesto** pero **no autorizan una acción** sin policy y aprobación.

**Historial/Auditoría:** alta, edición/sustitución, revocación y usos de una instrucción deben quedar asociados a actor, versión, fuente y causa, sin volcar el prompt completo ni datos personales en logs analíticos. Conservación RGPD y acceso por necesidad; tenant/company/case boundaries.

## 21. Ejecución de KIA Work dentro de la aplicación

Contrato de acción cerrado (véase docs/kia-workspace-execution-2026-10-09.md y PR #688): interpretar → resolver objeto → validar actor/entidad → generar vista previa → confirmar según riesgo → ejecutar mediante el servicio de dominio → comprobar lectura posterior → registrar y notificar el resultado. El modelo no pasa credenciales, no decide roles, no emite sentencias SQL arbitrarias y no concede OAuth.

| Tipo de comando en KIA | Admin | Cliente | Ejecución |
| --- | --- | --- | --- |
| «Resume las novedades del Inbox y prepárame tareas» | Omnicanal autorizado | Solo sus mensajes | Lectura autónoma; creación de tareas por política, confirmación en piloto |
| «Revisa ventas, gastos y resultado de la empresa del trimestre» | Empresa seleccionada | Empresa vinculada y autorizada | Consulta de snapshot Holded; no escribir |
| «Cambia este dato de contacto» | Soporte con actor real | Datos propios editables | Vista previa y confirmación; luego POST/PATCH autorizado |
| «Reserva una reunión con X» | Calendario autorizado | Cita propia dentro de reglas | Confirmación de destinatario, fecha/hora y proveedor; no inventar envío |
| «Envía este correo» | Hilo/cuenta autorizados | Solo mensaje propio donde esté previsto | Borrador visible + aprobación explícita antes de envío |
| «Rectifica factura/reconcilia banco/presenta modelo» | Solo profesional con capacidad concreta | No | Preparar propuesta y evidencias; sin autonomía irrestricta |

Distinguir actividades sincrónicas (lectura y cambios simples) de procesos duraderos (varios servicios, proveedor externo, reintentos): para estos últimos registrar job/step, tiempo/coste, idempotencia, comprobación y reanudación. No simular trabajo en segundo plano ni declarar operaciones finalizadas mientras no haya comprobación de proveedor.

**Guardas:** approval vinculada a actor, tenant, empresa, objeto, diff, caducidad, hash y versión; riesgo por herramienta; owner/rol/membresía por llamada; no elevar permisos por instrucción registral; bloqueo ante cambio de empresa; no actuar por texto de terceros; toda escritura auditable. Para modo soporte, el actor registrado es el Admin real, nunca el cliente. Verificar acciones de alta, edición, correo, reuniones y Holded en escenarios positivos y denegados.

## 22. Secuencia revisada, dependencias y criterios de aceptación

Esta ampliación **reordena prioridades**, pero no sustituye la Fase 0–7 del rediseño visual ni invalida las PR abiertas. No iniciar otras nuevas superficies de bandeja, informes financieros o memoria. Cada vertical implementa servicio de dominio + API/guardas + UI compartida + tests y despliegue independiente.

| Prioridad | Incremento / entregable concreto | Dependencias | Criterio de salida |
| --- | --- | --- | --- |
| P0 | Congelar este plan + mapa de módulos existentes y gap analysis; revisar PR #686/#687/#688 | Plan aprobado | Un único roadmap canónico; ninguna escritura prematura |
| P1 | Instrumentar Inbox 360: evento normalizado + dedupe + correlación a registro/empresa + notificaciones relevantes | Idempotencia, fuente, reglas de push, takeover | E2E desde correo/Telegram/web, un evento→una tarea/aviso |
| P2 | Primer ejecutor supervisado KIA: crear tarea Admin; después editar perfil propio | Catálogo acciones y guardas; audit_logs | Vista previa/aprobación/ejecución/verificación sin IDOR ni duplicados |
| P3 | Hoja Registral como instrucciones operativas efectivas en KIA y editor por ámbito | Registry v2 confirmado, jerarquía de instrucciones | KIA respeta reglas vigentes de A sin aplicar reglas de B; versiones y revocación |
| P4 | Servicio único de snapshot Holded y test de calidad contable | Gateway company-scoped, fuentes libro P&L | Ventas/compras/resultado expresados correctamente, trazabilidad y «No disponible» si falta |
| P5 | Nuevos KPIs financieros compartidos en Admin y Cliente | Snapshots y entitlements | Dashboard de ambas superficies coincide en cifras para la misma empresa/periodo autorizado |
| P6 | Tool KIA financiera + agenda/reuniones e Inbox actions | Métricas, meeting operator, consentimientos | KIA consulta cifras verificables y crea reuniones solo tras confirmación |
| P7 | Integración end-to-end, mobile, observabilidad, rollout controlado | Todos los módulos | Tests, seguridad, cutover independiente, rollback medido |

**Reglas de aceptación adicionales obligatorias:**

1. Inbox único: cero bandejas paralelas, hilos duplicados por polling o nuevos leads por sincronizaciones repetidas.
2. Push con deep link correcto, destinatario correcto y control de deduplicación. La respuesta automática de KIA no genera push de entrada humana.
3. Tarea automática no se duplica por retry; notificación y tarea reflejan el mismo hilo/origen; escalación visible en «Mi jornada».
4. La fecha y hora de una reunión se verifican en Calendar/Meet; error de proveedor deja estado recuperable, no reunión ficticia.
5. Finanzas por company_id e integration_id; Admin ve empresa autorizada y Cliente solo las propias; un admin con varias conexiones Holded no cruza contabilidad.
6. Ventas, compras y diferenciales documentales **nunca** se etiquetan como beneficio contable sin P&L conciliado; incluir fecha y cobertura de fuente. Comparar EUR vs EUR y periodos homogéneos.
7. KIA responde usando el mismo snapshot financiero que las gráficas, y puede citar periodo/actualización; no fabrica saldo ni resultado.
8. Una empresa sin Holded o sin capacidad autorizada ve un vacío honesto y guía de conexión; no datos de empresa vecina.
9. Instrucción registral específica no salta política superior ni puede dar acceso a otro tenant; cambios quedan versionados; campos profesionales internos no se exponen en Cliente.
10. Cliente pide cambio en su propia ficha y nunca puede alterar nota profesional, perfil ajeno ni calendario de otra empresa.
11. En modo soporte, toda acción conserva identidad y permisos de Admin, con trazabilidad de actor real y objetivo delegado.
12. Se mantienen las funciones existentes de KIA Copiloto, Inbox y Dashboard mientras se introducen flags por incrementos; sin regresión de mobile, ES/RU ni adjuntos.
13. CI completo, control de seguridad/RLS, test de origen autorizado, UAT humano sobre empresas piloto, despliegues app/ksenia-expert y prueba de rollback antes de fusionar.

### Decisiones registradas en esta ampliación

- 09/10/2026 (KIA Work): **KIA como ejecutor supervisado**, no solo chatbot; un único catálogo central de herramientas y aprobaciones.
- 09/10/2026 (Inbox): **Operations 360** existente es canónico; automatizar clasificación, tareas, citas y avisos sobre sus hilos.
- 09/10/2026 (Holded): reutilizar integración y reportes; un solo servicio de métricas Admin/Cliente/KIA, sin llamar beneficio al diferencial de facturas.
- 09/10/2026 (Hoja Registral): personalizar KIA por cliente/empresa/expediente con instrucciones confirmadas, trazables y de menor autoridad que permisos/ley; sin agentes desplegados por cada cliente.
- 09/10/2026 (procedimiento): **planificar y revisar primero**, implementar después en incrementos seguros.

**Documentos complementarios que permanecen vigentes:** docs/kia-client-ledger.md, docs/kia-2-strategy.md, docs/kia-workspace-execution-2026-10-09.md (pendiente PR #688), docs/client-company-status-dashboard.md, docs/holded-sync-action-plan.md y docs/telegram-operations360-e2e-runbook.md. Ante contradicciones de prioridades o nomenclatura, aplicar este plan maestro; para requisitos de seguridad específicos, mantener el control más estricto.
