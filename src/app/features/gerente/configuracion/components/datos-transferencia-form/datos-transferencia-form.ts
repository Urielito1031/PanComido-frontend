import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosTransferencia, esDatosTransferenciaValidos } from '../../../../../core/models/domain/datos-transferencia';

@Component({
  selector: 'app-datos-transferencia-form',
  imports: [FormsModule],
  templateUrl: './datos-transferencia-form.html',
  styleUrl: './datos-transferencia-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatosTransferenciaForm {
  readonly datosTransferencia = input.required<DatosTransferencia>();
  readonly datosTransferenciaChange = output<Partial<DatosTransferencia>>();

  readonly aliasInvalido = computed(() => !this.datosTransferencia().alias.trim());
  readonly numeroCuentaInvalido = computed(() => !this.datosTransferencia().numeroCuenta.trim());
  readonly titularInvalido = computed(() => !this.datosTransferencia().titularCuenta.trim());
  readonly cbuInvalido = computed(() => {
    const cbu = this.datosTransferencia().cbu;
    return !!cbu && cbu.trim().length !== 22;
  });

  readonly hayCambiosIncompletos = computed(() => {
    const datos = this.datosTransferencia();
    const tocado = !!datos.alias || !!datos.cbu || !!datos.numeroCuenta || !!datos.titularCuenta;
    return tocado && !esDatosTransferenciaValidos(datos);
  });

  emitirTexto(campo: 'alias' | 'numeroCuenta' | 'titularCuenta', valor: string): void {
    this.datosTransferenciaChange.emit({ [campo]: valor });
  }

  emitirCbu(valor: string): void {
    this.datosTransferenciaChange.emit({ cbu: valor === '' ? null : valor });
  }
}
