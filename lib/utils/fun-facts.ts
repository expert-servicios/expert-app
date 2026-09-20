const facts = [
  'España tiene más de 3,3 millones de autónomos. ¡Eres parte de una comunidad enorme que mueve la economía del país!',
  'El 62% de las pymes españolas que digitalizan su gestión contable recuperan más de 5 horas semanales de trabajo administrativo. Eso son 260 horas al año... o 32 días completos.',
  'La palabra "empresa" viene del latín medieval "imprehendere" — que significa atreverse a emprender. Así que si tienes una empresa, eres, por definición, una persona valiente.',
  'Hacienda procesa más de 22 millones de declaraciones de IRPF cada campaña. De todas ellas, el 70% resulta a devolver. ¿Revisaste bien tus deducciones?',
  'El Régimen Beckham (Ley de Impatriados) permite tributar a un tipo fijo del 24% en lugar de hasta el 47%. David Beckham lo usó al fichar por el Real Madrid en 2003. Buen precedente.',
  'Una Sociedad Limitada puede constituirse con un capital desde 1 €. Mientras capital y reserva legal no alcancen 3.000 €, se aplican salvaguardas legales específicas.',
  'El plazo de prescripción fiscal en España es de 4 años. Después de ese período, Hacienda ya no puede reclamar deudas de ejercicios anteriores. Por eso conservar facturas durante ese tiempo es fundamental.',
  'Holded tiene más de 80.000 empresas usando su plataforma en España. Los clientes que migran desde Excel o programas de escritorio reportan un ahorro medio del 40% en tiempo de gestión contable.',
  'El modelo 303 de IVA se presenta 4 veces al año. En 2025, la AEAT recibió más de 18 millones de liquidaciones de IVA. La puntualidad en los pagos te evita recargos de entre el 5% y el 20%.',
  'Las empresas con contabilidad ordenada y al día tienen un 35% más de probabilidades de obtener financiación bancaria en condiciones favorables. Los bancos también leen balances.',
  'El arraigo social vigente exige, con carácter general, 2 años de permanencia continuada en España y acreditar vínculos familiares con medios económicos o integración social.',
  'Los sistemas informáticos de facturación sujetos al RRSIF deberán estar adaptados antes del 1 de enero de 2027 para contribuyentes del Impuesto sobre Sociedades y antes del 1 de julio de 2027 para el resto de obligados del artículo 3.1.',
  'España tiene convenios para evitar la doble imposición con más de 90 países. Esto significa que si pagas impuestos en otro país, puedes deducirlos en tu declaración española. La globalización también tiene ventajas fiscales.',
  'El certificado digital tiene una vida útil de 2-3 años. Renovarlo antes de que caduque te evita tener que pasar de nuevo por la verificación de identidad presencial. Ponlo ya en el calendario.',
  'La cuota reducida de nuevos autónomos tiene requisitos y vigencia propios. El importe de 80 €/mes estaba fijado para 2023–2025; para altas posteriores hay que comprobar el importe oficial vigente antes de presupuestar.',
  'El Impuesto sobre Sociedades no tiene un único tipo aplicable a todas las SL. En 2026 conviven el 25% general, tipos específicos para microempresas y entidades de reducida dimensión y el 15% para determinadas entidades de nueva creación; hay que clasificar la entidad antes de calcular.',
  'Los emprendedores en España dedican de media 120 horas al año a tareas administrativas y fiscales que podrían delegar. A 50 €/hora de coste de oportunidad, son 6.000 € de valor perdido cada año.',
  'El 85% de los expedientes de extranjería que se presentan correctamente en el primer intento se resuelven en el plazo legal. La documentación completa marca la diferencia.',
  'Una empresa bien organizada digitalmente vale entre un 20% y un 40% más en una operación de compraventa que una similar con contabilidad desordenada. Tu gestión de hoy es la valoración de mañana.',
  'En España, el 94% de las empresas son microempresas (menos de 10 empleados). El reto no es crecer rápido, sino crecer de forma sostenible con la estructura legal y fiscal adecuada desde el principio.',
];

export function getRandomFunFact(): string {
  return facts[Math.floor(Math.random() * facts.length)];
}
