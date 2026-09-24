export const proteccionDatosKnowledgeDocs = [
  {
    slug: 'checklist-rgpd-autonomos-pymes',
    category: 'proteccion-datos' as const,
    title: 'Checklist RGPD para autónomos y pymes',
    excerpt:
      'Lista práctica para revisar si tu negocio tiene cubiertos los principales bloques de protección de datos en España.',
    tags: ['RGPD', 'LOPDGDD', 'checklist', 'pymes', 'autónomos', 'AEPD'],
    updatedAt: '24 sep 2026',
    readTime: '9 min',
    seoTitle: 'Checklist RGPD para autónomos y pymes | EXPERT Docs',
    seoDescription:
      'Checklist práctico de protección de datos para autónomos y pymes: RAT, bases jurídicas, información, encargados, seguridad, derechos y brechas.',
    body: `
## Objetivo

Este checklist sirve para hacer una primera revisión del cumplimiento de protección de datos de un autónomo o una pyme en España.

No sustituye un análisis jurídico cuando existen datos sensibles, perfiles, tratamientos a gran escala, vigilancia sistemática, menores u otros escenarios de mayor riesgo.

## 1. Inventario de tratamientos

Comprueba que puedes identificar qué actividades utilizan datos personales.

Ejemplos habituales:

- clientes y facturación;
- proveedores;
- leads y potenciales clientes;
- newsletter y marketing;
- trabajadores y nóminas;
- selección de personal;
- videovigilancia;
- soporte y atención al cliente;
- usuarios de la web;
- reservas y citas.

Para cada actividad debe quedar claro qué datos se utilizan, de quién son, para qué se necesitan y durante cuánto tiempo se conservan.

## 2. Registro de Actividades de Tratamiento

Verifica que existe un **RAT** actualizado y coherente con la operativa real.

Como mínimo revisa:

- finalidad;
- categorías de interesados;
- categorías de datos;
- destinatarios;
- transferencias internacionales;
- plazos de supresión;
- medidas de seguridad, cuando sea posible describirlas.

[Guía para preparar el RAT](/docs/registro-actividades-tratamiento-rat-pymes).

## 3. Base jurídica

Cada finalidad debe apoyarse en una base del artículo 6 del RGPD.

Comprueba que no se utiliza “consentimiento” por defecto para todo y que están correctamente diferenciados:

- ejecución de contrato;
- obligación legal;
- consentimiento;
- interés legítimo, cuando proceda y esté justificado;
- otras bases aplicables al caso.

Si se tratan categorías especiales de datos, hay que revisar además el artículo 9 del RGPD.

## 4. Información a las personas

Revisa todos los puntos en los que se recogen datos:

- formularios web;
- contratos;
- presupuestos;
- procesos de alta;
- selección;
- newsletters;
- citas;
- eventos;
- atención al cliente.

La información debe cubrir los elementos exigidos por los artículos 13 o 14 del RGPD y ser coherente con el tratamiento real.

## 5. Proveedores

Haz una lista de proveedores que acceden a datos personales.

Por ejemplo:

- gestoría;
- software contable;
- nóminas;
- CRM;
- hosting;
- cloud;
- email marketing;
- soporte IT;
- firma electrónica;
- herramientas de IA.

Determina si actúan como encargados del tratamiento y comprueba que existe contrato conforme al artículo 28 cuando corresponda.

## 6. Transferencias internacionales

Comprueba si algún proveedor o subencargado trata datos fuera del Espacio Económico Europeo.

Documenta, según proceda:

- decisión de adecuación;
- cláusulas contractuales tipo;
- otras garantías aplicables;
- análisis adicional cuando sea necesario.

## 7. Seguridad

Revisa las medidas técnicas y organizativas teniendo en cuenta el riesgo.

Puntos habituales:

- MFA;
- gestión de usuarios;
- permisos mínimos;
- copias de seguridad;
- cifrado cuando proceda;
- actualizaciones;
- antivirus/EDR;
- dispositivos;
- borrado seguro;
- formación;
- protocolo de incidencias.

## 8. Derechos

Debe existir un procedimiento para responder solicitudes de:

- acceso;
- rectificación;
- supresión;
- oposición;
- limitación;
- portabilidad;
- decisiones automatizadas, cuando proceda.

Como regla general, el RGPD establece un plazo de **un mes** para responder, con posibilidad de ampliación en determinados supuestos.

## 9. Brechas

Comprueba que existe un registro y un procedimiento para incidentes.

No toda brecha debe notificarse a la AEPD, pero todas deben documentarse.

[Protocolo de brechas y regla de 72 horas](/docs/protocolo-brechas-datos-personales-72-horas).

## 10. Web y cookies

Si tienes web, revisa:

- privacidad;
- cookies;
- formularios;
- newsletter;
- píxeles;
- analítica;
- reCAPTCHA;
- chat;
- servicios embebidos;
- mecanismo de retirada de consentimiento.

[Guía de privacidad, formularios y cookies](/docs/privacidad-formularios-cookies-web).

## 11. Conservación y borrado

No guardes los datos indefinidamente por costumbre.

Define plazos y criterios de conservación teniendo en cuenta:

- finalidad;
- obligaciones legales;
- responsabilidades;
- prescripción;
- bloqueo cuando proceda.

## 12. ¿Necesitas DPD?

No todas las pymes deben designar Delegado de Protección de Datos.

Debe revisarse si concurre alguno de los supuestos del artículo 37 RGPD o del artículo 34 LOPDGDD, además de otros casos en los que pueda resultar recomendable.

La AEPD dispone de un listado orientativo de entidades obligadas.

## Fuentes oficiales

- RGPD: https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa
- LOPDGDD: https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673
- AEPD — pymes: https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/directrices-de-aplicacion/pymes
- AEPD — Facilita RGPD: https://www.aepd.es/guias-y-herramientas/herramientas/facilita-rgpd

**Revisado el 24/09/2026.**
    `
  },
  {
    slug: 'registro-actividades-tratamiento-rat-pymes',
    category: 'proteccion-datos' as const,
    title: 'Cómo preparar el Registro de Actividades de Tratamiento (RAT)',
    excerpt:
      'Guía práctica para construir y mantener el RAT de una pyme: qué tratamientos separar y qué información debe documentarse.',
    tags: ['RAT', 'registro actividades tratamiento', 'RGPD', 'AEPD', 'pymes'],
    updatedAt: '24 sep 2026',
    readTime: '8 min',
    seoTitle: 'Registro de Actividades de Tratamiento (RAT) para pymes | EXPERT',
    seoDescription:
      'Cómo preparar el RAT de una pyme conforme al RGPD: finalidades, datos, interesados, destinatarios, transferencias, plazos y seguridad.',
    body: `
## Qué es el RAT

El Registro de Actividades de Tratamiento es el inventario estructurado de las operaciones de tratamiento de datos personales de una organización.

Sirve para entender y demostrar qué datos se tratan, con qué finalidad y bajo qué condiciones.

## ¿Una empresa con menos de 250 empleados está exenta?

El artículo 30.5 del RGPD contiene una excepción limitada para organizaciones con menos de 250 empleados, pero **no es una exención general para pymes**.

La excepción no opera, entre otros casos, cuando el tratamiento puede entrañar un riesgo para los derechos y libertades, no es ocasional o incluye categorías especiales de datos o datos relativos a condenas e infracciones.

En la práctica, muchas actividades ordinarias y recurrentes de una empresa —clientes, trabajadores, facturación o proveedores— no son tratamientos meramente ocasionales.

## Cómo dividir los tratamientos

No crees una línea por cada cliente. El RAT se organiza por **actividades o finalidades de tratamiento**.

Ejemplo:

### Gestión de clientes

Puede incluir:

- identificación;
- contacto;
- facturación;
- ejecución del servicio;
- cobros;
- atención postventa.

### Recursos humanos

Puede incluir:

- contrato;
- nómina;
- jornada;
- prevención;
- formación;
- Seguridad Social.

### Marketing

Puede incluir:

- newsletter;
- leads;
- campañas;
- medición de conversiones.

## Información mínima como responsable

El artículo 30 RGPD exige documentar, entre otros puntos:

- nombre y datos de contacto del responsable;
- DPD, cuando exista;
- fines del tratamiento;
- categorías de interesados;
- categorías de datos;
- categorías de destinatarios;
- transferencias internacionales, cuando existan;
- plazos previstos de supresión cuando sea posible;
- descripción general de medidas técnicas y organizativas cuando sea posible.

## Añade información útil para gestionar

Aunque no sea un campo literal obligatorio del artículo 30, suele ser práctico añadir:

- base jurídica;
- sistema o aplicación utilizada;
- proveedor;
- ubicación;
- responsable interno;
- fecha de revisión;
- fuente de los datos;
- enlace al contrato de encargo;
- nivel de riesgo.

Así el RAT se convierte en una herramienta de gestión, no en un documento estático.

## Coordina el RAT con el resto de documentos

El RAT debe ser coherente con:

- cláusulas informativas;
- política de privacidad;
- contratos con encargados;
- inventario de activos;
- análisis de riesgos;
- política de conservación;
- registro de brechas.

Si la política web dice una cosa y el RAT otra, la documentación pierde valor probatorio.

## Cuándo actualizarlo

Revísalo cuando:

- incorporas un nuevo software;
- cambias de CRM;
- empiezas una newsletter;
- contratas empleados;
- instalas videovigilancia;
- introduces IA;
- cambias un proveedor cloud;
- empiezas a tratar nuevos datos;
- cambia la finalidad;
- abres una nueva línea de negocio.

Además, conviene una revisión periódica aunque no haya cambios aparentes.

## Plantilla mínima de trabajo

Para cada tratamiento crea una ficha con:

1. Nombre del tratamiento.
2. Finalidad.
3. Interesados.
4. Datos.
5. Base jurídica.
6. Destinatarios.
7. Encargados.
8. Transferencias.
9. Conservación.
10. Medidas de seguridad.
11. Responsable interno.
12. Fecha de revisión.

## Fuentes oficiales

- RGPD, artículo 30: https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa
- AEPD — registro de actividades: https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/3-registro-de-actividades-de-tratamiento

**Revisado el 24/09/2026.**
    `
  },
  {
    slug: 'privacidad-formularios-cookies-web',
    category: 'proteccion-datos' as const,
    title: 'Checklist de privacidad para web, formularios y cookies',
    excerpt:
      'Qué revisar técnicamente y jurídicamente en una web empresarial: información, consentimientos, cookies, marketing y proveedores.',
    tags: ['web', 'cookies', 'formularios', 'RGPD', 'LSSI', 'consentimiento'],
    updatedAt: '24 sep 2026',
    readTime: '9 min',
    seoTitle: 'Checklist privacidad web y cookies | EXPERT Docs',
    seoDescription:
      'Guía práctica para revisar formularios, cookies, newsletter, analítica, píxeles y proveedores de una web empresarial en España.',
    body: `
## 1. Haz inventario de todos los puntos de recogida

No revises solo el formulario de contacto.

Incluye:

- contacto;
- presupuesto;
- reserva;
- newsletter;
- registro;
- checkout;
- chat;
- solicitudes de empleo;
- comentarios;
- descargas;
- soporte.

## 2. Identifica la finalidad de cada formulario

Pregunta:

- ¿para qué necesitamos estos datos?
- ¿qué campos son realmente necesarios?
- ¿qué base jurídica utilizamos?
- ¿vamos a reutilizarlos para marketing?
- ¿cuánto tiempo los guardamos?
- ¿qué proveedor los recibe?

## 3. Primera capa informativa

Junto al formulario debe mostrarse información clara suficiente o una primera capa con acceso fácil a la política completa.

Revisa que incluya, según el caso:

- responsable;
- finalidad;
- base jurídica;
- destinatarios;
- transferencias;
- derechos;
- enlace a información adicional.

## 4. Consentimientos separados

No utilices una única casilla para:

- aceptar condiciones;
- aceptar privacidad;
- recibir marketing;
- aceptar cesiones opcionales.

Las finalidades deben separarse cuando necesitan consentimiento independiente.

Las casillas de consentimiento no deben estar premarcadas.

## 5. Cookies antes de elegir

Abre la web en una sesión limpia y comprueba qué cookies y scripts se activan antes de pulsar aceptar.

Presta atención a:

- analítica;
- publicidad;
- redes sociales;
- mapas;
- vídeos;
- chat;
- reCAPTCHA;
- A/B testing;
- seguimiento de conversiones.

## 6. Aceptar y rechazar

La guía de la AEPD exige que **aceptar** y **rechazar** se ofrezcan al mismo tiempo, al mismo nivel y con visibilidad equivalente.

Evita patrones como:

- botón grande “Aceptar” y rechazo oculto;
- obligar a entrar en configuración para rechazar;
- colores o tamaños que empujen artificialmente a consentir.

## 7. Retirar el consentimiento

Debe resultar posible cambiar la elección posteriormente.

Incluye un mecanismo accesible para volver a abrir la configuración de cookies o retirar consentimientos.

## 8. Newsletter y marketing

Comprueba:

- base jurídica;
- prueba del consentimiento cuando proceda;
- texto de alta;
- segmentación;
- bajas;
- lista de supresión;
- proveedor utilizado.

La LSSI exige respetar reglas específicas para comunicaciones comerciales electrónicas.

## 9. Proveedores

Haz inventario de todos los terceros cargados por la web.

Para cada uno revisa:

- función;
- datos;
- cookies;
- rol;
- contrato;
- subencargados;
- país;
- transferencias.

## 10. Prueba periódica

Cada cambio de marketing o tecnología puede alterar el cumplimiento.

Repite la auditoría cuando:

- añades un píxel;
- instalas un plugin;
- cambias CMP;
- incorporas chat;
- cambias analítica;
- añades reservas;
- conectas un CRM.

## Fuentes oficiales

- Guía de cookies AEPD: https://www.aepd.es/guias/guia-cookies.pdf
- LSSI: https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758
- RGPD: https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa
- LOPDGDD: https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673

**Revisado el 24/09/2026.**
    `
  },
  {
    slug: 'protocolo-brechas-datos-personales-72-horas',
    category: 'proteccion-datos' as const,
    title: 'Protocolo de brechas de datos: primeras 72 horas',
    excerpt:
      'Checklist interno para contener, investigar, documentar y decidir si una brecha debe notificarse a la AEPD y a las personas afectadas.',
    tags: ['brecha', '72 horas', 'AEPD', 'ciberseguridad', 'incidente', 'RGPD'],
    updatedAt: '24 sep 2026',
    readTime: '8 min',
    seoTitle: 'Protocolo de brechas de datos y 72 horas | EXPERT Docs',
    seoDescription:
      'Pasos para gestionar una brecha de datos personales: contención, análisis de riesgo, notificación AEPD, afectados y registro interno.',
    body: `
## Fase 1 — Detectar y escalar

Registra inmediatamente:

- fecha y hora;
- quién detecta;
- sistema afectado;
- descripción;
- responsable interno;
- proveedor implicado, si existe.

No esperes a tener toda la investigación cerrada para escalar internamente.

## Fase 2 — Contener

Según el incidente:

- deshabilita cuentas;
- cambia credenciales;
- revoca sesiones;
- bloquea accesos;
- aísla dispositivos;
- retira enlaces públicos;
- informa al proveedor;
- conserva logs y evidencias.

Evita destruir información que pueda ser necesaria para investigar.

## Fase 3 — Determinar si hay datos personales

Identifica:

- qué datos;
- cuántas personas;
- qué categorías;
- si estaban cifrados;
- si el tercero pudo acceder;
- si se descargaron o solo quedaron expuestos;
- duración de la exposición.

## Fase 4 — Evaluar el riesgo

Analiza las posibles consecuencias para las personas.

Ejemplos:

- fraude;
- suplantación;
- pérdida económica;
- discriminación;
- daño reputacional;
- pérdida de confidencialidad;
- exposición de salud;
- riesgo físico;
- acceso a cuentas.

Documenta la valoración y sus motivos.

## Fase 5 — Decidir si hay que notificar a la AEPD

Si es probable que la brecha suponga un riesgo para los derechos y libertades, el artículo 33 RGPD exige notificación sin dilación indebida y, a ser posible, dentro de las **72 horas** desde que el responsable tiene constancia.

Si se supera ese plazo, la notificación debe incluir los motivos del retraso.

La notificación puede realizarse de forma escalonada cuando no sea posible facilitar toda la información al mismo tiempo.

## Fase 6 — Valorar comunicación a afectados

Si es probable que exista **alto riesgo**, revisa el artículo 34 RGPD.

La comunicación debe explicar en lenguaje claro:

- naturaleza de la brecha;
- contacto;
- posibles consecuencias;
- medidas adoptadas o propuestas.

## Fase 7 — Registrar siempre

Incluso si decides no notificar, conserva:

- hechos;
- efectos;
- análisis;
- decisión;
- medidas correctivas;
- responsables;
- fechas.

El artículo 33.5 obliga a documentar las brechas de datos personales.

## Fase 8 — Cerrar causa raíz

Después del incidente:

- identifica la causa;
- corrige;
- revisa permisos;
- cambia procesos;
- forma al equipo;
- revisa al proveedor;
- comprueba copias;
- añade controles.

No cierres el expediente únicamente porque el acceso dejó de estar expuesto.

## Herramientas AEPD

- Asesora Brecha: https://www.aepd.es/guias-y-herramientas/herramientas/asesora-brecha
- Comunicación de brechas: https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/comunicacion-de-brechas-de-datos
- Notificación: https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/brechas-de-datos-personales-notificacion

## Fuentes oficiales

- RGPD, artículos 33 y 34: https://eur-lex.europa.eu/eli/reg/2016/679/oj/spa
- AEPD — brechas de datos: https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/brechas-de-datos-personales-notificacion

**Revisado el 24/09/2026.**
    `
  }
];