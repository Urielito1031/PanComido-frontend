import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { DatosLocal } from '../../../../../core/models/domain/datos-local';
import { FamiliaTipografica } from '../../../../../core/models/domain/familia-tipografica';
import { CartaState } from '../../../../comensal/ver-carta/service/carta-state';

interface PreviewItem {
  nombre: string;
  esDestacado: boolean;
  tipo: string | null;
  tiempo: number | null;
  precio: string;
  img: string | null;
}

@Component({
  selector: 'app-comensal-preview',
  imports: [],
  templateUrl: './comensal-preview.html',
  styleUrl: './comensal-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComensalPreviewComponent {
  readonly datosLocal = input.required<DatosLocal>();
  readonly familiasTipograficas = input<FamiliaTipografica[]>([]);

  private readonly cartaState = inject(CartaState);

  readonly familiaActual = computed(() => {
    const id = this.datosLocal().familiaTipograficaId;
    return this.familiasTipograficas().find(f => f.id === id);
  });

  readonly fontTitulo = computed(() => {
    const familia = this.familiaActual();
    return familia ? `${familia.tipografiaTitulo}, sans-serif` : 'system-ui, sans-serif';
  });

  readonly fontCuerpo = computed(() => {
    const familia = this.familiaActual();
    return familia ? `${familia.tipografiaCuerpo}, sans-serif` : 'system-ui, sans-serif';
  });

  readonly colorPrimario = computed(() => this.datosLocal().colorPrincipal || '#1a4a2e');
  readonly colorSecundario = computed(() => this.datosLocal().colorSecundario || '#f08f1a');
  readonly nombreLocal = computed(() => this.datosLocal().nombre || 'Nombre del local');
  readonly logo = computed(() => this.datosLocal().imagen ?? null);
  readonly cargando = this.cartaState.cargando;

  readonly displayItems = computed((): PreviewItem[] => {
    const real = this.cartaState.items();
    if (real.length > 0) {
      return real.slice(0, 5).map(item => ({
        nombre: item.nombre,
        esDestacado: item.esDestacado,
        tipo: item.tipoPlato ?? item.categoriaBebida,
        tiempo: item.tiempoPreparacionEstimado,
        precio: `$ ${item.precio.toLocaleString('es-AR')}`,
        img: item.urlImagen
      }));
    }
    return this.platosMock;
  });

  private _ultimoCargadoId = -1;

  constructor() {
    effect(() => {
      const id = this.datosLocal().id;
      if (id && id !== this._ultimoCargadoId) {
        this._ultimoCargadoId = id;
        this.cartaState.cargarCarta(id);
      }
    });
  }

  private readonly platosMock: PreviewItem[] = [
    {
      nombre: 'Pollo a la crema',
      esDestacado: true,
      tipo: 'Pastas',
      tiempo: 20,
      precio: '$ 18.300',
      img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=300&h=200'
    },
    {
      nombre: 'Milanesa napolitana',
      esDestacado: false,
      tipo: 'Carnes',
      tiempo: 25,
      precio: '$ 16.200',
      img: 'https://images.unsplash.com/photo-1599921841143-819065a55cc6?auto=format&fit=crop&q=80&w=300&h=200'
    }
  ];
}
