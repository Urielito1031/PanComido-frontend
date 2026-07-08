import { HttpRequest, HttpResponse, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { of, delay, Observable } from 'rxjs';
import { AvisosResponseDto } from '../../../core/models/dtos/responses/avisos.response';
import { SugerenciaIA } from '../../../core/models/dtos/responses/sugerencia-ia.response';

export const handleAvisosMock = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const method = req.method;
  const url = req.url.toLowerCase();

  if (method === 'GET' && url.includes('/avisos')) {
    const mockResponse: AvisosResponseDto = {
      insumosConStockCritico: [
        {
          id: 1,
          nombre: 'Harina 0000',
          stockActual: 1.5,
          unidadMedida: 'Kg',
          stockMinimo: 15,
          estadoStock: 'Crítico',
          tipo: 'Ingrediente',
          vencimiento: null,
          categoria: 'Secos'
        },
        {
          id: 2,
          nombre: 'Aceite de Girasol',
          stockActual: 2,
          unidadMedida: 'L',
          stockMinimo: 5,
          estadoStock: 'Crítico',
          tipo: 'Ingrediente',
          vencimiento: null,
          categoria: 'Líquidos'
        }
      ],
      insumosConVencimientoProximo: {
        '3': [
          {
            id: 101,
            nombre: 'Leche - Lote 4B',
            insumoId: 3,
            cantidad: 5,
            fechaVencimiento: '2026-07-15',
            bodegaId: 1
          }
        ],
        '4': [
          {
            id: 102,
            nombre: 'Queso Cremoso - Lote 9A',
            insumoId: 4,
            cantidad: 2.5,
            fechaVencimiento: '2026-07-12',
            bodegaId: 1
          }
        ]
      }
    };

    return of(new HttpResponse({ status: 200, body: mockResponse })).pipe(delay(600));
  }

  if (method === 'POST' && url.includes('/avisos/sugerencias-ia')) {
    const mockSugerencia: SugerenciaIA = {
      fechaSugerencia: '2026-07-08',
      platosSugeridos: [
        {
          id: 901,
          nombre: 'Mousse de Queso y Frutillas',
          descripcion: 'Aprovechá la Leche y el Queso Cremoso con vencimiento próximo en un postre de preparación rápida.',
          tiempoPreparacion: 20,
          porcionesPosibles: 8,
          ingredientesSugeridosIA: [
            { insumoId: 3, nombre: 'Leche - Lote 4B', cantidad: 1 },
            { insumoId: 4, nombre: 'Queso Cremoso - Lote 9A', cantidad: 0.5 }
          ]
        }
      ]
    };

    return of(new HttpResponse({ status: 200, body: mockSugerencia })).pipe(delay(1200));
  }

  return next(req);
};
