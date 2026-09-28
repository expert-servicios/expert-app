export const PRE_QUOTE_QUESTIONNAIRE = {
  slug: 'presupuesto-aclaraciones',
  title: 'Cuestionario previo a presupuesto firme',
  intro:
    'Usar cuando faltan datos para fijar una cuota o presupuesto definitivo. KIA puede adaptar las preguntas, pero debe conservar estos bloques y evitar repetir datos ya conocidos.',
  meetingUrl: '/cita?tipo=consulta-inicial',
  plansUrl: '/planes',
  sections: [
    {
      id: 'scope',
      title: '1. Estructura y alcance',
      questions: [
        '¿Qué entidades debemos gestionar: sociedad, autónomos u otras?',
        '¿Qué relación existe entre ellas (socios, administradores, autónomos vinculados, etc.)?',
        '¿Queréis una única persona de contacto y una gestión conjunta?',
        '¿Qué servicios queréis delegar exactamente a EXPERT?',
      ],
    },
    {
      id: 'volume',
      title: '2. Volumen real',
      questions: [
        '¿Cuántas facturas emitidas y recibidas hay aproximadamente al mes por cada entidad o autónomo?',
        '¿Cuántos movimientos bancarios mensuales hay aproximadamente?',
        '¿Hay empleados, nóminas o colaboradores?',
        '¿Existe inventario, e-commerce, TPV, varias monedas o integraciones externas?',
      ],
    },
    {
      id: 'tax',
      title: '3. Obligaciones fiscales',
      questions: [
        '¿Qué modelos trimestrales y anuales presenta actualmente cada entidad/autónomo?',
        '¿Hay operaciones intracomunitarias o con terceros países?',
        '¿Existen alquileres sujetos a retención, profesionales con retención u otras obligaciones especiales?',
        '¿Hay operaciones entre socios y sociedad que debamos revisar?',
      ],
    },
    {
      id: 'holded',
      title: '4. Holded y sistema actual',
      questions: [
        '¿Trabajáis ya con Holded? ¿Qué plan/licencia tiene cada entidad?',
        '¿La contabilidad está al día y conciliada?',
        '¿Quién registra actualmente las facturas y movimientos?',
        '¿Queréis seguir introduciendo vosotros la información o delegar más parte del proceso?',
      ],
    },
    {
      id: 'migration',
      title: '5. Cambio de asesoría / migración',
      questions: [
        '¿Desde qué fecha queréis que EXPERT asuma la gestión?',
        '¿Qué software o sistema utiliza la asesoría actual?',
        '¿Necesitáis migrar el histórico completo o solo saldos/apertura desde una fecha?',
        '¿La asesoría saliente puede facilitar libros, modelos presentados, balances y copias de seguridad/exportaciones?',
      ],
    },
    {
      id: 'timing',
      title: '6. Inicio y prioridades',
      questions: [
        '¿Hay algún vencimiento, requerimiento o incidencia urgente?',
        '¿Cuál es vuestra fecha objetivo de cambio?',
        '¿Preferís mensual o anual cuando exista esa opción?',
      ],
    },
  ],
  rules: [
    'No repetir preguntas cuya respuesta ya conste en el email, CRM o expediente.',
    'Para autónomo vinculado/económicamente dependiente de una empresa del mismo cliente, con operativa simple y normalmente <=10 facturas/mes, usar Plan Supervisión 49 €/mes + IVA como referencia salvo complejidad fiscal adicional.',
    'Para sociedad sencilla que necesita impuestos, usar Plan Avanzado 99 €/mes + IVA como referencia cuando el alcance encaje.',
    'Si hay alto volumen, laboral, varias sociedades, inventario, e-commerce u operativa internacional compleja, derivar a Plan Personalizado.',
    'En toda respuesta comercial incluir enlace al plan recomendado, enlace general a /planes y reunión informativa de 15 minutos.',
    'No dar presupuesto firme si faltan datos que puedan cambiar materialmente el alcance.',
  ],
} as const;
