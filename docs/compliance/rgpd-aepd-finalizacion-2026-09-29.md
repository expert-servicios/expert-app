# Cierre técnico RGPD / AEPD / IA — EXPERT

Fecha de revisión: 29/09/2026

## 1. Alcance

Este documento registra el cierre técnico de la revisión de privacidad, cookies, KIA/IA, integraciones de productividad y firma electrónica en EXPERT.

No sustituye:
- la aprobación humana del Registro de Actividades de Tratamiento (RAT);
- la revisión jurídica de contratos/DPA de proveedores;
- la decisión documentada sobre DPD;
- la decisión documentada sobre EIPD;
- el análisis de riesgos y su firma;
- la revisión periódica de transferencias internacionales.

## 2. Marco normativo revisado

- Reglamento (UE) 2016/679 (RGPD), especialmente arts. 5, 6, 12–22, 24, 25, 28, 30, 32, 33–35 y 44–49.
- Ley Orgánica 3/2018 (LOPDGDD), texto consolidado.
- Ley 34/2002 (LSSI-CE), especialmente art. 22 para cookies/tecnologías de almacenamiento y comunicaciones.
- Guía AEPD sobre cookies: aceptar/rechazar al mismo nivel y consentimiento previo para tecnologías no exentas.
- Reglamento (UE) 2024/1689 (Reglamento de IA), transparencia al interactuar con sistemas de IA.
- Normativa de consumidores/ADR aplicable; eliminación de referencias a la antigua plataforma ODR europea.
- Reglas específicas de firma según el trámite: Google eSignature solo cuando el nivel jurídico sea suficiente; certificado reconocido/AutoFirma cuando corresponda.

## 3. Cambios implementados

### 3.1 Cookies y analítica

Antes:
- GTM, GA4 y Metricool se cargaban en `app/layout.tsx` al entrar en la web.

Después:
- `components/privacy/CookieConsent.tsx` controla la carga.
- GTM, GA4 y Metricool se cargan únicamente tras aceptar medición opcional.
- Rechazar y aceptar se muestran al mismo nivel.
- La preferencia caduca a los 24 meses.
- El usuario puede reabrir la configuración desde el footer.
- Al retirar consentimiento se eliminan cookies analíticas propias conocidas y se recarga la página para detener carga futura.
- reCAPTCHA se trata separadamente como mecanismo de seguridad por formulario; debe seguir revisándose su uso real.

### 3.2 Política de privacidad

Actualizada para reflejar:
- responsable y roles responsable/encargado;
- categorías reales de datos;
- finalidades y bases jurídicas;
- KIA como asistente de IA;
- revisión humana y ausencia de decisiones jurídicas autónomas por defecto;
- Gmail, Calendar, Drive, Meet/notas y Microsoft 365;
- Google eSignature;
- Supabase producción en `eu-west-2` (Londres);
- proveedores tecnológicos principales;
- transferencias internacionales por mecanismo aplicable;
- conservación por finalidad, no un único plazo genérico;
- derechos RGPD con plazo de un mes y posible ampliación de dos meses;
- cookies/analítica alineadas con comportamiento real.

### 3.3 Términos y contratación

Actualizados para:
- incluir KIA/automatización y revisión humana;
- diferenciar firma electrónica simple de certificado reconocido;
- eliminar la antigua plataforma ODR como canal operativo;
- alinear IVA con la presentación comercial actual;
- reflejar catálogo prioritariamente de servicios puntuales y presupuestos/calculadoras;
- evitar presentar suscripciones como modalidad ordinaria cuando no formen parte del catálogo actual.

### 3.4 Google eSignature

Nueva guía visual:
- `/docs/firma-google-esignature`.

Documenta:
- preparación de PDF/Google Doc;
- apertura de eSignature;
- firmantes y campos;
- solicitud;
- seguimiento;
- PDF final y auditoría;
- descarga desde KIA/EXPERT;
- límite: KIA no puede lanzar hoy la solicitud por API, por lo que ese clic sigue siendo humano;
- diferencia con AutoFirma/certificado reconocido.

### 3.5 RAT y herramienta interna

`RgpdWorkspace` incluye ahora tratamientos específicos:
- KIA e IA;
- Google Workspace / Microsoft 365;
- firma electrónica y evidencias.

## 4. Política de KIA respecto de privacidad

KIA:
- se identifica como asistente virtual;
- minimiza datos enviados a herramientas;
- no debe pedir credenciales/secretos;
- no expone prompts internos;
- consulta evidencia real antes de afirmar que una acción o firma se completó;
- escala acciones sensibles;
- permite revisión humana;
- no debe autodeclarar a EXPERT “conforme al RGPD” ni cerrar tareas que requieran aprobación humana.

## 5. Pendientes humanos obligatorios

### Dirección / jurídico
- [ ] Aprobar RAT.
- [ ] Aprobar matriz de conservación.
- [ ] Firmar análisis de riesgos.
- [ ] Documentar decisión DPD.
- [ ] Documentar decisión EIPD.
- [ ] Aprobar límites definitivos de KIA por categoría de datos.

### Proveedores
- [ ] Archivar DPA y subencargados de Supabase.
- [ ] Archivar DPA de Vercel.
- [ ] Revisar Stripe.
- [ ] Revisar Resend.
- [ ] Revisar Google Workspace/Cloud.
- [ ] Revisar Microsoft 365.
- [ ] Revisar Holded.
- [ ] Revisar proveedores de IA configurados.
- [ ] Documentar mecanismo de transferencia internacional por proveedor.

### Operativa
- [ ] Simular ejercicio de derechos.
- [ ] Simular brecha.
- [ ] Revisar MFA y accesos.
- [ ] Probar restauración de backup.
- [ ] Revisar aviso previo de notas/transcripción de reuniones.
- [ ] Validar comportamiento real de cookies en navegador limpio tras despliegue.

## 6. Evidencia recomendada

Carpeta `RGPD/`:
1. RAT
2. Riesgos
3. EIPD
4. DPA proveedores
5. Transferencias
6. Políticas públicas
7. Encargos/contratos
8. Personal/confidencialidad
9. Derechos
10. Brechas
11. Seguridad
12. Cookies
13. IA/KIA
14. Firma electrónica
15. Auditorías y revisiones

## 7. Criterio de producción

La parte técnica puede considerarse lista cuando:
- CI, Vercel y tests están verdes;
- cookies opcionales no cargan antes de aceptar;
- las páginas legales publicadas coinciden con la arquitectura;
- KIA identifica su naturaleza de IA;
- la guía de firma está publicada;
- no hay regresiones de autenticación, pagos, expedientes o documentos.

El cumplimiento organizativo no se considera cerrado hasta completar los pendientes humanos del apartado 5.
