# Gobierno de marca y nomenclatura Holded en EXPERT

Ultima actualización: 2026-09-13

## 1. Regla inmutable sobre la marca Holded

`Holded` es un nombre propio y una marca. En EXPERT debe escribirse siempre exactamente como **Holded**.

Esta regla aplica a web pública, SEO, EXPERT Business Academy, KIA, emails, Telegram, WhatsApp, materiales de formación, propuestas, documentación técnica y traducciones ES/RU/EN.

### Permitido

- `Holded`
- `Holded на русском`
- `Formación Holded`
- `Migración a Holded`
- `Holded Solution Partner`
- `Asesoría Holded acreditada`

### No permitido

- traducir `Holded`;
- transliterar `Holded` a cirílico;
- declinar o adaptar el nombre según el idioma;
- sustituirlo por una traducción descriptiva;
- usar variantes ortográficas o fonéticas.

En ruso, la parte descriptiva se traduce, pero **Holded permanece intacto**.

Ejemplo correcto:

> `Holded на русском — внедрение, обучение и сопровождение.`

## 2. Credenciales oficiales de EXPERT

EXPERT debe comunicar de forma consistente estas dos credenciales:

1. **Holded Solution Partner**
2. **Asesoría Holded acreditada**

No son dos formas alternativas de decir lo mismo. Refuerzan funciones distintas:

- **Holded Solution Partner**: implantación, configuración, migración, formación, acompañamiento e integración de Holded en procesos empresariales.
- **Asesoría Holded acreditada**: prestación profesional de asesoramiento y gestión trabajando dentro del ecosistema Holded.

## 3. Mensaje institucional recomendado

### Español

> **EXPERT — Holded Solution Partner y Asesoría Holded acreditada.**
> Implantación, formación, gestión y acompañamiento profesional para empresas que quieren trabajar y controlar su negocio con Holded.

### Ruso

> **EXPERT — Holded Solution Partner и аккредитованная Asesoría Holded.**
> Внедрение, обучение и профессиональное сопровождение работы бизнеса в Holded.

En ruso puede explicarse el significado de `Asesoría Holded acreditada`, pero el nombre propio `Holded` no se modifica.

## 4. Jerarquía de confianza comercial

En las páginas de la vertical rusa, la secuencia recomendada es:

1. **EXPERT**
2. **Holded Solution Partner**
3. **Asesoría Holded acreditada**
4. **Colaborador social de la Agencia Tributaria**
5. **EXPERT Business Academy — formación privada/no reglada**
6. KIA Copiloto y plataforma EXPERT

Estas credenciales deben reforzar confianza sin sugerir un aval institucional o relación distinta de la realmente existente.

## 5. Fuente de verdad técnica

La nomenclatura de marca y credenciales no debe repetirse como texto libre en decenas de componentes. En implementación debe centralizarse en una configuración de marca.

Ejemplo:

```ts
export const BRAND = {
  expert: 'EXPERT',
  holded: 'Holded',
  holdedSolutionPartner: 'Holded Solution Partner',
  holdedAccreditedAdvisory: 'Asesoría Holded acreditada',
  aeatSocialCollaborator: 'Colaborador social de la Agencia Tributaria'
} as const;
```

Los diccionarios de traducción podrán traducir las frases explicativas, pero no modificar `BRAND.holded`.

## 6. Control de calidad

Antes de publicar contenido RU/EN se debe comprobar automáticamente que:

- no existe transliteración de Holded;
- el token `Holded` mantiene su grafía;
- no se crean productos Stripe diferentes por idioma;
- las credenciales se muestran con la denominación aprobada;
- las traducciones afectan al contexto, no al nombre propio.

Esta regla debe formar parte de tests de contenido/i18n y de las instrucciones de KIA.