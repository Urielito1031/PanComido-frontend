import { Component, OnInit, inject, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { Boton } from '../../../../../shared/ui/botones/boton/boton';
import { PageToolbar } from '../../../../../shared/ui/page-toolbar/page-toolbar';
import { PedidoProveedor, EstadoPedidoProveedor } from '../../../../../core/models/domain/proveedor';
import { UnidadMedida } from '../../../../../core/models/domain/unidad-medida';
import { VerProveedoresState } from '../../services/ver-proveedores.state';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';
import { PriceNoteComponent } from '../../../../../shared/ui/price-note/price-note';
import { AgregarInsumoPedidoComponent } from '../../components/agregar-insumo-pedido/agregar-insumo-pedido';
import { RecepcionPedidoModalComponent } from '../../components/recepcion-pedido-modal/recepcion-pedido-modal';

@Component({
  selector: 'app-historial-proveedor',
  standalone: true,
  imports: [DatePipe, FormsModule, FontAwesomeModule, Boton, PageToolbar, ArsCurrencyPipe, PriceNoteComponent, AgregarInsumoPedidoComponent, RecepcionPedidoModalComponent],
  templateUrl: './historial-proveedor.html',
  styleUrls: ['./historial-proveedor.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialProveedorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly state = inject(VerProveedoresState);

  proveedorSeleccionado = this.state.proveedorSeleccionado;
  historialProveedor = this.state.historialProveedor;
  loadingHistorial = this.state.loadingHistorial;
  errorHistorial = this.state.errorHistorial;
  pedidoHistorialSeleccionado = this.state.pedidoHistorialSeleccionado;
  mensajeAccion = this.state.mensajeAccion;

  faXmark = faXmark;
  isAgregarIngredientesOpen = signal(false);

  totalHistorial = computed(() =>
    this.historialProveedor().reduce((total, pedido) => total + pedido.monto, 0)
  );

  pedidosPendientes = computed(() =>
    this.historialProveedor().filter(pedido => pedido.estado === 'Pendiente').length
  );

  totalItemsHistorial = computed(() =>
    this.historialProveedor().reduce((total, pedido) => total + pedido.items.length, 0)
  );

  historialOrdenado = computed(() =>
    [...this.historialProveedor()].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.volver();
      return;
    }

    const proveedorId = parseInt(id, 10);

    // Cargar lista de proveedores si aún no está disponible (solo metadatos, sin efectos sobre insumos)
    if (this.state.proveedores().length === 0) {
      this.state.cargarProveedoresSolos();
    }

    // Siempre seleccionar el proveedor correcto y cargar SUS insumos e historial
    this.state.seleccionarProveedor(proveedorId);
    this.state.cargarHistorial(proveedorId);
  }

  volver(): void {
    this.router.navigate(['/staff', 'gerente', 'ver-proveedores']);
  }

  reintentarHistorial(): void {
    const proveedor = this.proveedorSeleccionado();
    if (!proveedor) return;
    this.state.cargarHistorial(proveedor.id);
  }

  abrirDetallePedido(pedido: PedidoProveedor): void {
    this.state.abrirDetallePedido(pedido);
  }

  cerrarDetallePedido(): void {
    this.state.cerrarDetallePedido();
  }

  confirmarPedido(event: MouseEvent, pedido: PedidoProveedor): void {
    event.stopPropagation();
    this.state.confirmarPedido(pedido);
  }

  previsualizarRecepcion(event: MouseEvent, pedido: PedidoProveedor): void {
    event.stopPropagation();
    this.state.previsualizarRecepcion(pedido);
  }

  agregarIngredientes(): void {
    this.isAgregarIngredientesOpen.set(true);
  }

  cerrarAgregarIngredientes(): void {
    this.isAgregarIngredientesOpen.set(false);
  }

  nombreUnidad(unidadMedida: UnidadMedida | string | null | undefined): string {
    if (!unidadMedida) return '';
    return typeof unidadMedida === 'string' ? unidadMedida : unidadMedida.nombre;
  }

  unidadItemPedido(itemId: string | number, unidadMedida: UnidadMedida | string | null | undefined): UnidadMedida | string | null | undefined {
    const producto = this.state.productos().find(item => item.id.toString() === itemId.toString());
    return producto?.unidadMedida ?? unidadMedida;
  }

  cantidadConEquivalencia(cantidad: number, unidadMedida: UnidadMedida | string | null | undefined): string {
    const unidad = this.nombreUnidad(unidadMedida);
    const equivalencia = this.equivalenciaCantidad(cantidad, unidadMedida);
    return equivalencia ? `${cantidad} ${unidad} (${equivalencia.replace('Equivale a ', '')})` : `${cantidad} ${unidad}`;
  }

  cantidadItemPedido(cantidad: number, itemId: string | number, unidadMedida: UnidadMedida | string | null | undefined): string {
    const producto = this.state.productos().find(item => item.id.toString() === itemId.toString());
    return this.cantidadConEquivalencia(cantidad, producto?.unidadMedida ?? unidadMedida);
  }

  private equivalenciaCantidad(cantidad: number, unidadMedida: UnidadMedida | string | null | undefined): string | null {
    if (!cantidad || cantidad <= 0 || Number.isInteger(cantidad)) return null;

    const unidad = this.nombreUnidad(unidadMedida).trim().toUpperCase();
    if (['KG', 'KILO', 'KILOS'].includes(unidad)) {
      return `Equivale a ${this.formatearEquivalencia(cantidad, 'kg', 'g', 1000)}`;
    }

    if (['L', 'LT', 'LITRO', 'LITROS'].includes(unidad)) {
      return `Equivale a ${this.formatearEquivalencia(cantidad, 'l', 'ml', 1000)}`;
    }

    return null;
  }

  private formatearEquivalencia(cantidad: number, unidadMayor: string, unidadMenor: string, factor: number): string {
    const enteros = Math.trunc(cantidad);
    const menores = Math.round((cantidad - enteros) * factor);

    if (enteros > 0 && menores > 0) return `${enteros} ${unidadMayor} ${menores} ${unidadMenor}`;
    if (enteros > 0) return `${enteros} ${unidadMayor}`;
    return `${Math.round(cantidad * factor)} ${unidadMenor}`;
  }

  getEstadoClase(estado: EstadoPedidoProveedor): string {
    switch (estado) {
      case 'Recibido': return 'estado-recibido';
      case 'Enviado': return 'estado-enviado';
      default: return 'estado-pendiente';
    }
  }
}
