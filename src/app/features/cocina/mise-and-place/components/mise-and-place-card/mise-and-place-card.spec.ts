import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiseAndPlaceCard } from './mise-and-place-card';
import { MiseAndPlaceListadoDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';

const itemMock: MiseAndPlaceListadoDto = {
  loteId: 1,
  articuloId: 1,
  miseAndPlaceId: 1,
  nombre: 'Papas bastón',
  descripcion: '',
  cantidad: 0,
  fechaVencimiento: null,
  unidadMedida: 'KG',
  categoria: 'Guarniciones',
  bodega: '',
  stockMinimo: 0,
  stockRecomendado: 0,
  costoUnitario: 0,
  costo: 0,
  receta: [],
};

describe('MiseAndPlaceCard', () => {
  let component: MiseAndPlaceCard;
  let fixture: ComponentFixture<MiseAndPlaceCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiseAndPlaceCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MiseAndPlaceCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', itemMock);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
