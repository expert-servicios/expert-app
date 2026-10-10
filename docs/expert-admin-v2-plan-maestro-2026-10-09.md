# EXPERT Admin V2 — Plan maestro de rediseño integral

**Fecha:** 09/10/2026  
**Decisión:** Aprobado el diseño objetivo y su ejecución por fases. **Este documento es especificación; no supone un despliegue ni una migración de datos.**  
**Propietario de producto:** Dirección EXPERT  
**Alcance:** diseño transversal EXPERT Workspace con **Panel Admin** y **Portal Cliente** separados; KIA, Contactos 360, operaciones, comunicaciones, agenda, facturación, contenido y administración. Se documenta además la compatibilidad con el panel específico de administradores de tenant.  
**Estado:** LISTO PARA INICIAR FASE 0. Implementación bajo PRs independientes, CI, seguridad y verificación de producción.  
**Plan rector:** este documento prevalece sobre los borradores visuales anteriores; conserva sus requisitos operativos válidos.

**Ampliación incorporada 10/10/2026 — enriquecimiento empresarial y profesional (§26):** KIA podrá proponer búsquedas **acotadas y lícitas** de empresas y actividades profesionales en fuentes oficiales/públicas pertinentes al alta o al lead, distinguir coincidencias de identidad, mostrar evidencias y no atribuir perfiles homónimos ni etiquetar competidores automáticamente. Definición de privacidad, permisos, revisión humana y despliegue por fases; **aún no implementado**.

**Ampliación incorporada 10/10/2026 — adquisición y registro verificables (§25):** primera/última procedencia, contenido y CTA, paso por OAuth, historial técnico de sesiones, notificaciones de altas y solicitudes, vistas Admin/Cliente diferenciadas y privacidad. El caso Alberto Bouza es una prueba negativa de atribución: acceso Google no prueba Google orgánico. **Pendiente de desarrollo, no operativo aún.**

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

### 2 ter.7. Alcance operativo completo del «Portal cliente · Modo soporte» (ratificación 10/10/2026)

**Requisito de dirección, vinculante:** el Admin debe poder entrar en el **mismo espacio funcional del cliente**, con idénticos módulos y formularios reutilizados y con comandos internos adicionales, para **realizar directamente** las configuraciones, integraciones, gestión documental, operaciones y trabajo contable que EXPERT esté legitimada y técnicamente autorizada a ejecutar. La vista actual /admin/clientes/[id]/portal **solo muestra resumen, contexto, auditoría y enlaces**: no cumple aún este requisito de edición operativa unificada. No presentar «vista delegada existente» como «soporte operativo completo implementado».

**Recorrido objetivo:** Contactos 360 o Empresas 360 → «Abrir portal · Modo soporte» → seleccionar persona o entidad canónica y empresa autorizada → navegar dentro del mismo workspace por Resumen, Perfil, Empresas, Integraciones, Facturación/Contabilidad, Expedientes, Documentos, Agenda, Comunicaciones, Ajustes y KIA → configurar, previsualizar, editar/crear cuando esté autorizado → verificar persistencia real → volver a Contactos/Empresas conservando filtros. **Una entidad sin usuario de acceso** dispone del mismo contexto empresarial de soporte sin fabricar cuenta de cliente; no debe bloquear configuración ni vinculación Holded company-scoped.

**Principio de implementación:** reutilizar visualmente **la pantalla, componente de dominio, formulario, validaciones, datos y experiencia del Client Workspace**; incorporar adaptadores y comandos de Admin bajo controles de servidor. No clonar el dashboard, ni construir un «pseudo portal» de tarjetas de enlaces. Los módulos exclusivamente internos (marketing, conciliación global de EXPERT, operaciones de equipo, auditoría global, campañas, Inbox 360) siguen accesibles al Admin desde su shell o un acceso contextual, **sin exponerlos al cliente**.

#### Matriz concreta de módulos

| Módulo del portal | Qué podrá resolver el Admin desde modo soporte | Condición y fase |
| --- | --- | --- |
| Perfil, alta y empresas | Completar onboarding y datos autorizados, revisar identidad/verificación, vincular relaciones, representante/empresa, categorías y configuración del dashboard | Reutilizar formularios, validar sujeto y compañía; no alterar hechos oficiales confirmados sin rectificación. Fase S1 |
| Accesos y permisos | Configurar invitaciones, membresías, permisos concedidos, usuarios del portal y su estado | Auth sin suplantación, never reveal passwords/tokens. Confirmar cambios de acceso y registrar quién los autorizó. Fase S2 |
| Integraciones | Conectar, probar, ajustar o revocar integración Holded por empresa; permisos detectados/habilitados; vigencia del token; estado sincronización; Google/Calendar/Drive/otras con la autorización de proveedor válida | Reutilizar CompanyHoldedAdminPanel y ClientHoldedAdminPanel sin duplicar configuradores. OAuth externo puede requerir consentimiento del titular: Admin prepara vínculo y verifica resultado; credenciales nunca en frontend/chat. Fase S1–S2 |
| Facturación/Contabilidad | Consultar facturas emitidas/recibidas, clientes/proveedores, cuentas, diario, balances, tesorería, cobros/pagos, vencimientos, conciliación, anomalías, ajustes y evidencias; preparar propuestas y documentos | Modo lectura con fuente, periodo, fecha última sincronización y empresa explícitos. Cifras no verificadas se marcan. No mezclar la contabilidad propia de EXPERT con la cuenta laboratorio o empresas cliente. Fase S2 |
| Operaciones contables autorizadas | Crear/corregir borradores, propuestas de asiento, abonos, recordatorios y conciliación; ejecutar la operación permitida en Holded con aprobación específica si existe capacidad real de escritura | **No disponible por defecto.** Requiere mandato/alcance, permiso efectivo del token de esa empresa, tool/endpoint autorizado, preview del efecto, confirmación, idempotency key, readback y auditoría; sin borrar históricos ni generar asientos «de prueba» en datos reales. Activación gradual por tipo de operación. Fase S3 |
| Expedientes y documentos | Crear expediente/checklist, recibir/clasificar archivos, relacionar con empresa, preparar escritos, descargar entregables y revisar pendientes | Actor real, proveniencia, permisos de documentos, no acceso transversal. Fase S2 |
| Citas y comunicaciones | Reservar/reprogramar con disponibilidad real, gestionar solicitudes, preparar/responder comunicaciones autorizadas, crear tareas relacionadas, consultar estado envío/Meet | Consentimiento cuando corresponda, hilo/tarea/correlación y lectura posterior verificadas. Fase S2 |
| Suscripciones/Stripe, cobros | Ver estado de contratación y pagos EXPERT, corregir datos de facturación permitidos, preparar presupuesto, revisar fallos e incidencias | No crear cargos, contratos ni cambios de plan como si los hubiera aceptado el cliente; validar mandato, términos y confirmación. Fase S2 |
| KIA | Usar una sola instancia de Copilot para ver datos autorizados y preparar acciones desde el contexto seleccionado | Misma KIA, sujeto/empresa por SupportContext, identidad real Admin y política de tool específica; nunca usar permisos Admin globales para leer empresa no seleccionada. Fase S1–S3 |

**Capacidades reales, no aspiracionales:** antes de mostrar «Guardar», «Contabilizar», «Conciliar», «Enviar», «Emitir», «Revocar» o «Conectar» debe existir un endpoint verificable y autorización efectiva. No inferir que Holded write está disponible por el mero hecho de poder leer. Cuando falte acceso, mostrar estado bloqueado, causa, opción de solicitar autorización o tarea; nunca una operación simulada.

#### Contrato de contexto, permisos y trazabilidad
- El Admin sigue autenticado **como Admin** en todo momento; no crear sesión/JWT del cliente ni cambiar el active_company_id del cliente. El contexto de soporte es actorId + subjectType/subjectId + companyId + role/grants + mode + correlationId + caducidad, resuelto de nuevo por petición y acotado a una relación verificada o permiso de soporte expresamente concedido.
- El mismo módulo UI podrá recibir un ClientDataAdapter o AdminSupportAdapter; los endpoints Admin nunca son invocables directamente con IDs de terceros por un cliente. En cada lectura/escritura validar actor activo, autorización de soporte, empresa, recurso, acción, permiso de proveedor y CSRF/origen; retornar 403 sin detalles ajenos cuando no procede.
- Separar **permiso EXPERT** (trabajar sobre cliente o entidad) de **permiso del tercero** (usar la cuenta Holded, Google, banco u otro). Un mandato profesional puede permitir operación sin intervención reiterada del cliente dentro de su alcance y vigencia; cuando OAuth/confirmación del proveedor lo exija, no se puede sustituir por ser Admin EXPERT.
- Barra fija «Modo soporte» con identidad del cliente/empresa, operador real, empresa seleccionada, capacidad lectura/edición vigente, tarea/caso y salida clara. Mantener el contexto entre pestañas del workspace y borrar caché, documentos en memoria y estado KIA al cambiar de sujeto/empresa o salir.
- Auditoría de **entrada, cambio, salida y de cada operación relevante**: actor y roles efectivos, sujeto, companyId, endpoint/tool, tipo de acción, origen y dispositivo aproximado, fecha, correlation/request id, previa y posterior versión/campos permitidos (nunca secretos), aprobación/mandato, idempotencia, resultado y verificación externa. Consultable desde historial de cliente/empresa y Admin 360, con retención conforme a política.
- La ruta legacy /admin/clientes/[id]/portal se conserva como punto de entrada/alias; la futura /admin/soporte/... se decidirá en inventario. Compatibilidad por feature flag support_mode_v1 y rollback sin mutación de identidades.

#### Secuencia de implantación de soporte sin parches
- **S0 — Matriz real:** inventariar todas las pantallas cliente y rutas Admin, agrupar por componente/servicio reutilizable, verificar modelos empresa/persona sin perfil, permisos de conexión/lectura/escritura y capacidad de KIA. Definir primero pruebas de denegación por sujeto/empresa.
- **S1 — Shell funcional:** SupportWorkspaceShell con la misma navegación/formularios del portal, empresa y contexto de soporte independientes, barra visible, historial y edición permitida de perfil/configuración con readback. Mantener la vista actual como fallback.
- **S2 — Cobertura operativa:** incorporar integraciones reales, facturas y contabilidad en lectura, documentos, expedientes, agenda, mensajes, contratación y configuración por empresa; sin volver a construir pantallas paralelas.
- **S3 — Escritos contables controlados:** piloto con empresa laboratorio autorizada, propuesta → simulación → aprobación → escritura limitada → verificación en Holded → log. Pruebas con token sin write, firma/capacidad revocada, duplicado/reintento y empresa distinta; desplegar operación a operación, nunca activación general.
- **S4 — E2E y cutover:** smoke tests cliente real + Admin delegado + empresa sin perfil + dos empresas de un mismo contacto; responsive móvil, seguridad/privacidad y KIA; retirar tarjetas/enlaces redundantes solo tras demostrar la navegación operativa.

**Criterios de cierre adicionales:** (a) Admin configura Holded para una empresa sin usuario sin inventar identidad; (b) el cliente autenticado ve cambios autorizados del mismo módulo sin recibir controles staff; (c) KIA y Contabilidad actúan solo sobre la empresa expresamente seleccionada; (d) un token de lectura no habilita un asiento; (e) la primera escritura contable piloto, cuando se apruebe, se valida por lectura posterior sin duplicado; (f) cada transición y mutación queda atribuida al Admin real y puede auditarse; (g) no se deja un segundo configurador independiente para lo mismo.

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
| P4 | Sincronización **financiera diaria** Holded por empresa + snapshot canónico y test contable | Gateway company-scoped, presupuesto API, incremental con reconciliación y cron separado de facturación | Una captura diaria por integración autorizada, sin llamadas Holded por pregunta KIA; datos completos o error explícito; rentabilidad correcta o «No disponible» |
| P5 | Nuevos KPIs financieros compartidos en Admin y Cliente | Snapshots y entitlements | Dashboard de ambas superficies coincide en cifras para la misma empresa/periodo autorizado |
| P6 | Tool KIA financiera **cache-first**, resumen diario Admin/Cliente, agenda/reuniones e Inbox actions | Snapshots confirmados, alertas y preferencias, meeting operator | Resúmenes de hechos confirmados; cero Holded API calls en chat normal; avisos sin duplicados y reuniones solo tras confirmación |
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


---

## 23. Decisión operativa — sincronización financiera Holded una vez al día y resúmenes KIA (09/10/2026)

**Decisión de Dirección:** cada empresa con conexión y consentimiento válidos sincronizará automáticamente sus datos financieros de Holded **una vez al día como frecuencia ordinaria**, los guardará en EXPERT y ofrecerá las mismas cifras a Dashboard Admin, Dashboard Cliente y KIA. **KIA no debe llamar a Holded por cada pregunta** ni cada visita al dashboard. Los informes y avisos diarios se derivarán de los datos locales y de Operations 360.

### 23.1. Estado verificado y límite de lo existente

Inspección del código y esquema de Supabase el 09/10/2026:

- Existe \`public.client_accounting_records\` con \`integration_id\`, \`company_id\`, \`record_type\`, \`external_id\`, \`record_date\`, \`amount\`, \`currency\`, \`status\`, \`data\` y \`synced_at\`.
- Existe \`public.accounting_period_snapshots\` con resúmenes trimestrales por empresa, ventas, compras, IVA, conteos y datos mensuales; existe \`accounting_anomalies\`. **Las tres tablas estaban vacías (0 filas) al comprobarlas**; las migraciones son estructura, no prueba de sincronización financiera activa.
- El cron activo \`expert-holded-sync\` en Supabase pg_cron está programado \`15 7 * * *\`, pero **\`/api/cron/holded-sync\` procesa jobs de pedidos/suscripciones/facturación**, no obtiene diariamente el libro financiero de cada integración para snapshots. **No reutilizar su nombre como si fuera el nuevo importador financiero**.
- También existe \`.github/workflows/holded-sync.yml\` con disparo cada 15 minutos al **mismo endpoint**. Antes de añadir programaciones, verificar qué rutas/disparadores están efectivamente activos para no duplicar llamadas ni alterar la cola financiera de facturas. El cron de pagos/órdenes debe seguir atendiendo reintentos; la frecuencia de lectura financiera se gestiona por separado.
- El cron \`expert-daily-summary\` se programa a \`30 8 * * *\` y ya envía resumen administrativo; **extender/fusionar su contenido con el nuevo brief**, evitando un segundo correo/push equivalente. No presentar resúmenes diarios de clientes como ya implementados.
- \`lib/holded/quarter-data.ts\`, \`lib/reports/report-generator.ts\` y tools KIA ya hacen lecturas directas al proveedor en determinados flujos; una vez validada la capa local, migrar esas lecturas a snapshots para consultas rutinarias, conservando únicamente refresh excepcional autorizado.
- Documentación oficial Holded (consultada 09/10/2026): límites por minuto y cuota mensual por plan, compartidos por cuenta entre API keys; HTTP 429 y \`Retry-After\` / \`X-RateLimit-Remaining\`. La cuota comercial concreta de cada tenant debe verificarse, nunca suponerse ilimitada: https://www.holded.com/es/desarrolladores/limite-de-tasa y https://help.holded.com/es/articles/6896051-como-generar-y-usar-la-api-de-holded.

**Importante:** ninguna tabla fue modificada y no se programó un cron nuevo en esta ampliación de documentación.

### 23.2. Flujo de sincronización financiera diaria

\`\`\`text
pg_cron/worker (una ventana diaria, horario Europe/Madrid)
  -> identificar integraciones Holded activas + consentimiento y scopes
  -> claim idempotente POR (integration_id, company_id, fecha local, versión del sync)
  -> presupuesto API por cuenta + control de concurrencia
  -> leer cambios autorizados de Holded (cursor/paginación)
  -> normalizar registros y verificar divisa, estado y completitud
  -> upsert idempotente en client_accounting_records / staging validado
  -> reconstruir accounting_period_snapshots + anomalies afectadas
  -> comparar versión anterior y nueva para detectar hechos materiales
  -> publicar snapshot completo de forma atómica, o conservar el anterior y marcar error
  -> crear hechos de digest / alertas correlacionadas al batch
  -> Admin + Cliente + KIA leen la MISMA capa local, cada uno filtrado por permisos
\`\`\`

- **Frecuencia normal:** una vez por día e integración autorizada; planificador separado de \`holded-sync\` (cola de facturación). Ventana configurable en madrugada/mañana de Madrid; calcular verano/invierno correctamente en vez de asumir que UTC y Madrid tienen siempre el mismo desfase. Priorizar que la sincronización esté finalizada antes del resumen matinal; si excede ventana, resumen marca pendiente y no declara datos actualizados.
- **Integridad:** primera incorporación con backfill **único y acotado** según historial permitido; sincronizaciones posteriores incrementales cuando el endpoint lo soporte. Revisar una ventana retrospectiva configurable para facturas rectificadas, cobros tardíos y documentos que cambian de estado; reconciliación más amplia periódica, no descargar toda la historia diariamente. Registrar cursor/último corte por integración y tipo.
- **No confundir publicación con fecha del hecho:** algo detectado hoy puede ser una factura antigua modificada. Los informes dirán «detectado en la sincronización de [fecha]» y mostrarán fechas documentales reales.
- **Estados:** \`not_connected\`, \`permission_missing\`, \`queued\`, \`running\`, \`success\`, \`partial\`, \`failed\`, \`rate_limited\`, \`stale\`, \`unchanged\`. No sustituir un snapshot bueno por ceros tras fallo, cuota agotada o respuesta parcial. Registrar calidad/procedencia por métrica y \`last_success_at\` frente a \`last_attempt_at\`.
- **Contratación y seguridad:** la conexión/consentimiento de Holded y el permiso de lectura del usuario son requisitos separados; no sincronizar datos bancarios o laborales sin autorización específica. Aislamiento por \`company_id + integration_id\` y por proveedor/cuenta; un token global de EXPERT no puede hacer que dos clientes compartan datos.
- **Presupuesto API:** contabilizar peticiones por cuenta/proveedor/mes y por sync, fijar umbral de seguridad y colas limitadas. Respetar cabeceras Holded \`429\`/\`Retry-After\`, cuotas mensuales, backoff y jitter; limitar páginas y paralelismo. Reintentos de error técnico pueden añadir llamadas extraordinarias, pero el ciclo ordinario es único al día. Un sync manual excepcional requiere privilegio, auditoría, protección anti-repetición y advertencia de consumo de cuota.
- **Scheduler escalable:** un cron desencadena la cola; los workers procesan integraciones por lotes, con lock/claim atómico, idempotencia e información sobre avance; nunca una petición HTTP que intente extraer todos los datos de todas las empresas en un único timeout. Elegir entre la infraestructura de colas existente y workflow durable después de verificar límites/operación; no añadir cron paralelo sin limpiar solapamientos.

### 23.3. Política obligatoria: lectura cache-first en KIA y dashboards

**Admin, Cliente y KIA usan un único servicio de lectura financiera interno** (véase §19), con fechas e indicadores normalizados; sin llamadas al API Holded en GET de dashboard ni en las tools KIA de consultas rutinarias. Una pregunta como «¿Cuánto hemos vendido este mes?» lee el snapshot más reciente y comunica periodo, moneda, \`as_of\`, cobertura y posible retraso. Si la pregunta pide «ahora mismo» y solo existe la captura de ayer, responder con honestidad («última actualización [fecha]»), sin inventar tiempo real.

- Mostrar estado de frescura claro: \`fresh\` (sync diario correcto), \`stale\` (se superó ventana), \`partial\` (algunos datos faltan), \`unavailable\` (sin fuente autorizada). Umbrales exactos calibrados en piloto, no horas supuestas.
- No confundir compras/facturas y resultado contable; beneficio real solo si existen datos P&L suficientemente completos y conciliados, conforme §19.2.
- Separar histórico guardado de eventos operativos en tiempo real. Inbox/citas/tareas actualizan su estado cuando llegan; los indicadores Holded se actualizan al cierre de cada batch. Un usuario no debe creer que «ventas de hoy» están sincronizadas antes del siguiente batch.
- Los productos que impliquen *escritura* en Holded siguen usando adaptadores autorizados, confirmación y auditoría; la política cache-first solo cubre consultas.
- Entitlements/clientes sin conexión: sin cifras; no recuperar accidentalmente otras entidades por enlaces heredados.

### 23.4. Resumen diario KIA — dos perspectivas, un mismo origen

Generar **un artefacto diario por ámbito** (Admin/global autorizado o Cliente+empresa) a partir de snapshots publicados y eventos canónicos de Inbox 360, tareas, citas, expediente y auditorías relevantes. KIA aporta redacción/explicación, **no inventa hechos**. Distinguir explícitamente qué novedades son de la jornada operativa, qué diferencias financieras se **detectaron** respecto del sync previo, y qué requieren acción.

| Vista | Contenido | Notificación |
| --- | --- | --- |
| **Admin «Mi jornada»** | Resumen multicliente permitido: mensajes humanos, leads, citas, tareas abiertas/vencidas, escalaciones, errores de sincronización y anomalías Holded por empresa; diferencias operativas desde el último cierre | Bandeja de avisos / resumen matinal consolidado; **push inmediato solo de novedades importantes**, no por cada respuesta KIA o cada factura |
| **Cliente «Mi empresa»** | Por empresa vinculada: facturación, compras, cobros/pendientes si autorizados, cambios detectados desde última sync, documentos, citas, obligaciones, tareas y advertencias propias; sin datos internos de otros clientes | Resumen en dashboard siempre visible; push/email diario configurable por preferencias y base legítima de comunicación |
| **KIA Copiloto** | Mismas cifras locales, explicaciones y capacidad de responder «¿qué cambió desde ayer?» con evidencia y marca temporal | No genera notificación espontánea por cada consulta; propone acción/tarea si reglas y permisos lo permiten |

- **Ventana temporal:** por defecto, informe matinal de «jornada anterior + novedades disponibles del sync finalizado»; un sync matinal no permite afirmar conocer la evolución completa del mismo día aún en curso. Para avisos urgentes de correo, citas y trámites, utilizar eventos operativos en tiempo cercano al real, no esperar al sync financiero.
- **Detección de relevancia:** reglas deterministas antes del LLM: nueva factura/abono, vencimiento o retraso, variaciones materiales por empresa, pago conciliado, error de conexión, saldo pendiente significativo, incumplimiento o fecha límite; umbrales configurables y sin inferir beneficio a partir de facturas. No insertar avisos de marketing ni deducir fraude de simples anomalías.
- **Entrega:** un resumen por fecha/actor/scope con idempotency key; notificación push consolidada o crítica con deep link, delivery/retry y preferencias; no duplicar los avisos ya emitidos por Inbox 360 o \`daily-summary\`. Si no hay novedades, mostrar «sin cambios significativos» en Workspace y evitar push innecesario.
- **Protección de datos:** cualquier texto de push muestra solo información apropiada para pantalla bloqueada; cifras o datos confidenciales requieren autenticación al abrir. Mantener variantes ES/RU y acceso por empresa. Guardar base/evidencia/estado del digest y qué hechos lo sustentan para corregir errores.
- **Punto de envío:** tras confirmarse publicación de snapshots y completar el cálculo de diferencias; si Holded falla, enviar aviso de fallo a Admin y estado de «sin actualizar» al Cliente, sin resumen financiero falsamente actualizado.

### 23.5. Orden técnico específico y pruebas

**Implementar después de la aprobación de este plan**, integrándolo en P4–P6:

1. **Auditoría del pipeline:** trazar invocaciones actuales Holded en KIA y dashboards; identificar todos los cron activos (pg_cron, GitHub Actions y otros), separar la cola de facturación del importador financiero y contabilizar uso API antes de cambiar lógica.
2. **Poblar un caso piloto:** empresa autorizada con token únicamente de lectura financiera, job de importación/backfill acotado, comprobación contra documentos originales, deduplicación y protección de históricos. Las tablas vacías no acreditan éxito.
3. **Activar ciclo diario por empresa** con estado por lote, límite de cuota, reconciliación y snapshot atómico. Probar \`429\`, expiración de credenciales, 403, pérdida de red, paginación, varias divisas y facturas/abonos rectificadas.
4. **Migrar lecturas ordinarias:** un endpoint de métricas y tools KIA alimentados por snapshots, dos vistas Admin/Cliente con permiso propio; sin tocar compras/cobros si no hay consentimiento.
5. **Conectar diferencias y digest:** materializar eventos financieros relevantes solo tras actualización completa, asociar a Hoja Registral cuando proceda, reutilizar \`daily-summary\` y notificaciones existentes; grupos de envío y silencio sin novedades. Evitar crear tareas financieras automáticas si solo existe una señal poco fiable.
6. **Pruebas E2E:** 2 empresas del mismo cliente con tokens distintos; Admin con acceso delegado y cliente de solo lectura; 0 llamadas Holded en diez consultas de chat/dashboard repetidas; un sync ordinario diario por integración; fallos mantienen snapshot anterior; doble ejecución del cron no duplica datos/avisos; resultado y diferencial documental diferenciados; zona horaria Madrid y ES/RU verificados.

**Definition of Done adicional:** poder contestar «últimos datos sincronizados y origen» por cada empresa; ver cuentas de API consumidas y presupuesto restante; historial de sync, errores, aviso emitido y actor; dashboard Admin y Cliente comparten fuente consistente; KIA contesta sin invocar Holded en lecturas rutinarias.

### Historial de esta decisión

- 09/10/2026 (Holded daily-cache): **una sincronización financiera por empresa y día**, datos canónicos en EXPERT, KIA/dashboard local-first y resúmenes diarios diferenciados Admin/Cliente; activar por piloto tras comprobaciones. No confundir el cron previo de facturas con el nuevo importador.


---

## 24. Inventario consolidado 09/10/2026 y permisos conversacionales KIA–Holded

**Fuentes inspeccionadas:** historial de sesiones de la dirección, PR #672, #679–#682, #685–#690, #692; `client_integrations`, `client_registry_*`, `accounting_*`, `audit_logs`; rutas API actuales. Distinguir siempre PR fusionada, PR abierta, esquema presente y función operativa: no son sinónimos.

### 24.1. Estado por frente

| Frente | Hecho comprobado | Hueco real |
| --- | --- | --- |
| Workspace visual | #685 plan fusionado, auditoría soporte #686 fusionada | #687 ventana KIA abierta; desplegar/verificar nueva experiencia Admin/Cliente |
| KIA Work | #688 contrato de propuestas fusionado; #672 propuestas contables fusionada | Ejecutores confirmables e idempotentes permanecen desactivados |
| Inbox 360/push | Bandeja y push existentes | Correlación + dedupe fiable + tareas/citas y resúmenes E2E |
| Holded API v2 | #679 tenant boundary, #680 bancos, #681 detección scopes fusionados | #690 selección/revocación scopes pendiente, CI con tests de contrato que comprobar |
| MCP EXPERT | Código en `apps/holded-mcp`, #682 CI fusionada | OAuth EXPERT bridge apagado, no conectado de forma general a KIA |
| Doble cuenta Holded EXPERT | Una entidad fiscal canónica, integración producción API v2 activa/read-only; sandbox MCP ChatGPT separado | Identificación y onboarding de sandbox para KIA con scope explícito; no confundir tokens |
| Datos contables | `client_accounting_records`, `accounting_period_snapshots`, `accounting_anomalies` existentes | Al verificar el 09/10 esas tablas estaban vacías; falta importador financiero y snapshots diarios |
| Hojas registrales | `client_registry_instructions/events/facts` y editores existentes | Resolver instrucciones por ámbito/versión en cada tool de KIA; probar no-escalación |
| Holded dashboard | Lecturas directas y reportes existentes | Cache-first + Admin/Cliente/KIA misma fuente y P&L verificado |
| Plan piloto MCP | #692 documenta dataset desidentificado y paridad | Ningún clon contable ni escritura sandbox ejecutados |

### 24.2. Modelo de autorización para permisos de Holded

Separar cuatro capas **sin mezclar**: (A) scopes concedidos al token por Holded; (B) scopes detectados mediante prueba segura; (C) permisos que el titular habilita para EXPERT/KIA en `permissions_enabled`; (D) capacidades de rol/empresa/acción realmente disponibles al actor KIA. Efectivo = intersección de las cuatro, más estado activo de conexión y reglas de riesgo; datos de `permissions_detected` no conceden permiso por sí solos.

- **Retirar permisos en EXPERT** es inmediato en backend: toda tool o nuevo paso consulta nuevamente permisos de empresa/conexión, sin guardar grants obsoletos en prompts o sesión. Cancelar o bloquear aprobaciones y trabajos pendientes que dependan del permiso revocado.
- **Retirar scopes en Holded** invalida acceso aunque EXPERT aún muestre los últimos permisos; la petición debe fallar cerrada, ofrecer guía y refrescar. El refresco nunca reenciende un scope que el titular desactivó en EXPERT.
- **Añadir permisos** requiere que el token verdaderamente los conceda y el titular dé consentimiento específico en EXPERT. Si no está en el token, mostrar el botón «Abrir Holded»/instrucciones para ajustar scopes, y luego «Volver a comprobar». No afirmar que KIA puede modificar scopes de OAuth/credenciales de Holded por chat.
- **Acción conversacional:** ejemplo «KIA, consulta movimientos bancarios» cuando no existe `bankMovements`: KIA contesta cuál permiso falta y por qué, y ofrece un enlace contextual a `/dashboard/integraciones/holded` para el propietario/admin. Una confirmación de chat no altera permisos. Si el token ya tiene alcance, el propietario puede cambiar `permissions_enabled` desde la pantalla mediante backend autorizado y auditado. Para scopes ausentes, el cambio se hace primero en Holded.
- **Usuario distinto de propietario:** solo estado y guía de solicitud al titular; nunca activar permisos vía suplantación.
- **Empresa gestionada por EXPERT (`expert_account`/`advisor_managed`):** cliente ve estado y guía; no puede cambiar token ni permisos. EXPERT Admin gestiona según autorización documental.
- **Escrituras:** prohibidas en conexión real en fase piloto; en sandbox, herramienta individual + aprobación transaccional + readback. Ni «acceso completo» ni master toggle habilitan operaciones destructivas o fiscales.
- **Auditoría:** guardar actor real, empresa, integración, permisos antes/después sin secretos, origen KIA/dashboard, consentimiento/revisión, resultado y error. Correlacionar chat action id, idempotency key y `integration_sync_events`.

### 24.3. Matriz de pruebas de revocación y recuperación

| Escenario | Resultado exigido |
| --- | --- |
| Read scope concedido y habilitado | KIA lee en empresa autorizada, con fuente/fecha |
| Desactivar scope en panel | Siguiente consulta KIA denegada, sin llamada Holded |
| Reconectar/refrescar token después de desactivar | Nunca reactivar automáticamente el permiso elegido como OFF |
| Intentar activar scope no detectado | Rechazar y guiar a Holded |
| Reactivar scope detectado siendo titular | Nueva consulta KIA funciona sin rehacer conversación |
| Cliente sin rol owner/admin | No puede cambiar scopes, sí recibir la explicación |
| Cambiar empresa durante conversación | No leer datos del tenant anterior |
| Revocar token o Holded devuelve 401/403 | Fail-closed, conservar otros módulos válidos; no inventar números |
| Rate-limit 429/5xx | Mantener estado previo, avisar que comprobación no ha concluido; no revocar masivamente |
| Sandbox write R1 | Solo preview + aprobación concreta + verify + audit; nunca escribir en producción |
| Reintento o doble clic | No duplicar registros ni notificaciones |

### 24.4. Priorización y criterios de salida

1. Completar CI de #690 y corregir pruebas afectadas por nuevo helper de consentimiento; comprobar Vercel y fusionar si verde.
2. Fusionar #692 (documentación) cuando verde y alinear este plan maestro con roadmap EXPERT MCP. Revisar #687 de manera independiente.
3. Probar permisos **sin modificar contabilidad**: toggles para token de prueba autogestionado, confirmación server-side por estado, invocación KIA real, desconexión/revocación y readback de la autorización. No tocar `expert_account` productiva.
4. Incorporar KIA «solicitar permiso» como **enlace contextual al panel** y CTA «Revisar permisos del token»; lectura de permisos efectivos justo antes de ejecutar. Desambiguar empresa y modo.
5. Después integrar sandbox Holded en KIA (sin duplicar CIF) y probar lecturas en paridad con MCP oficial.
6. Solo después habilitar primera tool write R1 con aprobación, idempotencia y readback en sandbox desidentificado; importar más datos solo si hay verificación de consecuencias fiscales y privacidad.
7. Finalmente sync financiero diario y dashboards cacheados para Admin/Cliente/KIA, con avisos diarios sin spam.

**Bloqueos/limitaciones constatados:** MCP nativo ChatGPT y KIA no comparten tokens ni sesiones; no hay autorización en KIA para modificar credenciales de Holded con una respuesta de chat. La conexión interna productiva de EXPERT es read-only; no existen pruebas E2E de concesión/revocación en sesión auténtica ejecutadas hasta la fecha de este inventario. No inferir finalización a partir de merge o tests unitarios.


### 24.5. Corrección explícita del piloto MCP por Dirección (09/10/2026, posterior al inventario)

**Prevalece sobre cualquier párrafo anterior del §24 que interprete la «copia contable» como requisito.** El MCP nativo de ChatGPT ya apunta a la cuenta **laboratorio**, y KIA debe implementar una funcionalidad equivalente sobre su **propia integración a la contabilidad real** de Expert Consulting. No se pretende vincular dos cuentas a ChatGPT, ni conectar por defecto el laboratorio al dashboard productivo de EXPERT, ni hacer un clon de la contabilidad para poder comenzar.

El MCP nativo es **oráculo de pruebas** (tool schemas, paginación, lectura, escritura controlada, permisos, errores); KIA/EXPERT MCP **implementación a verificar** (mismos casos de uso sobre permisos y tenant propios). Comparar resultados semánticos y comportamiento, **no** totales contables de dos cuentas diferentes.

| Verificación | MCP nativo en ChatGPT/laboratorio | KIA en EXPERT/contabilidad real |
| --- | --- | --- |
| Lectura facturas/asientos/uso | Herramientas nativas accesibles; pruebas de lectura sin cambios | Gateway v2 disponible; comprobar respuesta desde KIA autenticada |
| Crear/editar contacto, documento borrador | Herramientas nativas de escritura expuestas; ejecución de ensayo solo en tenant de laboratorio identificado | Falta adaptar cada operación, conceder acción específica, preview, aprobación, readback |
| Scopes/capacidades | Herramientas con scopes declarados; no hay tools nativas de admin de tokens expuestas en esta sesión | \`client_integrations.permissions_detected/enabled\`; conexión productiva actual \`read_only\` |
| Reactivar/revocar permiso | Cambios en dashboard Holded cuando herramienta/API de gestión no esté disponible | Propietario/Admin modifica autorización EXPERT en dashboard; KIA debe re-evaluar cada tool call |
| Sincronización | No se usa para alimentar datos contables productivos | Sync financiero una vez/día desde conexión real, consulta cache-first |
| Copiar contabilidad | **No necesario** | **No se hará** como requisito de paridad |

Una credencial de proveedor con acceso completo **no autoriza por sí sola** a un LLM a operaciones sensibles. Las herramientas de KIA continúan sujetas a scopes activados por cliente, autorización por empresa/usuario, consentimiento por operación, prevención de duplicados, comprobación y auditoría.

Pruebas MCP nativas read-only en el chat 09/10: lectura facturas sin registros, asientos 01–09/10 sin registros; get_usage periodo 2026-10 reportó 24/7.500 en el momento de consulta. No extrapolar esas cantidades a la cuenta real de Expert Consulting. La condición de prueba «con todos los permisos» es declarada por la dirección, no una evidencia de permiso efectivo de escritura ni de administración de tokens en el backend.

**Cambio de prioridad:** cerrar #690; matriz de paridad; probar KIA sobre integración existente y capacidades reales; ejecutar primer write con consentimiento específico solo tras verificar tenant y readback. Evitar trabajo de clonación no imprescindible.

---

## 25. Trazabilidad de adquisición y alta de usuarios en EXPERT Workspace V2 (decisión 10/10/2026)

**Objetivo vinculante:** en el nuevo Admin, responder desde la ficha de cualquier persona **cómo llegó, qué le llevó a registrarse, qué acción realizó y qué actividad posterior existe**, sin confundir el método de autenticación (Google) con la fuente de captación (Google Search, social, email, referido, directo u origen desconocido). El Portal Cliente comparte plantilla y eventos de cuenta, pero **no** muestra datos comerciales internos, segmentos ni trazas de otros usuarios. Esta ampliación se integra en Contactos, Inbox 360, Marketing, Inicio y Sistema del mismo EXPERT Workspace; **no propone un tercer dashboard ni otro CRM**.

**Estado de la decisión:** aprobado como alcance del plan y pendiente de implementación/verificación. No declarar operativa ninguna captura, vista, push o métrica hasta comprobar eventos reales en producción. PR #693, actualmente abierto, cubre la base visual Admin/Cliente y no sustituye estas fases de trazabilidad.

### 25.1. Caso de control: registro de Alberto Bouza (hechos observados)

- **Identidad en Auth:** Alberto Bouza, correo `albbouza@gmail.com`, ID de usuario `b6d17c9b-3d43-43f3-8d3f-ff4079e518f6`.
- **Alta:** 09/10/2026 a las 21:36:33 UTC (23:36:33, Europe/Madrid); autenticación con **proveedor Google** por flujo OAuth/PKCE.
- **Dominio confirmado:** `expertconsulting.es`. Los logs de inicio muestran Safari en iPhone.
- **Redirección de autenticación:** `/auth/callback?next=%2Fdashboard%3Fkia%3Dopen`; confirma que el flujo conducía al dashboard con KIA abierta, **no** que sepamos desde qué página hizo clic ni que conversara efectivamente con KIA.
- **Origen comercial:** **NO DETERMINADO**. Los logs de autenticación no acreditan primera página visitada, referrer externo, búsqueda orgánica, campaña ni UTM. No etiquetar como «Google orgánico» por usar Google OAuth. No convertir un `Referer: expertconsulting.es` del callback en adquisición externa.
- **Dispositivo:** un user-agent del evento es evidencia técnica puntual, no identidad inequívoca del terminal ni garantía de ubicación. Evitar deducir residencia, IP del usuario o fuente de marketing de proxies/saltos de red.

**Resultado exigido para este registro:** ficha Admin debe mostrar «Captación: no determinada», «Alta: web EXPERT», «Acceso: Google», «Continuación: KIA», «Dispositivo observado: iPhone/Safari», hora y nivel de evidencia; las dimensiones aún no conocidas permanecen desconocidas. **No rellenar retroactivamente fuentes inventadas** ni transformar el alta de Auth por sí sola en una solicitud profesional.

### 25.2. Reutilización de lo existente y diagnóstico de brechas

Código ya presente que debe aprovecharse:
- `lib/marketing/client-attribution.ts`: `captureClientAttribution()`, `readClientAttribution()`, `ACQUISITION_STORAGE_KEY` y cookie first-party `expert_acquisition`; captación **solo tras consentimiento de cookies**, primera ruta `originPath`, UTM y clasificación parcial de canal.
- `lib/marketing/server-attribution.ts`: `readRequestAttribution()`, `buildLeadAttributionFields()`; lectura validada de cookie para ciertas entradas comerciales.
- `lib/marketing/acquisition-taxonomy.ts`: enum `LeadSource`, esquema y `LeadAttribution`; se amplían con compatibilidad, no crear taxonomías incompatibles.
- `components/content/ArticleIntentCTA.tsx`: identificador `origen=blog:slug` o `docs:slug` en CTA, enlaces para consulta gratuita, servicio, cita y `/dashboard?kia=open`; tracking de clics de contenido.
- `leads.source`, `leads.source_key`, `leads.metadata.acquisition` e Inbox/KIA ya contienen parte de la trazabilidad comercial; `profiles` y `auth.users` son identidades, no sinónimos de lead.

**Hueco central:** el consentimiento/captura en visita o formulario, el CTA, la redirección OAuth, el alta en `auth.users`, el `profile`, la conversación KIA y el nuevo registro en Contactos **no constituyen hoy una cadena probada end-to-end**. Específicamente no hay evidencia confirmada de persistencia de first-touch + last-touch vinculada al perfil después del OAuth. Revisar integridad de `origen` al pasar por el callback y los redirects. No confundir un clic en CTA con una consulta iniciada.

### 25.3. Modelo canónico de procedencia y evidencias

**Diseñar un contrato tipado de adquisición**, guardando campos y eventos separados; la siguiente estructura es lógica, **no una orden para crear tablas sin inventario y Security Advisor**:

| Dimensión | Campo semántico | Regla |
| --- | --- | --- |
| Identidad | `profile_id`, `lead_id`, `company_id`, `tenant_id` | Referencias autorizadas, relaciones explícitas; jamás unificar por nombre/email solamente. |
| Primera procedencia | `first_touch_source`, `first_touch_medium`, `first_touch_at`, `first_landing_path` | Primera evidencia válida, inmutable salvo corrección auditada. |
| Último contacto previo al alta | `last_touch_source`, `last_touch_medium`, `last_touch_at`, `last_landing_path` | Actualiza en la ventana definida; no sustituye primera procedencia. |
| Campaña | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `campaign_id` | Lista permitida, longitud máxima, saneamiento y procedencia. No aceptar datos como hechos verificados por venir de query string. |
| Referencia de entrada | `referrer_hostname`, `landing_path`, `origin_type`, `origin_ref`, `content_slug`, `cta_id` | Separar referrer externo, ruta interna y artículo/guía/servicio concreto; conservar enlaces funcionales sin parámetros sensibles. |
| Contexto KIA | `kia_entry_surface`, `conversation_id`, `chat_started_at` | «Abrir KIA» no es lo mismo que «mensaje enviado» o «necesidad profesional detectada». |
| Autenticación | `auth_provider`, `signup_at`, `signup_entry_path`, `auth_flow_id` | Google OAuth es **método de login**, nunca `lead_source=google`. |
| Nivel de prueba | `evidence_type`, `confidence`, `captured_at`, `consent_state` | Distinguir `explicit_cta`, `utm`, `referrer`, `inferred`, `unknown`; no usar una clasificación inferida como certeza. |
| Seguridad de sesión | `session_id`, `first_seen_at`, `last_seen_at`, `device_label`, `browser`, `os` | Registro técnico limitado, administrado por Auth; no atribuir actividad de proxies a un dispositivo real. |

**Vocabulario obligatorio:** `direct` = ausencia de referencia detectable en condiciones instrumentadas; `unknown` / «no determinado» = evidencia insuficiente, rechazo de consentimiento o pérdida de datos. Nunca asignar automáticamente `direct` por fallo de tracking o ausencia de permiso. Mantener `organic_search`, `paid_search`, `social`, `referral`, `telegram`, `email`, `partner`, `other` del contrato actual.

**Causalidad y jerarquía:** mostrar **first-touch** y **last-touch** independientes y la **acción inmediata antes de registrarse** (CTA/servicio), indicando fuente de cada hecho. Un referrer sin UTM no prueba siempre una búsqueda orgánica; `google.com` puede ser redirect de autenticación. En caso de conflicto, mostrar ambas evidencias o «por verificar» y conservar raw event sanitizado, nunca sobrescribir la primera entrada.

**Persistencia propuesta:** reusar `leads.metadata.acquisition` y `profiles` con una vista/compositor server-side de Contactos 360; evaluar un registro de eventos de adquisición de solo inserción con IDs tipados, marcas temporales y expiración si el inventario lo necesita. Toda migración futura exige diseño mínimo, índice, RLS, retención y tests; los eventos no deben alojar secretos, tokens OAuth, URLs con credenciales, IP en claro ni texto libre confidencial.

### 25.4. Embudo completo de visita a trabajo profesional

1. **Primera visita pública:** capturar landing interna (sin query sensible), referrer de dominio externo, UTM y consentimiento aplicable; conservar el primer toque permitido, sin forzar cookies de marketing si no consiente.
2. **Navegación y CTA:** instrumentar `content_view` cuando legalmente proceda, `cta_clicked` con `blog:slug`, `docs:slug`, `service:slug`, `form:slug`, `kia_widget`, cita o Telegram. El contexto funcional `origen` viaja por la acción hasta su objeto, sin registrar navegación adicional no consentida.
3. **Inicio de autenticación:** vincular **estado firmado/validado, de un solo uso y caducidad breve**, a la acción legítima antes del OAuth; no poner datos personales en la URL ni confiar en parámetros editables. El callback recupera contexto permitido y evita open redirects.
4. **Alta o acceso repetido:** asociar a `profile_id` solo tras validar sesión e identidad. Evento `account_registered` **solo para alta nueva**, `account_logged_in` separado, `auth_provider` independiente. La falta de consentimiento para analítica **no impide registrarse**.
5. **Actividad posterior:** `kia_chat_started` solo cuando exista primer mensaje/hilo; `lead_requested` con necesidad explícita; `service_requested`, `quote_created`, `meeting_booked`, `checkout_started`, `payment_completed` cada uno tras persistencia/confirmación real, no al hacer clic.
6. **CRM:** añadir contacto de portal a directorio unificado con estado **«Registrado · sin solicitud»** si no pidió servicio. Un lead profesional se activa al registrar una petición real o señal comercial verificable, sin duplicar contacto, crear empresa ficticia ni confundir usuarios Auth con clientes.
7. **Comunicaciones:** Inbox 360 y KIA heredan solo el contexto autorizado del origen para atender la petición; si no hay conversación/expediente, no inventar motivo de contacto. Notificaciones y tareas por eventos comerciales o incidentes definidos, no por cada autenticación/turno de chat.

**Tráfico multicanal:** Telegram, formulario, email, redes, publicaciones y Google deben converger en Contactos, pero una identidad externa solo se vincula al `profile_id` mediante vínculo verificado. Conservar `origen` en redirecciones ES/RU, selector de idioma, calculadoras, enlaces a reserva, deep-links Telegram y cambio de dispositivo cuando exista evidencia de vinculación; si se pierde el rastro, mostrar «no determinado» sin rellenar.

### 25.5. Pantallas a incluir en los dos dashboards

**Admin Workspace — Inicio / Contactos / Marketing / Sistema**
- Tarjeta compacta de **«Nuevas altas de portal»** con nombre, fecha, acción siguiente y origen conocido/no determinado; distinguir altas de leads que requieren respuesta.
- En **Contactos 360**, pestaña **«Origen y recorrido»** con línea temporal verificada: primera visita conocida → página/contenido → CTA → login → primer mensaje KIA → solicitud → cita/presupuesto/compra. Cada nodo enlaza a evento/objeto existente y muestra origen, fecha, método, evidencia y consentimiento.
- Filtros combinables por canal, landing, `blog:slug`/`docs:slug`, campaña, CTA, registro por Google/email, estado de solicitud y `unknown`; no confundir `login_provider` y `lead_source`.
- En **Marketing**, embudo por fuente y contenido: visita consentida → CTA → registro → conversación → solicitud → presupuesto → contratación; cohortes y conversiones sobre personas/objetos **deduplicados**, y aviso de cobertura incompleta por consentimiento/adblock. No presentar ratios brutos como certeza estadística.
- En **Inbox 360**, mostrar badge de origen trazable en nueva comunicación, sin inferir intención; **«abrir ficha»** y «crear tarea» reutilizan objetos existentes.
- En **Sistema > Auditoría/Seguridad**, historial de accesos y cambios: operador real, entidad, fecha, acción, resultado, origen, navegador/dispositivo aproximado cuando exista base jurídica; diferenciar eventos de autenticación de operaciones administrativas y de sesiones delegadas.

**Client Workspace — Mi EXPERT / Perfil y seguridad**
- Mantener el **mismo design system Kiranism** que Admin, pero sus accesos, navegación, endpoints y filtros continúan cliente/empresa-scoped.
- En **Mi perfil > Seguridad y sesiones**, mostrar únicamente dispositivos/sesiones propias disponibles, fecha de acceso y, cuando Auth lo permita, cerrar sesión/revocar. Mostrar claramente qué detalles son aproximados y si el historial no existe. No inventar datos históricos.
- Preservar en el flujo de KIA únicamente contexto de página/servicio y empresa autorizada; ninguna vista de campañas, segmentación, UTM de otras personas o analítica global en Client.
- **Modo soporte Admin:** consultar la parte operativa del portal sin suplantar al cliente; acceso a su historial de eventos sujeto a permiso y finalidad; registrar entrada/salida/acciones con actor Admin. Nunca ver tokens, cookies, atributos privados innecesarios ni sesiones activas como credenciales reutilizables.

### 25.6. Avisos, consentimiento, retención y antifraude

- **Notificar a Dirección/Admin:** alta nueva de portal como aviso informativo compacto con enlace a ficha y procedencia si existe; notificación **prioritaria/push** cuando llega una consulta humana, nueva solicitud de servicio, reserva o incidente de onboarding/KIA. Deduplicación por `event_id` + tipo; preferencia configurable, agrupación y silencio nocturno salvo urgencia, con acuse, reintentos y estado de entrega. No enviar un push por cada mensaje o respuesta de KIA.
- **Entrega:** canal push admin existente como preferencia; fallback por email/agenda según configuración real. **No afirmar que ha llegado** sin prueba de envío/entrega. Contador y feed de avisos coherentes con Inbox y Contactos.
- **RGPD/ePrivacy:** distinguir almacenamiento estrictamente necesario para iniciar sesión/atender una petición de **analítica/marketing no esencial**, sujeto al consentimiento o base jurídica evaluada. Si rechaza cookies, no usar localStorage, cookies de campaña o identificadores alternativos para reconstruir navegación; respetar revocación y expiración. El `origen` que el propio usuario envía al pedir un servicio puede conservarse como contexto transaccional cuando resulte necesario, no como consentimiento de marketing.
- **Minimización:** no incluir PII en eventos de analítica, no exponer email/teléfono en UTM; no fingerprinting, geolocalización por IP ni inferencias de identidad. Política de retención diferenciada: metadata de campaña transitoria, audit de seguridad por plazo justificado y expediente según obligación legal; documentar periodos concretos con revisión RGPD antes de activar.
- **Seguridad:** allowlist de campos/rutas/eventos, comprobación de firma y anti replay del estado de login, mismos límites tenant/empresa y RLS que Contactos, filtrado anti-bot, llamadas idempotentes y bloqueo de URL inyectada. **No enviar datos de origen comercial a KIA como instrucción confiable**.
- **Auditoría:** cada corrección manual de fuente o vinculación de identidades conserva dato anterior, autor, motivo, fecha, evidencia y permiso; nunca completar `unknown` por intuición humana sin marcar la corrección como manual.

### 25.7. PRs y dependencias; respetar la secuencia de Workspace V2

| Orden | Entrega acotada | Dependencia / resultado verificable |
| --- | --- | --- |
| A0 | Inventario de puntos de captura, callback OAuth, click CTA, cookie consent, eventos en leads/profiles, observabilidad Vercel/Supabase | Informe de brechas y pruebas existentes; **no crear tablas todavía**. |
| A1 | Contrato de adquisición y propagación segura por CTA/login, first/last touch, `unknown`, prueba de consentimiento | Tests unitarios de clasificación y flujo ES/RU; sin persistir PII en URL. |
| A2 | Asociación idempotente del alta Auth al perfil/contacto, `account_registered` distinto de login y solicitud; timeline de evidencias | E2E Google OAuth, callback y regreso a KIA; no duplicar leads. |
| A3 | Contactos 360 «Origen y recorrido», filtros, badge Inbox, feed nuevas altas + alertas push | Admin-only API paginada; permisos, dedupe, pruebas mobile y escritorio. |
| A4 | Embudo Marketing con cobertura y tasas correctamente denominadas + sesiones propias del cliente + modo soporte auditado | Misma fuente de datos, capas RBAC/RLS distintas y ninguna fuga de tracking comercial. |
| A5 | Validación con datos reales, métricas de ingestión y alertas, retención/consentimiento, rollback por flag | Prueba contra los casos de aceptación; despliegue por superficie, sin alterar históricos. |

A0–A2 pueden avanzar en paralelo con la implementación visual PR #693 cuando no toquen los mismos archivos; A3–A5 se montan sobre `AdminWorkspaceShell` y `ClientWorkspaceShell` compartidos. Mantener la regla general de cambios por PR pequeña, typecheck/lint/tests/Vercel, migración revisada y rollback independiente. **No** añadir nuevas herramientas externas para duplicar Supabase, ni otro tablero comercial.

### 25.8. Criterios de aceptación y pruebas E2E obligatorias

1. **Alberto Bouza (histórico real):** alta Google en web EXPERT y salto a KIA acreditados; origen comercial «No determinado». Nunca mostrar «Google orgánico» sin evidencia.
2. **Búsqueda orgánica con referrer verificable y consentimiento:** registra ruta y canal apropiados si existe evidencia válida; Google OAuth posterior no altera `first_touch`.
3. **Campaña etiquetada:** conserva `utm_source/medium/campaign/content/term`, landing y CTA a través de redirección al login y vuelta a `/dashboard?kia=open`; diferencia first/last touch.
4. **Artículo `blog:slug` / guía `docs:slug`:** consulta, servicio, reserva y KIA retienen el CTA de origen; no basta contabilizar visualización.
5. **Cookie rechazada o revocada:** login, KIA pública y contratación siguen funcionando; no se instala rastreo de campaña alternativo; fuente desconocida donde falten evidencias.
6. **Registro vs login:** un usuario recurrente no dispara nueva alta, alerta ni lead; segundo clic en CTA no crea dos conversiones.
7. **KIA sin mensaje:** el botón abierto no se registra como conversación o lead; `kia_chat_started` exige conversación real.
8. **Persona multientidad / lead previo por Stripe o email:** una identidad puede estar relacionada con varios objetos sin fusionar por email ni mezclar empresa, tenant o histórico contable.
9. **Push y tarea:** una nueva solicitud humana genera un aviso único y trabajo vinculable; el simple registro informa según preferencias sin crear tarea profesional ficticia; auditar fallos de entrega.
10. **Dos superficies:** un cliente no puede acceder a /admin ni consultar fuentes/embudos globales; un admin en modo soporte queda identificado y auditado.
11. **Sesiones:** cliente solo ve las suyas y no puede consultar/revocar las de otro; datos de navegador son aproximados; no se expone IP completa ni token.
12. **Reconstrucción incompleta:** una fuente perdida se muestra `unknown`; informe de calidad indica cobertura y no calcula una conversión falsa.
13. **Dispositivos e idiomas:** Safari iPhone, Android, desktop, ES/RU, redirecciones y viewport móvil; KIA no tapa el panel ni corta botones de recorrido.
14. **Auditoría y rollback:** rastro de cambios con autor, resultado y trazabilidad; con feature flag OFF, registro/autenticación siguen operativos sin errores ni alteración de fuentes históricas.

**Definition of Done:** se puede responder «¿de dónde vino este usuario?» desde Admin mostrando **hechos verificables y los huecos de información**, con enlace a la evidencia disponible, alertas funcionando y controles de privacidad. No declarar completado el punto hasta pasar la prueba con un registro nuevo, al menos un origen externo consentido y el caso histórico Alberto.

---

## 26. Enriquecimiento profesional y empresarial verificable en Contactos 360 (decisión 10/10/2026)

**Decisión:** ampliar EXPERT Workspace V2 para que un **lead que llega por web, correo, formulario, Telegram, cita u otros canales**, y también **un usuario que se registra sin solicitar servicio**, disponga de una **evaluación de enriquecimiento** en la ficha Contactos 360. KIA buscará de manera proporcional **información empresarial y profesional relacionada con la finalidad de la relación**, cuando dispongamos de identificadores y base jurídica adecuados. Buscar no significa afirmar que un resultado pertenece a esa persona. **El registro por sí solo no acredita actividad profesional, necesidad comercial ni condición de competidor.**

**Estado:** especificación aprobada, **no hay buscador automático activado ni verificación de identidad de terceros completada por esta decisión**. Este bloque extiende el §25 (adquisición y altas), el §7.2 (Contactos), §7.5 (Inbox 360), §7.7 (Marketing), §2 ter (modo soporte) y el Design System Admin/Cliente compartido; **no** inaugura un CRM paralelo, una plataforma OSINT ni un menú adicional en el portal cliente.

### 26.1. Objetivos y casos de uso

- **Empresa conocida:** si un lead o usuario facilita voluntariamente razón social, **NIF/CIF** o dominio corporativo, KIA localiza datos corporativos pertinentes para asesoramiento: denominación, actividad pública, CNAE cuando conste, web corporativa, actos registrales y representantes cuando sean necesarios y legalmente accesibles. Los datos oficiales quedan sujetos a su propia vigencia y posibles discrepancias.
- **Profesional conocido:** si la persona aporta empresa, profesión o URL profesional, KIA puede contrastar **esa vinculación concreta**, consultando solo información profesional pertinente y accesible legalmente. Si solo hay un nombre común o email personal, **no debe iniciar una búsqueda indiscriminada de identidad o redes sociales**: estado «Datos insuficientes para vincular actividad profesional».
- **Usuario recién registrado sin consulta:** se registra el evento de alta, se crea/actualiza su identidad y se muestra «Registrado · sin solicitud»; el evaluador puede ejecutar comprobaciones **no intrusivas** sobre empresa aportada, si se cumplen permisos, y marcar el resto «No investigado — falta dato/base habilitante». No crear automáticamente un lead profesional o tarea comercial.
- **Lead comercial entrante:** si existe finalidad clara, usar el enriquecimiento verificado para preparar una atención más contextualizada: tipo de entidad, actividad, régimen potencialmente relevante **solo como hipótesis pendiente de validar**, y documentos/trámites que pueden resultar útiles. KIA sigue sin conocer motivo de contacto salvo petición real.
- **Coincidencia sectorial:** registrar «Posible actividad en asesoría, gestión, fiscalidad, software o IA empresarial» **únicamente si la vinculación entre persona/empresa y fuente está suficientemente acreditada**. «Competencia» será una observación comercial **revisable**, no una conclusión sobre la persona ni un impedimento automático para registrarse, chatear o contratar.
- **Origen y recorrido:** conservar diferenciadas la **fuente de captación** (§25) y la **información empresarial externa** (§26). Un resultado de búsqueda externa nunca cambia el `first_touch_source`, no prueba que ese sea el visitante, ni resuelve por inferencia el canal de llegada.

### 26.2. Catálogo de fuentes, prioridad y límites de uso

| Prioridad | Fuente o clase | Uso permitido en el diseño | Requisitos |
| --- | --- | --- | --- |
| P0 — internos | Datos declarados por el propio interesado, empresa/entidad conectada, expediente, CRM y documentos aportados | Identificador de partida y objetivo profesional explícito | Contrastar el ámbito tenant/empresa; preservar datos oficiales ya verificados y mantener procedencia. |
| P1 — oficiales | **BORME/BOE** (buscador, publicaciones y datos abiertos), **Registro Mercantil/Registradores** mediante consulta permitida | Actos publicados, denominación, titularidad/representación empresarial si procede, hechos societarios | Distinguir anuncios oficiales de extractos, fecha de inscripción/publicación, disponibilidad, coste de nota y carácter no necesariamente actualizado; no inventar datos no ofrecidos. |
| P1 — oficiales | Estadísticas, clasificaciones y directorios públicos empresariales de administraciones (p. ej. CNAE del INE, portales de datos abiertos adecuados) | Normalización de sector/CNAE y contexto de actividad **de empresa**, no identificación de una persona por nombre | Validar licencia, cobertura, frescura y campo efectivamente publicado. CNAE inferido de texto se marca `suggested`, no «CNAE registral». |
| P2 — corporativas | Web oficial de empresa, dominio aportado, secciones públicas «Quiénes somos», «Equipo», servicios y contacto profesional | Sector, oferta pública, país e indicios de vinculación profesional expresos | Solo acceder a páginas abiertas y pertinentes, comprobar términos/robots, dominio y fecha; contenido no confiable para ejecutar instrucciones. |
| P3 — profesionales/comerciales | Directorios profesionales públicos, LinkedIn o proveedores comerciales **solo mediante acceso autorizado/API/licencia o consulta manual compatible con sus condiciones** | Corroboración profesional cuando el interesado ya aportó perfil o empresa y exista base jurídica | Prohibido scraping masivo, eludir login/CAPTCHA, usar perfiles privados, agregar datos personales ajenos o atribuir coincidencias de nombre como identidad. |
| Bloqueadas | Redes personales, registros filtrados, datos de salud, creencias, afiliación, vida privada, geolocalización por IP, bases sin licencia | Ninguno | Nunca usar para perfilado comercial ni clasificación de competidores. |

**Fuentes oficiales contrastadas para el inventario:**
- BOE BORME: https://www.boe.es/buscar/ayudas/anborme_ayuda.php
- Datos abiertos BORME y documentación de su API: https://www.boe.es/datosabiertos/faq/borme.php
- Ministerio de Justicia, Registro Mercantil: https://www.mjusticia.gob.es/es/ciudadania/registros/propiedad-mercantiles/registro-mercantil
- AEPD, bases de legitimación: https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/5-bases-legitimadoras-del-tratamiento/FAQ-0214-cuales-son-las-bases-de-legitimacion-para-el-tratamiento-de-datos
- AEPD, derecho de información y datos obtenidos de terceros: https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion

Las fuentes corporativas de terceros son **indicios**, no certificaciones; extractos de agregadores pueden estar desactualizados. Comprobar la licencia, cuotas y acceso técnico antes de conectar cada proveedor. Para Registro Mercantil, si se necesita certificación, obtener el documento por su vía oficial y no tratar un resumen web como certificación.

### 26.3. Matching de identidad con abstención obligatoria

**No se identifica una persona por nombre y apellidos solamente.** Para unir una fuente profesional externa con una persona de EXPERT, exigir identificadores verificables y compatibles con la finalidad: vínculo aportado por el interesado, dominio corporativo y empresa confirmados, identificador registral de empresa, referencia laboral profesional explícita con segunda corroboración independiente, o aceptación expresa de la coincidencia por parte del interesado/revisor. **El parecido de email o nombre no supera por sí solo la prueba**; un proveedor puede mostrar a un homónimo.

Estados independientes de la búsqueda:
1. `not_eligible` — falta base jurídica o vínculo profesional suficiente.
2. `queued` / `in_progress` — búsqueda permitida iniciada, con control de cuota.
3. `no_verified_match` — se han encontrado 0 o más resultados pero ninguno atribuible.
4. `candidate_unverified` — candidato en cola de revisión; **no adjuntarlo como hecho confirmado**.
5. `company_verified` — sociedad/actividad verificadas con identificador corporativo.
6. `professional_link_verified` — vínculo profesional confirmado con evidencia suficiente.
7. `needs_human_review` / `rejected` / `stale` / `error` — diferentes estados de control, no sobreescribir con «sin actividad».
 
**Política de abstención:** cuando existan varios Alberto Bouza u otros homónimos, presentar solo «Coincidencias públicas no verificadas», sin asociarlas al perfil real, sin extraer su correo/vida privada y sin sugerir que sean la misma persona. **El caso Alberto Bouza es el test principal de falso positivo**: registro Google con origen comercial desconocido, ningún mensaje KIA registrado, ningún dato empresarial/profesional corroborado; el sistema no puede asociarle empresas ni identificarlo como competencia por coincidencias nominales.

### 26.4. Contrato de datos, provenance, revisión y retención

**Modelo lógico — decidir persistencia después de inventario, sin migración prematura**:
 
| Objeto/campo | Semántica / seguridad |
| --- | --- |
| `enrichment_assessment` | `subject_type` persona/empresa, `subject_id` del resolutor Contactos, `tenant_id`, `trigger_event_id`, `eligibility_reason`, `lawful_basis_id`, `status`, `attempts`, `created_at/updated_at`, `expires_at`. |
| `enrichment_source` | `source_kind`, `source_url` **canónica y saneada**, `issuer`, `published_at`, `retrieved_at`, `access_mode`, `licence`, `evidence_excerpt` mínimo (no copiar páginas completas), `source_hash`. |
| `enrichment_finding` | Tipo company/profession/sector/CNAE, valor y **si es dato confirmado, inferido o no vinculado**, `verification_level`, `matched_identifiers` redactados, `company_id` explícito; `review_status`. |
| `enrichment_review` | Actor real admin, campo revisado, evidencia, decisión aceptar/rechazar/corregir, justificación, fecha y diff; append-only/auditable. |
| `enrichment_usage` | Ejecuciones, proveedor, coste/cuota, caché, errores, reintentos, nivel de uso y `source_policy_version`, sin credenciales ni datos personales en logs. |

**Fuente de verdad y separación:** no modificar `auth.users`, datos oficiales de `companies` o `client_registry_facts` por una búsqueda web. Guardar **sugerencias** anexas y exigir `confirm/save` auditado antes de insertar un dato verificado en la ficha/Hoja Registral. La revisión conserva la fuente original, la corrección y la fecha. Si se rechaza una coincidencia, evitar que reaparezca como confirmada en el siguiente cron. No fusionar leads/perfiles/empresas por coincidencias automatizadas.

**Límites de almacenamiento y costes:** caché por entidad verificada + fuente, con TTL ajustado a cada clase; cache negativa, deduplicación por ID del evento y sujeto, una sola evaluación inicial por alta/lead y reconsulta solo ante **nuevos datos profesionales, cambio material o revisión expresa**. No reintentos perpetuos ni scraping programado de personas. Valorar retención corta de resultados no verificados y eliminación segura, conforme a la política RGPD documentada. No enviar cuerpos completos, PII innecesaria ni secretos al modelo de IA.

### 26.5. Orquestación KIA — flujo de entrada no bloqueante

```text
Alta Auth / lead validado / nueva empresa declarada
  → normalizar identidad dentro del tenant (sin join automático por email)
  → evaluar finalidad, base jurídica, permisos, identificadores y política fuente
  → NO elegible: estado justificado «sin búsqueda» y finaliza
  → SÍ elegible: encolar job idempotente en infraestructura actual
      → conectar fuentes permitidas (oficial → web corporativa → otras autorizadas)
      → extraer hechos corporativos/profesionales pertinentes + fecha + URL
      → resolver duplicados y matching conservador
      → no verificado: abstenerse y ofrecer revisión (sin asociar homónimos)
      → verificado: crear hallazgos y propuesta de actualización
      → revisión humana cuando vincula persona/afecta perfil comercial
      → publicar en Contactos 360, conservar auditoría y estado de última revisión
```

- Activación única por `registration.created` o `lead.created` con evento persistido; la visita anónima o el login repetido no produce una investigación nueva. Un formulario empresarial con CIF validado puede habilitar la ruta corporativa; un alta solo con email personal **termina como no elegible**. No hacer que el alta espere la respuesta de buscadores.
- KIA clasifica necesidad de negocio solo a partir de solicitud/expediente/consentimiento; la información encontrada puede **contextualizar** una respuesta, nunca decidirla por el cliente ni forzar oferta.
- Servicios de búsqueda/IA exponen únicamente tools de **lectura de fuentes autorizadas** en esta fase. Separación entre datos fuente no confiables, razonamiento IA y escritura al CRM; URL/HTML externo no son instrucciones ejecutables. Revisión de prompt injection/SSRF, acceso a host permitido, rate limit y cuotas.
- Integrar con `internal_tasks`, `next_best_actions`, Inbox 360 y `client_registry_events` solo si existe una acción humana real. Sin coincidencia, no crear tarea, lead duplicado, incidencia ni aviso intrusivo.
- No usar un único valor de `confidence` para simular certeza: guardar evidencia explícita y método; el umbral de vinculación no reemplaza la comprobación humana requerida.

### 26.6. UX: misma plantilla Admin/Cliente, permisos distintos

**Admin → Contactos → Ficha 360**, dentro de la misma plantilla Kiranism:
- Añadir bloque o pestaña **«Empresa y actividad · Fuentes verificadas»** conectado a «Origen y recorrido» (§25) pero conceptualmente separado.
- Encabezado compacto: `Empresa identificada / Pendiente / Datos insuficientes`; actividad, web corporativa y sector solo si verificados; botón `Ver fuente` con tipo, fecha y licencia; advertencia de posible dato obsoleto.
- Botones `Revisar coincidencias`, `Corregir`, `Descartar` y `Actualizar datos` (si la política de fuente permite refresco), con confirmación y rastro de cambios; control `No buscar` cuando haya oposición o falta de finalidad.
- En **Inicio Admin**, incluir métrica accionable «Hallazgos corporativos pendientes de revisar» **sin mezclar con leads calientes**. Una alta informativa sigue sin tarea profesional automática.
- Filtros del directorio por `Actividad verificada`, `Sector/CNAE`, `Empresa vinculada`, `Fuente`, `Estado de revisión`; permitir búsquedas combinadas **server-side** sin exponer PII a visitantes.
- En Marketing, análisis **agregado por sectores de entidades verificadas** y cobertura de enriquecimiento con denominadores correctos; «solapamiento sectorial» no significa competidor confirmado. Prohibido enviar campañas a personas por inferencias no validadas o sin base habilitante para comunicaciones comerciales.

**Cliente → Mi EXPERT:** los componentes de empresa que se muestren al titular pueden incorporar **información registral/publicada con cita y fecha**, marcar sugerencias para su rectificación y permitir aportar/confirmar empresa; nunca publicar evaluaciones internas de interés comercial, anotaciones de competencia, búsquedas internas o coincidencias de otras personas. En **Modo soporte**, el Admin ve el mismo contexto operativo del cliente, y cualquier confirmación queda firmada como actor Admin real.

### 26.7. Privacidad, transparencia y condiciones de activación

**Puerta de activación obligatoria antes de ejecutar búsquedas sistemáticas sobre personas:**
- Mantener registro de actividades, finalidad definida y **base de legitimación por tipo de fuente/objeto**, con documentación de ponderación si se utiliza interés legítimo; evaluar necesidad de EIPD cuando concurran los criterios. Que algo esté publicado en Internet **no significa que pueda reutilizarse indiscriminadamente para elaborar perfiles comerciales**.
- Actualizar aviso de privacidad de alta, formulario, chat y comunicaciones para indicar enriquecimiento empresarial de fuentes públicas, categorías, procedencia, usos y derechos. Cuando haya datos no recabados del interesado, cumplir las obligaciones de información del art. 14 RGPD y excepciones solo si son legalmente aplicables. Registrar oposición y supresión conforme a obligaciones, bloqueando nueva búsqueda.
- Separar búsqueda corporativa para prestar servicio, búsqueda profesional de una persona y prospección/segmentación marketing: **pueden requerir bases y garantías distintas**. Una alta de cuenta sin solicitud no autoriza por defecto prospectar por perfiles personales. No usar consentimiento de cookies como base universal ni deducir consentimiento comercial por registrarse.
- **Excluir expresamente** datos personales sensibles, redes de ocio, direcciones particulares, familia, patrones de actividad y búsquedas por correo personal en Internet. Prohibidos enriquecimientos inferenciales sobre reputación, solvencia personal, ideología, religión, salud, orientación, etc.
- No tomar decisiones exclusivamente automatizadas que restrinjan acceso, condiciones, prestación de servicio o trato comercial por «perfil de competencia»; acceso de cliente no condicionado a la ficha enriquecida.
- Garantizar acceso Admin con finalidad y rol, separación tenant/empresa, cifrado y minimización; proveedores y transferencias revisados. Retención concreta y política de borrado a aprobar por responsable RGPD antes del despliegue.

**Evidencia normativa y operativa:** AEPD explica bases legitimadoras y necesidad de documentarlas; el deber de información comprende también la procedencia de datos obtenidos de terceros y perfiles. Referencias verificadas arriba en §26.2.

### 26.8. Implementación por PRs compatibles con §25 / workspace compartido

| Orden | Entrega | Validación |
| --- | --- | --- |
| E0 | Inventario: fuentes existentes `companies`, `profiles`, leads, datos registrales, KIA, proveedor LLM, RGPD y capacidades de APIs oficiales; clasificación de identificadores y autorización. | Matriz real de campos disponibles, costes, condiciones de uso y decisión documentada de base jurídica por supuesto. |
| E1 | Contratos tipados `eligibility`, `match`, `finding`, `source`; reglas de abstención, cache/idempotencia, pipeline solo lectura con fuentes oficiales/corporativas permitidas. | Unit tests homónimos, emails privados, CIF y URLs malformados, inyección en contenidos, error de fuente y `no_match`. |
| E2 | Persistencia mínima de sugerencias/evidencias y revisión humana con RLS, auditable, sin escribir automáticamente fuente oficial de empresas. | Migración si procede, Security Advisor, aislamiento por tenant y prohibición de joins por nombre/email; test reconexión/cambio de empresa. |
| E3 | Contactos 360 bloque de actividad, fuentes y revisión; búsqueda y filtros autorizados; lectura empresa propia en Cliente. | UX de las dos superficies sobre componentes compartidos, mobile ES/RU, modo soporte con actor real, accesibilidad. |
| E4 | Eventos de entrada + jobs idempotentes y observabilidad: alta, lead, nueva empresa; alertas **solo** por hallazgo revisable relevante o error repetido. | Reintento sin dobles búsquedas/avisos, fallos sin bloquear alta/KIA, cuotas, log de coste y última actualización. |
| E5 | Piloto sin escritura automática en CRM y revisión RGPD; despliegue gradual por flag independiente de `admin_v2`/`client_v2`. | Aprobación de privacidad, fuentes habilitadas/licencias y pruebas reales; rollback que no impide registrarse ni usar KIA. |

**Priorización:** primero el §25 (atribución fiable), luego E0/E1 del §26 en paralelo al diseño visual #693; no retrasar el acceso a KIA ni la finalización del Admin/Cliente por un módulo de enriquecimiento. Evitar implantar plataformas de terceros mientras BORME, fuentes públicas y estructuras EXPERT cubran el piloto.

### 26.9. Criterios de aceptación clave

1. **Alberto Bouza:** ante homónimos encontrados en Internet, el sistema se abstiene; **ninguna empresa/sector/competencia atribuida** ni búsqueda personal automatizada si solo consta nombre y email privado. Mostrar «Empresa/actividad no verificada»; cuenta funcional y sin tarea de ventas forzada.
2. **Lead SL con CIF y razón social:** buscar entidad correcta, dar evidencias con URL, publicación y fecha; distinguir CNAE oficial de actividad sugerida. Rechazar sociedad homónima con distinto CIF.
3. **Autónomo sin empresa ni dato profesional explícito:** no buscar redes personales; ofrecer que aporte sector/actividad si necesita asesoramiento. Mantener estado `not_eligible`.
4. **Profesional con perfil aportado:** consulta según permiso/base jurídica, exige vínculo acreditado y revisión antes de adherir el hecho a su ficha.
5. **Identidad ambigua:** candidatos externos permanecen aislados como posibles coincidencias, sin enlazarse ni mostrarse como hechos; rechazo queda guardado y prevalece en reintentos.
6. **Competencia:** coincidir en CNAE/servicio no determina condición competitiva; comentario interno revisable, nunca segmentación negativa ni trato diferencial automático.
7. **Cliente y staff no autorizado:** no pueden consultar evidencias privadas ajenas ni el ranking interno; tenant_admin jamás recibe acceso global.
8. **Oposición/borrado/cambio de base:** no se generan nuevas consultas; se aplica conservación/supresión conforme a política; auditoría necesaria no filtra datos prohibidos.
9. **Autorización y recursos:** ningún token secreto expuesto, scraping bloqueado, APIs respetan límites, origen de cada hallazgo visible, caché y facturación de llamadas contabilizadas.
10. **Trazabilidad de la operación:** tiempo de alta no aumenta por enriquecimiento; eventos repetidos no duplican datos, tareas ni notificaciones; fallo de proveedor no cambia `first_touch_source`, Auth, expedientes ni KIA.
11. **Cierre:** reporte de precisión de matching manual y tasa de abstención; no declarar el módulo operativo hasta probar 1 empresa con identificador confirmado, 1 profesional explícito, 1 homónimo, 1 oposición y permisos entre dos tenants.

**Definition of Done:** cualquier alta/lead tiene un **estado explícito de elegibilidad de enriquecimiento**, y cuando exista información pertinente **verificada** puede verse desde Contactos 360 con fuente, fecha, grado de vinculación, revisión y derecho de corrección. «No elegible», «sin coincidencia» y «fuente no disponible» son resultados válidos; ninguno permite completar identidades, profesiones o necesidades comerciales inventadas.
