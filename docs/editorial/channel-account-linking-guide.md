# Guía completa de vinculación de canales de publicación y Ads

Fecha: 02/10/2026

## Objetivo

Conectar EXPERT directamente con:

- Facebook Page;
- Instagram Professional;
- Meta Ads;
- LinkedIn personal;
- LinkedIn Organization/Page;
- LinkedIn Ads;
- Google Ads.

La arquitectura es API-first. EXPERT mantiene el contenido, aprobación y calendario; cada plataforma actúa como destino de publicación y fuente de métricas.

---

# 1. Antes de empezar

Necesitas tener acceso administrador a:

- Meta Business Portfolio que contiene la página de Facebook, Instagram y cuenta publicitaria;
- Google Ads y, preferiblemente, una cuenta Manager si vas a solicitar/usar developer token;
- LinkedIn Developer App y permisos sobre tu perfil/página/cuenta publicitaria;
- Vercel del proyecto EXPERT para introducir secretos;
- Admin de EXPERT para probar cada conexión.

No pegues tokens, app secrets ni refresh tokens en GitHub, documentos públicos, Trello o chats. Todos los secretos deben quedar en Vercel/Secret Manager y EXPERT solo almacenará referencias y metadatos no sensibles.

---

# 2. META — Facebook, Instagram y Meta Ads

## Estado actual en EXPERT

**Actualización 02/10/2026:** la configuración Meta ya pasa la prueba read-only del Marketing Hub. Las credenciales están cargadas en Vercel y la versión Graph API está configurada. El siguiente gate no es de credenciales: es poblar el catálogo C2 y validar activos/canales antes de cualquier escritura.

Ya existe:

- cliente Meta Graph API server-side;
- Marketing Hub;
- configuración `META_MARKETING_*`;
- estructura de catálogo;
- tablas de jobs/logs;
- Page ID;
- Instagram Account ID;
- Ad Account ID;
- Business ID;
- Catalog ID;
- Dataset ID.

La integración está todavía en modo fail-closed/read-only. No crea campañas ni publica posts automáticamente.

## 2.1. Comprobar Business Portfolio

1. Entra en Meta Business Suite / Business Settings.
2. Confirma cuál es el Business Portfolio de EXPERT.
3. Comprueba que dentro están:
   - página de Facebook de EXPERT;
   - cuenta profesional de Instagram;
   - cuenta publicitaria;
   - catálogo;
   - dataset/pixel, si se utiliza.
4. Comprueba que tu usuario personal tiene acceso administrador/completo.
5. Anota solo los IDs, no tokens:
   - Business ID;
   - Page ID;
   - Instagram Business Account ID;
   - Ad Account ID;
   - Catalog ID;
   - Dataset/Pixel ID.

## 2.2. Comprobar Instagram

Instagram debe ser Professional (Business o Creator) y estar conectado a la Facebook Page correcta.

Revisar:
1. Instagram > configuración profesional.
2. Cuenta profesional activa.
3. Conectada a la Facebook Page de EXPERT.
4. Dentro de Business Settings debe aparecer como activo asignado al Business Portfolio.

## 2.3. App de Meta

En Meta for Developers:

1. Abre la app que ya utilizas para EXPERT/Ads.
2. No reutilices variables antiguas de WhatsApp.
3. La integración de marketing usa exclusivamente `META_MARKETING_*`.
4. Comprueba App ID y App Secret.
5. Comprueba que la app está vinculada al Business Portfolio correcto.

## 2.4. System User

Para procesos server-to-server conviene mantener System User:

1. Business Settings > Users > System Users.
2. Crear o revisar el System User de EXPERT.
3. Darle acceso a:
   - Page;
   - Instagram account;
   - Ad Account;
   - Catalog;
   - Dataset cuando proceda.
4. Generar token únicamente con los permisos necesarios para las funciones activas.

No sustituir el token de producción sin haber validado primero el nuevo.

## 2.5. Permisos Meta previstos

Para publicación orgánica y gestión:
- páginas: permisos de lectura/gestión/publicación que requiera la versión vigente de Pages API;
- Instagram: lectura básica de cuenta profesional y content publishing;
- Ads: `ads_read`, `ads_management` cuando se habiliten escrituras;
- Business: permisos de lectura/gestión de activos cuando sea necesario;
- catálogo: permisos específicos de Commerce/Catalog cuando se active sincronización.

Los permisos exactos deben validarse contra la versión Graph API configurada antes de activar producción.

## 2.6. Variables en Vercel

Configurar/verificar:

```env
META_MARKETING_ENABLED=false
META_MARKETING_GRAPH_API_VERSION=
META_MARKETING_APP_ID=
META_MARKETING_APP_SECRET=
META_MARKETING_SYSTEM_USER_ACCESS_TOKEN=
META_MARKETING_BUSINESS_ID=
META_MARKETING_CATALOG_ID=
META_MARKETING_AD_ACCOUNT_ID=
META_MARKETING_PAGE_ID=
META_MARKETING_INSTAGRAM_ACCOUNT_ID=
META_MARKETING_DATASET_ID=
```

Mantener `META_MARKETING_ENABLED=false` hasta completar la prueba read-only y los jobs auditables de escritura.

## 2.7. Verificación en EXPERT

Admin > Marketing Hub:

1. Configuración completa: **confirmada 02/10/2026**.
2. “Probar Meta”: **prueba read-only correcta 02/10/2026**.
3. Catálogo/activo responde: **confirmado**.
4. No activar publicación automática todavía.
5. Cuando añadamos publishing:
   - crear post de prueba en estado no público o entorno controlado cuando la API lo permita;
   - guardar ID externo;
   - recuperar ese objeto;
   - confirmar cuenta/página correctas;
   - eliminar/cancelar prueba si procede.

---

# 3. GOOGLE ADS

## Estado actual en EXPERT

Google Ads está contemplado como canal comercial, pero aún no hay cliente Google Ads API dentro del repositorio.

Es independiente de:
- Gemini API;
- Calendar;
- Gmail;
- Drive;
- Google Search.

Tener Google Cloud configurado no significa que Google Ads API ya esté vinculada.

## 3.1. Localizar Customer ID

En Google Ads:

1. Entra en la cuenta publicitaria de EXPERT.
2. Copia el Customer ID de 10 dígitos.
3. Guardarlo sin guiones en la variable/configuración interna.
4. Si utilizas Manager Account (MCC), anota también el Login Customer ID.

## 3.2. Acceso API del proyecto Google Cloud

Desde el 9 de septiembre de 2026 Google Ads API dejó de utilizar Developer Token como mecanismo de acceso. Los niveles de acceso se asignan al proyecto de Google Cloud que posee las credenciales OAuth o la cuenta de servicio.

1. Entra en Google Cloud Console.
2. Selecciona el proyecto que vas a usar para EXPERT Ads.
3. Abre Google Ads API > Overview.
4. Comprueba el nivel de acceso del proyecto:
   - Test;
   - Explorer;
   - Basic;
   - Standard.
5. Para operar con una cuenta de producción, solicita al menos el nivel que permita el uso previsto.
6. Si el proyecto tenía un Developer Token aprobado antes del 09/09/2026, Google pudo migrar automáticamente ese nivel de acceso al proyecto Cloud asociado según su actividad reciente.

No necesitamos crear ni almacenar un nuevo Developer Token.

## 3.3. Google Cloud

Usar el proyecto Cloud que quieras dedicar a EXPERT Ads.

1. Abre Google Cloud Console.
2. APIs & Services.
3. Habilita Google Ads API.
4. Configura OAuth consent screen.
5. Añade el usuario/cuenta permitido si está en modo test.
6. Crea credenciales OAuth 2.0 para aplicación web.

Redirect propuesto:

```
https://expertconsulting.es/api/auth/google-ads/callback
```

## 3.4. Credenciales previstas

```env
GOOGLE_ADS_ENABLED=false
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
GOOGLE_ADS_API_VERSION=
```

El refresh token debe generarse después de autorizar el scope de Google Ads con la cuenta correcta.

## 3.5. Primera prueba

Antes de escritura:

1. autenticar;
2. obtener datos básicos del customer;
3. listar campañas;
4. comprobar moneda y zona horaria;
5. guardar cuenta como `connected`;
6. no crear campañas todavía.

Después:

1. crear campaña de prueba PAUSED;
2. crear budget;
3. crear ad group;
4. crear anuncio de prueba;
5. leerlo;
6. borrarlo o mantenerlo pausado;
7. revisar logs.

---

# 4. LINKEDIN — PERFIL PERSONAL

## Objetivo

Publicar desde el perfil profesional de Ksenia sin Metricool.

## 4.1. Crear LinkedIn Developer App

1. Entra en LinkedIn Developers.
2. Create App.
3. Nombre recomendado: `EXPERT Publishing`.
4. Asociarla a la LinkedIn Page de EXPERT si LinkedIn lo requiere para verificación/productos.
5. Completar logo, política de privacidad y URL.
6. Verificar la página/empresa cuando corresponda.

## 4.2. OAuth

Añadir Authorized Redirect URL:

```
https://expertconsulting.es/api/auth/linkedin/callback
```

Guardar:
- Client ID;
- Client Secret.

## 4.3. Producto para publicación personal

Solicitar/habilitar el producto que permita compartir/publicar mediante la API vigente.

Para publicación desde miembro, el scope tradicional es:

```
w_member_social
```

Cuando LinkedIn cambie productos/scopes, EXPERT debe tomar los scopes autorizados realmente devueltos por OAuth como fuente de verdad.

## 4.4. Identidad

Después del OAuth, EXPERT debe resolver y guardar:
- member/person URN;
- nombre visible;
- scopes;
- fecha de verificación.

Nunca guardar el access token en `social_channel_accounts`; solo referencia al secreto seguro.

## 4.5. Variables

```env
LINKEDIN_ENABLED=false
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://expertconsulting.es/api/auth/linkedin/callback
LINKEDIN_MEMBER_URN=
```

Los tokens OAuth deberán persistirse cifrados/Secret Manager.

---

# 5. LINKEDIN — PÁGINA DE EMPRESA

Si queremos publicar como EXPERT y no como Ksenia:

1. Confirma que existe la página LinkedIn de EXPERT.
2. Comprueba que Ksenia tiene un rol suficiente para publicar.
3. Dentro de la Developer App solicita los productos/permisos de Community Management aplicables.
4. Autoriza los scopes de organización.
5. EXPERT debe resolver:
   - Organization URN;
   - nombre;
   - rol autorizado;
   - scopes.

Variable de referencia:

```env
LINKEDIN_ORGANIZATION_URN=
```

Las publicaciones personales y las de la empresa se consideran dos canales distintos dentro del calendario:
- `linkedin_member`;
- `linkedin_organization`.

---

# 6. LINKEDIN ADS

## 6.1. Cuenta de Campaign Manager

1. Entra en Campaign Manager.
2. Localiza la cuenta publicitaria de EXPERT.
3. Anota el Ad Account ID.
4. Comprueba que tu usuario tiene un rol suficiente para:
   - campañas;
   - creatividades;
   - billing/administración si procede.

## 6.2. Advertising API

En la Developer App:

1. Solicita acceso a Advertising API.
2. Empezar con Development Access para nuestra propia cuenta.
3. Vincular la cuenta de Campaign Manager permitida.
4. Solicitar los scopes correspondientes, normalmente:
   - lectura de Ads/reporting;
   - `rw_ads` para escritura cuando proceda.
5. Esperar aprobación si LinkedIn la requiere.

Variables:

```env
LINKEDIN_ADS_ENABLED=false
LINKEDIN_AD_ACCOUNT_ID=
```

No activar `LINKEDIN_ADS_ENABLED=true` hasta que:
- OAuth funcione;
- cuenta/rol se verifique;
- podamos listar campañas;
- se pruebe una campaña PAUSED.

---

# 7. CALENDARIO EDITORIAL — DECISIÓN DE ARQUITECTURA

## Decisión

El calendario maestro será EXPERT.

Meta Business Suite, LinkedIn y Google Ads no deben ser la fuente canónica.

Razones:

1. necesitamos una vista única multicanal;
2. Meta no controla LinkedIn/Google Ads;
3. cada API trata la programación de forma diferente;
4. EXPERT necesita saber qué contenido estaba aprobado realmente;
5. queremos trazabilidad de errores;
6. métricas y conversiones deben volver a la pieza original;
7. podremos reprogramar/cancelar sin depender de un tercero.

## Modelo

```
social_content_items
        ↓ approved
social_publication_jobs
        ↓ scheduled_at
publisher cron
        ↓
Meta | LinkedIn | Google Ads
        ↓
external_object_id
        ↓
metrics
```

## Vista Admin

Editorial Hub tendrá:

- calendario mensual;
- selector de contenido aprobado;
- canal;
- fecha/hora;
- cuenta conectada;
- estado;
- error;
- cancelación;
- futuro: drag & drop / semana / duplicar pieza / reprogramar.

## Zona horaria

La interfaz trabajará en hora local de administración.

En base de datos, `scheduled_at` se guarda como `timestamptz` UTC.

## Cron

El publisher se ejecutará periódicamente desde Vercel Cron.

Reglas:

1. recuperar jobs `scheduled` vencidos;
2. bloquear por job;
3. confirmar que la pieza sigue aprobada;
4. comprobar consentimiento;
5. comprobar cuenta conectada;
6. publicar;
7. guardar ID externo;
8. marcar `published`;
9. registrar fallo con error;
10. reintento limitado;
11. notificar Admin si falla repetidamente.

No activar el cron de escritura hasta que cada adaptador haya pasado pruebas.

---

# 8. ORDEN RECOMENDADO DE CONEXIÓN

1. Meta read-only — **completado 02/10/2026**.
2. Poblar catálogo C2 y proyectar únicamente servicios realmente ready.
3. Facebook orgánico.
4. Instagram orgánico.
5. Meta Ads.
6. LinkedIn perfil personal.
7. LinkedIn Page.
8. LinkedIn Ads.
9. Google Ads.
10. Publisher Cron.
11. Métricas y atribución.

Motivo: empezar por canales con infraestructura ya avanzada y por publicación orgánica de bajo riesgo.

---

# 9. CHECKLIST QUE DEBE COMPLETAR KSENIA

## Meta

- [ ] Confirmar Business Portfolio.
- [ ] Confirmar Facebook Page.
- [ ] Confirmar Instagram Professional vinculado.
- [ ] Confirmar Ad Account.
- [ ] Confirmar Catalog.
- [ ] Confirmar Dataset/Pixel.
- [ ] Confirmar System User.
- [ ] Revisar permisos y activos asignados.
- [x] Introducir/revisar variables en Vercel.
- [x] Probar Marketing Hub.

## Google Ads

- [ ] Confirmar Customer ID.
- [ ] Confirmar/crear Manager Account si se necesita gestión jerárquica.
- [ ] Confirmar nivel de acceso Google Ads API del proyecto Cloud.
- [ ] Habilitar Google Ads API en Cloud.
- [ ] Crear OAuth Web Client.
- [ ] Añadir redirect.
- [ ] Autorizar cuenta.
- [ ] Obtener refresh token.
- [ ] Probar lectura.

## LinkedIn

- [ ] Confirmar perfil.
- [ ] Confirmar/crear página EXPERT.
- [ ] Crear Developer App.
- [ ] Asociar/verificar página.
- [ ] Añadir redirect OAuth.
- [ ] Solicitar publicación personal.
- [ ] Solicitar Community Management para página si procede.
- [ ] Confirmar Campaign Manager Ad Account.
- [ ] Solicitar Advertising API.
- [ ] Autorizar scopes.
- [ ] Probar perfil.
- [ ] Probar página.
- [ ] Probar Ads read-only.

---

# 10. CRITERIO DE ACTIVACIÓN

Ningún canal puede pasar a publicación automática si no cumple:

- cuenta correcta verificada;
- scopes suficientes;
- secrets server-side;
- lectura correcta;
- prueba de escritura controlada;
- logs;
- manejo de error;
- consentimiento cuando proceda;
- pieza editorial `approved`;
- calendario/job válido.

La conexión técnica y la autorización para publicar son estados diferentes.
