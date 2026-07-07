# Reporte de Mejoras de Calidad y Robustez Backend

## Contexto

Se realizo una mejora integral sobre los modulos de Dashboard, analisis de platos, descuentos, empleados, reportes PDF, manejo de errores y soporte arquitectonico. El objetivo fue acercar el backend a un nivel mas robusto para evolucionar hacia un producto SaaS, respetando una restriccion importante del proyecto: algunas entidades deben mantenerse anemicas por decision/estado arquitectonico del equipo.

## Resultado General

Estado alcanzado:

```txt
SaaS-ready parcial / robustez intermedia-alta
```

Validacion:

```txt
dotnet test PanComido.sln
293 tests ejecutados correctamente
0 fallidos
```

## 1. IA Real vs Fallback Local

### Problema Detectado

El sistema podia mezclar recomendaciones generadas por IA con respuestas locales de respaldo, generando riesgo de que el negocio tomara decisiones comerciales creyendo que el analisis siempre provenia de IA.

### Mejora Aplicada

Se separo explicitamente el origen del analisis:

- `ia`: analisis generado por servicio IA.
- `fallback_local`: analisis generado por reglas internas.
- `desconocida`: valor defensivo por compatibilidad.

Tambien se agrego informacion para indicar si el analisis viene de cache.

### Archivos Modificados

- `backend/PanComido.Dominio/CasosDeUso/Dashboard/ObtenerAnalisisPlatoCasoDeUso.cs`
- `backend/PanComido.Dominio/Entidades/IA/PlatoAnalisisIa.cs`
- `backend/PanComido.Presentacion/DTOs/Dashboard/PlatoAnalisisDto.cs`
- `backend/PanComido.Presentacion/Mappers/Dashboard/PlatoAnalisisMapper.cs`
- `backend/PanComido.Tests/Dominio/CasosDeUso/Dashboard/ObtenerAnalisisPlatoCasoDeUsoTest.cs`

### Resultado

El fallback local ya no se guarda como cache de IA y se informa al frontend mediante campos explicitos:

```ts
fuenteAnalisis
esFallbackLocal
analisisProvieneDeCache
mensajeFallback
```

## 2. Proteccion de Informacion Tecnica en Fallback IA

### Problema Detectado

Cuando el servicio de IA fallaba, el mensaje tecnico de la excepcion podia terminar expuesto en la respuesta funcional.

### Mejora Aplicada

El detalle tecnico queda en logs, pero al frontend se devuelve un mensaje seguro:

```txt
No se pudo obtener analisis de IA en este momento.
```

### Archivos Modificados

- `backend/PanComido.Dominio/CasosDeUso/Dashboard/ObtenerAnalisisPlatoCasoDeUso.cs`
- `backend/PanComido.Tests/Dominio/CasosDeUso/Dashboard/ObtenerAnalisisPlatoCasoDeUsoTest.cs`

## 3. Politica Configurable para Descuentos

### Problema Detectado

Las reglas de descuento estaban hardcodeadas dentro del caso de uso:

- descuento maximo
- margen minimo permitido

Esto limita la evolucion a SaaS, donde esas reglas pueden variar por restaurante, plan, configuracion comercial o tenant.

### Mejora Aplicada

Se creo una politica de descuento configurable y se inyecto mediante servicio.

Valores por defecto:

```txt
PorcentajeDescuentoMaximo = 80
MargenMinimoPermitido = 20
```

La configuracion queda preparada para leerse desde:

```json
{
  "Dashboard": {
    "PoliticaDescuento": {
      "PorcentajeDescuentoMaximo": 80,
      "MargenMinimoPermitido": 20
    }
  }
}
```

### Archivos Agregados

- `backend/PanComido.Dominio/Entidades/Dashboard/PoliticaDescuentoDashboard.cs`
- `backend/PanComido.Dominio/Interfaces/Servicios/IPoliticaDescuentoDashboardServicio.cs`
- `backend/PanComido.Infraestructura/ServiciosExternos/Dashboard/PoliticaDescuentoDashboardConfiguracion.cs`
- `backend/PanComido.Infraestructura/ServiciosExternos/Dashboard/PoliticaDescuentoDashboardServicio.cs`

### Archivos Modificados

- `backend/PanComido.Dominio/CasosDeUso/Dashboard/AplicarDescuentoCasoDeUso.cs`
- `backend/PanComido.Presentacion/Program.cs`
- `backend/PanComido.Tests/Dominio/CasosDeUso/Dashboard/AplicarDescuentoCasoDeUsoTest.cs`

### Resultado

El caso de uso ya no depende de constantes internas. Para evolucionar a politicas por restaurante, solo se debe cambiar la implementacion de `IPoliticaDescuentoDashboardServicio`.

## 4. Transaccion para Aplicar Descuento

### Problema Detectado

Aplicar descuento modificaba el precio del plato y luego actualizaba el estado de la sugerencia IA. Si una de esas operaciones fallaba, podia quedar informacion inconsistente.

### Mejora Aplicada

Se agrego un servicio de transaccion de persistencia para ejecutar ambas operaciones como una unidad.

### Archivos Agregados

- `backend/PanComido.Dominio/Interfaces/Servicios/ITransaccionPersistenciaServicio.cs`
- `backend/PanComido.Infraestructura/Persistencia/TransaccionPersistenciaServicio.cs`

### Archivos Modificados

- `backend/PanComido.Dominio/CasosDeUso/Dashboard/AplicarDescuentoCasoDeUso.cs`
- `backend/PanComido.Presentacion/Program.cs`
- `backend/PanComido.Tests/Dominio/CasosDeUso/Dashboard/AplicarDescuentoCasoDeUsoTest.cs`

### Resultado

La actualizacion de precio y la marca de sugerencia aplicada quedan protegidas por transaccion.

## 5. Validaciones de Descuento con Reglas de Negocio

### Problema Detectado

El descuento podia dejar precios invalidos o margenes peligrosos para el negocio.

### Mejora Aplicada

Se agregaron validaciones:

- descuento mayor a `0`
- descuento menor o igual al maximo configurado
- precio original valido
- precio final mayor a `0`
- margen final mayor o igual al minimo configurado

### Archivos Modificados

- `backend/PanComido.Dominio/CasosDeUso/Dashboard/AplicarDescuentoCasoDeUso.cs`
- `backend/PanComido.Presentacion/Controllers/DashboardController.cs`
- `backend/PanComido.Tests/Dominio/CasosDeUso/Dashboard/AplicarDescuentoCasoDeUsoTest.cs`

## 6. Contrato de Error Mas Robusto

### Problema Detectado

El backend devolvia errores con formatos distintos segun el origen:

- strings sueltos
- `ModelState` default de ASP.NET
- `ErrorResponseDto` simple
- mensajes tecnicos en algunos casos

Esto dificulta el manejo consistente desde el frontend.

### Mejora Aplicada

Se amplio `ErrorResponseDto`:

```csharp
public string Error { get; set; }
public string Code { get; set; }
public string TraceId { get; set; }
public IDictionary<string, string[]>? Details { get; set; }
```

### Archivos Modificados

- `backend/PanComido.Presentacion/DTOs/ErrorResponse/ErrorResponseDto.cs`
- `backend/PanComido.Presentacion/GlobalExceptionHandler.cs`
- `backend/PanComido.Presentacion/Program.cs`
- `backend/PanComido.Presentacion/Controllers/DashboardController.cs`
- `backend/PanComido.Presentacion/Controllers/ReporteController.cs`

### Resultado

El frontend puede leer errores mediante un contrato mas estable:

```ts
error.error
error.code
error.traceId
error.details
```

## 7. Validacion Global de ModelState

### Problema Detectado

Algunos controllers validaban manualmente `ModelState`, devolviendo estructuras distintas.

### Mejora Aplicada

Se configuro `ApiBehaviorOptions.InvalidModelStateResponseFactory` para devolver `ErrorResponseDto` uniforme en validaciones.

### Archivos Modificados

- `backend/PanComido.Presentacion/Program.cs`
- `backend/PanComido.Presentacion/Controllers/EmpleadoController.cs`

### Resultado

Las validaciones de DTOs ahora devuelven:

```json
{
  "error": "La solicitud contiene datos inválidos.",
  "code": "validation_error",
  "traceId": "...",
  "details": {
    "Campo": ["Mensaje de error"]
  }
}
```

## 8. Empleado: Value Objects para Rol y Estado

### Problema Detectado

Existia una clase de constantes de empleado en el dominio que funcionaba como utilitario, pero no expresaba correctamente el concepto de dominio.

### Mejora Aplicada

Se reemplazo por Value Objects:

- `RolEmpleado`
- `EstadoEmpleado`

Estos encapsulan:

- valores validos
- normalizacion
- igualdad por valor
- construccion controlada

### Archivos Agregados

- `backend/PanComido.Dominio/ValueObjects/RolEmpleado.cs`
- `backend/PanComido.Dominio/ValueObjects/EstadoEmpleado.cs`

### Archivos Eliminados

- `backend/PanComido.Dominio/Entidades/EmpleadoConstantes.cs`

### Archivos Modificados

- `backend/PanComido.Dominio/CasosDeUso/EmpleadoCasosDeUso/CrearEmpleadoCasoDeUso.cs`
- `backend/PanComido.Dominio/CasosDeUso/EmpleadoCasosDeUso/ModificarEmpleadoCasoDeUso.cs`
- `backend/PanComido.Infraestructura/Persistencia/Repositorios/EmpleadoRepositorio.cs`
- `backend/PanComido.Presentacion/Mappers/EmpleadoMapper.cs`
- `backend/PanComido.Presentacion/DTOs/Empleado/CrearEmpleadoRequestDto.cs`
- `backend/PanComido.Presentacion/DTOs/Empleado/ModificarEmpleadoRequestDto.cs`
- `backend/PanComido.Tests/Dominio/CasosDeUso/EmpleadoCasosDeUso/CrearEmpleadoCasoDeUsoTest.cs`
- `backend/PanComido.Tests/Dominio/CasosDeUso/EmpleadoCasosDeUso/ModificarEmpleadoCasoDeUsoTest.cs`

### Nota Arquitectonica

La entidad `Empleado` se mantiene anemica por restriccion del proyecto. La mejora se implemento mediante Value Objects, mappers y validaciones, evitando forzar una refactorizacion que podria romper la arquitectura existente.

## 9. Validaciones de DTOs de Empleado

### Problema Detectado

Los DTOs de empleado aceptaban datos demasiado debiles para un entorno productivo.

### Mejora Aplicada

Se agregaron validaciones:

- `Nombre`: requerido, 2 a 120 caracteres
- `Email`: requerido, formato email, maximo 160 caracteres
- `Contrasenia`: minimo 8, maximo 128
- `Rol`: valor permitido por dominio
- `Estado`: valor permitido por dominio

### Archivos Modificados

- `backend/PanComido.Presentacion/DTOs/Empleado/CrearEmpleadoRequestDto.cs`
- `backend/PanComido.Presentacion/DTOs/Empleado/ModificarEmpleadoRequestDto.cs`
- `backend/PanComido.Presentacion/Mappers/EmpleadoMapper.cs`

## 10. Reportes PDF con Fechas Tipadas y Rango Seguro

### Problema Detectado

Los reportes recibian fechas como texto y dependian de parseos manuales.

### Mejora Aplicada

Se cambiaron los parametros a `DateOnly` y se agregaron reglas:

- fechas requeridas
- `fechaInicio <= fechaFin`
- rango maximo de 366 dias

### Archivos Modificados

- `backend/PanComido.Presentacion/Controllers/ReporteController.cs`

### Resultado

Los endpoints esperan:

```http
GET reporte/dashboard/pdf?fechaInicio=2026-07-01&fechaFin=2026-07-07
GET reporte/ventas/pdf?fechaInicio=2026-07-01&fechaFin=2026-07-07
```

## 11. PDF: Separacion de Componentes

### Problema Detectado

El generador PDF concentraba demasiada responsabilidad en un unico archivo.

### Mejora Aplicada

Se separaron componentes visuales reutilizables del PDF.

### Archivos Agregados

- `backend/PanComido.Infraestructura/ServiciosExternos/PdfComponentes.cs`

### Archivos Modificados

- `backend/PanComido.Infraestructura/ServiciosExternos/QuestPdfGeneradorServicio.cs`

## 12. Dashboard: Consulta de Mozos Mas Segura

### Problema Detectado

El calculo de minutos promedio podia depender de una traduccion fragil de Entity Framework/Npgsql al calcular diferencias de fechas dentro de SQL.

### Mejora Aplicada

Se dejo el agregado principal en base de datos, pero el calculo de minutos se hace en memoria trayendo solo columnas necesarias.

### Archivos Modificados

- `backend/PanComido.Infraestructura/Persistencia/Repositorios/DashboardRepositorio.cs`

### Resultado

Menor riesgo de error runtime por traduccion del provider y mejor control sobre el calculo.

## 13. Registro de Dependencias

### Mejora Aplicada

Se registraron nuevas dependencias en DI:

- `ITransaccionPersistenciaServicio`
- `IPoliticaDescuentoDashboardServicio`
- configuracion `Dashboard:PoliticaDescuento`

### Archivos Modificados

- `backend/PanComido.Presentacion/Program.cs`

## 14. Estado Final

### Fortalezas Actuales

- Mejor separacion entre IA real, cache y fallback local.
- Reglas comerciales de descuento protegidas.
- Operacion critica de descuento transaccional.
- Contrato de errores mas estable.
- Validaciones de empleado mas fuertes.
- Reportes con fechas seguras.
- Mayor test coverage en dashboard y empleados.
- Value Objects incorporados sin romper la restriccion de entidad anemica.

### Pendientes Recomendados

- Evolucionar `IPoliticaDescuentoDashboardServicio` para cargar politicas por restaurante/tenant desde base de datos.
- Agregar tests de integracion reales con PostgreSQL para queries complejas de dashboard.
- Estandarizar progresivamente todos los controllers antiguos que todavia puedan devolver errores manuales no enriquecidos.
- Revisar warnings de nullability y conflictos de versiones de EF Core.
- Agregar trazabilidad funcional para acciones comerciales sensibles.

## 15. Verificacion

Comando ejecutado:

```bash
dotnet test PanComido.sln
```

Resultado:

```txt
Passed: 293
Failed: 0
Skipped: 0
```

Advertencias observadas:

- Warnings de nullability preexistentes.
- Conflicto de versiones de `Microsoft.EntityFrameworkCore.Relational` entre dependencias.

Estas advertencias no bloquearon la suite, pero conviene atenderlas antes de un despliegue productivo real.
