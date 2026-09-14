# RU-1 — checklist de release `/ru`

Última actualización: 2026-09-13

## Principio de despliegue

La publicación RU se hace en dos fases independientes:

1. **Visibilidad** — `NEXT_PUBLIC_RU_ENABLED=true` con `NEXT_PUBLIC_RU_INDEX_ENABLED=false`.
2. **Indexación** — activar `NEXT_PUBLIC_RU_INDEX_ENABLED=true` solo después del smoke test de producción.

Mientras ambos flags permanezcan `false`, el código RU puede estar fusionado en `main` sin hacer públicas ni indexables las rutas.

## Gate automático P0

Debe estar verde antes de cualquier activación:

- [ ] GitHub Actions: `npm ci`.
- [ ] TypeScript: `npm run typecheck`.
- [ ] ESLint: `npm run lint`.
- [ ] Vitest completo: `npm test`.
- [ ] Tests i18n: locales, rutas ES/RU/EN y 10 rutas RU permitidas.
- [ ] Gate de visibilidad separado del gate de indexación.
- [ ] canonical + hreflang ES/RU + `x-default`.
- [ ] selector de idioma persiste cookie y `profiles.preferred_language` cuando hay sesión.
- [ ] formularios/leads preservan locale y atribución.
- [ ] precios RU se derivan del catálogo canónico; no existen productos/priceIds RU paralelos.
- [ ] grafía `Holded` protegida frente a transliteraciones rusas conocidas.
- [ ] identidad pública EXPERT procede de `config/identity.ts`.
- [ ] Kia recibe `preferred_language`; idioma no cambia nacionalidad, residencia ni jurisdicción.
- [ ] Vercel `app` en verde: este check ejecuta el build Next.js de producción.
- [ ] Vercel `ksenia-expert` en verde: segundo build/deployment de control.

> El build de producción se valida mediante los dos checks Vercel obligatorios. No se duplica `npm run build` en GitHub Actions mientras ese build dependa del entorno de despliegue de Vercel.

## Smoke test con RU visible y `noindex`

Activar primero solo `NEXT_PUBLIC_RU_ENABLED=true`.
Mantener `NEXT_PUBLIC_RU_INDEX_ENABLED=false`.

### Rutas RU

- [ ] `/ru`
- [ ] `/ru/holded`
- [ ] `/ru/plany`
- [ ] `/ru/uslugi`
- [ ] `/ru/academy`
- [ ] `/ru/autonomo`
- [ ] `/ru/sl`
- [ ] `/ru/nalogi`
- [ ] `/ru/verifactu`
- [ ] `/ru/konsultatsiya`
- [ ] slug RU desconocido devuelve 404.

### Navegación y responsive

- [ ] desktop: header, selector, CTAs y tarjetas sin overflow.
- [ ] móvil: navegación, selector, tarjetas y footer utilizables.
- [ ] cambiar RU → ES conserva la intención semántica de la ruta.
- [ ] EN aparece deshabilitado mientras `NEXT_PUBLIC_EN_ENABLED=false`.

### SEO pre-indexación

- [ ] páginas RU devuelven `noindex,nofollow`.
- [ ] `/sitemap.xml` no contiene rutas RU todavía.
- [ ] canonical de cada RU apunta a sí misma.
- [ ] hreflang enlaza ES/RU y `x-default` a ES.

### Conversión

- [ ] CTA Holded lleva al producto/flujo canónico existente, sin producto RU duplicado.
- [ ] CTA plan mensual lleva al plan ES/canónico correspondiente.
- [ ] autónomo y SL conservan el producto/precio canónico.
- [ ] Academy conserva el programa canónico.
- [ ] login/auth siguen funcionando sin prefijo RU y sin cambios de callback.
- [ ] checkout Stripe mantiene los mismos priceIds existentes.
- [ ] lead de prueba RU aparece en Admin con `locale=ru`, origen, campaña/intención cuando correspondan.

### KIA

- [ ] usuario/perfil con `preferred_language=ru` recibe respuesta RU.
- [ ] nombres oficiales españoles se mantienen cuando corresponda.
- [ ] `Holded` no se traduce ni translitera.
- [ ] no se infiere nacionalidad/residencia/jurisdicción por idioma.

### Identidad y compliance

- [ ] `info@expertconsulting.es` visible donde corresponde.
- [ ] teléfono/WhatsApp `+34 669 04 55 28`.
- [ ] Holded Solution Partner / Asesoría Holded acreditada con copy canónico.
- [ ] `Colaborador social de la Agencia Tributaria` sin insinuar aval institucional.
- [ ] Academy descrita como formación privada/no reglada.
- [ ] `/ru/verifactu` diferencia SIF, VERI*FACTU y NO VERI*FACTU y mantiene los plazos 2027 documentados.

## Activación de indexación

Solo después de completar el smoke test anterior:

1. `NEXT_PUBLIC_RU_INDEX_ENABLED=true`.
2. desplegar producción.
3. verificar que `/sitemap.xml` contiene las 10 rutas RU.
4. comprobar `robots` index/follow en RU.
5. comprobar canonical/hreflang en producción.
6. confirmar analítica/leads RU en Admin durante las primeras conversiones.

## Rollback

Rollback funcional inmediato, sin DDL ni corrección de datos:

1. `NEXT_PUBLIC_RU_INDEX_ENABLED=false`.
2. `NEXT_PUBLIC_RU_ENABLED=false`.
3. redesplegar.

No requiere rollback de base de datos porque RU-004…RU-009 no crean un catálogo financiero paralelo ni reescriben históricos financieros.
