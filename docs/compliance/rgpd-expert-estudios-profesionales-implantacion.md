# Implantación RGPD interna — EXPERT ESTUDIOS PROFESIONALES, SLU

Estado: borrador operativo interno  
Fecha de revisión: 24/09/2026  
Responsable de validación: Dirección de EXPERT

## 1. Objetivo

EXPERT debe poder demostrar cumplimiento real, no solo disponer de textos legales. La implantación se basará en inventario de tratamientos, RAT, bases jurídicas, encargados, seguridad, derechos, brechas, conservación y revisión periódica.

Fuentes principales:
- AEPD PYMES: https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/directrices-de-aplicacion/pymes
- RGPD: https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa
- LOPDGDD: https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673

## 2. Roles de EXPERT

EXPERT actúa como responsable en sus tratamientos propios: leads, presupuestos, contratación, facturación, cuentas de usuario, reservas, marketing, reseñas, personal, proveedores, seguridad, web y uso interno de KIA.

En servicios fiscales, contables, laborales y administrativos para clientes, el rol debe analizarse por servicio:
- si EXPERT trata datos por cuenta del cliente siguiendo instrucciones, revisar encargo art. 28;
- si EXPERT determina finalidades propias por obligaciones legales/profesionales, puede existir responsabilidad propia o un reparto de roles.

Fuente AEPD:
https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/8-responsable-y-encargado-del-tratamiento/FAQ-0251-como-se-si-soy-responsable-o-encargado

Acción humana obligatoria: clasificar el rol de EXPERT en cada familia de servicios y reflejarlo en contratos.

## 3. Borrador inicial de RAT

### RAT-01 — Leads, contacto y presupuestos
Interesados: potenciales clientes.  
Datos: nombre, email, teléfono, empresa, mensaje.  
Finalidad: atender consultas, presupuestar y concertar reunión.  
Base jurídica a validar: medidas precontractuales y, para finalidades adicionales, consentimiento cuando proceda.  
Sistemas: web EXPERT, Supabase, Resend, Google Workspace/Calendar/Meet y Microsoft 365 cuando se use.  
Acción humana: definir plazo para leads no convertidos.

### RAT-02 — Clientes, contratos y expedientes
Datos: identificación, contacto, fiscales, económicos, documentos y expediente.  
Finalidad: ejecutar servicios y atender al cliente.  
Base: contrato y obligaciones legales.  
Sistemas: Supabase, Google Workspace/Drive, Microsoft 365 si procede, Resend, Vercel, Holded, Stripe.  
Acción humana: definir conservación por tipo de expediente.

### RAT-03 — Gestión fiscal, contable y administrativa
Datos: fiscales, contables, bancarios, patrimoniales y justificantes.  
Finalidad: asesoramiento, contabilidad, impuestos y gestión administrativa.  
Acción humana: validar responsable/encargado por servicio.

### RAT-04 — Gestión laboral y nóminas
Datos: identificativos, laborales, nóminas, SS, bancarios y, ocasionalmente, información que puede revelar salud.  
Finalidad: contratación, nómina, cotización y obligaciones laborales.  
Riesgo: medio/alto según categorías y volumen.  
Acción humana: revisar categorías especiales y permisos internos.

### RAT-05 — Facturación, pagos y cobros
Proveedores: Stripe, Holded, Supabase.  
Acción: mantener fuera de sistemas propios los datos completos de tarjeta.

### RAT-06 — Cuenta de usuario y autenticación
Datos: email, nombre, identificadores técnicos, avatar y eventos de autenticación.  
Proveedores: Supabase Auth y Google OAuth cuando se use.

### RAT-07 — Reservas, Calendar y Meet
Datos: nombre, email, asunto/notas, fecha/hora, invitación, enlace Meet y, si se activa, notas/resumen de reunión.  
Acción humana: aprobar finalidad, información previa, acceso y conservación de notas.

### RAT-08 — Comunicaciones operativas
Canales: Google Workspace, Microsoft 365, Resend, WhatsApp y Telegram cuando proceda.  
Acción humana: fijar retención y reglas de sincronización con expedientes.

### RAT-09 — Marketing
Datos: email, nombre, preferencias e interacción.  
Acción: base jurídica trazable, baja sencilla y lista de supresión.

### RAT-10 — Web, analítica y cookies
Datos: identificadores online, cookies, información técnica y navegación.  
Acción: auditoría técnica real de scripts/cookies; no basarse solo en textos legales.

### RAT-11 — Reseñas y moderación
Datos: puntuación, comentario, autorización y metadatos mínimos.  
Acción: revisión humana de casos ambiguos y minimización.

### RAT-12 — KIA / IA
Datos: según caso, expediente, mensajes, contexto empresarial y resultados.  
Proveedores: Anthropic/OpenAI según router activo.  
Acciones: minimización, redacción, control de herramientas, logs, revisión humana y análisis de EIPD cuando proceda.

### RAT-13 — Seguridad y auditoría
Datos: logs, IP, accesos, acciones administrativas, errores y trazas.  
Acción: fijar retención por clase de log y limitar accesos.

### RAT-14 — Personal y colaboradores
Datos: identificación, contrato, nómina, SS, formación, jornada, prevención y otros necesarios.  
Acción: cláusula informativa, confidencialidad, permisos y baja de accesos.

## 4. Inventario inicial de proveedores

Revisar DPA, subencargados, ubicación, transferencias, retención y finalidad de:
- Supabase
- Vercel
- Stripe
- Resend
- Google Workspace
- Microsoft 365
- Holded
- Anthropic
- OpenAI
- Telegram
- Meta/WhatsApp
- GitHub
- Google Cloud
- reCAPTCHA

### Hallazgo P1 — Supabase

Producción está en eu-west-2. Supabase identifica eu-west-2 como London (United Kingdom). La política pública actual indica UE (Frankfurt), por lo que debe corregirse.

Fuente:
https://supabase.com/docs/guides/platform/regions

Acción humana: decidir si mantener Londres con las garantías aplicables o valorar migración a una región UE. No migrar sin análisis técnico/jurídico.

## 5. Encargados del tratamiento

Para cada proveedor que actúe como encargado:
- aceptar/firmar DPA;
- guardar versión o evidencia;
- identificar subencargados;
- documentar mecanismo de transferencia;
- revisar cambios;
- comprobar supresión/devolución al terminar;
- verificar asistencia en derechos y brechas.

Fuente AEPD:
https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/8-responsable-y-encargado-del-tratamiento/FAQ-0238-cual-seria-el-contenido-del-contrato-de-encargo-de-tratamiento

## 6. Transferencias internacionales

Crear matriz separada con proveedor, entidad contractual, país/región, datos, subencargados, mecanismo jurídico, SCC/adecuación cuando corresponda y fecha de revisión.

No asumir que servidor europeo elimina todas las transferencias: soporte, telemetría, subencargados o accesos remotos pueden generar otros flujos.

## 7. Análisis de riesgos y EIPD

Debe existir análisis de riesgos documentado.

Revisión reforzada para:
- laboral y posibles datos de salud;
- documentación fiscal/patrimonial;
- KIA con contexto de expediente;
- proveedores IA;
- Google/Microsoft/Holded;
- mensajería multicanal;
- automatizaciones;
- grabación/notas automáticas de reuniones.

Fuente:
https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/realizacion-de-evaluaciones-de

Acción humana: aprobar el análisis de riesgos y decidir formalmente si alguna capacidad exige EIPD antes de activarse.

## 8. DPD

Con la información actual, EXPERT no entra automáticamente en el artículo 34 LOPDGDD por ser asesoría fiscal/laboral/contable. Debe documentarse la decisión y revisar si las actividades principales implican observación sistemática a gran escala o tratamiento a gran escala de categorías especiales.

Acción humana: firmar una nota interna DPD obligatorio / no obligatorio / voluntario, con fundamento y fecha. Revisar anualmente.

## 9. Conservación y bloqueo

No usar una cifra única. Crear matriz por categoría con:
- plazo operativo;
- plazo legal;
- bloqueo;
- destrucción/anonimización;
- sistema donde se ejecuta.

### Hallazgo P1
La política pública indica como ejemplo 5 años para datos contables según la Ley General Tributaria. Debe revisarse: los plazos fiscales, mercantiles y civiles no son equivalentes.

Acción humana: aprobar tabla de conservación con soporte legal antes de actualizar la política.

## 10. Derechos

Procedimiento:
1. recepción;
2. registro de fecha;
3. verificación proporcional de identidad;
4. localización de sistemas;
5. decisión;
6. ejecución;
7. evidencia;
8. respuesta dentro del plazo.

Acción humana: designar quién aprueba respuestas. KIA puede preparar borrador, no adoptar la decisión final.

## 11. Brechas

Registrar todas las brechas, incluso las no notificadas.

Flujo: detectar, contener, preservar evidencia, identificar afectados, valorar riesgo, decidir AEPD, decidir comunicación, corregir causa raíz y documentar cierre.

Guía EXPERT:
/docs/protocolo-brechas-datos-personales-72-horas

## 12. Web, cookies y formularios

Auditar técnicamente:
- GTM/GA4;
- reCAPTCHA;
- Stripe;
- píxeles futuros;
- KIA/chat;
- embeds;
- formularios;
- reservas;
- retirada de consentimiento.

Verificar que rechazar y aceptar tengan el mismo nivel, que tecnologías opcionales no carguen antes del consentimiento y que marketing no se mezcle con prestación del servicio.

## 13. Google Meet y notas automáticas

Si se activa toma automática de notas:
- informar;
- definir finalidad;
- limitar acceso;
- fijar conservación;
- decidir incorporación al expediente;
- documentar proveedor.

Acción humana: aprobar política de notas automáticas y plazo de conservación.

## 14. KIA: reglas mínimas

1. minimización;
2. acceso por rol/tenant;
3. aislamiento entre clientes;
4. no enviar información innecesaria;
5. pseudonimizar cuando sea viable;
6. permisos explícitos;
7. acciones sensibles con confirmación;
8. logs sin secretos;
9. trazabilidad de proveedor;
10. no entrenamiento con datos cliente salvo base/configuración expresa;
11. exclusión de datos de alto riesgo cuando proceda;
12. revisión de DPA y subencargados.

## 15. Personal y confidencialidad

Para toda persona con acceso:
- confidencialidad;
- formación inicial;
- refresco anual;
- acceso mínimo;
- MFA;
- dispositivo protegido;
- no compartir cuentas;
- alta/cambio/baja;
- devolución de activos;
- revocación inmediata.

Acción humana: revisar y firmar documentación de personal/colaboradores.

## 16. Correcciones P1 detectadas

- [ ] Corregir Supabase: producción = eu-west-2 / Londres, no Frankfurt.
- [ ] Revisar tabla pública de proveedores contra integraciones reales.
- [ ] Revisar texto de conservación 5 años contables.
- [ ] Revisar rol de Stripe; no asumir que es exclusivamente encargado en todo.
- [ ] Actualizar fecha de política tras los cambios.
- [ ] Documentar Google Calendar/Meet/notas.
- [ ] Revisar transferencias proveedor por proveedor.
- [ ] Auditar cookies técnicamente.

## 17. Trabajo humano que no debe delegarse a KIA

### Decisiones
- [ ] Confirmar tratamientos reales.
- [ ] Aprobar finalidades y bases jurídicas.
- [ ] Aprobar matriz de conservación.
- [ ] Aprobar rol responsable/encargado por servicio.
- [ ] Decidir DPD.
- [ ] Aprobar análisis de riesgos.
- [ ] Decidir EIPD.
- [ ] Aprobar proveedores y transferencias.
- [ ] Aprobar política de IA.
- [ ] Aprobar política de notas.

### Firma y contratación
- [ ] Firmar/aceptar DPAs.
- [ ] Archivar contratos con encargados.
- [ ] Firmar confidencialidad de personal.
- [ ] Actualizar contratos de clientes cuando EXPERT sea encargado.

### Operativa
- [ ] Revisar accesos y permisos.
- [ ] MFA.
- [ ] Revocar usuarios antiguos.
- [ ] Probar backups/restauración.
- [ ] Hacer simulacro anual de brecha.
- [ ] Auditar cookies/scripts.
- [ ] Probar canal de derechos.
- [ ] Formar al personal.

### Revisión profesional
- [ ] Validar política pública.
- [ ] Validar categorías especiales.
- [ ] Revisar automatizaciones KIA de alto riesgo.
- [ ] Revisar RAT anualmente y ante nuevas integraciones.

KIA puede preparar inventarios, matrices, borradores, recordatorios y evidencias, pero la validación final debe quedar atribuida a una persona responsable.

## 18. Carpeta de evidencias recomendada

RGPD/
- 01_RAT
- 02_Analisis_Riesgos
- 03_EIPD
- 04_Proveedores_DPA
- 05_Transferencias
- 06_Clausulas_Informativas
- 07_Clientes_Encargos
- 08_Personal_Confidencialidad
- 09_Derechos
- 10_Brechas
- 11_Seguridad
- 12_Cookies_Web
- 13_IA_KIA
- 14_Formacion
- 15_Auditorias_Revisiones

## 19. Criterio de cierre

No marcar implantado hasta que:
- RAT esté aprobado;
- roles estén definidos;
- proveedores y DPAs revisados;
- transferencias documentadas;
- conservación aprobada;
- análisis de riesgos firmado;
- decisión EIPD/DPD documentada;
- políticas públicas coincidan con arquitectura real;
- derechos y brechas tengan responsables;
- personal tenga instrucciones;
- exista evidencia de revisión.

Después: revisión anual y revisión extraordinaria cuando cambien servicios, proveedores, IA, cookies, tratamientos o arquitectura.
