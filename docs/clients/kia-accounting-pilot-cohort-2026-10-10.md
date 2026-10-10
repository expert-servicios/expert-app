# Programa piloto contable de EXPERT + KIA — cohorte 10/10/2026

> **Estado:** REGISTRO DE ALCANCE DOCUMENTADO; no habilita nuevos accesos ni escrituras.  
> **Responsable:** Dirección EXPERT. **Repositorio:** `expert-servicios/expert-app`.  
> **Marco:** `docs/expert-kia-ecosystem-master-plan-2026-10-10.md` (fase E0 activa y secuencia E0→E6; esta nota no modifica los gates).  
> **Confidencialidad:** documento de operación interna; identificadores canónicos, no credenciales, estados bancarios ni datos financieros personales.

## 1. Identidades canónicas verificadas en EXPERT (Supabase, 10/10/2026)

Cinco **sujetos contables**, no seis: EXPERT Asesorías es la plataforma/entorno de servicio; Expert Consulting es el tenant usado para la contabilidad de la empresa propia. Nunca mezclar ambos aunque compartan personal o marca.

| Sujeto piloto | company_id | NIF/CIF | Perfil | Integración de lectura verificada en EXPERT | Caso de uso |
|---|---|---|---|---|---|
| DISEÑO GLOBAL MERIDIANO, S.L. (DGM) | `188a1871-0ea8-4b11-adac-c9acc41c4a4b` | `B42700427` | Sociedad patrimonial con alquileres | Holded V2 activo y `read_only`; `accountingEntries=true`, `accountingAccounts=false` | Arrendamientos, documentos, reconstrucción contable y conciliación por ejercicio; `docs/clients/dgm-accounting-rebuild-2025-2026.md` |
| ALVILS ESP, S.L.U. | `445d6b1b-6970-409c-a0b8-574ae5b3b345` | `B56305501` | Sociedad patrimonial, alquiler de local | Holded V2 activo en lectura; diario y cuentas autorizados | Migración de tenant con origen y destino diferenciados; `docs/clients/alvils-holded-dual-tenant-pilot.md` en PR #713, no fusionada |
| EXPERT ESTUDIOS PROFESIONALES, S.L.U. (marca EXPERT; tenant propio Expert Consulting) | `9382c1ad-2b82-4fca-8473-a77af66d3263` | `B44991776` | Asesoría propia | Holded V2 activo, `expert_account`, lectura contable autorizada | Operativa de despacho, facturas, proveedores, cobranzas, conciliación e historial de asistencia KIA |
| SIGMAKNOT, S.L. (nombre social identificado para «Sit Magnet») | `a97decd7-2008-4354-a8dc-122956dc2b49` | `B93871473` | Sociedad asociada al perfil de Josep | Conexión Holded activa `client_account`, **API sin versión V2 confirmada**; permisos detectados insuficientes (no inferir acceso al diario) | Contabilidad de sociedad comercial, asesoría al cliente y organización documental |
| Josep Sánchez Sánchez, empresario individual | `baf3aad3-2f84-4357-b4ac-d23a55c8d724` | NIF fiscal verificado en ficha EXPERT (no reproducido aquí) | Persona física con actividad propia | **Sin integración Holded activa encontrada** en `client_integrations` | IRPF/IVA del autónomo, facturas y separación de actividad personal/societaria |

**Verificación de vínculo:** las entidades `SIGMAKNOT` y `Josep autónomo` están asociadas al mismo `profile_id` mediante `profile_companies`, con rol `owner` para ambas. Esto **no** autoriza a fusionarlas ni a compartir sus datos, facturas o herramientas de escritura. La denominación informal «Sit Magnet» debe verificarse con la usuaria antes de modificar nombres legales.

**Expresamente separado:** `EXPERT Asesorías` gestiona la operación multiempresa cliente; el tenant contable propio `Expert Consulting` solo contiene EXPERT ESTUDIOS PROFESIONALES, S.L.U. Tampoco debe utilizarse el tenant de laboratorio de ChatGPT/Holded como si fuese el de un cliente.

## 2. Registro de madurez

- `registered`: ficha `companies` ya existente, sin duplicados nuevos.
- `source_linked`: integración contabilizada por entidad, con API, identidad, permisos y estado comprobados en servidor; **no deducir lectura válida solo de configuración**.
- `inventoried`: lectura real de asientos, cuentas, facturas, IVA, bancos y documentos; paginación exhaustiva o cobertura parcial declarada.
- `reconciled`: apertura, saldos, periodos e impuestos contrastados con fuentes verificadas.
- `kia_case_validated`: KIA resuelve consultas con citas a la entidad correcta y medidas de prevención de acceso cruzado.
- `approved_for_write`: requiere permiso explícito, específico, idempotencia, pruebas y auditoría. **Ninguno de estos pilotos queda aprobado para escritura por este documento.**

Al 10/10/2026 todos los pilotos están `registered`; su estado de integración consta en la tabla anterior. No afirmar `inventoried` ni `kia_case_validated` sin una prueba documentada.

## 3. Batería de casos reales (read-only primero)

1. **DGM:** alquileres, facturas, morosidad, acuerdos, retenciones e inmuebles; separar actores arrendatarios y titulares.
2. **ALVILS:** primera apertura y diario reales de Holded; dual-tenant origen/destino, inventario completo, conciliación, reversibilidad y no sustitución de secreto origen. Excel manual anterior excluido.
3. **EXPERT propio:** gastos operativos, ingresos de servicios, facturación y pagos propios; probar que nunca consulta bancos o contabilidad de DGM/ALVILS desde su tenant propio.
4. **SIGMAKNOT:** determinar versión API, identidad del tenant y permisos reales. Solo después diseñar inventario/documentación contable y ejercicios correspondientes.
5. **Josep autónomo:** validar conexión individual y consentimiento; consultas y declaraciones propias separadas de SIGMAKNOT pese a perfil de propietario común.
6. **Prueba transversal de aislamiento:** usuario con dos empresas vinculadas, cambio explícito de empresa activa, revocación, autorización, operaciones admin, historial y no filtrado de credenciales entre tenants.

## 4. Bucle de aprendizaje para KIA

Cada actuación debe producir un registro estructurado de `case_id`/company_id, fecha, actor, empresa activa, herramienta y alcance, dato original consultado, fuente/cita de evidencia, problema, hipótesis, acción autorizada, prueba, resultado, regresión y versión de procedimiento. **No** volcar datos reales sensibles en prompts, tests del repositorio o logs: usar fixtures sintéticos anonimizados para tests, referencias con acceso controlado para pruebas operativas y referencias a Drive/hoja registral por empresa.

- Hechos de una empresa → hoja registral **de esa empresa**, no prompt global.
- Reglas generalizables verificadas → runbook/Operator Lessons reutilizables; incorporar a contexto de KIA **solo tras integración probada**, ya que un documento GitHub por sí solo no da acceso semántico automático.
- Incertidumbre → etiquetar `pending_verification` y conservar referencia; no elevar a hecho fiscal confirmado.
- La autorización genérica de pilotaje no autoriza extraer datos indiscriminadamente, escribir en Holded, enviar mensajes a clientes, modificar impuestos o revelar datos personales. Implementar minimización, propósito y permisos efectivos.

## 5. Puertas y tareas concretas

| Prioridad | Comprobación | Estado al inicio |
|---|---|---|
| P0 | Cerrar pruebas seguridad de la PR #713 y verificar que destino no sobrescribe origen | Pendiente |
| P0 | Verificar lectura REAL del origen ALVILS y saldo de apertura | Pendiente |
| P0 | Resolver acceso fiscal y documental de SIGMAKNOT; comprobar NIF/tenant v2 y consentimiento | Pendiente |
| P0 | Vincular, previa comprobación, Holded individual de Josep y su ficha `company_id` sin interferir con SIGMAKNOT | Pendiente |
| P1 | Asegurar segregación `EXPERT Asesorías` vs. contabilidad propia `Expert Consulting` | Contrato documentado; pruebas pendientes |
| P1 | Auditar accesos y relaciones de `profile_companies` por piloto, autorización/RLS y revocaciones | Parcialmente verificado para Josep |
| P1 | Completar hoja registral, documentos probatorios y correos por compañía, sin trasladar tokens | Pendiente |
| P1 | Diseñar pruebas E2E de KIA con datos representativos y sanitizados; regresiones multiempresa | Pendiente |
| P2 | Promocionar únicamente aprendizajes de procedimiento validados a la guía transversal KIA | Pendiente |

**No crear nuevas filas `companies` para ninguno de estos cinco sujetos:** ya existen y están identificados por CIF/NIF y company_id. Si surge nueva entidad, primero buscar por NIF normalizado y resolver relaciones reales. No deducir que "acceso completo a contabilidad" está efectivamente otorgado sin lectura autenticada en cada integración.

**Fuentes funcionales:** Supabase EXPERT (`companies`, `client_integrations`, `profile_companies`, consulta interna al 10/10/2026); `docs/admin-improvement-plan.md` (caso multi-entidad Josep); `docs/admin-360-compact-redesign-backlog-2026-10-09.md` (tenant EXPERT propio versus EXPERT Asesorías); `docs/kia-pilot-rollout.md` (pilotos contextuales, distinto objetivo); `docs/clients/dgm-accounting-rebuild-2025-2026.md`; piloto ALVILS PR #713.
