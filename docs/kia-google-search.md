# KIA — Gemini + Google Search grounding

Fecha: 30/09/2026

## Objetivo

Usar Gemini como buscador en vivo principal para consultas de KIA que requieran información oficial vigente, manteniendo una cadena de fallback segura:

1. Gemini Interactions API + `google_search`.
2. OpenAI Responses API + `web_search`.
3. Fuentes oficiales estáticas por tema.

## Activación

Variables:

- `OFFICIAL_SEARCH_ENABLED=true`: habilita el bloque de búsqueda oficial.
- `OFFICIAL_GOOGLE_SEARCH_ENABLED=true`: permite Gemini Google Search.
- `GEMINI_API_KEY` o `GOOGLE_GENERATIVE_AI_API_KEY`: credencial Gemini.
- `OFFICIAL_GOOGLE_SEARCH_MODEL=gemini-3.8-flash`: modelo de búsqueda.
- `OFFICIAL_SEARCH_TIMEOUT_MS=12000`: timeout acotado.
- `OPENAI_API_KEY`: fallback opcional para OpenAI web search.

## Seguridad y calidad

- El prompt limita la búsqueda a dominios oficiales españoles conocidos.
- KIA no confía solo en la instrucción al modelo: valida las citas devueltas.
- Si Gemini devuelve una mezcla de fuentes oficiales y no oficiales, se descarta por completo el resumen grounded y se continúa con el siguiente fallback.
- Si no hay citas oficiales válidas, no se considera una búsqueda live correcta.
- Nunca se expone la API key en cliente o logs.

## Integración con KIA

`buildOfficialSourceContext()` se ejecuta únicamente cuando `shouldUseOfficialSources()` detecta una consulta fiscal, laboral, mercantil, jurídica, extranjería, DGT, registros, Holded u otra materia regulatoria cubierta.

El contexto resultante incluye:

- resumen de la búsqueda;
- hasta 5 enlaces oficiales;
- reglas explícitas para no inventar plazos, importes, requisitos o documentación.

La búsqueda no sustituye la base regulatoria interna ni el criterio de prioridad de fuentes oficiales; aporta actualización en tiempo real.

## Rollout

1. Confirmar que la variable Gemini está disponible en el proyecto Vercel que ejecuta KIA y en Production.
2. Redeploy para materializar cambios de variables si fueron añadidas después del deployment activo.
3. Validar el health-check `gateway_primary_configured` / pool directo.
4. Ejecutar una consulta de prueba que requiera fuente oficial actual.
5. Verificar que la respuesta muestra únicamente URLs de dominios permitidos.
6. Mantener OpenAI Search como fallback, no como dependencia primaria.
