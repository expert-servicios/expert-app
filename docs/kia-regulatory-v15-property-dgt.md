# KIA Regulatory Registry v1.5 - Propiedad y DGT

Fecha de inicio: 20/09/2026
Rama: `feat/regulatory-v15-property-dgt`

## Objetivo

Cerrar P1-B de propiedad, notaría y tráfico reutilizando el baseline v1.3/v1.4.

Contrato:
`fuente oficial -> ruleset/value -> dependencia -> consumidor -> test`

## Lote 1

### Compraventa inmobiliaria en Comunitat Valenciana
- reutiliza `VALENCIA_ITPAJD_2026` para tipos;
- añade `VALENCIA_PROPERTY_TRANSFER_BASE_2026` para valor de referencia, base y Modelo 600;
- evita calcular ITP/AJD únicamente desde precio de compra;
- separa TPO de operaciones sujetas a IVA + AJD.

### Vehículos / DGT
- `DGT_VEHICLE_TRANSFER_2026`: 30 días para cambio de titularidad, prueba de tributación autonómica y controles de transferibilidad;
- `DGT_FEES_2026`: tasas 2026 reutilizables;
- el ITP de vehículos nunca hereda el tipo inmobiliario ni un rango nacional aproximado.

## Errores detectados a eliminar
- confundir IVTM con plusvalía municipal;
- afirmar 4-8 % o 6-10 % como ITP general de vehículos;
- usar 30 días hábiles para el ITP valenciano cuando la regla ATV es un mes;
- usar precio de compraventa como única base inmobiliaria;
- mostrar tasa DGT aproximada cuando existe tasa oficial anual.

## Lote 2

### Matriculación / IEDMT / importación
- `IEDMT_REGISTRATION_2026`: hecho imponible, Modelo 576, tramos CO2 de referencia, base y excepciones;
- `VEHICLE_IMPORT_REGISTRATION_2026`: separa UE de fuera de UE, ITV/homologación, Aduana/H1 y fiscalidad previa;
- reutiliza `DGT_FEES_2026`;
- catálogo, prompt y checklist dejan de resumir IEDMT como "pagar si supera cierto CO2".

## Lote 3

### Cancelación de hipoteca
- `VALENCIA_MORTGAGE_CANCELLATION_2026`: deuda vs carga registral, escritura pública, Modelo 600 exento y Registro;
- evita afirmar que la cancelación es automática u obligatoria en todos los casos.

### ISD operativo Comunitat Valenciana
- `VALENCIA_SUCCESSIONS_650_2026`: Modelo 650, seis meses y prórroga solicitada en los cinco primeros meses;
- `VALENCIA_DONATIONS_651_2026`: Modelo 651, un mes y reglas territoriales inmueble/resto de bienes;
- ambos consumen `VALENCIA_ISD_2026` para beneficios fiscales.

### Fianza de alquiler
- `VALENCIA_RENTAL_DEPOSIT_2026`: una mensualidad vivienda / dos uso distinto según LAU;
- procedimiento GVA 2026: plazo operativo de un mes;
- modelo 816 telemático / 806 presencial;
- se documenta explícitamente el conflicto con instrucciones antiguas de 15 días y se toma la ficha GVA 2026 como fuente operativa vigente.

## Siguientes lotes
- duplicados y permisos;
- Capitanía.

## Lote 4 - cierre final v1.5

### Duplicados y permisos DGT
- `DGT_DUPLICATES_PERMITS_2026`: permiso de conducir, permiso de circulación, eITV/ficha técnica y canjes;
- distingue duplicado, renovación y copia eITV;
- `DGT_FEES_2026` pasa a schema v2 desde 20/09/2026 para incorporar tasa 4.1 sin solapar la versión anterior;
- no se mantienen listas estáticas de países con convenio de canje.

### Capitanía / embarcaciones de recreo
- `MARITIME_RECREATIONAL_CRAFT_2026`: inscripción/abanderamiento, régimen especial hasta 12 m con marcado CE cuando procede, cambio de titularidad, cambios registrales y permiso/certificado de navegación;
- cambio de titularidad: máximo 3 meses desde la transmisión;
- tasa código 025: cálculo por concepto/arqueo, sin importe fijo universal;
- titulaciones de recreo: verificar autoridad competente y título concreto.

## Estado de v1.5

**CERRADA.**

Cobertura final:
1. compraventa inmobiliaria / valor de referencia CV;
2. transferencias DGT y tasas;
3. matriculación / IEDMT / importación UE-no UE;
4. cancelación hipotecaria;
5. ISD operativo CV;
6. fianzas GVA/LAU;
7. duplicados, documentación y canjes DGT;
8. embarcaciones de recreo / Capitanía-Marina Mercante.

El siguiente trabajo debe abrir una versión nueva; no ampliar este baseline salvo corrección de error.

