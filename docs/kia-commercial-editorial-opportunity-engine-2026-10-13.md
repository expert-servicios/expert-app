# KIA — Oportunidades comerciales y editoriales (13/10/2026)

Estado: diseño aprobado por Dirección, implementación de detección en fases y **sin autopublicación**. Integrar bajo una sola KIA y Editorial Hub existentes, no desplegar segundo agente.

## Entradas reutilizables
- Solicitudes explícitas de servicio, consultas repetidas, leads cualificados, búsqueda interna agregada, resultados de casos desidentificados.
- `regulatory_sources`, `regulatory-monitor`, `regulatory-review` y valores oficiales validados; una huella modificada NO implica nueva obligación legal.
- Catálogo canónico `catalog_services/service_contents/commercial_offers/service_channel_configs`, `blog_posts`, Docs, FAQ, Editorial Hub.

## Pipeline determinista
1. **Captar señal:** tipo, fuente/URL o evento mínimo, fecha, ámbito jurídico, idioma, trazabilidad sin datos personales en editoriales.
2. **Desduplicar:** slug/servicio equivalente, problema, norma y público objetivo contra catálogo activo, borradores, archivo y contenido ya publicado.
3. **Verificar:** norma primaria, publicación, vigencia, transitorias, sujeto y territorio. Una señal no verificada queda `needs_review`.
4. **Puntuar con evidencia:** frecuencia real, impacto, complejidad, confianza, oportunidad comercial, coste de mantenimiento, riesgo. No inventar métricas.
5. **Proponer:** (a) nuevo servicio, (b) actualización, (c) artículo, (d) guía/FAQ o (e) descartar; precio SOLO propuesta hasta autorización de Dirección.
6. **Preparar:** borradores ES/RU, glosario, fuentes y CTA al servicio existente; nunca datos de cliente ni divulgación de expedientes.
7. **Aprobar:** revisión jurídica/editorial y comercial, intervención humana en claims, precios, Stripe, publicación y mensajes.
8. **Publicar + validar:** checklist HTTP/SEO/CTA/formulario, actualizaciones de catálogo y tarea/evento con pruebas, sin envíos duplicados.

## Estados recomendados
`signal` -> `triaged` -> `verified` -> `proposed` -> `drafted` -> `approved` -> `published` / `rejected` / `needs_review`.

## Reglas de seguridad
Privacidad y minimización; separación tenant; RLS/roles y límites de acceso; idempotencia por fuente+norma+servicio; control de caducidad; un cambio de huella no activa contenido jurídico. No nuevas tablas en producción sin migración, políticas, preflight y Security Advisor. No programar escrituras de producción ni publicación automática durante E0. La revisión semanal de oportunidades ya existe como mecanismo externo de observación, no como motor de código desplegado.

## Gate del Plan Maestro
A fecha 13/10/2026 E0 mantiene scope freeze. Estas capacidades nuevas son una propuesta dirigida y documentada; antes de integrar nuevas API, tablas, automatismos o UI funcionales debe quedar registrada excepción explícita en Plan Maestro y cumplirse CI, auth, tests, seguridad y release gate. Arquitectura candidata: motor independiente en `lib/marketing`, orquestación KIA existente, proyección Admin a Editorial Hub. No crear un cerebro distinto.
