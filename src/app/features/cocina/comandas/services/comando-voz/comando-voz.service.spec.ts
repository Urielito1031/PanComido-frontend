import { TestBed } from '@angular/core/testing';

import { ComandoVozService } from './comando-voz.service';

describe('ComandoVoz', () => {
  let service: ComandoVozService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComandoVozService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('aceptar comanda', () => {
    it('reconoce "mesa X aceptar"', () => {
      service['procesarFrase']('mesa 5 aceptar');
      expect(service.comandoDetectado()).toMatchObject({ mesaNumero: 5, accion: 'aceptar', nuevoEstadoId: 2 });
    });

    it('reconoce "mesa X aceptar comanda"', () => {
      service['procesarFrase']('mesa 6 aceptar comanda');
      expect(service.comandoDetectado()).toMatchObject({ mesaNumero: 6, accion: 'aceptar', nuevoEstadoId: 2 });
    });

    it('reconoce "aceptar comanda mesa X"', () => {
      service['procesarFrase']('aceptar comanda mesa 7');
      expect(service.comandoDetectado()).toMatchObject({ mesaNumero: 7, accion: 'aceptar', nuevoEstadoId: 2 });
    });
  });

  describe('llamar al mozo', () => {
    const frasesValidas = [
      ['mesa 1 llamar mozo', 1],
      ['mesa 2 llamar moso', 2],
      ['mesa 3 llamar al mozo', 3],
      ['mesa 4 llamar al moso', 4],
      ['llamar al mozo mesa 8', 8],
      ['llamar al moso mesa 9', 9],
      ['llamar mozo mesa 10', 10],
      ['llamar moso mesa 11', 11],
    ] as const;

    for (const [frase, mesa] of frasesValidas) {
      it(`reconoce "${frase}"`, () => {
        service['procesarFrase'](frase);
        expect(service.comandoDetectado()).toMatchObject({ mesaNumero: mesa, accion: 'llamar-mozo', nuevoEstadoId: 0 });
      });
    }
  });
});
