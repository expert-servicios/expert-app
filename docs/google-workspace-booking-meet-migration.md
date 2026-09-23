# Migración de Cal.com a Google Workspace: Calendar + Meet + Gemini

Fecha: 2026-09-23  
Estado: aprobado para implementación progresiva  
Ámbito: EXPERT (web pública, onboarding, formación, Academy, Admin y KIA)

## 1. Objetivo

Eliminar Cal.com como dependencia operativa de EXPERT y reutilizar la licencia existente de Google Workspace Business Standard como capa principal para:

- páginas de reserva mediante Google Calendar Appointment Schedules;
- videollamadas mediante Google Meet;
- notas de reuniones mediante Gemini "Toma notas por mí";
- archivo de notas y documentación en Google Drive;
- sincronización de citas, expedientes y tareas con EXPERT/KIA.

La migración no debe borrar ni reescribir citas históricas de Cal.com.

## 2. Decisiones de arquitectura

### 2.1 Google Workspace será el proveedor principal

Para la operativa propia de EXPERT:

- reservas: Google Calendar Appointment Schedules;
- reunión: Google Meet;
- notas: Gemini en Meet;
- documentos de notas: Google Drive;
- estado operativo: Supabase/EXPERT.

### 2.2 EXPERT sigue siendo la fuente operativa

Google gestiona la experiencia de calendario/reunión, pero no sustituye appointments, cases, internal_tasks, documents, auditoría ni permisos de EXPERT.

### 2.3 Cal.com entra en modo legacy

Durante la transición:

- no se crean nuevas dependencias de Cal.com;
- las URLs Google tienen prioridad;
- el webhook de Cal.com se conserva temporalmente para cancelaciones o cambios de reservas antiguas;
- cal_uid histórico no se borra;
- el script global de Cal.com se elimina del sitio público.

El webhook y las variables legacy se podrán retirar cuando no queden reservas futuras originadas en Cal.com.

## 3. Modelo de proveedor

~~~text
BookingProvider
├── google_calendar
└── cal_legacy

MeetingProvider
├── google_meet
└── legacy_external

MeetingNotesProvider
└── google_meet_gemini
~~~

En la primera fase se conserva la API histórica getCal*Url() como alias de compatibilidad para evitar un cambio masivo. Los helpers nuevos getBooking*Url() son la interfaz objetivo.

## 4. Fases

### Fase 1 — Desacoplar la web de Cal.com

1. Añadir URLs completas de Google Appointment Schedules:
   - reunión general;
   - demo;
   - onboarding;
   - formación;
   - Academy.
2. Dar prioridad a Google sobre las variables NEXT_PUBLIC_CAL_*.
3. Hacer que los botones de reserva abran cualquier proveedor externo.
4. Eliminar el JavaScript global de Cal.com de app/layout.tsx.
5. Adaptar /cita:
   - Google: abrir página oficial de reserva;
   - Cal legacy: mantener iframe solo como compatibilidad;
   - sin proveedor: fallback a contacto.

### Fase 2 — Crear agendas Google en Workspace

Configuración manual inicial en info@expertconsulting.es:

- Consulta inicial 15 min;
- Demo Holded;
- Onboarding;
- Formación;
- Entrevista Academy.

Cada agenda debe usar disponibilidad real del calendario, crear Google Meet, tener recordatorios, solicitar solo datos necesarios y activar verificación por email cuando proceda. Stripe dentro de Calendar solo se usará si aporta una ventaja frente al checkout existente de EXPERT.

Las URLs se guardan en Vercel; no se hardcodean.

### Fase 3 — Ingesta de reservas Google

No se debe inferir el formato de un evento de Appointment Schedules sin evidencia real.

Después de crear la primera agenda se capturará un evento de prueba y se documentarán:

- event.id;
- organizador;
- asistentes;
- conference data / Meet;
- título;
- descripción;
- campos del formulario;
- cualquier metadata estable que permita identificar la agenda.

Con esa evidencia se implementará sincronización idempotente hacia appointments.

Objetivo de esquema posterior:

- booking_provider;
- provider_booking_id;
- conservar cal_uid como dato histórico;
- google_event_id como identificador de Calendar;
- evitar deduplicación por email.

### Fase 4 — Gemini Meet → EXPERT

Google Business Standard permite "Toma notas por mí".

~~~text
Reserva
→ Calendar
→ Google Meet
→ Gemini toma notas
→ Google Doc en Drive
→ evento de Calendar enlaza las notas
→ EXPERT detecta documento
→ documents
→ KIA propone:
   - resumen
   - decisiones
   - tareas
   - fechas
   - documentación solicitada
→ revisión humana
→ Cliente 360 / expediente
~~~

Reglas:

- las notas de Gemini son evidencia auxiliar, no fuente jurídica automática;
- KIA no ejecuta decisiones profesionales sensibles solo a partir de notas;
- preservar enlace/ID del documento fuente;
- no duplicar documentos ya archivados;
- respetar consentimiento y configuración de Meet.

### Fase 5 — Retirada completa de Cal.com

Condiciones:

- todas las páginas usan Google;
- todos los emails usan Google;
- onboarding/formación/Academy usan Google;
- no quedan reservas futuras de Cal.com;
- sincronización Google → EXPERT validada;
- cancelación/reprogramación Google validada.

Entonces se retiran el webhook Cal, sus secretos y variables, y los componentes legacy, conservando las referencias históricas.

## 5. Gemini en Meet

Google Workspace Business Standard soporta "Toma notas por mí" en español.

La configuración debe verificarse en Admin Console:

Google Workspace → Google Meet → Configuración de Gemini → Toma de notas con IA.

Las notas generadas se guardan en Drive y, cuando la reunión fue programada desde Calendar, Google las vincula al evento.

Desde septiembre de 2026 Google puede habilitar por defecto la toma automática de notas en determinadas reuniones de Business Standard/Plus; EXPERT debe mantener una política explícita y no depender solo del valor por defecto del proveedor.

## 6. Seguridad y privacidad

- No enviar secretos de Workspace al cliente.
- Domain-Wide Delegation solo con scopes mínimos.
- No ampliar scopes hasta que exista una función concreta que lo requiera.
- No usar contenido de reuniones para cambios fiscales/contables automáticos.
- Mantener confirmación humana para actuaciones profesionales.
- No borrar citas históricas ni referencias cal_uid.
- Los documentos canónicos siguen registrados en EXPERT; Drive puede contener la copia operativa.

## 7. Rollback

Mientras exista la transición:

- si falta una URL Google, el helper puede usar temporalmente el enlace Cal legacy;
- /cita conserva fallback a contacto;
- el webhook Cal permanece activo para eventos históricos;
- no se modifica producción de forma irreversible en la primera fase.

## 8. Criterio de finalización

~~~text
web EXPERT
→ Google Appointment Schedule
→ Meet
→ Gemini notes
→ Drive
→ appointments
→ case/client context
→ tasks/summary
~~~

La migración se considera terminada cuando el flujo anterior funciona sin intervención de Cal.com y sin pérdida de trazabilidad.
