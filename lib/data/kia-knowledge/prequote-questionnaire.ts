export const PREQUOTE_QUESTIONNAIRE = {
  name: 'Cuestionario general previo a presupuesto firme',
  purpose:
    'Recoger solo los datos que cambian el alcance, precio o plazo antes de emitir un presupuesto firme.',
  rules: [
    'No repetir preguntas que ya estén contestadas en el correo, lead, cliente, empresa o expediente.',
    'Agrupar las preguntas pendientes en un solo bloque breve.',
    'Si el usuario prefiere hablar, ofrecer siempre reunión informativa gratuita de 15 minutos: /cita?tipo=consulta-inicial.',
    'En planes mensuales, incluir siempre /planes y el enlace directo al plan recomendado.',
    'No pedir credenciales, contraseñas ni API keys por email, chat o Telegram.',
    'Para autónomo vinculado/económicamente dependiente de una empresa del mismo cliente, con operativa simple y normalmente <=10 facturas/mes, usar la modalidad vinculada del Plan Supervisión 49 €/mes + IVA como referencia. Puede incluir obligaciones fiscales básicas según alcance.',
    'Para una sociedad sencilla que necesita impuestos, usar Plan Avanzado 99 €/mes + IVA como referencia cuando el alcance encaje.',
  ],
  sections: [
    {
      id: 'scope',
      title: 'Actividad y alcance',
      questions: [
        '¿Qué entidades o personas debemos gestionar (SL, autónomos u otras)?',
        '¿Cuál es la actividad principal de cada una?',
        '¿Qué servicios queréis delegar: contabilidad, impuestos, cuentas anuales, laboral, consultas u otros?',
      ],
    },
    {
      id: 'volume',
      title: 'Volumen',
      questions: [
        '¿Cuántas facturas emitidas y recibidas aproximadamente hay al mes por cada entidad/autónomo?',
        '¿Cuántas cuentas bancarias o tarjetas hay que conciliar?',
        '¿Hay empleados, nóminas o colaboradores recurrentes?',
      ],
    },
    {
      id: 'tax',
      title: 'Fiscalidad y complejidad',
      questions: [
        '¿Qué modelos fiscales presenta actualmente cada entidad/autónomo?',
        '¿Hay operaciones intracomunitarias, internacionales, retenciones, alquileres, e-commerce, inventario o regímenes especiales?',
        '¿Existen incidencias, requerimientos, contabilidad atrasada o ejercicios pendientes de cerrar?',
      ],
    },
    {
      id: 'software',
      title: 'Software y Holded',
      questions: [
        '¿Trabajáis ya con Holded? ¿Qué plan/licencia utiliza cada entidad?',
        '¿Está la contabilidad actualizada y conciliada?',
        '¿Necesitáis migración completa de histórico o solo apertura/saldos desde una fecha concreta?',
      ],
    },
    {
      id: 'timing',
      title: 'Inicio y transición',
      questions: [
        '¿Desde qué fecha queréis que EXPERT asuma la gestión?',
        '¿La asesoría actual entregará exportaciones, libros, modelos y documentación de cierre?',
        '¿Hay algún vencimiento inmediato que debamos tener en cuenta?',
      ],
    },
  ],
  monthlyPlanLinks: {
    all: '/planes',
    supervision: '/planes/supervision',
    avanzado: '/planes/avanzado',
    colaborativo: '/planes/colaborativo',
    questionnaire: '/presupuesto/aclaraciones',
    meeting15: '/cita?tipo=consulta-inicial',
  },
} as const;
