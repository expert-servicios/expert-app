# EXPERT — Protocolo terminológico RU/ES

Versión: 13/10/2026. **La versión rusa debe explicar conceptos a un usuario rusohablante sin ocultar el nombre que verá en España.**

- Primera mención: explicación clara en ruso seguida del término oficial español entre paréntesis: «расчётный лист по зарплате (nómina)», «система социального страхования (Seguridad Social)».
- Menciones siguientes: usar denominación corta si es inequívoca. Para modelos, preservar «Modelo 036», «Modelo 714», «EX-11», «TIE», «NIE», «IRPF», «IVA».
- No mezclar conceptos: salario vs nómina, NIE vs TIE, Seguridad Social vs Hacienda, expediente vs resolución, Registro Mercantil vs Registro de la Propiedad.
- Si el título de producto oficial se conserva en español, encabezarlo con descripción rusa o incluir glosa, según legibilidad.
- Traducciones deben mantener exactamente alcance, importe, periodicidad, requisitos, sujetos y procedimiento de ES; nunca añadir afirmaciones normativas no verificadas.
- La traducción de servicios debe actualizar título, resumen, incluidos, excluidos, documentación, FAQ, CTA, email, cálculo y metadatos; no basta con la introducción.
- Los servicios periódicos excluidos del catálogo puntual no vuelven a activarse por traducirse.
- KIA utiliza glosario en respuestas, blog, base de conocimientos y propuestas comerciales. Si no hay equivalencia segura, conservar español y marcar para revisión.
- Control de QA: detectores de vocablos ES sin glosa, pruebas de terminología crítica, revisión editorial ES/RU y gates CI/Vercel. El glosario **no es** una traducción automática fiable de textos libres y no debe reemplazar traducciones profesionales por sustitución de cadenas.

## Actualización 15/10/2026 — glosario RGPD
- Se han unificado los 30 términos anteriores y 20 conceptos RGPD adicionales en `lib/i18n/ru-es-legal-glossary.ts`. Total: **50 claves únicas**.
- El glosario RGPD `lib/rgpd/ru-legal-glossary.ts` es una vista derivada de la fuente general; prohibido mantener traducciones paralelas.
- Aplicación a KIA: lenguaje ruso natural con término oficial español entre paréntesis en primera mención; ejemplos: ответственный за обработку данных (responsable del tratamiento), обработчик (encargado del tratamiento), реестр операций обработки (registro de actividades de tratamiento, RAT), оценка воздействия (evaluación de impacto relativa a la protección de datos, EIPD).
- La fuente canónica también alimenta el glosario visible en la herramienta, artículos, servicio y los títulos del informe PDF RU; QA pendiente para todos los textos narrativos de páginas y widget KIA.
- Pendiente: ampliar a todas las familias fiscales, laborales, administrativas y mercantiles mediante entradas individualmente contrastadas. No introducir traducciones libres sin revisión jurídica.
- Gate CI: `tests/i18n/ru-es-legal-terminology.test.ts` comprueba unicidad e identidad entre maestro y vista RGPD.
- **No declarar QA completo**: test de compilación y vistas móviles, legibilidad PDF RU y terminología contextual permanecen sujetos a validación.
