# Especificación del Backend: Análisis de Platos (API-First)

Este documento detalla la especificación de integración para el backend en C# (ASP.NET Core / Entity Framework Core) para soportar el módulo de **Análisis de Platos** (Cajón de Platos de Baja Rotación) en el Dashboard del Gerente, adaptándose al **modelo de datos existente** sin introducir nuevas tablas o columnas.

---

## 1. Mapeo al Modelo de Datos Existente

Para persistir y procesar la información del análisis sin alterar la estructura de la base de datos de PostgreSQL, utilizaremos las siguientes tablas existentes:

### A. Consulta y Rendimiento Financiero (`GET /analisis-plato`)
* **Datos del Plato**: Se consultan de las tablas `articulo` y `plato` (donde `plato.id_articulo = articulo.id`).
* **Costo de Preparación**: Se calcula de forma dinámica sumando el costo de las materias primas desde `plato_ingrediente` unida con `ingrediente`, `insumo` y el último precio de adquisición registrado en `pedido_insumo`:
  $$\text{Costo Total} = \sum (\text{plato\_ingrediente.cantidad} \times \text{ultimo\_precio\_compra})$$
* **Margen de Ganancia**: Se calcula como:
  $$\text{Margen \%} = \frac{\text{precio\_venta\_final} - \text{Costo Total}}{\text{precio\_venta\_final}} \times 100$$
* **Tendencia Histórica**: Se calcula agrupando las ventas semanales de las últimas 7 semanas a partir de `articulo_comanda.cantidad` donde la `comanda` asociada pertenezca al `restaurante_id` y su estado esté pagado/cerrado.
* **Diagnósticos y Sugerencias de IA**: Se consultan del campo `json` (de tipo `JSONB`) en la tabla `sugerencia_plato_ia` asociada al `restaurante_id`.

### B. Aplicación de Descuentos (`POST /aplicar-descuento`)
* **Persistencia del Descuento**: Se actualiza el campo `precio_promocional` (o directamente `precio_venta_final` según la política comercial del negocio) en la tabla `articulo`.
* **Actualización del Estado de IA**: Se lee el registro de `sugerencia_plato_ia` del restaurante, se modifica la sugerencia de tipo `"descuento"` para este plato a `"aplicada": true` dentro del JSONB, y se vuelve a guardar.

### C. Registro de Tareas/Recordatorios (`POST /agendar-recordatorio`)
* **Persistencia del Recordatorio**: Se inserta una nueva fila en la tabla `notificacion` con:
  - `restaurante_id` = ID del restaurante.
  - `fecha` = `DateTime.UtcNow`
  - `descripcion` = `"Revisión: [NombrePlato] - Medir impacto de: [AccionSugerida]"` (un prefijo estructurado que el dashboard identifica para listar como tarea pendiente).
  - `resuelta` = `false`
* **Actualización del Estado de IA**: Se modifica la sugerencia correspondiente en `sugerencia_plato_ia` del restaurante a `"aplicada": true` dentro del JSONB.

---

## 2. Definición de Endpoints y DTOs

### Endpoint 1: Obtener Detalle de Análisis de Plato
* **Método y Ruta**: `GET /api/gerente/dashboard/analisis-plato`
* **Query Params**: `?nombre={platoNombre}`
* **Response `200 OK` (JSON)**:
```json
{
  "platoId": 10,
  "plato": {
    "nombre": "Papas Fritas",
    "valor": 12,
    "detalle": "$ 4.000"
  },
  "diagnostico": "El precio actual de Papas Fritas está afectando su rotación debido al incremento en el costo de los insumos primarios.",
  "alerta": "critica",
  "metricas": {
    "volumen": "12 u.",
    "volumenVar": "-15% vs mes anterior",
    "costo": "$ 2.000",
    "precio": "$ 4.000",
    "margenPct": "50%",
    "participacion": "2.4%"
  },
  "comparativa": {
    "nombre": "Papas Rústicas",
    "precio": "$ 4.500",
    "ventas": "45 u."
  },
  "tendencia": [18, 16, 15, 14, 12, 10, 12],
  "sugerenciasDetalladas": [
    {
      "id": 1,
      "tipo": "descuento",
      "accion": "Aplicar descuento promocional del 10% por 1 semana.",
      "impacto": "Impacto Medio (+10 u./mes)",
      "dificultad": "baja",
      "esAplicable": true,
      "aplicada": false
    },
    {
      "id": 2,
      "tipo": "combo",
      "accion": "Ofrecer Papas Fritas en combo promocional con Bebida.",
      "impacto": "Impacto Alto (+20 u./mes)",
      "dificultad": "media",
      "esAplicable": true,
      "aplicada": false
    }
  ]
}
```

### Endpoint 2: Aplicar Descuento
* **Método y Ruta**: `POST /api/gerente/dashboard/analisis-plato/aplicar-descuento`
* **Request Body (JSON)**:
```json
{
  "platoId": 10,
  "porcentajeDescuento": 10
}
```
* **Response `200 OK` (JSON)**:
```json
{
  "mensaje": "¡Descuento del 10% aplicado exitosamente!",
  "platoId": 10,
  "precioNuevo": 3600,
  "costo": 2000,
  "margenPctNuevo": "44%"
}
```

### Endpoint 3: Agendar Recordatorio / Tarea Administrativa
* **Método y Ruta**: `POST /api/gerente/dashboard/analisis-plato/agendar-recordatorio`
* **Request Body (JSON)**:
```json
{
  "platoId": 10,
  "accionSugerida": "Ofrecer Papas Fritas en combo promocional con Bebida."
}
```
* **Response `200 OK` (JSON)**:
```json
{
  "mensaje": "Recordatorio agendado para la revisión.",
  "accionItem": {
    "titulo": "Revisión: Papas Fritas",
    "detalle": "Medir impacto de: Ofrecer Papas Fritas en combo promocional con Bebida.",
    "destino": "carta",
    "tono": "info",
    "impacto": "Reevaluar demanda",
    "prioridad": 4
  }
}
```

---

## 3. Esqueleto del Controlador en C# (Ejemplo de Implementación)

A continuación, se presenta una propuesta de implementación para el controlador en el backend (`DashboardController.cs`) utilizando EF Core:

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace PanComido.Presentacion.Controllers;

[ApiController]
[Route("api/gerente/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly PanComidoDbContext _context;

    public DashboardController(PanComidoDbContext context)
    {
        _context = context;
    }

    [HttpGet("analisis-plato")]
    public async Task<IActionResult> GetAnalisisPlato([FromQuery] string nombre)
    {
        // 1. Obtener artículo y plato
        var articulo = await _context.Articulos
            .Include(a => a.Plato)
            .FirstOrDefaultAsync(a => a.Nombre == nombre && !a.Eliminado);

        if (articulo == null || articulo.Plato == null)
            return NotFound("No se encontró el plato especificado.");

        // 2. Calcular costo dinámico de ingredientes
        decimal costoPreparacion = 0;
        var receta = await _context.PlatoIngredientes
            .Where(pi => pi.PlatoId == articulo.Id)
            .ToListAsync();

        foreach (var item in receta)
        {
            // Obtiene el último precio de compra unitario registrado para el insumo/ingrediente
            var ultimoPrecioCompra = await _context.PedidoInsumos
                .Where(pi => pi.InsumoId == item.IngredienteId)
                .OrderByDescending(pi => pi.Pedido.Fecha)
                .Select(pi => pi.PrecioCompra)
                .FirstOrDefaultAsync();

            costoPreparacion += item.Cantidad * (ultimoPrecioCompra > 0 ? ultimoPrecioCompra : 0);
        }

        // 3. Obtener sugerencias de la IA (JSONB)
        var sugerenciaIa = await _context.SugerenciasPlatoIa
            .FirstOrDefaultAsync(s => s.RestauranteId == articulo.RestauranteId);

        // Deserializar y buscar el diagnóstico/sugerencias para este plato particular
        var diagnostico = $"El precio de {articulo.Nombre} puede mejorarse.";
        var alerta = "moderada";
        var sugerencias = new List<PlatoSugerenciaDto>();
        List<int> tendencia = new() { 5, 8, 10, 7, 6, 4, 2 };

        if (sugerenciaIa != null)
        {
            using var jsonDocument = JsonDocument.Parse(sugerenciaIa.Json);
            // Parsear sugerencias del JSONB...
            // (Lógica para mapear el JSON dinámico de IA a los DTOs de salida)
        }

        var response = new PlatoAnalisisDto
        {
            PlatoId = articulo.Id,
            Plato = new DashboardRankingItemDto
            {
                Nombre = articulo.Nombre,
                Valor = 10, // Ventas calculadas del periodo
                Detalle = $"$ {articulo.PrecioVentaFinal:N0}"
            },
            Diagnostico = diagnostico,
            Alerta = alerta,
            Metricas = new MetricasAnalisisDto
            {
                Volumen = "10 u.",
                VolumenVar = "-12% vs mes anterior",
                Costo = $"$ {costoPreparacion:N0}",
                Precio = $"$ {articulo.PrecioVentaFinal:N0}",
                MargenPct = $"{((articulo.PrecioVentaFinal - costoPreparacion) / (articulo.PrecioVentaFinal > 0 ? articulo.PrecioVentaFinal : 1) * 100):N0}%",
                Participacion = "1.8%"
            },
            Comparativa = new ComparativaAnalisisDto
            {
                Nombre = "Plato Líder Categoria",
                Precio = "$ 5.000",
                Ventas = "38 u."
            },
            Tendencia = tendencia,
            SugerenciasDetalladas = sugerencias
        };

        return Ok(response);
    }

    [HttpPost("analisis-plato/aplicar-descuento")]
    public async Task<IActionResult> AplicarDescuento([FromBody] AplicarDescuentoRequest request)
    {
        var articulo = await _context.Articulos.FindAsync(request.PlatoId);
        if (articulo == null)
            return NotFound("Plato no encontrado.");

        // Modificar precio en base de datos
        decimal precioOriginal = articulo.PrecioVentaFinal;
        decimal descuento = precioOriginal * (request.PorcentajeDescuento / 100);
        articulo.PrecioVentaFinal = precioOriginal - descuento;
        
        await _context.SaveChangesAsync();

        // Calcular nuevo margen (simplificado)
        decimal costoMock = 2000; 
        decimal nuevoMargen = ((articulo.PrecioVentaFinal - costoMock) / (articulo.PrecioVentaFinal > 0 ? articulo.PrecioVentaFinal : 1)) * 100;

        return Ok(new AplicarDescuentoResponse
        {
            Mensaje = $"¡Descuento del {request.PorcentajeDescuento}% aplicado exitosamente!",
            PlatoId = articulo.Id,
            PrecioNuevo = articulo.PrecioVentaFinal,
            Costo = costoMock,
            MargenPctNuevo = $"{nuevoMargen:N0}%"
        });
    }

    [HttpPost("analisis-plato/agendar-recordatorio")]
    public async Task<IActionResult> AgendarRecordatorio([FromBody] AgendarRecordatorioRequest request)
    {
        var articulo = await _context.Articulos.FindAsync(request.PlatoId);
        if (articulo == null)
            return NotFound("Plato no encontrado.");

        // Insertar en la tabla de notificaciones existente
        var notificacion = new Notificacion
        {
            RestauranteId = articulo.RestauranteId,
            Fecha = DateTime.UtcNow,
            Descripcion = $"Revisión: {articulo.Nombre} - Medir impacto de: {request.AccionSugerida}",
            Resuelta = false
        };

        _context.Notificaciones.Add(notificacion);
        await _context.SaveChangesAsync();

        return Ok(new AgendarRecordatorioResponse
        {
            Mensaje = "Recordatorio guardado en el módulo de tareas administrativas.",
            AccionItem = new DashboardAccionItemDto
            {
                Titulo = $"Revisión: {articulo.Nombre}",
                Detalle = $"Medir impacto de: {request.AccionSugerida}",
                Destino = "carta",
                Tono = "info",
                Impacto = "Reevaluar demanda",
                Prioridad = 4
            }
        });
    }
}

// --- DTOs auxiliares ---
public class AplicarDescuentoRequest { public int PlatoId { get; set; } public decimal PorcentajeDescuento { get; set; } }
public class AplicarDescuentoResponse { public string Mensaje { get; set; } public int PlatoId { get; set; } public decimal PrecioNuevo { get; set; } public decimal Costo { get; set; } public string MargenPctNuevo { get; set; } }
public class AgendarRecordatorioRequest { public int PlatoId { get; set; } public string AccionSugerida { get; set; } }
public class AgendarRecordatorioResponse { public string Mensaje { get; set; } public DashboardAccionItemDto AccionItem { get; set; } }
public class DashboardAccionItemDto { public string Titulo { get; set; } public string Detalle { get; set; } public string Destino { get; set; } public string Tono { get; set; } public string Impacto { get; set; } public int Prioridad { get; set; } }
public class PlatoAnalisisDto { public int PlatoId { get; set; } public DashboardRankingItemDto Plato { get; set; } public string Diagnostico { get; set; } public string Alerta { get; set; } public MetricasAnalisisDto Metricas { get; set; } public ComparativaAnalisisDto Comparativa { get; set; } public List<int> Tendencia { get; set; } public List<PlatoSugerenciaDto> SugerenciasDetalladas { get; set; } }
public class DashboardRankingItemDto { public string Nombre { get; set; } public int Valor { get; set; } public string Detalle { get; set; } }
public class MetricasAnalisisDto { public string Volumen { get; set; } public string VolumenVar { get; set; } public string Costo { get; set; } public string Precio { get; set; } public string MargenPct { get; set; } public string Participacion { get; set; } }
public class ComparativaAnalisisDto { public string Nombre { get; set; } public string Precio { get; set; } public string Ventas { get; set; } }
public class PlatoSugerenciaDto { public int Id { get; set; } public string Tipo { get; set; } public string Accion { get; set; } public string Impacto { get; set; } public string Dificultad { get; set; } public bool EsAplicable { get; set; } public bool Aplicada { get; set; } }
```
