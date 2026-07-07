import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Bodega } from '../../../../../core/models/domain/bodega';
import { CategoriaInsumo } from '../../../../../core/models/domain/categoria-insumo';
import { UnidadMedida } from '../../../../../core/models/domain/unidad-medida';
import { ProductoForm, GuardarProductoPayload } from '../../../stock-mercaderia/components/producto-form/producto-form';

@Component({
  selector: 'app-panel-crear-bebida',
  standalone: true,
  imports: [ProductoForm],
  templateUrl: './panel-crear-bebida.html',
  styleUrls: ['./panel-crear-bebida.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PanelCrearBebidaComponent {
  bodegas = input<Bodega[]>([]);
  categorias = input<CategoriaInsumo[]>([]);
  unidadesMedida = input<UnidadMedida[]>([]);

  guardar = output<GuardarProductoPayload>();
  cerrar = output<void>();

  onClose(): void {
    this.cerrar.emit();
  }
}
