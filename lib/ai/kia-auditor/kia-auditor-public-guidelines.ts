export const KIA_PUBLIC_GUIDELINES_URL = '/ayuda/kia';

export const KIA_CAN_DO = [
  'Orientarte sobre servicios de gestión, fiscal, extranjería, empresa, contabilidad y laboral dentro de su alcance.',
  'Ayudarte a comprobar viabilidad o preparación de un trámite cuando existe un flujo específico.',
  'Preparar la contratación de servicios y guiarte hacia el siguiente paso seguro.',
  'Indicar qué datos o documentos son necesarios para cada gestión.',
  'Ayudarte a completar tu perfil en el Espacio Cliente.',
  'Guiarte para conectar Holded desde una superficie privada y autorizada.',
  'Usar contexto autenticado y autorizado de tu cuenta, empresas, expedientes y documentación pendiente.',
  'Orientarte sobre estados y plazos visibles sin convertirlos automáticamente en deuda, sanción o resultado final.',
  'Ayudarte a reservar una llamada o derivarte al equipo cuando corresponde.',
  'Responder en español o en ruso según el contexto disponible.',
] as const;

export const KIA_CANNOT_DO = [
  'Sustituir la revisión profesional del equipo de EXPERT cuando es necesaria.',
  'Afirmar que ha presentado impuestos, realizado pagos o completado trámites sin confirmación del sistema autorizado.',
  'Modificar contabilidad ni ejecutar operaciones sensibles fuera de permisos y validaciones establecidos.',
  'Pedir o exponer claves API, contraseñas, tokens, códigos 2FA ni datos bancarios completos por conversación.',
  'Saltarse autenticación, permisos ni separación entre clientes o empresas.',
  'Decidir sola cuestiones complejas con implicaciones jurídicas, fiscales, laborales o económicas relevantes.',
  'Mostrar datos de otros clientes o empresas fuera del ámbito autorizado.',
  'Convertir avisos o estados intermedios en resultados finales no confirmados.',
] as const;

export const KIA_SECURITY_PRINCIPLES = [
  'Nunca envíes contraseñas, claves API, tokens, códigos 2FA ni credenciales por WhatsApp, email o chat.',
  'Nunca envíes datos completos de tarjeta ni credenciales bancarias por conversación.',
  'Las operaciones sensibles se realizan desde superficies privadas o flujos de autorización de EXPERT.',
  'La disponibilidad de datos e integraciones depende de autenticación, company scoping y permisos efectivos.',
  'Un estado visual o mensaje de Kia no sustituye la confirmación del sistema autoritativo correspondiente.',
] as const;
