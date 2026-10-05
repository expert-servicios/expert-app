# DGM / Alexey / Olga — separación de sujetos registrales

> **Estado:** INTERNAL ONLY · REGLA DE CLASIFICACIÓN
>
> Los tres sujetos comparten comunicaciones, inmuebles y asesores, pero no deben compartir una única memoria histórica.

## 1. Sujetos

### DISEÑO GLOBAL MERIDIANO, S.L.
- NIF: **B42700427**
- sociedad patrimonial;
- CNAE **68.20 / 6820 — Alquiler de bienes inmobiliarios por cuenta propia**;
- cinco viviendas de alquiler identificadas en el proyecto;
- fiscalidad societaria propia: IS, SUMA de sus inmuebles, obligaciones censales y expedientes propios;
- expediente IRNR 2023 / 216-296 pertenece a **DGM**.

### Oleksii / Alexey Batyrev — persona física
- NIE conocido en documentación: **Y3468635L**;
- **residente fiscal en España** para la gestión 2025 revisada;
- obligaciones personales: IRPF, patrimonio inmobiliario personal, SUMA/IBI/basura, seguros, ventas, residencia/extranjería, etc.;
- no mezclar notificaciones personales con DGM aunque lleguen en el mismo hilo.

### Olga Andrianova — persona física
- NIE conocido en documentación: **Y3468632Q**;
- **no residente fiscal** en la gestión revisada;
- obligaciones personales: IRNR Modelo 210 por inmuebles propios/cuotas de titularidad, SUMA/IBI/basura, seguros, ventas, etc.;
- los Modelos 210 personales de Olga no pertenecen a DGM.

## 2. Inmuebles DGM conocidos

Inventario societario documentado:
1. **Alba / Av. Masnou 9–11, 2º I + garaje 8**
2. **Avda. del Norte 40, 1º D**
3. **Almendros 26, 5º E + garaje 11**
4. **Portalet 15, 2º D**
5. **Boreal / C. San Isidro 6 + garaje 45**

La pertenencia jurídica final debe contrastarse con título/IBI/contrato antes de importar como hecho permanente.

## 3. Patrimonio personal Alexey / Olga

El usuario indica que entre ambos podrían existir **aprox. 16 inmuebles**.

**Este número queda como dato pendiente de verificación documental**, no como hecho registral definitivo.

Señales ya localizadas en correo/chats:
- C/ Maestro Serrano — propiedad personal, no DGM;
- propiedades con Modelos 210 de Olga;
- referencias a Masnou 14 con garajes 5 y 7;
- Masnou 9 con garaje;
- San Isidro con garaje;
- otras unidades con recibos SUMA personales.

Algunas direcciones coinciden geográficamente con inmuebles gestionados por DGM; la titularidad debe comprobarse, no inferirse por dirección/nombre.

## 4. Venta Maestro Serrano — ejemplo de separación

Operación personal de Alexey y Olga:
- titularidad: **50 % cada uno**;
- precio total de transmisión: **215.000 €**;
- parte de cada uno: **107.500 €**;
- retención Modelo 211 total: **6.450 €**;
- retención por titular: **3.225 €**.

Tratamiento:
- Alexey: IRPF como residente;
- Olga: Modelo 210 IRNR como no residente.

No registrar esta venta como actividad/operación de DGM.

## 5. Modelos 210 de Olga

Correos de marzo 2025 confirman presentación de declaraciones IRNR Modelo 210 de Olga.

Corrección de nomenclatura comunicada por Leonarda:
- “Masnou 14” con garajes 5 y 7;
- “Masnou 9” debía incluir garaje;
- “San Isidro” también debía incluir garaje.

Esto prueba que existen varios activos personales/unidades accesorias asociados a Olga, pero no permite todavía construir el inventario completo sin revisar las declaraciones/archivos.

## 6. Regla obligatoria para correo y documentos

Cada elemento debe tener:

`subject_scope`
- `dgm`
- `alexey_pf`
- `olga_pf`
- `shared_pf`
- `mixed`
- `unresolved`

Y, si procede:

`asset_scope`
- `dgm:<property_key>`
- `alexey:<property_key>`
- `olga:<property_key>`
- `shared:<property_key>`
- `unknown`

## 7. Criterios de clasificación

### DGM
Asignar a DGM si existe evidencia como:
- CIF B42700427;
- razón social;
- cuenta bancaria DGM;
- contrato donde DGM es arrendador/titular;
- Modelo 200 u obligación societaria;
- SUMA/IBI emitido a DGM;
- póliza cuyo titular es DGM;
- expediente administrativo a nombre de DGM.

### Alexey PF
Asignar a Alexey si:
- notificación está a su NIE/nombre;
- IRPF;
- inmueble o SUMA a su nombre;
- venta/ganancia personal;
- residencia/extranjería;
- seguro personal.

### Olga PF
Asignar a Olga si:
- notificación a su NIE/nombre;
- Modelo 210/IRNR personal;
- inmueble/SUMA a su nombre;
- venta personal;
- residencia/extranjería;
- seguro personal.

### Mixed
Usar `mixed` solo cuando un mismo hilo trate realmente varios sujetos.
Después dividir sus eventos internos por sujeto en lugar de copiar el hilo entero a todas las hojas.

## 8. Regla de comunicación

Un correo dirigido simultáneamente a Alexey, Olga y Leonarda **no se clasifica por destinatarios**.
Se clasifica por:
1. titular jurídico;
2. NIF/NIE de la notificación;
3. inmueble/contrato;
4. impuesto/modelo;
5. cuenta/póliza;
6. expediente.

## 9. Pendiente

- recuperar inventario completo de propiedades personales;
- confirmar número total de inmuebles/unidades y porcentajes;
- cruzar Google Drive/Modelos 210/IRPF/SUMA;
- asignar referencias catastrales;
- construir Hoja Registral separada para Alexey PF;
- construir Hoja Registral separada para Olga PF;
- evitar duplicar en estas hojas los eventos puramente societarios de DGM.
