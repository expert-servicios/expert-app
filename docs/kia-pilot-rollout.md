# KIA — piloto contextual de clientes

Fecha: 22/09/2026.

## Regla de idioma

KIA responde siempre en el idioma de la **última pregunta/mensaje del usuario**.

Prioridad:
1. idioma detectado en el último mensaje;
2. si el mensaje es neutro o no permite detectar idioma, `profiles.preferred_language`;
3. fallback: español.

Ejemplo:
- usuario pregunta en ruso → KIA responde en ruso;
- siguiente pregunta en español → KIA cambia inmediatamente a español;
- no se arrastra el idioma de mensajes anteriores.

## Pilotos iniciales

### Viacheslav Konov — nacionalidad de Ruslana
Objetivo:
- contexto de expediente;
- firmas;
- documentos;
- tasa;
- próximos pasos;
- fuentes oficiales;
- guías/doc;
- servicio ya contratado, por lo que KIA no debe hacer venta repetitiva del mismo servicio.

Readiness:
- perfil EXPERT existente;
- expediente estructurado;
- caso id disponible;
- idioma variable ES/RU;
- apto para piloto app cuando esté desplegada la capa contextual.

### Josep — suscripción mensual
Objetivo:
- onboarding;
- empresa activa;
- Holded;
- cobertura del plan;
- pagos/suscripción;
- próximos pasos.

Readiness:
- perfil EXPERT existente;
- empresas vinculadas;
- tenant del perfil actualmente nulo: permitido para contexto personal, pero company ownership debe revalidarse;
- apto tras completar tools de suscripción/pagos.

### Ilya Ovchinnikov / INVERSIONES PASO SEGURO
Objetivo:
- migración laboral;
- empleados;
- documentos;
- formación;
- Holded;
- estado de tareas.

Readiness actual:
- empresa existe;
- no existe todavía vínculo `profile_companies` para el contacto;
- NO generar enlace contextual hasta crear/verificar identidad EXPERT y pertenencia a empresa.

### DISEÑO GLOBAL MERIDIANO
Objetivo:
- renovaciones de permisos de residencia;
- documentación;
- vencimientos;
- representación;
- estado de cada expediente.

Readiness actual:
- no se ha localizado todavía empresa/perfil/case estructurado en EXPERT bajo ese nombre;
- NO generar enlace contextual hasta completar onboarding/migración del cliente.

## Gate para mostrar CTA KIA

Un email puede mostrar «Hablar con KIA sobre este expediente» solo si:
- existe `profile_id` verificado;
- el perfil está activo;
- para case context: case.client_id coincide con profile_id;
- para company context: existe `profile_companies`;
- el token contextual se ha creado server-side;
- la ruta contextual está desplegada;
- KIA puede consultar el estado actual de la entidad;
- el piloto está habilitado.

Si falla cualquier condición, el correo se envía normalmente sin CTA contextual.

## Piloto

Orden:
1. Viacheslav — app contextual;
2. Josep — app contextual tras payments/subscription tools;
3. Ilya — tras vinculación de identidad;
4. DISEÑO GLOBAL — tras estructurar perfil/company/cases;
5. Telegram solo después de vinculación explícita.

## Criterios de éxito

- KIA usa el nombre correcto;
- cambia ES/RU por último mensaje;
- conoce el expediente correcto;
- no cruza clientes/empresas;
- muestra estado actual, no el estado antiguo del email;
- puede dar guía/doc/artículo y fuentes oficiales;
- ofrece servicios solo si detecta una necesidad nueva real;
- agradece acciones completadas;
- escala a persona cuando corresponde;
- feedback del piloto queda registrado.
