# DISEÑO GLOBAL MERIDIANO, S.L. — reconstrucción contable interna 2025–2026

> **Estado:** INTERNAL ONLY · NO CLIENT ACCESS · NO EXTERNAL EMAIL · ACCOUNTING READ-ONLY
>
> Este documento es el hilo operativo maestro de DGM. Debe actualizarse a medida que avancemos. Las decisiones específicas de DGM permanecen aquí y en el contexto interno de la empresa; solo las reglas generalizables se promocionan a KIA Operator Lessons.

## 1. Identidad y alcance

- **Razón social:** DISEÑO GLOBAL MERIDIANO, S.L.
- **Alias interno:** DGM
- **CIF:** B42700427
- **Company ID EXPERT:** `188a1871-0ea8-4b11-adac-c9acc41c4a4b`
- **Tipo:** sociedad patrimonial.
- **Actividad operativa:** arrendamiento de viviendas.
- **Inmuebles:** 5 viviendas en alquiler.
- **Ejercicios a reconstruir:** 2025 y 2026.

## 2. Puertas operativas

Mientras este bloque siga activo:

- no crear usuario para el titular;
- no crear membresía `profile_companies`;
- no enviar invitación al portal;
- no enviar correos automáticos ni manuales al titular como parte de este proyecto;
- no reservar reuniones externas;
- no escribir contabilidad en Holded;
- sí se permite analizar correos, crear tareas internas, preparar borradores internos y realizar auditoría read-only.

Las puertas están persistidas en `company_operational_controls`:

- `external_communication_blocked = true`
- `portal_activation_blocked = true`
- `accounting_write_blocked = true`

## 3. Arquitectura Holded

La única ruta válida es:

`EXPERT Admin → Company 360 → Integraciones → Holded → tenant DGM → KIA`

Configuración objetivo:

- modo: `advisor_managed`;
- API: v2;
- credencial: token específico del tenant DGM;
- almacenamiento: `client_integration_secrets`, cifrado;
- nunca usar el conector Holded del chat;
- nunca usar el token raíz del portal de asesorías para entrar al tenant DGM.

### Estado conocido

- El 03/10/2026 se validó técnicamente un token v2 de DGM.
- Esa prueba no quedó migrada a `client_integrations`.
- DGM debe conectarse de nuevo desde Company 360 para crear la integración canónica.
- Hasta entonces no debe iniciarse extracción contable real desde KIA.

## 4. Plan de reconstrucción

### Fase 0 — control y alcance

- [x] Crear DGM en `companies` sin usuario.
- [x] Bloquear comunicación externa.
- [x] Bloquear activación del portal.
- [x] Bloquear escritura contable.
- [x] Crear tareas internas.
- [ ] Conectar Holded canónicamente desde Company 360.

### Fase 1 — auditoría read-only

Inventariar 2025 y 2026 sin modificar nada:

- plan contable;
- asientos y diario existente;
- saldos de apertura;
- facturas emitidas / rentas;
- facturas y gastos recibidos;
- cobros y pagos;
- cuentas bancarias y movimientos si la API los expone;
- impuestos presentados;
- inmovilizado;
- amortizaciones;
- préstamos, fianzas y depósitos si existen;
- incidencias y duplicidades.

Clasificar cada elemento como:

- `correcto`
- `falta_contabilizar`
- `corregir`
- `duplicado`
- `revisar`

### Fase 2 — matriz de 5 viviendas

Crear una ficha por inmueble con:

- identificación interna;
- contrato / inquilino;
- período de alquiler;
- renta mensual;
- cobros;
- fianza;
- IBI;
- comunidad;
- seguro;
- reparaciones y conservación;
- tasas / basura;
- suministros asumidos por propietario;
- amortización;
- otros costes;
- incidencias de arrendamiento;
- rentabilidad 2025;
- rentabilidad 2026.

Objetivo: que EXPERT/KIA pueda reconstruir la contabilidad y analizar rentabilidad por unidad de explotación.

### Fase 3 — plan de corrección

Antes de escribir:

1. conciliar saldos de apertura;
2. validar cuentas contables y criterios homogéneos;
3. definir tratamiento por tipo de gasto;
4. definir inmovilizado y amortización por inmueble;
5. validar ingresos/cobros;
6. validar fianzas;
7. conciliar bancos;
8. cruzar con impuestos presentados;
9. generar lista de asientos a crear/corregir;
10. aprobación interna EXPERT.

### Fase 4 — reconstrucción

Solo después de retirar `accounting_write_blocked`:

- corregir 2025;
- cerrar 2025;
- trasladar saldos correctos a 2026;
- reconstruir 2026 hasta fecha actual;
- volver a conciliar;
- generar snapshots y anomalías finales.

## 5. Fiscal

Antes de cerrar cada ejercicio, cruzar contabilidad con:

- Impuesto sobre Sociedades;
- IVA, únicamente si procede según la naturaleza concreta de cada arrendamiento;
- retenciones de alquileres si existe algún arrendamiento sujeto;
- modelos informativos aplicables;
- amortizaciones fiscales;
- operaciones vinculadas si existieran;
- saldos con socios/administradores si existieran.

No inferir obligaciones fiscales solo por la forma societaria; confirmar el uso y naturaleza de cada inmueble.

## 6. Correos e incidencias

Durante la reconstrucción:

- inventariar todos los hilos relacionados con DGM, viviendas, inquilinos, siniestros y proveedores;
- asociarlos a inmueble cuando sea posible;
- distinguir correo pendiente de respuesta de correo meramente informativo;
- no responder al titular durante la fase INTERNAL ONLY;
- se pueden preparar borradores internos para revisión posterior;
- antes de cualquier futuro envío, aplicar siempre el control live-thread anti-duplicado.

## 7. Activación futura del titular

Solo después de:

- [ ] 2025 reconstruido y conciliado;
- [ ] 2026 actualizado y conciliado;
- [ ] impuestos cruzados;
- [ ] anomalías críticas resueltas;
- [ ] EXPERT aprueba apertura al cliente.

Entonces:

1. retirar `portal_activation_blocked`;
2. crear/vincular usuario;
3. crear membresía de empresa;
4. habilitar portal;
5. habilitar chat con KIA;
6. presentar al cliente un estado ya limpio, no el proceso interno de reconstrucción.

## 8. Aprendizaje KIA

### Contexto específico DGM — NO globalizar

- cinco viviendas;
- hechos de sus contratos/inquilinos;
- incidencias concretas;
- cifras, saldos y asientos;
- correos;
- decisiones contables particulares.

### Promocionar a aprendizaje global solo si es reutilizable

Ejemplos:

- auditar read-only antes de reconstruir una contabilidad heredada;
- separar hechos específicos de cliente de reglas globales;
- no activar acceso del cliente durante una reconstrucción interna si existe gate;
- trabajar patrimoniales por inmueble cuando aporte trazabilidad;
- conciliar ejercicio anterior antes de reconstruir el siguiente;
- comprobar impuestos contra contabilidad antes de cerrar.

## 9. Log

### 05/10/2026

- creada empresa interna en EXPERT sin usuario;
- creadas cinco tareas internas de reconstrucción;
- activadas tres puertas operativas;
- documentada arquitectura Holded correcta;
- KIA preparada para recibir notas internas solo en contexto staff;
- pendiente conectar tenant DGM desde Company 360;
- sin comunicaciones externas.
