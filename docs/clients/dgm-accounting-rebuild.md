# DISEÑO GLOBAL MERIDIANO, S.L. — reconstrucción contable interna

## Identificación
- Razón social: DISEÑO GLOBAL MERIDIANO, S.L.
- CIF: B42700427
- Alias operativo: DGM
- Tipo: sociedad patrimonial
- Actividad operativa conocida: arrendamiento de 5 viviendas
- Company 360 ID: 188a1871-0ea8-4b11-adac-c9acc41c4a4b

## Regla de fase
**Fase interna EXPERT.**

Hasta que la reconstrucción contable esté terminada y revisada:
- no crear usuario para el titular;
- no añadir membresía de portal;
- no enviar invitaciones;
- no enviar correos al titular;
- no activar automatismos externos;
- no habilitar chat/portal del cliente;
- KIA trabaja solo en contexto staff/admin.

Cuando EXPERT declare la contabilidad al día, se podrá preparar alta de usuario, acceso al portal y conversación con KIA.

## Holded
DGM se gestiona por el portal de asesorías de EXPERT.

Arquitectura:
- modo: `advisor_managed`;
- API: v2;
- credencial: token específico del tenant DGM;
- almacenamiento: cifrado en `client_integration_secrets`;
- acceso: exclusivamente desde backend EXPERT / KIA;
- no usar el conector Holded disponible en el chat de ChatGPT para esta empresa;
- el token raíz/portal de Asesorías no sustituye la credencial del tenant gestionado.

Existe evidencia técnica previa de que un token DGM v2 fue validado el 03/10/2026, pero esa prueba temporal no quedó persistida en el modelo canónico. La conexión definitiva debe hacerse desde Company 360.

## Objetivo
Reconstruir y dejar revisada la contabilidad completa de:
- ejercicio 2025;
- ejercicio 2026 hasta fecha actual;
antes de abrir el portal al titular.

## Método
### Fase 0 — conexión y congelación
- conectar tenant DGM desde Company 360;
- verificar permisos efectivos;
- mantener cualquier escritura contable bloqueada hasta finalizar auditoría read-only;
- registrar snapshot inicial.

### Fase 1 — inventario read-only
Obtener y clasificar:
- plan contable;
- saldos iniciales;
- diario/asientos existentes;
- facturas emitidas;
- facturas y gastos recibidos;
- cobros y pagos;
- bancos y movimientos si la API lo permite;
- impuestos/retenciones disponibles;
- inmovilizado;
- préstamos;
- terceros/contactos relevantes.

### Fase 2 — modelo por inmueble
Crear una unidad analítica por cada una de las 5 viviendas.

Para cada inmueble:
- identificación/dirección;
- inquilino(s);
- período(s) de arrendamiento;
- renta mensual;
- fianza;
- cobros;
- impagos;
- IBI;
- comunidad;
- seguros;
- reparaciones y conservación;
- suministros/gastos repercutidos;
- tasas/basura;
- amortización;
- otros gastos atribuibles.

Separar gastos generales de sociedad de gastos directamente atribuibles a cada inmueble.

### Fase 3 — conciliación 2025
Clasificar cada registro:
- correcto;
- falta contabilizar;
- contabilizado con error;
- duplicado;
- requiere revisión.

Conciliar:
- ingresos por alquiler;
- cobros;
- bancos;
- gastos;
- inmovilizado/amortización;
- saldos de clientes/proveedores;
- impuestos presentados vs. contabilidad.

### Fase 4 — reconstrucción 2025
Solo después de validar el diagnóstico:
- corregir asientos;
- incorporar faltantes;
- eliminar/neutralizar duplicidades con trazabilidad;
- recalcular amortizaciones;
- cuadrar balance y PyG;
- cerrar snapshot 2025.

No alterar históricos fiscales sin revisión EXPERT.

### Fase 5 — reconstrucción 2026
Repetir metodología desde 01/01/2026 hasta fecha actual.
Una vez cuadrado:
- establecer rutina de contabilización;
- conciliación periódica;
- reglas automáticas seguras;
- alertas KIA.

### Fase 6 — revisión fiscal
Reconciliar contabilidad con obligaciones aplicables:
- IVA, solo cuando proceda según naturaleza de cada arrendamiento;
- retenciones, solo cuando proceda;
- Impuesto sobre Sociedades;
- pagos fraccionados;
- operaciones con terceros y restantes modelos aplicables.

No inferir obligaciones por el simple hecho de ser arrendadora: comprobar el uso y régimen de cada inmueble/contrato.

### Fase 7 — apertura al titular
Solo tras aprobación EXPERT:
- crear/vincular usuario;
- añadir membresía a DGM;
- habilitar portal;
- activar KIA para cliente;
- mostrar situación contable validada;
- comunicar acceso.

## KIA — contexto específico
Estos datos son específicos de DGM y **no se convierten en lecciones globales**:
- 5 viviendas;
- situación concreta de inquilinos;
- importes;
- incidencias;
- estados contables;
- correspondencia.

Solo se promueven a aprendizaje global reglas generalizables, por ejemplo:
- auditar antes de reconstruir;
- separar análisis por unidad de explotación/inmueble;
- no escribir antes de snapshot;
- reconciliar fiscalidad contra contabilidad;
- no invitar al cliente antes de que el entorno esté preparado.

## Comunicación
Durante fase interna:
- no responder automáticamente correos relacionados con DGM;
- KIA puede resumir y preparar borradores internos;
- no enviar sin instrucción expresa de EXPERT;
- aplicar siempre control anti-duplicado antes de cualquier envío futuro.

## Estado actual
- Company 360: creado.
- Acceso titular: NO.
- Holded canónico: pendiente de conexión desde Company 360.
- Reconstrucción 2025: pendiente.
- Reconstrucción 2026: pendiente.
- Portal cliente: bloqueado por fase.
