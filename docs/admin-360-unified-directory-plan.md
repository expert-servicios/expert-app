# Admin 360 — Directorio unificado y Vista Cliente delegada

Fecha: 2026-09-22

## Decisión de modelo

Para evitar seguir mezclando conceptos, el Admin utilizará estas definiciones:

- **Usuario / perfil**: identidad de acceso a EXPERT. Vive en `auth.users` + `profiles`.
- **Cliente**: condición comercial/operativa. Puede tener o no acceso al portal.
- **Empresa / entidad**: sujeto fiscal/mercantil. Vive en `companies`.
- **Vínculo persona ↔ empresa**: `profile_companies`.
- **Lead**: prospecto anterior a convertirse en cliente/usuario.

No se inferirá que una empresa sin usuario no es cliente. Tampoco se creará un usuario artificial únicamente para poder operar una empresa.

## Objetivo

Reducir las pantallas duplicadas de Usuarios / Clientes / Empresas y convertir Cliente 360 en el cockpit operativo principal.

### Directorio 360

Nueva vista única con personas y empresas, buscables y filtrables por:

- persona / empresa;
- cliente / staff;
- con o sin acceso al portal;
- activa / inactiva;
- con o sin entidad vinculada;
- con Holded;
- con suscripción;
- con expedientes activos.

Las pantallas legacy se mantienen durante la transición para no romper enlaces ni flujos.

### Vista Cliente delegada para Admin

El Admin necesita ver y operar el contexto del cliente sin cambiar su identidad de sesión.

**No se implementará suplantación real de Auth.**

En su lugar se crea una vista delegada dentro de `/admin/clientes/[id]/portal`:

- conserva la sesión y permisos de Admin;
- usa el mismo cliente y entidad activa como contexto;
- muestra lo que necesita el cliente y accesos de gestión equivalentes;
- todas las acciones sensibles siguen pasando por endpoints Admin y audit logs;
- se muestra una banda visible de “Modo Admin / Vista cliente”.

Ventajas:

- no se generan sesiones del cliente;
- no se confunden auditorías;
- no se pueden atribuir acciones del Admin al cliente;
- no se saltan permisos/RLS del portal por accidente.

### Company 360

Una empresa debe poder administrarse aunque todavía no tenga usuario vinculado.

Primera prioridad: Holded company-scoped.

Ruta prevista:

`/admin/empresas/[companyId]/integraciones`

Debe permitir conectar el tenant Holded de una empresa sin exigir `profile_companies`.

## Roadmap Cliente 360

### Fase A — identidad y acceso

1. Directorio 360.
2. Vista Cliente delegada.
3. Company 360 mínimo.
4. Holded company-scoped sin owner obligatorio.
5. Vincular/desvincular persona ↔ empresa explícitamente.
6. Selector de entidad consistente en todo Cliente 360.

### Fase B — completar IMP-025/027/028

7. Timeline 360 con filtro entidad / expediente / canal.
8. Centro de comunicaciones completo.
9. Inventario documental normalizado.
10. Tareas y próximos pasos en la ficha.
11. Acciones rápidas contextuales.
12. Contenido completo de emails disponibles y adjuntos autorizados.

### Fase C — facturación y control

13. Stripe attempts + suscripciones + facturas por entidad.
14. Conciliación visual Stripe ↔ order ↔ Holded invoice.
15. Alertas de checkout abandonado / pagos fallidos.
16. Integraciones con permisos y errores por entidad.

### Fase D — productividad

17. Búsqueda global ampliada a persona, empresa, CIF/NIF, Stripe y Holded.
18. Filtros persistentes.
19. Historial de acciones de staff.
20. Exportación de resumen 360.

## Reglas de seguridad

- Sin auto-fusión de personas/empresas.
- Sin reescritura de históricos financieros.
- Posibles duplicados Stripe/Holded → revisión manual.
- Credenciales siempre cifradas y server-side.
- Todo acceso delegado mantiene identidad del Admin.
- Toda acción sensible debe ser company-scoped cuando aplique.
- DDL solo mediante migración y Security Advisor posterior.

## Caso de aceptación inmediato

INVERSIONES PASO SEGURO, S.L.U. debe poder:

1. existir y ser operable aunque no tenga usuario vinculado;
2. aparecer en Directorio 360;
3. abrir su gestión Holded desde Admin;
4. conectar tenant con autorización laboral;
5. permitir a KIA diagnosticar Oksana sin crear un usuario ficticio.
