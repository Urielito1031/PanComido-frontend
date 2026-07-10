import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FilaVirtualState } from '../../services/fila-virtual.state';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-anotarse-fila',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './anotarse-fila.html',
  styleUrls: ['./anotarse-fila.css']
})
export class AnotarseFila implements OnInit {
  private state = inject(FilaVirtualState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  configVisual = inject(ConfiguracionVisualState);
  
  nombre = '';
  cantidad = 0;
  mostrarInputCantidad = false;
  restauranteId = 0;

  ngOnInit() {
    const rId = this.route.snapshot.paramMap.get('restauranteId');
    if (rId) {
      this.restauranteId = Number(rId);
      sessionStorage.setItem('restauranteId', rId);
    } else {
      this.restauranteId = Number(sessionStorage.getItem('restauranteId'));
    }
    
    if (this.restauranteId) {
      this.configVisual.cargar(this.restauranteId);
    }
  }

  seleccionarCantidad(n: number) {
    this.cantidad = n;
    this.mostrarInputCantidad = false;
  }

  activarInputCantidad() {
    this.mostrarInputCantidad = true;
    this.cantidad = 6;
  }

  cancelar() {
    this.router.navigate(['/']); // O donde deba ir
  }

  anotarme() {
    if (!this.nombre || this.nombre.trim() === '') {
      alert('Debes ingresar tu nombre para anotarte.');
      return;
    }
    if (this.cantidad < 1) {
      alert('Debes ingresar la cantidad de personas.');
      return;
    }

    this.state.anotarse(this.restauranteId, this.nombre, this.cantidad).subscribe(() => {
      const estadoActual = this.state.estado();
      if (estadoActual && estadoActual.mesaAsignadaId) {
        this.state.setMesaAsignadaDirecta(estadoActual.mesaAsignadaId, estadoActual.minutosParaOcupar || 7);
        this.router.navigate(['/comensal/mesa-lista']);
      } else {
        this.router.navigate(['/comensal/estado-fila']);
      }
    });
  }
}
