# KIA — voz y audio

Fecha de diseño: 29/09/2026. Última actualización: 30/09/2026.

## Objetivo

Añadir voz a KIA sin crear un segundo motor de conversación ni saltarse los controles de identidad, permisos, herramientas, trazabilidad y revisión humana ya existentes.

La voz es una modalidad de entrada/salida del mismo KIA.

## Opciones estudiadas

### Opción A — nota de voz + transcripción (fase 1, recomendada)

Flujo:

1. el usuario pulsa el micrófono en el widget;
2. el navegador solicita permiso de micrófono;
3. `MediaRecorder` captura audio;
4. el audio se envía al backend autenticado;
5. OpenAI Speech-to-Text transcribe;
6. el texto transcrito entra por el mismo `POST /api/ai/kia`;
7. KIA responde con las mismas tools/policies del chat escrito;
8. opcionalmente el usuario pulsa “Escuchar” y el backend genera TTS.

Ventajas:
- mismo control de seguridad que texto;
- transcript auditable;
- no mantiene una sesión de audio abierta;
- menor coste y menor complejidad;
- buena compatibilidad móvil/web;
- fácil de usar en ES/RU;
- permite conservar el texto como registro y no el audio bruto.

### Opción B — conversación Realtime/WebRTC (fase 2)

OpenAI ofrece modelos Realtime de audio-in/audio-out y tool use.

Ventajas:
- conversación natural de baja latencia;
- interrupciones y turn-taking más fluidos.

Riesgos/impacto:
- más coste y estado de sesión;
- requiere política explícita de grabación/transcripción;
- debe mantener exactamente las mismas reglas de autorización;
- más difícil de auditar si se intenta ejecutar tools directamente desde una sesión de voz.

Decisión: no activar Realtime hasta validar la fase 1 y tener telemetría real.

### Opción C — voz solo del dispositivo

Web Speech / síntesis local puede variar entre navegador, idioma y plataforma. No se adopta como vía canónica porque no garantiza resultados consistentes ni una transcripción server-side auditable.

## Modelos

La implementación debe permitir configuración por entorno:
- transcripción: `OPENAI_TRANSCRIBE_MODEL` (default recomendado actual: `gpt-4o-mini-transcribe`);
- voz: `OPENAI_TTS_MODEL` (default recomendado actual: `gpt-4o-mini-tts`);
- voz concreta: `OPENAI_TTS_VOICE` obligatoria para activar salida TTS.

No exponer `OPENAI_API_KEY` al navegador.

## Seguridad y privacidad

- Audio máximo configurable; fase 1 limita tamaño y duración práctica.
- El endpoint web exige `Content-Length` válido y rechaza cuerpos sobredimensionados antes de materializar el multipart.
- Rate limit corto por usuario + cuota diaria durable por transcripción/TTS antes de invocar OpenAI.
- `OPENAI_TTS_VOICE` es obligatoria: sin voz configurada, TTS falla cerrado.
- No almacenar audio bruto por defecto.
- Persistir solo:
  - transcript final;
  - duración/tamaño aproximado;
  - canal `voice`;
  - referencia de decisión KIA;
  - idioma detectado.
- No transcribir en el navegador con un proveedor no controlado.
- Si falla transcripción, no ejecutar KIA sobre texto parcial.
- KIA debe indicar que es IA también en voz.
- Si el contenido requiere revisión humana, la modalidad de voz no cambia esa obligación.

## UX fase 1

Widget:
- botón micrófono;
- estado “Escuchando…”;
- botón detener;
- preview del transcript antes de enviar si el usuario lo prefiere;
- fallback a textarea;
- botón “Escuchar” en respuestas de KIA si TTS está configurado;
- accesibilidad: `aria-label`, estados visibles, teclado y no depender solo de color.

## Telegram

Fase 1 también debe aceptar voice notes:
- detectar `message.voice` / `message.audio`;
- descargar el archivo desde Telegram server-side;
- transcribir con el mismo helper;
- procesar el transcript con el mismo motor/policy de Telegram;
- registrar el evento como `voice_inbound`.

No guardar el audio bruto por defecto.

## Fuentes técnicas

- OpenAI audio/realtime models: https://platform.openai.com/docs/models
- OpenAI Platform pricing/audio: https://platform.openai.com/pricing
- MediaRecorder: https://developer.mozilla.org/docs/Web/API/MediaRecorder
- MediaStream Recording API: https://developer.mozilla.org/docs/Web/API/MediaStream_Recording_API

## Criterio de listo

- [x] micrófono implementado con limpieza al cerrar/desmontar/error;
- [x] audio nunca contiene API key en cliente;
- [x] transcripción pasa por endpoint autenticado;
- [x] transcript se deja en preview y luego usa el mismo `/api/ai/kia`;
- [x] TTS es opcional y fail-closed si no hay voz configurada;
- [x] peticiones TTS anteriores se cancelan para evitar voces solapadas;
- [x] no se guarda audio bruto;
- [x] logs no incluyen base64/audio;
- [x] Telegram voice/audio usa el mismo transcriptor detrás de `KIA_TELEGRAM_VOICE_ENABLED`;
- [x] documentos/fotos Telegram no soportados se rechazan o se procesa solo su caption;
- [x] tests de auth/tamaño/tipo/cuotas/regresiones estructurales;
- [ ] activar y validar voz web en producción con usuario real;
- [ ] activar y validar Telegram voice en producción;
- [ ] validación manual final móvil + desktop tras merge.
