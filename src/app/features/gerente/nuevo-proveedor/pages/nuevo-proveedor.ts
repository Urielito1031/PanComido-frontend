import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { ProveedorNuevo } from '../../../../core/models/domain/proveedor';
import { NuevoProveedorState } from '../services/nuevo-proveedor.state';
import { CategoriaInsumo } from '../../../../core/models/domain/categoria-insumo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-nuevo-proveedor',
  standalone: true,
  imports: [ReactiveFormsModule, FontAwesomeModule, Boton],
  templateUrl: './nuevo-proveedor.html',
  styleUrls: ['./nuevo-proveedor.css']
})
export class NuevoProveedorComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly state = inject(NuevoProveedorState);

  readonly proveedorForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    telefono: ['', [Validators.pattern(/^\s*\+?[0-9\s-]{7,18}\s*$/)]],
  });

  readonly categorias = this.state.categorias;
  readonly categoriaIds = this.state.categoriaIds;
  readonly categoriasDisponibles = this.state.categoriasDisponibles;
  readonly cargandoCategorias = this.state.cargandoCategorias;
  readonly guardando = this.state.guardando;
  readonly errorCategorias = this.state.errorCategorias;
  readonly errorGuardado = this.state.errorGuardado;

  readonly faTrash = faTrash;
  readonly intentoGuardar = signal(false);
  readonly busquedaCategoria = signal('');

  ngOnInit(): void {
    this.state.resetearFormulario();
    this.state.cargarCategorias();
  }

  // Convertimos el observable del estado del formulario a Signal
  private readonly formStatus = toSignal(this.proveedorForm.statusChanges, {
    initialValue: this.proveedorForm.status
  });
  private readonly formValue = toSignal(this.proveedorForm.valueChanges, {
    initialValue: this.proveedorForm.getRawValue()
  });

  readonly categoriasInvalidas = computed(() => this.intentoGuardar() && this.categoriaIds().length === 0);
  readonly puedeGuardar = computed(() => this.formStatus() === 'VALID' && this.categoriaIds().length > 0 && !this.guardando());
  readonly nombrePreview = computed(() => this.formValue().nombre?.trim() || 'Sin nombre');
  readonly telefonoPreview = computed(() => this.formValue().telefono?.trim() || 'Sin WhatsApp');
  readonly categoriasFiltradas = computed(() => {
    const query = this.busquedaCategoria().trim().toLowerCase();
    if (!query) return this.categoriasDisponibles();
    return this.categoriasDisponibles().filter(categoria => categoria.descripcion.toLowerCase().includes(query));
  });
  readonly categoriasIngredienteFiltradas = computed(() =>
    this.categoriasFiltradas().filter(categoria => categoria.tipoAplica !== 'Bebida')
  );
  readonly categoriasBebidaFiltradas = computed(() =>
    this.categoriasFiltradas().filter(categoria => categoria.tipoAplica === 'Bebida')
  );
  readonly resumenListo = computed(() => this.puedeGuardar());

  onBusquedaCategoriaChange(valor: string): void {
    this.busquedaCategoria.set(valor);
  }

  toggleCategoria(categoria: CategoriaInsumo): void {
    this.state.toggleCategoria(categoria);
  }

  categoriaSeleccionada(id: number): boolean {
    return this.categoriaIds().includes(id);
  }

  removerCategoria(id: number): void {
    this.state.removerCategoria(id);
  }

  reintentarCategorias(): void {
    this.state.cargarCategorias();
  }

  cancelar(): void {
    this.router.navigate(['/staff', 'gerente', 'ver-proveedores']);
  }

  guardarProveedor(): void {
    this.intentoGuardar.set(true);
    this.proveedorForm.markAllAsTouched();
    if (!this.puedeGuardar()) return;
    
    const formVal = this.proveedorForm.getRawValue();
    const proveedor: ProveedorNuevo = {
      nombre: formVal.nombre.trim(),
      numeroTelefonoWsp: formVal.telefono.trim(),
      categoriaIds: this.categoriaIds()
    };

    this.state.guardarProveedor(proveedor, () => {
      this.router.navigate(['/staff', 'gerente', 'ver-proveedores'], { 
        state: { created: true, message: 'Proveedor creado correctamente' } 
      });
    });
  }
}
