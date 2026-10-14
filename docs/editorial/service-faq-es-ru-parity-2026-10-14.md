# FAQ bilingües en fichas de servicio — especificación y control (14/10/2026)

**Decisión:** Aprovechar el bloque de preguntas frecuentes existente y evitar traducir automáticamente textos legales o fiscales sin validación. No crear un segundo motor de FAQ.

## Auditoría del estado real
- La plantilla canónica `app/(public)/servicios/[categoria]/[servicio]/page.tsx` **ya muestra** `service.faqs` y emite JSON-LD `FAQPage`.
- `lib/utils/catalog.ts` es la fuente ES. Las fichas RU (p. ej. `ru/uslugi/sozdanie-sl` y `sozdanie-sl-cherez-circe`) incluyen sus propios arrays `faqs` y JSON-LD; también renderizan bloques visibles.
- No se ha acreditado un traductor automático de FAQ del catálogo a las páginas RU. La nueva pregunta ES puede quedar desincronizada en RU aunque ambas páginas rendericen la sección.
- PR #771 incluye FAQ visibles ES/RU en la landing RGPD, pero usa copias editoriales manuales, no una traducción dinámica. Mantener coherencia sin fusionar ramas prematuramente.

## Modelo funcional deseado
1. Fuente ES canónica por `serviceSlug`, preguntas con respuesta pública clara y vigente, fuentes oficiales y fecha de revisión.
2. Pairs RU **aprobados y alineados por ID estable**; una traducción puede ser redactada por IA solo en fase de propuesta, y necesita control de sentido jurídico, terminología y hechos.
3. El render ES y RU consume la misma definición de preguntas aprobadas por servicio (sin duplicar copy local), incluido JSON-LD derivado exactamente del contenido visible.
4. **Fail closed editorial**: si falta una traducción RU aprobada o cambió ES, los tests de paridad deben fallar; no mostrar texto ES bajo `lang=ru` ni activar traducción automática sin aprobación.
5. No traducir URLs, códigos legales `CNAE-2025`, `IAE`, `Modelo 036`, `RETA`, identificadores, precios ni condiciones comerciales de forma creativa; usar glosa RU y nombre normativo español.
6. El futuro resto de servicios se migra por lotes desde la plantilla existente, sin reescribir toda la web. Auditar tanto fichas canónicas como fichas RU específicas; añadir 3–6 FAQ útiles por servicio en vez de rellenar por volumen.

## Lote piloto — servicios de constitución
- `constitucion-sl`: capital mínimo y reglas hasta 3.000 €, sociedad unipersonal, empresario individual/autónomo, tributación IS/IRPF, IAE vs CNAE vs objeto social y cotización de socios/administradores.
- `constitucion-sl-circe`: formación guiada **180 € + IVA** ≠ tramitación completa **499 € + IVA**; documentación y viabilidad con socios extranjeros.
- La ficha `alta-autonomo` conservará su FAQ RU actual hasta validarse dentro del lote ampliado.
- Fuente comercial: catálogo aprobado. **No alterar precios/Stripe ni crear presupuestos de ComfyApp antes de la reunión.**

## Validaciones antes de fusionar/publicar
- [ ] La definición ES canónica tiene exactamente los mismos IDs que su par RU aprobado; sin extras/sin duplicados.
- [ ] Preguntas y respuestas RU no vacías, con redacción y nomenclatura jurídica revisadas (incluye 1 €, 3.000 €, RETA/IAE/CNAE, CIRCE).
- [ ] Los bloques FAQ aparecen visualmente en ambas fichas, mobile y desktop, sin hidratación extra ni filtración del idioma incorrecto.
- [ ] JSON-LD FAQPage coincide exactamente con el texto visible y no genera entidades duplicadas.
- [ ] Canonical y hreflang son bidireccionales con URLs reales indexables; respetar feature flag `NEXT_PUBLIC_RU_INDEX_ENABLED`.
- [ ] TS, lint, tests, CI y previews de ambas Vercel en verde; smoke browser en ES y RU y sin regresión de checkout.
- [ ] En la web pública tras desplegar, comprobar URLs correctas, expansión de FAQ, idioma RU y SEO con inspector; registrar versión/fecha.
- [ ] Si existe propuesta de traducción IA, cotejarla con RU aprobado y registrar diferencias: **tener FAQ RU no prueba que KIA las tradujo automáticamente**.

## Nota SEO
FAQPage puede ayudar a los sistemas a interpretar las preguntas, pero la presencia de marcado no garantiza resultados enriquecidos de Google; Google limita significativamente la aparición de rich results de preguntas frecuentes. Priorizar contenido legible, útil, fechado y pareado, enlaces internos y consistencia técnica.

**Fuente técnica SEO:** https://developers.google.com/search/docs/specialty/international/localized-versions

**Estado:** documentación de auditoría y criterio de prueba. Implantación piloto en la PR de constitución #772, y RGPD en #771 con revisión editorial independiente.
