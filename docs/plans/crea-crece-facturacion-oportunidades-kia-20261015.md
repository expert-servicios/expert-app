# EXPERT — Atlas normativo y oportunidades educativas: Crea y Crece, factura electrónica y VERI*FACTU
**Fecha de corte:** 15/10/2026. **Estado:** SOLO INVESTIGACIÓN Y DOCUMENTACIÓN. **Proyecto:** PR #783, subordinado al cierre de RGPD PR #782.
**Propósito:** convertir cada artículo y cambio legal en información libre, guías, herramientas gratuitas, bases de conocimiento ES/RU y propuestas editoriales supervisadas por KIA. No usar esta documentación como contenido publicado ni como instrucciones de producción de KIA hasta aprobar el desarrollo.

## 1. Clasificación legal obligatoria (no mezclar tres familias)
| Familia | Origen y norma oficial | Objeto, sujetos y cuidado editorial |
| --- | --- | --- |
| **CREA Y CRECE** | Ley 18/2022 (BOE-A-2022-15818), art. 12 (reforma Ley 56/2007 art. 2 bis), desarrollo RD 238/2026 y Orden HAC/1028/2026 | **Factura electrónica B2B**, transmisión/recepción, interoperabilidad, información sobre pago y protección del proveedor; otras medidas sobre morosidad, financiación y creación de sociedades. No se limita a nuevas SL ni obliga por sí misma a poner QR en todas las facturas. |
| **SIF / VERI*FACTU** | Ley 11/2021 y LGT 58/2003 art. 29.2.j, RD 1007/2023, Orden HAC/1177/2024 y modificaciones (incl. RDL 15/2025) | **Sistemas informáticos utilizados para expedir facturas**: integridad, inalterabilidad, huella SHA-256, encadenamiento, QR fiscal y envío opcional/condicionado a modalidad. VERI*FACTU (registros remitidos) y no VERI*FACTU (con controles adicionales) no son sinónimos. Las excepciones para SII, forales y otros supuestos se comprueban por perfil. |
| **REGLAS DE FACTURACIÓN Y POSTCONSTITUCIÓN** | RD 1619/2012, LIVA 37/1992, normas AEAT/TGSS, Ley 14/2013, Ley 28/2022 | Facturas completas/simplificadas, deducción del IVA, obligaciones de nueva SL y autónomos, y estatuto de empresa emergente. No concluir que la factura sin QR es automáticamente inválida ni que el IVA deja de ser deducible. |

**Puntos AEAT verificables (última consulta FAQ 21/07/2026):**
- En un SIF sujeto a RD 1007/2023, tanto facturas ordinarias como simplificadas llevan QR tributario. El destinatario puede comprobar registro; el QR **no envía por sí solo** la factura a la AEAT.
- La huella o hash es de **registros de facturación**, no de la representación impresa del QR. AEAT: **la huella no forma parte de los datos incluidos en el QR**, a diferencia de TicketBAI.
- En modalidad VERI*FACTU se remiten registros a la AEAT; en modalidad no VERI*FACTU se exigen conservación/controles propios adicionales. No llamar «VERI*FACTU obligatorio» a la obligación de tener SIF conforme sin distinguir modalidad.
- Facturas sin QR pueden conservar deducibilidad del IVA si cumplen requisitos sustantivos; QR no se exige universalmente (SII, facturación sin SIF y ámbitos forales, entre otras situaciones).
- No confundir el **CSV notarial** de documentos electrónicos con el **QR fiscal** de facturas ni con la **huella hash** interna del SIF: representan problemas jurídicos y técnicos distintos.

### Estado de calendarios a 15/10/2026: vigencia vs anuncio
**Factura electrónica B2B**: Orden HAC/1028/2026 publicada en BOE 05/10/2026 y en vigor 06/10/2026. Ley 18/2022 DF 8.ª y RD 238/2026 prevén fases de aplicación 12/24 meses desde desarrollo: a verificar para cada sujeto, con la excepción comunitaria y el régimen transitorio que proceda. Fechas de referencia a vigilar: **06/10/2027** para más de 8 M€ y **06/10/2028** para restantes obligados; no inferir volumen de un cliente o concluir obligación definitiva sin comprobación.
**SIF / VERI*FACTU**: la página AEAT disponible en esta revisión y el texto reglamentario mantienen **antes del 01/01/2027** (Impuesto sobre Sociedades) y **antes del 01/07/2027** (otros sujetos alcanzados) por RDL 15/2025. Se ha difundido anuncio de Hacienda del **05/10/2026** de intención de traslado a octubre de 2028 y noticias posteriores (15/10), pero **no se ha acreditado una modificación del BOE que lo haga vigente**. Etiquetar claramente **«aplazamiento anunciado, pendiente de publicación»** y revisar el BOE antes de cualquier calendario público o respuesta categórica de KIA. **No actualizar los vencimientos legales a 2028 solo por titulares.**
**Obligación de productores SIF**: plazos y requisitos propios, separados de los aplicables a usuarios; nunca suponer que un cambio para usuarios suspende condiciones técnicas ya aplicables a comercializadores.

## 2. Cartera editorial gratuita derivada (31 ideas iniciales)
Todas las ideas son **borradores**, no publicaciones ni servicios activados. Cada pieza: público objetivo, pregunta que resuelve, checklist/ejemplo, fuente oficial y artículo, fecha de corte, diferencias ES/RU, revisora, estado.

### A. Crea y Crece, constitución y financiación (9)
A01. «Qué cambió la Ley Crea y Crece en la constitución de SL», artículo y esquema antes/después.
A02. «Capital social 1 € frente a 3.000 €: reserva, riesgos, responsabilidad y ejemplo», guía + calculadora didáctica.
A03. «Tramitar solo por CIRCE o elegir un PAE»: mapa de decisión y comparación gratuita.
A04. «Derecho a que notaría informe sobre CIRCE, aranceles y plazos», FAQ + minuta desglosada.
A05. «Ley de Startups vs Crea y Crece vs SL online de Ley 11/2023», cuadro de tres regímenes y ENISA.
A06. «Morosidad: cómo documentar un impago comercial y reclamar intereses/compensaciones si procede», guía por supuestos, sin estimar intereses sin tabla vigente.
A07. «Relaciones con administraciones y subvenciones: el pago a proveedores como condición», artículo con alcance y excepciones.
A08. «Crowdfunding regulado, financiación participativa y alternativas a préstamos», guía de riesgos y marco UE/CNMV.
A09. «Cómo crecer sin cambiar de sociedad: trámites, licencias y simplificación administrativa», checklist sectorial/territorial con límites.

### B. Factura electrónica B2B (10)
B01. «¿Qué factura es obligatoria en formato electrónico y para quién?», cuestionario sin almacenar datos.
B02. «Factura electrónica B2B no es un PDF por email», vídeo/FAQ con contraste estructurado EN16931/UBL.
B03. «Solución pública gratuita de factura electrónica», paso a paso sujeto a disponibilidad efectiva y capturas verificadas.
B04. «Plataformas privadas vs solución pública: interoperabilidad y derecho a no quedar cautivo», comparador sin recomendaciones pagadas por defecto.
B05. «Cómo comunicar aceptación, rechazo y pago de una factura electrónica», guía con fechas y casos.
B06. «Morosidad y factura B2B: estados de pago, pruebas y derecho del proveedor», artículo y checklist.
B07. «¿Desde cuándo me obliga? Más de 8 millones vs demás empresas/profesionales», calendario jurídico con vigencia y alertas.
B08. «Excepciones y facturas simplificadas: qué operaciones quedan fuera», árbol normativo con SII y especialidades si proceden.
B09. «UBL, EN16931, copia fiel y conexión entre plataformas», tutorial técnico sin prometer una integración ya construida.
B10. «Mis derechos como destinatario: descarga, acceso, revocación y no imposición de proveedor», FAQ con precisión de plazos art. 2 bis Ley 56/2007.

### C. SIF, QR y hash, VERI*FACTU (10)
C01. «Factura electrónica B2B vs VERI*FACTU: comparativa definitiva», hub de confusiones frecuentes.
C02. «Código QR tributario: qué contiene y cómo comprobar una factura», vídeo/manual gratuito con datos simulados.
C03. «Qué es la huella SHA-256 y por qué se encadenan registros», infografía y simulación educativa sin facturas reales.
C04. «¿Qué ocurre si falta el QR? ¿Puedo deducir el IVA?», FAQ con excepciones.
C05. «Modo VERI*FACTU o modo no verificable: obligaciones y elección de software», tabla sin ofrecer certificación del producto.
C06. «Cómo se corrige una factura: registros de anulación, rectificación y trazabilidad», guía con casos contables.
C07. «¿Mi programa cumple el RD 1007/2023?», checklist de declaración responsable del productor, sin afirmar homologación automática.
C08. «¿Soy SII, régimen foral u otro supuesto excluido?», cuestionario orientativo con revisión de competencia territorial.
C09. «Qué datos envío realmente a la AEAT y quién los recibe», guía de privacidad y tratamiento de registros.
C10. «2027 o 2028: cómo identificar plazo vigente, anuncio y prueba del BOE», seguimiento normativo fechado.

### D. Nuevas empresas, operaciones y alfabetización (2)
D01. «Primeros 90 días de una SL: libros, fiscalidad, empleados, protección de datos y facturación», manual interactivo.
D02. «Glosario EXPERT: DUE, CIRCE, SIF, QR fiscal, CSV, hash, Facturae, UBL, SII, TicketBAI, ENISA», centro bilingüe.

## 3. Productos gratuitos y formatos reutilizables
- **Guías libres**: decisión de vía de constitución; lectura arancel/notaría; calendarios vigentes; QR/hash; checklist SIF; factura B2B paso a paso; catálogo de excepciones.
- **Calculadoras y comprobadores en navegador**: coste aproximado de constituir SL (honorarios vs notaría/RM), cronograma por régimen, capital/reserva, ¿qué norma me aplica?, QR factura (ejemplos simulados), fechas legales separadas de anuncios.
- **Vídeos cortos de orientación**, mapas de procesos, modelos y documentos explicados, artículos relacionados y FAQ en cada ficha; contenido público ES/RU sin registro. KIA gratuito para explicación, limitado por controles de abuso/coste.
- **Consulta previa de 15 min gratis**, cuando se necesite clasificación del supuesto y haya agenda; formación práctica 2h 180 € + IVA como opción voluntaria. Servicios puntuales futuros no presupuestados (verificación factura, revisión SIF, implantación factura B2B, revisión de morosidad) pasan por aprobación de alcance, riesgos y precios; no anunciar precio ni crear pedidos.
- La biblioteca general se alimenta por **familias jurídicas**, no por volumen de texto: diferenciar creación de sociedad, startup certificada, impuestos, facturación, registral, consumo y laboral.

## 4. Enseñar a KIA el mismo método de este chat: SOP de investigación y propuestas (A DISEÑAR, NO EJECUTAR)

### Método repetible, 12 controles
1. **Escuchar la necesidad** y separar la consulta de una petición de contratar; no empujar venta.
2. **Desambiguar conceptos** parecidos (Crea y Crece/VeriFactu/Factura B2B; QR/hash/CSV; SL/ENISA).
3. **Identificar perfil y jurisdicción** con datos no personales; si no se sabe, hablar de escenarios, no suponer.
4. **Buscar fuente primaria**: BOE consolidado + versión publicada, AEAT/Ministerio/CNMV/ENISA/PAE y FAQs técnicas fechadas. Internet y resúmenes externos son señales, no sustituyen BOE.
5. **Comprobar estado**: anuncio, proyecto, publicación, entrada en vigor, aplicación efectiva, suspensión, reforma o derogación; registrar fecha/hora y URL.
6. **Leer condiciones y excepciones**, no solo cifra, titular o plazo; identificar artículo, sujeto, hecho imponible, régimen territorial y disposiciones transitorias.
7. **Comparar con EXPERT**: contenido existente, fichas, enlaces, FAQ, catálogo, ES/RU, base KIA, normativa guardada, fechas y flags; detectar huecos y posibles contradicciones.
8. **Crear oportunidades únicas**: una cuestión/objetivo por ficha; deduplicar temáticas y agrupar FAQ, guía, artículo, vídeo, comparador, calculadora, curso y servicio sin duplicar contenido.
9. **Ordenar por valor**: frecuencia de duda agregada y consentida, coste de mantener, riesgo legal, utilidad para hacer el trámite sin asesoría, idioma y urgencia de cambio.
10. **Redactar borrador explicativo** con ejemplos ficticios, citas oficiales, advertencias para supuestos excluidos y preguntas frecuentes; traducir ES/RU con revisión.
11. **Pasar QA jurídico + técnico**: humano valida norma, enlaces, fechas, precios, carácter gratuito, accesibilidad, SEO, privacidad, capturas; CI y previews tras implementar.
12. **Publicar solamente con permiso** y medir utilidad; almacenar feedback agregado sin PII, registrar cambios/versiones y revisar periódicamente normas. Nunca emitir mensaje a clientes, crear leads, lanzar campaña ni fusionar PR desde esta rutina sin orden/autorización.

### Formato de propuesta a la futura bandeja editorial
```text
theme_id: <familia>:<tema>:<norma>:<versión>
source: [BOE/AEAT/ministerio — artículo preciso — URL — fecha consulta]
legal_state: publicado | vigente | anunciado | pendiente | derogado
audience: SL | autónomo | startup | pyme B2B | proveedor software
pain_point: duda / confusión / documento / cambio normativo
missing_knowledge: existente | desactualizado | ausente | contradictorio
public_free_first: FAQ | guía | mapa | vídeo | calculadora
other_options: curso | consulta | servicio propuesto, no activado
language: ES/RU, traducción revisada
risk: bajo | medio | jurídico alto
privacy: sin datos identificativos ni contenido de chat sin anonimizar
owner_review: required
publication_state: draft_only
```

### Prohibiciones de KIA (antes y después de implementar)
- No leer chats, documentos, facturas, expedientes ni correo privados para detectar tendencias editoriales salvo permiso y tratamiento justificado; usar cuestiones anónimas, agregadas o fuentes oficiales.
- No cambiar fechas legalmente aplicables por un anuncio en medios; **alertar** para revisar normas cuando entre una novedad.
- No afirmar «QR obligatorio para todas las facturas», «hash dentro del QR», «todos deben usar VERI*FACTU», «factura PDF siempre inválida», «código QR da derecho a deducir IVA» ni «la SL nueva ya está obligada desde la constitución».
- No publicar contenidos, artículos ni comunicaciones comerciales ni actualizar KIA público desde un borrador no aprobado; no escribir normativa jurídica sin revisión humana.
- No mezclar el **desarrollo de productos de pago** con la divulgación gratuita y no condicionar acceso a publicidad.
- No compartir claves API, tokens, datos personales, expedientes reales o plantillas comerciales sensibles con canales públicos de consulta IA.

## 5. Plan de ejecución con dependencia RGPD
**Congelado**: esta PR #783 añade exclusivamente documentos; no integra en KIA, no crea artículo, ni herramienta ni nuevo servicio público, no modifica Stripe, ni altera los calendarios de clientes.
**Tras cierre RGPD #782**: (i) revalidar cada fuente y fecha; (ii) aprobar la matriz editorial y elegir 6–8 primeros recursos gratis; (iii) alinear contenidos y KIA con permisos/QA; (iv) desarrollar herramientas y pruebas ES/RU; (v) publicar por tandas y observar experiencia, sin seguimiento comercial automático.
**Vigilancia documental**: si se publica un decreto que cambie el calendario VeriFactu antes de retomar, actualizar estado de norma y no insertar silenciosamente fechas nuevas en artículos existentes.

## 6. Fuentes de apoyo, consultadas 15/10/2026
- Crea y Crece: https://www.boe.es/eli/es/l/2022/09/28/18/con
- Ley 56/2007 art. 2 bis: https://www.boe.es/buscar/act.php?id=BOE-A-2007-22440
- Ley 11/2021 antifraude: https://www.boe.es/eli/es/l/2021/07/09/11/con
- Ley General Tributaria art. 29.2.j: https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186
- RD 1007/2023 SIF: https://www.boe.es/eli/es/rd/2023/12/05/1007/con
- Orden HAC/1177/2024 QR/hash: https://www.boe.es/eli/es/o/2024/10/17/hac1177/con
- RDL 15/2025 fechas: https://www.boe.es/eli/es/rdl/2025/12/02/15/con
- AEAT nota de plazos 2027: https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/nota-informativa-ampliacion-plazo-adaptacion-facturacion.html
- AEAT FAQ hash (no incluido en QR): https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/huella-hash.html
- AEAT FAQ QR, deducibilidad: https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/cuestiones-generales-conceptos-definiciones.html
- AEAT FAQ sistemas VERI*FACTU vs no: https://www3.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/sistemas-verifactu.html
- RD 238/2026 factura B2B: https://www.boe.es/eli/es/rd/2026/03/25/238/con
- Orden HAC/1028/2026 solución pública: https://www.boe.es/eli/es/o/2026/10/02/hac1028/con
- Ministerio Hacienda anuncio aplazamiento 2028 (sin modificación BOE acreditada en esta revisión): localizar nota original antes de atribuir fecha vinculante.
