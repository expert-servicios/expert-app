# EXPERT — Cierre específico de traducciones ES/RU y corpus regulatorio (13/10/2026)

**Ámbito único:** traducciones legales/comerciales, fuentes regulatorias, KIA Knowledge y pipeline editorial ES/RU. **No es el plan de Workspace V2 E0–E6.** La construcción del agente de desarrollo supervisado por KIA es otra línea y no forma parte de este cierre.

**Estado del presente control:** auditoría de lectura del repositorio `main` y consultas agregadas en Supabase, más corrección propuesta en PR de revisión. No implica publicación automática, aplicación SQL ni validación jurídica humana.

## 1. Inventario de fuentes de verdad — fotografía 13/10/2026

| Módulo | Realidad observada | Control de cierre |
| --- | --- | --- |
| Catálogo BD | 52 servicios: 33 activos, 18 pausados, 1 borrador | Excluir pausados y retirados de enlaces comerciales y traducciones como «servicios contratables» |
| Contenidos de servicio BD | 52 filas ES (51 activas y 1 borrador) y 4 RU (3 activas y 1 borrador) | **No equivale a todas las páginas RU de código**. Sincronizar/proyectar únicamente desde el servicio canónico, sin duplicar producto, precio ni Stripe. Conciliar divergencia entre DB y catálogo TypeScript |
| Traducciones en código | PR #754 inventario; #755 tres fiscales; #756 ocho páginas; #757 glosario 30 términos; #758 dos artículos laborales ES/RU; #759 terminología; #761 dos guías de residencia ES/RU | Ejecutar matriz real de rutas, paridad de secciones, contenidos y CTA, no asumir que la fila RU de DB prueba página visible ni que el componente TS está persistido en DB |
| Blog BD | 9 entradas: cinco publicadas de enero/febrero de 2026; cuatro borradores ES/RU de Extranjería/EX-11 añadidos 13/10 | Diferenciar `blog_posts` de artículos estáticos `lib/utils/blog.ts` / `lib/content/**`. Evitar duplicados de slug/SEO antes de exportar/importar o publicar |
| FAQ BD | 20 entradas; 8 FAQ Extranjería larga duración están **invisibles**; 12 visibles en otras categorías | Revisar vigencia y paridad, no convertir FAQ invisibles en publicadas automáticamente |
| Registry | 105 fuentes; rulesets=35 filas; values=9; 291 dependencias (276 activas) | Registro primario: fuente oficial + versión publicada + fecha de vigencia + fecha comprobada + ruleset/valor con evidencia |
| Cola de cambios regulatorios | 57 `needs_review`, 4 `classified`, 7 `ignored`; 56 `needs_review` tienen severidad nula | Diferenciar históricos pendientes de clasificación fallida y cambios realmente normativos. No resolver en bloque. Revisión humana trazable |
| Lectura regulatoria | Pulso 13/10 14:09 UTC: 46 fuentes, cuatro cambios, 12 fallos; worker 14:37 UTC clasificó cuatro | Validar lectura después de PR #763; evitar impacto falso con #764; comprobar actualización de datos y canales de notificación antes de publicar |

**Observación:** el informe histórico `docs/kia-regulatory-coverage-audit-v13.md` que declara `catalog_services` y `services` vacíos refleja una fotografía anterior (20/09/2026) y **no puede utilizarse como inventario actual**. No modificar su trazabilidad; enlazar este informe actualizado.

## 2. Prioridad editorial por grupos

1. **Extranjería y nacionalidad.** RD 1155/2024, RD 316/2026 y sentencias BOE-A-2026-19632/19633 del 22/09/2026; guías de arraigo, familiares, renovación y EX-11. Se ha detectado que el plazo excepcional del RD 316/2026 finalizó el 30/06/2026 (DA 20.ª y 21.ª): la traducción debe indicar expresamente el cierre y verificar posible normativa posterior antes de ofrecer un trámite. Las sentencias anulan el art. 197.2, evitando afirmar una obligación telemática general, **sin deducir de ello que cualquier vía presencial esté disponible en cualquier trámite**. Revisión jurídica sobre el alcance real antes de publicar.
2. **Fiscalidad/contabilidad.** Calendario AEAT 2026, modelos 036/210/130/151, tipos IS 2026, CV ITP/AJD/ISD, RETA 2026, IRPF retenciones desde 10/09 y VERI*FACTU. Comprobar reglas versionadas y cada fecha efectiva contra fuente oficial primaria antes de traducir cifras. No adaptar los valores según traducción.
3. **Laboral/Holded.** Dos artículos ES/RU existentes en el repositorio (#758). Verificar enlaces TGSS/SEPE y alcance exacto de funciones de Holded; generar fichero SILTRA no equivale a presentación/aceptación TGSS. Comprobar glosario y equivalencia de secciones.
4. **Catálogo, guías, Academy, FAQ y blog.** Consolidar glosario jurídico RU, ruta recíproca ES/RU, mismo precio/CTA y mismo régimen de publicación. Diferenciar servicio puntual activo frente a suscripción retirada. Revisar #760 como inventario editorial, no como tarea que deba añadir textos sin fuente.

## 3. Secuencia de cierre verificable, sin Workspace V2

| Orden | Tarea | Criterio de salida |
| --- | --- | --- |
| R1 | Terminar seguridad de fuentes (#763) | CI y dos previews, preflight y post-release sobre SHA final; fallos HTTP403 no se eluden |
| R2 | Bloquear impactos negativos y revisión jurídica (#764) | Solo `impacted=true` produce dependencias; dictamen Admin con fuente, fecha y autor; bot DevOps solo notifica |
| T1 | Inventario ES/RU por ruta de catálogo/blog/docs/FAQ | Matrícula `ES ↔ RU` con clasificación: lista, parcial, bloqueada, noindex, falta/duplicada |
| T2 | Corregir material jurídico ES de mayor riesgo y su espejo RU | Fuente oficial, publicación/vigencia, contexto, glosario jurídico, mismo alcance; QA humano por afirmación |
| T3 | Conciliar TS / base de datos / SEO | Un servicio y una oferta, localización solo del copy, mismo CTA y checkout; no tratar versiones antiguas como nuevas |
| T4 | Prueba KIA retrieval del corpus final | Consultas ES/RU reales y sintéticas: cita fuente/fecha correcta, abstención por documentación insuficiente, no uso de borradores internos |
| T5 | Prepublicación editorial conjunta | HTTP 200, indexación conscientemente habilitada, canonical/hreflang recíproco, enlaces, 375/768/1440px, accesibilidad, CTA, privacidad y aprobación humana |
| T6 | Publicar por lotes con lectura posterior | Fecha y versión del texto, URL ES/RU, capturas, trazas de aprobación, plan de retirada/rollback; nunca «todo OK» solo por CI |

## 4. Bloqueos de publicación actualmente relevantes

- **#763 y #764 no están fusionadas** al registrar este informe, y sus migraciones no se han declarado aplicadas; no dar por reparada la vigilancia.
- Las sentencias septiembre 2026 y DA extraordinarias requieren dictamen humano para traducir recomendaciones procesales sin sobreinterpretarlas.
- La cola de 57 eventos pendientes requiere limpieza **con evidencia** (severidad nula no significa impacto inexistente).
- No hay correspondencia total BD↔código: la traducción RU de repositorio no equivale a `service_contents.ru`.
- No liberar `noindex` RU hasta comprobar paridad legal/editorial y ruta/SEO en cada URL.
- La aprobación jurídica debe recogerse en Admin; `@expert_devops_bot` solo alerta. No se permite aprobar cambios por responder al bot.

## 5. Casos de regresión que no pueden faltar

- El servicio español cambia precio, requisitos o CTA: la ruta rusa utiliza **exactamente el mismo dato canónico**.
- La traducción RU conserva nombres formales (IRPF, NIE, TIE, EX-11, AEAT, TGSS) con glosas, no falsos equivalentes jurídicos.
- Fecha legal histórica, publicación y fecha de revisión no se confunden.
- Al vencer un plazo transitorio, las versiones ES/RU dejan de invitar a presentar solicitudes nuevas por esa vía.
- En BOE la mera aparición del título en el sumario no enlaza por similitud temas que no han cambiado.
- Fuente inaccesible o fallo de fetch = evidencia incompleta y revisión humana, nunca sustitución por copia inventada.
- Ningún borrador ni FAQ invisible se promociona a contenido público sin autorización.

**Fuentes normativas utilizadas para corrección de extranjería:** [RD 316/2026](https://www.boe.es/buscar/doc.php?id=BOE-A-2026-8284), [STS BOE-A-2026-19632](https://www.boe.es/buscar/doc.php?id=BOE-A-2026-19632), [STS BOE-A-2026-19633](https://www.boe.es/buscar/doc.php?id=BOE-A-2026-19633).

Este documento es un plan de cierre operativo **del bloque traducciones + regulatory + editorial**, separado del plan del Workspace V2 E0–E6.
