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

## Siguientes lotes
- duplicados y permisos;
- cancelación de hipoteca;
- herencia/donación/ISD operativo;
- fianzas GVA/LAU;
- Capitanía.
