# RGPD — arquitectura de consentimiento y proveedores

## Regla técnica

Ninguna medición opcional se carga antes de una decisión afirmativa del usuario.

El estado se conserva en `expert-cookie-consent-v3` y distingue:

- `accepted`: permite GA4, GTM, Metricool y atribución comercial de primera parte;
- `rejected`: no carga esos trackers ni permite que `captureClientAttribution()` escriba sesión/cookie.

Abrir «Configurar cookies» no borra temporalmente el estado vigente. La retirada desde un estado aceptado:

1. guarda `rejected`;
2. elimina cookies analíticas conocidas gestionables desde primera parte;
3. elimina `expert_acquisition_v1` de sessionStorage y `expert_acquisition`;
4. recarga la página para desmontar scripts de terceros ya inyectados.

El fallo de localStorage no bloquea la elección en la sesión actual.

## Trackers

Los trackers no están en `app/layout.tsx`. Se renderizan exclusivamente dentro de `CookieConsent` cuando el estado es `accepted`.

No existe fallback `noscript` de GTM ni píxel de Metricool fuera del consentimiento.

## Atribución comercial

`captureClientAttribution()` comprueba el consentimiento por sí misma. Esto evita que un consumidor futuro de la función eluda accidentalmente el gate del componente `AcquisitionTracker`.

## Proveedores y transferencias

La política pública diferencia proveedor, finalidad y salvaguarda contractual. Para servicios de IA:

- OpenAI: para datos EEE, contrato/DPA con OpenAI Ireland y transferencias ulteriores mediante CCT o decisión de adecuación según el DPA aplicable;
- Anthropic: tratamiento sujeto al DPA contratado y a las salvaguardas internacionales aplicables.

La política no debe prometer una ubicación exclusiva ni una certificación concreta si la configuración/contrato vigente no la acredita.

## Condiciones comerciales

Este cambio no modifica las reglas actuales de contratación, suscripciones, cobro mensual, renovación o cancelación. RGPD/cookies y condiciones comerciales se mantienen como superficies independientes.
