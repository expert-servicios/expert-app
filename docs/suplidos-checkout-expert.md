# Gestion de suplidos en checkout EXPERT

## Objetivo

Este documento define como cobrar, registrar y conciliar suplidos dentro del checkout interno de EXPERT sin tratarlos como honorarios profesionales ni como base imponible del servicio.

Un suplido no es un servicio propio. Es una cantidad pagada en nombre y por cuenta del cliente, con mandato expreso, por el importe exacto de una tasa, arancel, certificado u otro gasto oficial/documentado.

## Regla operativa

Un importe solo puede tratarse como suplido si cumple todos estos criterios:

1. Existe mandato expreso del cliente antes del pago.
2. El pago se realiza en nombre y por cuenta del cliente.
3. El justificante externo sale a nombre del cliente, interesado o expediente correspondiente, no como coste propio de EXPERT.
4. El importe repercutido coincide exactamente con el gasto pagado.
5. No hay margen, comision ni recargo sobre ese importe.
6. La linea queda separada de los honorarios.
7. La linea se marca internamente como no revenue y no taxable.
8. Se conserva justificante del pago y autorizacion del cliente.

Si falta cualquiera de estos puntos, no debe tratarse como suplido. Debe tratarse como gasto propio repercutido, servicio adicional o concepto sujeto al analisis fiscal correspondiente.

## Implementacion tecnica inicial

El checkout de servicios acepta una lista allowlist de suplidos mediante:

```json
{
  "priceId": "price_xxx",
  "companyId": "uuid",
  "disbursements": ["mjusticia_790_026_nacionalidad_residencia"],
  "disbursementMandateAccepted": true
}
```

Si se informa `disbursements` y `disbursementMandateAccepted` no es `true`, el checkout debe bloquear la operacion.

### Suplido actualmente permitido

```text
key: mjusticia_790_026_nacionalidad_residencia
concepto: Suplido tasa Ministerio de Justicia 790-026
beneficiario: Ministerio de Justicia
modelo: 790-026
importe: 104,05 EUR
importe cents: 10405
IVA: no sujeto / no taxable
revenue_affecting: false
```

## Metadata obligatoria

Cada linea de suplido en Stripe debe incluir metadata equivalente a:

```text
line_type=disbursement
revenue_affecting=false
taxable=false
disbursement_key=mjusticia_790_026_nacionalidad_residencia
beneficiary=Ministerio de Justicia
official_model=790-026
```

La sesion de checkout debe guardar tambien:

```text
disbursement_keys
disbursement_total_cents
revenue_amount_cents
checkout_total_net_cents
contains_disbursements
disbursement_mandate_accepted
```

## Ejemplo: nacionalidad menor nacido en Espana

### Cobro total al cliente

```text
Honorarios profesionales: 250,00 EUR
IVA 21% honorarios: 52,50 EUR
Subtotal honorarios: 302,50 EUR
Suplido tasa 790-026: 104,05 EUR
Total cobrado por Stripe: 406,55 EUR
```

### Tratamiento interno

```text
Ingreso profesional: 250,00 EUR
IVA repercutido: 52,50 EUR
Suplido / pasivo transitorio: 104,05 EUR
```

El suplido no debe entrar en margen, facturacion profesional, base imponible de honorarios, metricas de revenue ni calculo de beneficio.

## Texto de mandato para el cliente

### Espanol

```text
Confirmo que autorizo a EXPERT / Ksenia Ilicheva a abonar en mi nombre y por mi cuenta la tasa oficial indicada para este expediente. Entiendo que este importe es un suplido, se cobra por el importe exacto y no forma parte de los honorarios profesionales.
```

### Ruso

```text
Подтверждаю, что разрешаю Ksenia Ilicheva / EXPERT оплатить указанную государственную пошлину от имени заявителя. Понимаю, что эта сумма является suplido / госпошлиной, взимается в точном размере и не входит в стоимость профессиональных услуг.
```

## Flujo recomendado

1. El servicio se muestra con precio de honorarios.
2. La UI/admin ofrece incluir suplido solo si procede.
3. El cliente acepta mandato expreso.
4. El checkout se genera con lineas separadas.
5. Stripe cobra el total.
6. EXPERT registra honorarios y suplido por separado.
7. Se paga la tasa desde el canal oficial.
8. Se sube justificante al expediente.
9. La factura/recibo muestra honorarios y suplido separados.
10. Conciliacion excluye suplidos de revenue y beneficio.

## Casos donde puede aplicar

### Extranjeria y nacionalidad

- Tasa Ministerio de Justicia 790-026.
- Tasas extranjeria 790-052, 790-012 o equivalentes si se pagan en nombre del cliente.
- Certificados oficiales solicitados a nombre del interesado.

### Trafico y administracion

- Tasas DGT pagadas a nombre del titular/interesado.
- Tasas de Capitania Maritima o registros publicos.

### Notaria, registro y propiedades

- Notas simples, certificaciones registrales o aranceles cuando el justificante salga a nombre del cliente y exista mandato.

### Certificados digitales

No tratar automaticamente como suplido. Si EXPERT revende o presta el servicio como RA/operador, puede existir prestacion propia. Requiere criterio separado.

## Casos donde NO aplica

No es suplido:

- Coste interno de EXPERT.
- Herramientas, licencias, software, mensajeria o gestion interna.
- Tasas pagadas sin mandato expreso.
- Gastos cuyo justificante sale a nombre de EXPERT.
- Importes redondeados o con margen.
- Servicios de terceros revendidos como parte del servicio profesional.

## Requisitos antes de produccion

Antes de usar suplidos en produccion, deben estar cerrados estos puntos:

1. UI/admin para seleccionar suplidos allowlist.
2. Check de mandato expreso antes del checkout.
3. Persistencia de metadata en `checkout_sessions`.
4. Webhook y conciliacion que excluyan `disbursement_total_cents` de revenue.
5. Factura/recibo con seccion separada de suplidos.
6. Expediente documental con justificante externo y mandato.
7. Tests de regresion para que ningun suplido compute como honorario.

## Criterio de seguridad

La lista de suplidos debe ser allowlist, no importe libre introducido por el usuario.

Cada nuevo suplido debe definirse con:

```ts
{
  key: string;
  name: string;
  unitAmount: number;
  beneficiary: string;
  officialModel: string;
  taxable: false;
  revenueAffecting: false;
}
```

No permitir importes arbitrarios en frontend sin validacion backend.

## Checklist para crear un nuevo suplido

1. Confirmar que legal/fiscalmente es suplido.
2. Verificar importe oficial exacto.
3. Confirmar beneficiario y modelo/tasa.
4. Crear key estable.
5. Anadirlo a la allowlist backend.
6. Anadir test unitario.
7. Documentar mandato recomendado.
8. Verificar factura/recibo.
9. Verificar conciliacion.
10. Guardar justificante en expediente.
