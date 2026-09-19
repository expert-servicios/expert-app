# Lote 1 — automatización operativa y publicación

Fecha: 19/09/2026  
Estado: implementación

## Objetivo

Convertir el lote 1 en un pipeline único que conecte producto, contenido, expediente, KIA y canales de adquisición sin duplicar reglas.

## Fuente operativa

La fuente canónica de requisitos, documentación, pasos y tareas es:

```text
lib/services/service-operational-blueprints.ts
```

El mismo blueprint alimenta:

- checklist de usuario;
- checklist de Admin;
- Base de Conocimientos;
- artículos de apoyo;
- expediente creado tras pago;
- tareas internas;
- KIA en Dashboard/Admin;
- KIA en Telegram;
- readiness para publicación.

## Flujo post-pago

```text
Stripe payment
  -> order
  -> ensureServiceOrderFulfillment()
  -> case
  -> docs_checklist + checklist_json
  -> internal_tasks
  -> KIA puede consultar estado, blueprint y pendientes
```

La función es idempotente por `order_id` y por combinación `case_id + title + source`.

## Gates humanos

La automatización puede:

- abrir expediente;
- generar checklist;
- crear tareas;
- calcular pendientes;
- preparar contenido;
- preparar canales en `review`;
- informar al usuario;
- resumir al Admin.

No puede automáticamente:

- decidir una viabilidad jurídica dudosa;
- validar autenticidad documental;
- dar por acreditada representación;
- presentar ante la Administración;
- emitir definitivamente un certificado;
- publicar campañas externas.

Las fases sensibles del blueprint llevan `humanApprovalRequired`.

## Contenido

Cada servicio del lote dispone de un suelo automático de:

- 3 artículos blog;
- 3 guías KB;
- 3 piezas Facebook;
- 3 piezas Instagram;
- 3 piezas LinkedIn;
- 3 piezas Google.

Las piezas manuales existentes tienen prioridad. El generador actúa como fallback para impedir huecos de producción.

## KIA

Tool canónica:

```text
get_service_operational_blueprint
```

Riesgo: R0  
Efecto: read  
Canales: Dashboard, Admin, Telegram, email y demás canales KIA autorizados.

Para usuario devuelve requisitos, documentación, pasos y orientación. Para Admin añade plan de tareas y reglas de escalado.

## Telegram

Comandos:

```text
/status
/link CODIGO
/servicio SLUG
/lote1
```

`/lote1` queda reservado al chat Admin.

El canal cliente exige:

1. `TELEGRAM_WEBHOOK_SECRET`;
2. `KIA_TELEGRAM_CLIENTS_ENABLED=true`;
3. identidad EXPERT vinculada mediante código de un solo uso;
4. perfil activo y tenant consistente;
5. policy KIA autorizada.

Las tools R0/R1 requieren además:

```text
KIA_TELEGRAM_TOOLS_ENABLED=true
```

El despliegue es fail-closed por defecto.

## Publicación

Endpoint Admin:

```text
GET  /api/admin/services/publication-review
POST /api/admin/services/publication-review
```

POST acepta:

```json
{ "slug": "arraigo-social" }
```

o:

```json
{ "batch1": true }
```

Solo prepara `service_channel_configs`:

- `publish_status = review`;
- `enabled = false`.

No publica en Meta, Google, LinkedIn, Facebook o Instagram.

## Regla de seguridad

Un servicio con errores de readiness no se prepara para canales.

Además, el gate de producción exige blueprint operativo con:

- requisitos estructurados;
- documentación;
- tareas de expediente.

## Correcciones normativas incorporadas

### Arraigo Sociolaboral

El slug legacy `arraigo-laboral` se mantiene por compatibilidad, pero nombre, landing, viabilidad, blueprint y KIA trabajan con la modalidad vigente **Arraigo Sociolaboral**.

### Arraigo Familiar

Se elimina la antigua presentación como vía genérica para cualquier familiar de español/residente. El sistema obliga a clasificar primero el supuesto vigente y redirigir a otra autorización cuando corresponda.

## Próxima capa

Después de estabilizar el lote 1:

1. panel visual para readiness por servicio;
2. aprobación editorial por canal;
3. generación de payload Meta/Google desde C2;
4. jobs auditables;
5. publicación externa únicamente desde `ready`;
6. feedback de conversiones e incidencias al catálogo.
