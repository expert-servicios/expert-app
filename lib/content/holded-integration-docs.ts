import type { KnowledgeDoc } from '@/lib/utils/docs';

/** Official Holded source references verified 2026-10-09. */
export const holdedIntegrationDocs: KnowledgeDoc[] = [
  {
    "category": "holded",
    "updatedAt": "9 oct 2026",
    "slug": "conectar-holded-kia-token-api-v2",
    "title": "Cómo crear un token API v2 de Holded y conectarlo con KIA",
    "excerpt": "Pasos para generar un token de Holded, elegir permisos y conectarlo de forma segura a tu empresa en EXPERT.",
    "tags": [
      "Holded",
      "API v2",
      "token",
      "KIA",
      "conectar",
      "credenciales",
      "токен"
    ],
    "readTime": "5 min",
    "seoTitle": "Conectar Holded con KIA: token API v2 | EXPERT",
    "seoDescription": "Cómo generar un token de Holded y conectarlo a EXPERT App sin compartir credenciales.",
    "body": "## Antes de comenzar\n\n- Selecciona en Holded **la empresa correcta**: cada empresa tiene su propia conexión con EXPERT y sus propios permisos.\n\n- Necesitas un plan de pago o prueba con acceso a API y un usuario con acceso a **Desarrolladores**. El plan Free no da acceso a la API.\n\n- Crea un token exclusivo para esta integración. **No envíes la clave por correo, Telegram, WhatsApp ni a KIA por chat.**\n\n## 1. Genera tu token API v2 en Holded\n\n1. Entra en tu empresa de Holded. Abre el menú de cuenta (arriba a la izquierda) y selecciona **Configuración**.\n\n2. Ve a **Desarrolladores → Credenciales** y pulsa **Agregar API Token**.\n\n3. Pon un nombre descriptivo como *EXPERT KIA — Empresa*. Selecciona **API v2**, no el enlace separado a claves v1 heredadas.\n\n4. Elige permisos por área. Para empezar, selecciona **Lectura** en los módulos que quieras consultar. No necesitas conceder Escritura ni Todo.\n\n5. Crea el token y copia la clave para pegarla en el formulario privado de EXPERT. La clave no debe guardarse en documentos ni compartirse por mensajería.\n\nLos permisos del token **no heredan automáticamente los de tu rol de usuario**. Los módulos disponibles y sus nombres pueden variar según el plan. Consulta [la guía oficial de Holded](https://help.holded.com/es/articles/6896051-como-generar-y-usar-la-api-de-holded).\n\n## 2. Conecta Holded desde tu espacio de EXPERT\n\n1. Entra en [EXPERT App → Integraciones → Holded](https://expertconsulting.es/dashboard/integraciones/holded) e identifica tu empresa activa.\n\n2. Pega el token **solo en el formulario seguro**, pulsa **Verificar conexión** y examina qué lecturas autoriza realmente.\n\n3. Confirma el consentimiento de integración y pulsa **Conectar**. La clave se guarda cifrada; no se muestra completa posteriormente.\n\n4. Pregunta a KIA por facturas o contactos de la empresa activa. Si autorizaste bancos, podrás consultar también las funciones bancarias que EXPERT haya habilitado para tu rol.\n\n## ¿Qué acceso recibe KIA?\n\nKIA puede consultar únicamente datos permitidos por el token, por la empresa activa y por los controles de EXPERT. Si no das acceso a bancos, la consulta de facturas puede seguir funcionando. **Aunque el token tenga permisos de escritura, el conector de EXPERT permanece en modo de solo lectura en esta fase.**\n\n## Más ayuda\n\n- [Qué permisos dar a KIA](https://expertconsulting.es/docs/permisos-holded-kia-lectura-escritura)\n\n- [Actualizar permisos y solucionar errores](https://expertconsulting.es/docs/actualizar-permisos-token-holded-kia)\n\n- [Guía oficial de Holded](https://help.holded.com/es/articles/6896051-como-generar-y-usar-la-api-de-holded)\n\n- [Autenticación de API v2](https://www.holded.com/en-us/developers/authentication)\n\n**No confundir:** la integración Holded de EXPERT App y el conector Holded MCP integrado en ChatGPT o Claude son conexiones independientes."
  },
  {
    "category": "holded",
    "updatedAt": "9 oct 2026",
    "slug": "permisos-holded-kia-lectura-escritura",
    "title": "Permisos para KIA en Holded: facturas, bancos y contabilidad",
    "excerpt": "Qué áreas conceder en el token de Holded, para qué sirve cada lectura y por qué no necesitas dar acceso completo.",
    "tags": [
      "Holded",
      "KIA",
      "permisos",
      "bancos",
      "contabilidad",
      "facturas",
      "nóminas",
      "права доступа"
    ],
    "readTime": "7 min",
    "seoTitle": "Permisos de Holded para KIA: qué activar | EXPERT",
    "seoDescription": "Conoce qué permisos del token Holded v2 necesita KIA para facturas, bancos, pagos y contabilidad.",
    "body": "## El permiso correcto depende de la consulta\n\nNo hay una lista única de permisos obligatorios para todos los clientes. Activa **Lectura** únicamente en las áreas que quieras compartir; el nombre exacto puede variar según los módulos de Holded.\n\n| Necesito que KIA consulte… | Permiso de lectura a valorar |\n\n| --- | --- |\n\n| Facturas y cobros de ventas | Facturas emitidas / Ventas |\n\n| Facturas de proveedores y gastos | Compras / Facturas recibidas |\n\n| Clientes y proveedores | Contactos |\n\n| Impuestos | Impuestos |\n\n| Cuentas contables y asientos | Contabilidad / Plan de cuentas y diario |\n\n| Pagos contabilizados | Pagos / Contabilidad, si existe esa área |\n\n| Cuentas y movimientos bancarios | Bancos / Tesorería |\n\n| Empleados y nóminas | Personal / Nóminas, solo si es necesario y con autorización específica |\n\n## Ejemplos prácticos\n\n- **Solo facturación:** lectura de facturas de venta y compra, y contactos si necesitas identificar clientes o proveedores.\n\n- **Contabilidad:** añade impuestos, cuentas, asientos y pagos si necesitas analizar saldos o preparar propuestas.\n\n- **Conciliación bancaria:** añade bancos y movimientos y las facturas relacionadas. Que aparezca un movimiento conciliado no demuestra por sí solo que una factura específica esté pagada.\n\n- **Laboral:** concede solo los datos laborales necesarios y autoriza separadamente la lectura de empleados o nóminas.\n\n## Lectura no equivale a escritura\n\nEn Holded, un token puede ofrecer Lectura, Escritura o Todo por área. **KIA no recibe derecho automático a modificar datos porque hayas seleccionado Todo:** EXPERT aplica restricciones independientes y mantiene las escrituras contables deshabilitadas actualmente.\n\nEl resultado efectivo depende de los permisos del token, la verificación técnica de las operaciones, la empresa seleccionada, el rol del usuario y la política de EXPERT.\n\nSi falta un permiso, KIA debe indicar **qué área necesita** y enlazar la guía de actualización, sin bloquear consultas de otras áreas ni pedir acceso total.\n\n## Recursos\n\n- [Cómo generar y conectar el token](https://expertconsulting.es/docs/conectar-holded-kia-token-api-v2)\n\n- [Modificar los permisos y solucionar errores](https://expertconsulting.es/docs/actualizar-permisos-token-holded-kia)\n\n- [Guía oficial de Holded](https://help.holded.com/es/articles/6896051-como-generar-y-usar-la-api-de-holded)\n\n- [Referencias de autenticación y scopes](https://www.holded.com/en-us/developers/authentication)"
  },
  {
    "category": "holded",
    "updatedAt": "9 oct 2026",
    "slug": "actualizar-permisos-token-holded-kia",
    "title": "Cambiar permisos del token Holded y solucionar errores de KIA",
    "excerpt": "Cómo actualizar los permisos de una conexión existente y qué hacer ante errores 401, 403, 429 o falta de movimientos.",
    "tags": [
      "Holded",
      "KIA",
      "403",
      "401",
      "429",
      "permisos",
      "solución de problemas",
      "ошибка доступа"
    ],
    "readTime": "6 min",
    "seoTitle": "Actualizar permisos de Holded y resolver errores | EXPERT",
    "seoDescription": "Instrucciones para revisar el token de Holded, actualizar permisos en EXPERT App y resolver fallos de acceso.",
    "body": "## Si KIA te avisa de que falta un permiso\n\n1. Confirma en [el panel de integración de EXPERT](https://expertconsulting.es/dashboard/integraciones/holded) que has seleccionado la empresa correcta.\n\n2. Comprueba qué permiso concreto se necesita: facturas, bancos, movimientos, pagos o nóminas.\n\n3. En Holded, abre **Configuración → Desarrolladores → Credenciales** y localiza el token utilizado para KIA.\n\n4. Revisa y cambia los permisos del token. **Si tu interfaz no permite editarlos**, genera un nuevo token con los permisos deseados y sustituye la conexión a través del formulario seguro de EXPERT.\n\n5. Si sigues usando la misma clave, pulsa **Revisar permisos del token** en el panel de Holded de EXPERT. Así se volverán a comprobar sus capacidades sin que tengas que copiar la clave.\n\n6. Si creaste una clave nueva, reconecta desde tu panel; **no envíes claves al chat ni por correo**.\n\nLos permisos se aplican por empresa. Retirar permisos bloquea esas lecturas, pero no debería afectar a otros módulos concedidos.\n\n## Qué significa cada error\n\n- **403:** acceso denegado para esa operación; verifica el permiso o scope del token.\n\n- **401:** token no válido, caducado o revocado; revisa la credencial y, si procede, sustitúyela con seguridad.\n\n- **429:** límite de peticiones; espera y reintenta. No cambies el token solo por este error.\n\n- **Error temporal de red o API:** no equivale a revocación de permisos; reintenta más tarde.\n\n- **Sin bancos o movimientos:** comprueba tanto los permisos de tesorería como la sincronización bancaria dentro de Holded. Cero movimientos devueltos no demuestra que no haya pagos.\n\n## Integraciones gestionadas por EXPERT\n\nSi ves que la conexión pertenece a una cuenta gestionada por EXPERT Asesoría, solicita a KIA la revisión para **esa empresa concreta**. No sustituyas una credencial de asesoría por el token de otra organización.\n\n## Ayuda y fuentes\n\n- [Guía para generar un token](https://expertconsulting.es/docs/conectar-holded-kia-token-api-v2)\n\n- [Qué permisos necesita KIA](https://expertconsulting.es/docs/permisos-holded-kia-lectura-escritura)\n\n- [Ayuda oficial de Holded](https://help.holded.com/es/articles/6896051-como-generar-y-usar-la-api-de-holded)\n\n- [Documentación de autenticación API v2](https://www.holded.com/en-us/developers/authentication)"
  }
];
