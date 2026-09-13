# RU-008 — fuentes de contenido comercial

Fecha de revisión: 2026-09-13.

## Catálogo EXPERT

La capa RU no mantiene precios paralelos. Los bloques comerciales consumen fuentes canónicas existentes:

- planes mensuales: `lib/data/kia-knowledge/monthly-plans.ts`;
- Holded Pack Starter: `lib/data/kia-knowledge/holded-pack-starter.ts`;
- migraciones Holded: módulos `holded-migracion-*.ts`;
- servicios puntuales: `lib/utils/catalog.ts`;
- Academy: `lib/data/academy-catalog.ts`.

Los enlaces RU pueden terminar en una página ES de contratación mientras no exista un detalle RU equivalente; producto, priceId y backend siguen siendo los mismos.

## SIF / VERI*FACTU

Fuentes oficiales AEAT revisadas para el copy de `/ru/verifactu`:

- https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html
- https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/cuestiones-generales/modalidades-cumplimiento-obligaciones.html

Criterios aplicados:

- hablar de requisitos de los Sistemas Informáticos de Facturación (SIF), no presentar VERI*FACTU como el único modo obligatorio;
- distinguir modalidad VERI*FACTU y modalidad NO VERI*FACTU;
- plazos comunicados por AEAT: antes de 01/01/2027 para contribuyentes del Impuesto sobre Sociedades y antes de 01/07/2027 para los demás obligados afectados;
- añadir reserva de aplicabilidad individual antes de recomendar cambios de proceso.
