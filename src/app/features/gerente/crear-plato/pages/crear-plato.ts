import { Component, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { ToggleComponent } from '../../../../shared/ui/toggle/toggle';
import { DetalleRecetaComponent } from '../components/detalle-receta/detalle-receta';
import { CrearPlatoFormComponent, PlatoFormData, PlatoFormDraft } from '../components/crear-plato-form/crear-plato-form';
import { RecetaIngrediente } from '../../../../core/models/domain/plato';
import { CrearPlatoState } from '../services/crear-plato.state';

interface PlatoIAState {
  desde_ia: boolean;
  nombre?: string;
  descripcion?: string;
  tiempoPreparacion?: number;
  ingredientes?: Array<{ insumoId: number; nombre: string; cantidad: number }>;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-crear-plato-page',
  standalone: true,
  imports: [Boton, ToggleComponent, DetalleRecetaComponent, CrearPlatoFormComponent],
  templateUrl: './crear-plato.html',
  styleUrl: './crear-plato.css'
})
export class CrearPlatoPage {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly state = inject(CrearPlatoState);

  visible = this.state.visible;
  previsualizarImagen = this.state.previsualizacionImagen;
  tiposPlato = this.state.tiposPlato;
  categoriasPlato = this.state.categoriasPlato;
  restricciones = this.state.restricciones;
  restriccionesSeleccionadas = this.state.restriccionesSeleccionadas;
  ingredientesDisponibles = this.state.ingredientesDisponibles;
  porcentajesPlatos = this.state.porcentajesPlatos;
  receta = this.state.receta;
  mostrarExito = this.state.mostrarExito;
  costoSugerido = this.state.costoSugerido;
  vegano = this.state.vegano;
  vegetariano = this.state.vegetariano;
  celiaco = this.state.celiaco;
  loading = this.state.loading;
  nombresExistentes = this.state.nombresExistentes;
  errorImagen = this.state.errorImagen;
  activeStep = signal<0 | 1 | 2>(0);
  formDraft = signal<PlatoFormDraft>({});
  resetVersion = signal(0);
  readonly steps = [
    { label: 'Datos visibles', helper: 'Nombre, foto y descripción', icon: 'menu_book' },
    { label: 'Receta y costo', helper: 'Ingredientes y cantidades', icon: 'restaurant' },
    { label: 'Precio y publicación', helper: 'Margen, tags y visibilidad', icon: 'sell' },
  ];

  readonly progressWidth = computed(() => `${((this.activeStep() + 1) / this.steps.length) * 100}%`);
  readonly recetaLista = computed(() => this.receta().length > 0 && this.receta().every(item => Number(item.cantidad) > 0));
  readonly datosVisiblesListos = computed(() => {
    const draft = this.formDraft();
    return Boolean(
      this.previsualizarImagen() &&
      (draft.nombre?.trim()?.length ?? 0) >= 3 &&
      draft.tipoPlatoId &&
      draft.categoriaPlatoId &&
      (draft.descripcion?.trim()?.length ?? 0) >= 8 &&
      Number(draft.tiempoPreparacion ?? 0) > 0
    );
  });
  readonly publicacionLista = computed(() => Number(this.formDraft().precioVenta ?? 0) > 0);
  readonly tipoSeleccionado = computed(() => {
    const id = this.formDraft().tipoPlatoId;
    return this.tiposPlato().find(item => item.id === id)?.descripcion ?? 'Sin tipo';
  });
  readonly categoriaSeleccionada = computed(() => {
    const id = this.formDraft().categoriaPlatoId;
    return this.categoriasPlato().find(item => item.id === id)?.descripcion ?? 'Sin categoría';
  });
  readonly tagsSeleccionados = computed(() => {
    const tags: string[] = [];
    if (this.vegano()) tags.push('Vegano');
    if (this.vegetariano()) tags.push('Vegetariano');
    if (this.celiaco()) tags.push('Celíaco');
    return tags;
  });
  readonly margenFinal = computed(() => {
    const draft = this.formDraft();
    const precio = Number(draft.precioVenta ?? 0);
    const costo = Number(draft.costo ?? this.costoSugerido());
    if (precio <= 0 || costo <= 0) return null;
    return Math.round(((precio - costo) / precio) * 100);
  });
  readonly ingredientesSinCantidad = computed(() => this.receta().filter(item => Number(item.cantidad) <= 0).length);


  constructor() {
    this.state.cargarDatosFormulario();

    const navState = this.location.getState() as PlatoIAState | null;
    if (navState?.desde_ia && navState.ingredientes) {
      const ingredientes: RecetaIngrediente[] = navState.ingredientes.map(ing => ({
        id: ing.insumoId,
        nombre: ing.nombre,
        cantidad: ing.cantidad,
        unidadMedida: 'GR',
      }));

      this.state.updateReceta(ingredientes);
    }
  }

  onGuardar(data: PlatoFormData): void {
    this.state.guardarPlato(data, () => { });
  }

  onDraftCambiado(draft: PlatoFormDraft): void {
    this.formDraft.set(draft);
  }

  onContinuarDesdeFormulario(): void {
    this.activeStep.set(1);
  }

  onContinuarDesdeReceta(): void {
    if (!this.recetaLista()) return;
    this.activeStep.set(2);
  }

  onVolverPaso(): void {
    this.activeStep.update(step => (Math.max(0, step - 1) as 0 | 1 | 2));
  }

  onIrAPaso(index: number): void {
    if (index < this.activeStep()) {
      this.activeStep.set(index as 0 | 1 | 2);
    }
  }

  pasoCompleto(index: number): boolean {
    if (index === 0) return this.datosVisiblesListos();
    if (index === 1) return this.recetaLista();
    return this.publicacionLista();
  }

  onToggleTag(tag: 'vegano' | 'vegetariano' | 'celiaco'): void {
    this.state.toggleTag(tag);
  }

  onToggleVisible(): void {
    this.state.toggleVisible();
  }

  onRecetaCambiada(ingredientes: RecetaIngrediente[]): void {
    this.state.updateReceta(ingredientes);
  }

  onImagenSeleccionada(file: File): void {
    const previsualizarUrl = URL.createObjectURL(file);
    this.state.seleccionarImagen(file, previsualizarUrl);
  }

  onCerrarExito(): void {
    this.state.setMostrarExito(false);
    this.router.navigate(['/staff/gerente/modificar-carta']);
  }

  onCrearOtroPlato(): void {
    this.state.resetFormulario();
    this.formDraft.set({});
    this.resetVersion.update(value => value + 1);
    this.activeStep.set(0);
  }

  onCancelar(): void {
    this.router.navigate(['/staff/gerente/modificar-carta']);
  }
}
