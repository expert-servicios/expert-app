# Reconstrucción laboral y conciliación en KIA

Estado: pautas del copiloto y comprobación de líquido incorporadas al código; no equivale a habilitar escrituras, conectar una empresa o validar nóminas reales.

## Secuencia operativa

1. Resolver la empresa por identificador fiscal y ámbito autorizado. Separar contacto CRM de usuario autenticado; nunca crear un usuario ficticio ni invitar al cliente para salvar una limitación técnica.
2. Inventariar originales por empleado: contrato, transformaciones, anexos con vigencia, nóminas, IDC y modelo 145. Guardar referencias privadas y huellas; no copiar identificadores personales, documentos o credenciales al repositorio.
3. Reconstruir contrato y antigüedad por separado. Mantener contradicciones explícitas entre documento contractual, TGSS y nómina. Distinguir horas al mes de horas a la semana y detener extrapolaciones cuando vence un anexo.
4. Verificar convenio, categoría, jornada, grupo documental, tarifa AT/EP, pagas y retención. Una autorización para simular con un grupo provisional no valida ese grupo para emitir o presentar cotizaciones.
5. Ejecutar una vista previa de un trabajador representativo antes de extender cambios. Comparar bruto, bases, deducciones, IRPF, cuotas empresariales y neto; comprobar contrato, antigüedad y parcialidad en el resultado.
6. Guardar únicamente el estado realmente obtenido: simulación, borrador, aprobado, contabilizado y pagado son hitos distintos. Un estado del proveedor no sustituye evidencia bancaria. Un líquido cero, negativo o no interpretable requiere revisión, no implica necesariamente que la nómina sea ilegal.
7. Registrar pendientes con ámbito de empresa, procedencia, responsable y criterio de cierre. Usar una clave estable por operación para evitar duplicados y preservar eventos previos; nunca cerrar tareas solo porque terminó el turno de KIA.

## Grupo y cálculo mensual

La [regla de TGSS sobre ajuste mensual](https://www.seg-social.es/descarga/es/Reglas_control_bases_ajuste_mensual) contempla grupos diarios con indicador de salario mensual. Calcular 30 días no transforma jurídicamente un grupo 8–11 en 7. Las excepciones de tramos, tiempo parcial, fijo discontinuo e incidencias deben comprobarse antes de extrapolar.

Conservar para cualquier prueba: grupo documental, grupo de simulación, autorización, periodo, motivo técnico, resultado y tarea para regularizar. No manipular ocupación o cotización para forzar una coincidencia de neto.

## Piloto interno sin registro del cliente

Las tareas admiten `company_id` sin `client_id`. El esquema actual de `cases` exige un cliente registrado y la creación de expedientes valida `profile_companies`. No atribuir el expediente al profesional como si fuera el cliente ni insertar valores nulos eludiendo esa restricción.

Hasta implementar y probar expedientes internos de empresa, conservar el dossier privado y tareas de empresa como trabajo pendiente; no afirmar que existe un expediente canónico completo. Una coincidencia de correo con otro nombre CRM requiere conciliación de identidad, no una fusión automática.

La conexión Holded se realiza con la autoridad [company-scoped existente](holded-credential-authority.md), credencial cifrada y permisos explícitos `laborEmployeesRead` / `laborPayrollsRead`. Una sesión abierta de Holded, un conector MCP o un registro de empresa no acreditan conexión de KIA. Verificar identidad de empresa, acceso profesional, lectura de empleados/contratos/nóminas y aislamiento antes de invitar al cliente. No copiar claves entre integraciones ni añadir permisos globales como atajo.

## Criterios de cierre del piloto

- Plantilla, administrador separado, documentos y periodos conciliados.
- Sin diferencias materiales sin resolver ni grupos provisionales pendientes.
- Nóminas comparadas por todos los componentes, sin tratar una proyección del mes anterior como emisión.
- Conexión real de la empresa y pruebas de aislamiento verificadas.
- Tareas, evidencia y estado visibles desde el ámbito interno correcto; ningún correo o invitación implícitos.
- Acceso del cliente solo cuando el profesional lo autorice tras estas comprobaciones. No prometer una validación del 100 % sin pruebas concretas.
