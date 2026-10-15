# Caso piloto QA KIA: Comfi App — revisión de notas 14/10/2026
Fecha: 15/10/2026. Estado: caso de prueba documental, **no** publicación de datos personales. Fuente de origen privada: notas Gemini de la reunión de 14/10 a las 17:00 (en EXPERT). Los contenidos públicos del mismo tema deben ser anónimos y generalizables.

## Regla de aprendizaje
KIA separa (a) lo dicho durante una llamada (no verificado), (b) lo contrastado con fuentes oficiales, (c) los compromisos efectivamente aprobados y (d) las oportunidades editoriales. Nunca convierte una opinión expresada con seguridad en un hecho ni envía correos/presupuestos por su cuenta. La sesión formativa no equivale a auditoría, EIPD o certificación RGPD.

## Hallazgos de la reunión y estado QA
| Pregunta planteada | Respuesta registrada en Gemini | Clasificación y corrección requerida | Tema reutilizable |
|---|---|---|---|
| ¿Se puede preguntar por sexo o discapacidad? | Prohibición absoluta de ambos campos | **CORREGIR:** sexo no está prohibido per se; exige finalidad, base jurídica y minimización/no discriminación. Discapacidad puede ser dato de salud (art. 9 RGPD); precauciones reforzadas, casos y excepciones con especialista. | Artículo formularios y selección |
| ¿Quién responde cuando usuarios comparten perfiles/fotos? | Con normas comunitarias la plataforma deja de ser responsable | **CORREGIR:** la función de responsable/corresponsable/encargado depende de finalidades y medios reales; términos de uso y moderación no extinguen obligaciones de diseño/seguridad. | Marketplace y datos entre usuarios |
| ¿Google Tag Manager y analítica implican contrato? | Contratos siempre / anonimización suficiente | **REVISAR:** distinguir Google Tag Manager, Analytics, cookies, proveedores y acceso efectivo a datos, anonimización verdadera frente a seudonimización, artículo 28 y transferencias. | Analítica y encargado |
| ¿Constituir SL inmediatamente evita riesgo y obligaciones? | Sí, SL inactiva sin obligaciones extra | **CORREGIR:** analizar sujeto responsable antes de constitución, obligaciones mercantiles/fiscales tras constitución, privacidad y riesgos por tratamientos existentes; no exigir constituir para cumplir RGPD. | Autónomo vs SL y RGPD |
| ¿Los gastos seis meses antes son deducibles automáticamente? | Plazo universal seis meses | **CORREGIR:** no existe una regla general automática de seis meses; IVA actos preparatorios con prueba de intención y requisitos de Ley IVA, otros impuestos y sujetos por separado. | Gastos previos e impuestos |
| ¿Con más del 25 % toca RETA siempre? | Regla general absoluta | **CORREGIR:** participación, cargo de administración, funciones, control efectivo directo/familiar, convivencia y actividad real según LGSS art. 305; no asumir porcentajes aislados. | Régimen SS socios |
| ¿Administrador queda exento de responsabilidad si cumple? | Exención personal universal | **CORREGIR:** responsabilidad societaria propia y deberes del administrador; la SL no es escudo absoluto. Analizar obligaciones personales y supuestos legales. | Responsabilidad administrador |
| ¿Puede usar AEPD para cumplimiento? | Herramienta suficiente por sí sola | **CORREGIR:** Facilita RGPD, Facilita EMPRENDE y Gestiona RGPD son herramientas gratuitas de orientación/documentación, no certificaciones; el responsable conserva responsabilidad proactiva. | Comparación 3 herramientas |

## Oportunidades entregables
- Servicio 2 horas Google Meet, precio definitivo 180 € + IVA, de carácter formativo guiado: `formacion-rgpd-aepd`.
- Artículos: comparación AEPD y responsabilidades en marketplaces.
- Docs/KB: guía de decisión y criterios para verificar adecuación.
- SEO: metaTitle, metaDescription, etiquetas y FAQs en catálogo, FAQPage JSON-LD desde página de servicio.
- KIA: reglas de detección para frases absolutas (siempre, nunca, seis meses, irresponsabilidad), decisión pendiente por defecto y etiqueta de oportunidad reutilizable; aprendizaje transversal sin datos de cliente.
- Web RGPD: acceso a la formación desde herramienta gratuita; formulario de presupuesto permite seleccionar formación diferenciada de implantación.
- **Pendiente de rama futura:** traslado opcional y minimizado del resultado del prediagnóstico por POST en vez de parámetros URL; ver issue #778.
- **Pendiente:** traducción ES/RU y hreflang específicos de nuevo servicio, pruebas con traducción real antes de publicar; no declarar automático sin QA.

## Criterios de aceptación
- [ ] CI TypeScript + lint + Vitest y build Vercel sin regresiones.
- [ ] Precio fijo 180 € + IVA; no crear Stripe Price sin política fiscal / catálogo revisado.
- [ ] Página no debe prometer certificación ni adecuación completa.
- [ ] Documentos públicos sin nombres de emprendedores, emails, imágenes ni citas de transcripción.
- [ ] Fuentes AEPD, EUR-Lex, BOE visibles y fechas de revisión.
- [ ] Flujo postreunión QA identifica oportunidades con revisión antes de publicar.
- [ ] CTA de presupuesto no transmite información individual de riesgo en URL (issue #778; fuera del alcance actual).
- [ ] Enlaces internos y FAQ validados.
- [ ] Revisión de cumplimiento normativo por persona responsable de EXPERT.

## Referencias
- https://www.aepd.es/guias-y-herramientas/herramientas
- https://gestiona2.aepd.es/
- https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa
- https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673
- https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544
- https://www.boe.es/buscar/act.php?id=BOE-A-1994-14960
