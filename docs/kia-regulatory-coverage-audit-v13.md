# KIA Regulatory Coverage Audit v1.3 — EXPERT master map

Fecha: 20/09/2026  
Estado: auditoría exhaustiva + remediación P0 en curso  
Ámbito: catálogo EXPERT, KIA, calculadoras, checklists, contenido, formación y operativa Admin.

## Objetivo

Mantener una única capa regulatoria trazable para cualquier materia que pueda hacer incorrecta una respuesta, cálculo, checklist, landing, artículo, curso o trámite de EXPERT.

La cobertura se clasifica así:

- **A — cubierta**: fuente oficial específica + dependencia explícita + valor/regla consumible cuando procede.
- **B — parcial**: existe fuente oficial general o contenido actualizado, pero falta fuente específica, ruleset o dependencia.
- **C — hueco**: materia operativa presente en EXPERT sin cobertura canónica suficiente.
- **P0**: puede producir hoy una respuesta/cálculo materialmente incorrecto.
- **P1**: importante para servicios activos, sin error actual confirmado.
- **P2**: referencia estable o servicio de menor frecuencia.

## Hallazgos estructurales

1. `public.catalog_services` y `public.services` existen pero están vacías. A día de hoy no pueden actuar como inventario maestro de cobertura. El catálogo real vive en el repositorio.
2. El catálogo principal contiene 50 slugs de servicio, más planes/aliases en prompts y catálogos de canales.
3. `regulatory_values` resuelve magnitudes escalares, pero no representa correctamente tablas versionadas:
   - tramos RETA;
   - tabla/algoritmo de retenciones IRPF;
   - matriz de tipos de Impuesto sobre Sociedades;
   - calendario fiscal;
   - plazos transitorios Modelo 210;
   - tasas DGT;
   - reglas ITP/AJD/ISD por CCAA.
4. Se introduce `regulatory_rulesets` para estos casos; no se deben convertir matrices en decenas de pseudo-valores inconexos.
5. Toda regla temporal necesita `valid_from` / `valid_to` y fuente oficial. Los prompts no son base de datos regulatoria.

## P0 confirmados durante la auditoría

| Código | Materia | Evidencia en repo | Situación oficial 20/09/2026 | Acción |
|---|---|---|---|---|
| P0-AUT-01 | Cuota reducida autónomos | tip activo sin `validTo`: “2025… 80 €/mes” + blog/docs/fun fact | los 80 € estaban fijados para 2023–2025; 2026 debe verificarse con norma vigente | eliminar afirmación numérica viva; RETA 2026 a ruleset |
| P0-VF-01 | VERI*FACTU / RRSIF | fun fact: obligatorio julio 2026 | IS antes 01/01/2027; resto antes 01/07/2027 | corregir y registrar ruleset |
| P0-IRNR-01 | Modelo 210 | catálogo/checklists/prompt: alquiler “trimestral”; imputación “enero” | Orden HAC/623/2026 cambia plazos; 2026 tiene transición | sustituir por ruleset transitorio |
| P0-CV-01 | ITP Comunitat Valenciana | KIA CCAA y fallback oficial: 10 % general | desde 01/06/2026: 9 % general; >1 M€: 11 % | corregir prompt/fallback + ruleset |
| P0-CV-02 | AJD Comunitat Valenciana | KIA CCAA: 1,5 % | desde 01/06/2026: general 1,4 % | corregir + ruleset |
| P0-CV-03 | ISD Comunitat Valenciana | KIA CCAA: bonificación 75 % grupos I-II | normativa vigente recoge 99 % en supuestos familiares definidos y cambios 2026 | retirar resumen obsoleto; ruleset con requisitos |
| P0-RET-01 | Retenciones IRPF 2026 | prompt estático 15/7 y cálculo laboral | AEAT publica versión 01/01–09/09 y nueva versión desde 10/09/2026 | ruleset versionado; cálculo siempre por periodo |
| P0-CENS-01 | Modelo 037 | catálogo, ayuda, prompts y Holded seguían ofreciendo 036/037 | Modelo 037 suprimido desde 03/02/2025; la vía vigente es Modelo 036 | eliminar 037 como trámite vivo + ruleset canónico |

## Mapa exhaustivo por dominio

### 1. Fiscalidad estatal — prioridad P0/P1

Servicios:
`irpf`, `modelo-151`, `no-residentes`, `iva-trimestral`, `impuesto-sociedades`,
`modelos-informativos`, `modelo-720`, `impuestos-trimestrales`,
planes mensuales, formación fiscal/contable y planificación fiscal.

| Materia | Estado | Prioridad | Fuente canónica objetivo | Representación |
|---|---|---:|---|---|
| calendario del contribuyente 2026 | C | P0 | AEAT calendario 2026 | ruleset |
| retenciones IRPF | C | P0 | AEAT Retenciones 2026 | ruleset versionado |
| IVA 21/10/4/0 | B | P1 | AEAT tipos IVA 2026 | valores + fuente |
| IS tipos 2026 | C | P0 | AEAT tipo impositivo IS | ruleset |
| Modelo 210 IRNR | C | P0 | AEAT + Orden HAC/623/2026 | ruleset |
| tipos IRNR 19/24 | C | P1 | AEAT IRNR | valores/ruleset |
| Modelo 720 | B | P1 | AEAT GI34 | ruleset |
| Modelo 721 cripto | C | P1 | AEAT Modelo 721 | ruleset |
| Beckham 149/151 | B | P1 | AEAT régimen impatriados | ruleset |
| pagos fraccionados 130/131/202 | B | P1 | AEAT calendario/instrucciones | ruleset |
| modelos informativos 180/190/347/349/390 | B | P1 | AEAT calendario/modelos | ruleset |
| interés legal/demora | A | — | AEAT evidencia 2026 | values |
| VERI*FACTU / RRSIF | C | P0 | AEAT FAQ/nota oficial | ruleset |

### 2. Autónomos y Seguridad Social — prioridad P0

Servicios:
`alta-autonomo`, `baja-cese-actividad`, `contabilidad-mensual`,
`impuestos-trimestrales`, `formacion-alta-autonomo-sl`, planes,
`holded-modulo-laboral`, `holded-migracion-laboral`, formación laboral.

| Materia | Estado | Prioridad | Representación |
|---|---|---:|---|
| tramos RETA 2026 y bases min/max | C | P0 | ruleset |
| tipos RETA 2026 | B | P0 | ruleset/values |
| cuota reducida inicio actividad | C | P0 | rule + vigencia, nunca hardcode sin fuente anual |
| cambios de base hasta 6/año | C | P1 | ruleset |
| SMI | A | — | values |
| MEI | A | — | values |
| base máxima RG | A | — | values |
| tipos Régimen General | B | P1 | ruleset |
| RED/SILTRA avisos | A | — | sources |
| prestaciones/IT/autónomos | C | P2 | referencias oficiales específicas |

### 3. Laboral / nóminas — prioridad P0/P1

Cobertura transversal en formación, Holded Labor, diagnósticos y planes.

- Retenciones IRPF 2026: P0.
- cotización RG y MEI: P1.
- SMI: A.
- bases y topes: parcial.
- convenios colectivos: **no deben centralizarse como un único valor nacional**; requieren fuente por convenio (REGCON/BOP/BOE según caso).
- calendario laboral/festivos: ruleset territorial cuando el producto lo necesite.
- contratos/bonificaciones SEPE: P1 por servicio laboral futuro.

### 4. Mercantil / sociedades — prioridad P1

Servicios:
`constitucion-sl`, `constitucion-sl-circe`, `nif-socio-extranjero`,
`cuentas-anuales`, `apoderamientos-mercantiles`, formación alta autónomo/SL.

| Materia | Estado | Prioridad | Fuente |
|---|---|---:|---|
| capital mínimo SL y reglas <3.000 € | C | P1 | Ley Sociedades de Capital |
| CIRCE/PAE/DUE | C | P1 | PAE Electrónico/CIRCE |
| legalización de libros: 4 meses desde cierre | C | P1 | Reglamento Registro Mercantil |
| formulación/aprobación/depósito cuentas | C | P1 | LSC + RRM |
| depósito: 1 mes desde aprobación | C | P1 | art. 279 LSC / art. 365 RRM |
| cierre registral por falta depósito | C | P1 | art. 378 RRM |
| NIF sociedades / 036 | B | P1 | AEAT |
| titular real | C | P1 | normativa mercantil/AML aplicable |

### 5. Extranjería y nacionalidad — cobertura A/B

Servicios:
`arraigo-social`, `arraigo-familiar`, `arraigo-laboral`,
`renovacion-residencia`, `reagrupacion-familiar`,
`permiso-residencia-inicial`, `nie-pasaporte`,
`nacionalidad-espanola`, `nacionalidad-espanola-menor-nacido-en-espana`.

- RD 1155/2024: A.
- hojas Migraciones: manual_reference por WAF + fallback BOE: A.
- Justicia nacionalidad: A.
- tasa nacionalidad por residencia 104,05 €: C/P1 → value.
- tasas 790 extranjería: C/P1 → ruleset/values por epígrafe.
- NIE/ciudadanos UE/pasaporte: B/C → Policía/Interior y normativa específica.
- cambios UGE/Ley 14/2013: C/P1 para futuras residencias especializadas.

### 6. Certificados digitales — cobertura A/B

Servicios:
`certificado-digital-persona-fisica`, `certificado-digital-entidad`,
`pack-certificados-digitales`, `certificado-digital-sin-animo-lucro`.

- Ley 6/2020: A.
- eIDAS: P2 como referencia europea.
- condiciones Camerfirma/Creativ Quality: fuente operativa/proveedor, no sustituye norma oficial.
- vigencia/precio específico de producto debe vivir en catálogo comercial, no en registry regulatorio.

### 7. Propiedad, notaría, alquileres e impuestos autonómicos — P0/P1

Servicios:
`compraventa-inmueble`, `herencia`, `donacion`, `hipoteca-cancelacion`.

Para Comunitat Valenciana (mercado prioritario EXPERT):
- TPO general desde 01/06/2026: 9 %; >1.000.000 €: 11 %.
- AJD general desde 01/06/2026: 1,4 %.
- tipos reducidos y cuotas de vehículos: ruleset, no scalar único.
- ISD: cambios 2026 + bonificaciones/reducciones condicionadas: ruleset.
- plazos ISD CV: 6 meses mortis causa; 1 mes resto según normativa autonómica.
- fianza alquiler: GVA + LAU; 1 mes vivienda / 2 meses uso distinto; procedimiento de depósito GVA.
- LAU y medidas temporales vivienda: fuente BOE propia y fecha de expiración.
- plusvalía municipal/IBI: ámbito local; fuente por ayuntamiento/SUMA cuando haya servicio operativo.

### 8. Tráfico — P1

Servicios:
`transferencia-vehiculo`, `matriculacion`, `duplicado-permiso`.

- DGT tasas actuales: C → ruleset.
- matriculación automóvil: 99,77 €.
- cambio titularidad: 55,70 €.
- además ITP vehículo depende de CCAA: ruleset autonómico independiente.
- tablas de valoración de vehículos: fuente fiscal oficial por ejercicio, no precio de compraventa como única base.

### 9. Capitanía Marítima — P1/P2

Servicio: `tramites-embarcaciones`.

- Ministerio Transportes / DGMM, tasa código 025 y Registro Marítimo.
- transferencias, inscripción/baja, cambio motor/nombre/lista: fuente oficial específica.
- fiscalidad de embarcaciones puede depender de ITP/IEDMT/IVA: separar capa marítima de capa fiscal.

### 10. Protección de datos — P2 transversal

No existe hoy un servicio independiente, pero afecta:
- alta empresa/autónomo;
- clientes/proveedores;
- empleados;
- marketing;
- KIA/IA;
- formularios y documentación.

Fuente: AEPD (Facilita RGPD, guías PYME). Mantener como referencia estable y activar monitorización solo de guías/criterios relevantes; no hace falta pulse diario.

### 11. Contabilidad / Holded — cobertura regulatoria indirecta

Servicios Holded:
`holded-pack-starter`, `holded-migracion-sin-inventario`,
`holded-migracion-con-inventario`, `holded-migracion-laboral`,
`holded-modulo-laboral`, `holded-modulo-formacion`,
`holded-integraciones-api`, `formacion-holded`.

Holded como producto no necesita una ley propia, pero cualquier automatización contable/fiscal/laboral debe consumir:
- IVA;
- IS;
- IRPF/retenciones;
- RETA/SS;
- calendario fiscal;
- VERI*FACTU/RRSIF;
- cuentas/libros cuando corresponda.

### 12. Formación — hereda cobertura

`formacion-fiscal-contable`, `formacion-laboral-rrhh`,
`formacion-administraciones-publicas`, `formacion-alta-autonomo-sl`,
`formacion-planificacion-fiscal`.

Los cursos no duplicarán cuantías en prompts/documentos sin una dependencia a value/ruleset. El material debe declarar `asOf` y fuente canónica.

## Arquitectura objetivo v1.3

### `regulatory_values`
Solo valores escalares:
- SMI, IPREM;
- interés legal/demora;
- tipos IVA básicos si conviene consumirlos individualmente;
- tasas simples (nacionalidad);
- tasas DGT simples cuando no dependan de condiciones.

### `regulatory_rulesets`
Reglas/tablas versionadas:
- `RETA_2026_BRACKETS`
- `IRPF_WITHHOLDING_2026_01_01_09_09`
- `IRPF_WITHHOLDING_2026_FROM_09_10`
- `IS_RATES_2026`
- `IRNR_210_2026_TRANSITION`
- `VERIFACTU_DEADLINES`
- `VALENCIA_ITPAJD_2026`
- `VALENCIA_ISD_2026`
- `DGT_FEES_2026`
- `AEAT_TAX_CALENDAR_2026`
- `MODELO_720_721_RULES`

Cada versión debe incluir:
- fuente;
- vigencia;
- payload JSON;
- fecha de verificación;
- versión de schema;
- metadatos/evidencia;
- dependencia explícita.

KIA podrá leerlos mediante `get_regulatory_ruleset` (R0/read), igual que `get_regulatory_value`.

## Política de frecuencia

- **daily**: BOE, AEAT novedades/retenciones/calendario operativo, Seguridad Social/RED, fuentes que cambian operativa inmediata.
- **monthly**: tipos/tasas/tablas anuales ya publicadas; DGT; Justicia; GVA tributaria; AEPD.
- **manual_reference**: páginas bloqueadas por WAF o material proveedor que no puede monitorizarse de forma fiable.
- una fuente general `discovery_only` detecta; una fuente específica aporta evidencia.

## Roadmap de cierre

### Lote P0 — inmediato
1. eliminar información caducada de autónomos, VERI*FACTU, IRNR y Valencia.
2. crear `regulatory_rulesets`.
3. registrar fuentes específicas AEAT/Seguridad Social/BOE CV.
4. sembrar RETA, IS, IRNR, VERI*FACTU y Valencia ITP/AJD.
5. tests que impidan reintroducir cadenas obsoletas.

### Lote P1-A — fiscal/mercantil
- calendario AEAT;
- IVA;
- 720/721;
- Beckham;
- libros/cuentas;
- CIRCE;
- nacionalidad/tasas extranjería.

### Lote P1-B — propiedad/tráfico
- ISD CV completo;
- GVA fianzas;
- LAU temporal;
- DGT tasas;
- valoración vehículos;
- Capitanía.

### Lote P2
- AEPD;
- tributos locales por municipio/SUMA;
- fuentes autonómicas fuera de CV solo cuando haya caso/servicio;
- convenios colectivos por ámbito concreto.

## Definition of Done de cobertura

Una materia se considera cubierta cuando:
1. tiene fuente oficial identificada;
2. la fuente tiene estrategia de monitorización válida;
3. cada valor/regla temporal tiene vigencia;
4. existe dependencia hacia todo activo que la consume;
5. KIA la puede consultar sin depender de texto hardcodeado;
6. existe test contra regresiones críticas;
7. cambios críticos no publican ni modifican producción sin revisión humana.
