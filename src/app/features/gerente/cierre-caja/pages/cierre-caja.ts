import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CierreCajaStateService, TipoTurnoCierre } from '../services/cierre-caja.state';
import { GlassCard } from '../../../../shared/ui/glass-card/glass-card';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { ArsCurrencyPipe } from '../../../../shared/pipes/ars-currency.pipe';
import { CierreCaja } from '../../../../core/models/domain/cierre-caja';

@Component({
  selector: 'app-cierre-caja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GlassCard,
    Boton,
    ArsCurrencyPipe
  ],
  templateUrl: './cierre-caja.html',
  styleUrls: ['./cierre-caja.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CierreCajaComponent implements OnInit {
  public state = inject(CierreCajaStateService);

  ngOnInit(): void {
    this.state.cargarDatos();
  }

  abrirCierre(tipo: TipoTurnoCierre): void {
    this.state.abrirCierre(tipo);
  }

  cerrarModalCierre(): void {
    this.state.cerrarModalCierre();
  }

  onConteoCajaChange(valor: number): void {
    this.state.setConteoCaja(valor || 0);
  }

  onConteoCajaFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '0') {
      input.value = '';
    }
  }

  confirmarCierre(): void {
    this.state.confirmarCierre();
  }

  abrirDetalleCierre(cierre: CierreCaja): void {
    this.state.abrirDetalleCierre(cierre);
  }

  cerrarDetalleCierre(): void {
    this.state.cerrarDetalleCierre();
  }
}
