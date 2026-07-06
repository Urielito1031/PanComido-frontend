import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { Proveedor } from '../../../../../core/models/domain/proveedor';
import { ProveedorListComponent } from './proveedor-list';

describe('ProveedorListComponent', () => {
  let fixture: ComponentFixture<ProveedorListComponent>;

  const proveedores = [
    {
      id: 1,
      nombre: 'Verduras del Sur',
      telefono: '  11223344  ',
      activo: true,
      fechaUltimoPedido: '2026-07-01'
    },
    {
      id: 2,
      nombre: 'Lácteos Norte',
      telefono: '',
      activo: false,
      fechaUltimoPedido: null
    }
  ] as unknown as Proveedor[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProveedorListComponent);
    fixture.componentRef.setInput('proveedores', proveedores);
    fixture.componentRef.setInput('proveedorSeleccionadoId', 1);
  });

  it('debería renderizar proveedores, selección y estados visuales', () => {
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.proveedor-row'));
    expect(rows).toHaveLength(2);
    expect(rows[0].nativeElement.classList).toContain('selected');
    expect(rows[0].query(By.css('.proveedor-estado-dot')).nativeElement.classList).toContain('activo');
    expect(rows[1].nativeElement.textContent).toContain('Sin pedidos');
  });

  it('debería emitir selección y acciones sin propagar la fila', () => {
    const component = fixture.componentInstance;
    const seleccionarSpy = vi.spyOn(component.seleccionar, 'emit');
    const crearSpy = vi.spyOn(component.crearPedido, 'emit');
    const historialSpy = vi.spyOn(component.verHistorial, 'emit');
    const editarSpy = vi.spyOn(component.editar, 'emit');
    const eliminarSpy = vi.spyOn(component.eliminar, 'emit');
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.proveedor-row')).triggerEventHandler('click');
    const buttons = fixture.debugElement.queryAll(By.css('.icon-btn'));
    buttons[0].triggerEventHandler('click');
    buttons[1].triggerEventHandler('click');
    buttons[2].triggerEventHandler('click');
    buttons[3].triggerEventHandler('click');

    expect(seleccionarSpy).toHaveBeenCalledWith(proveedores[0]);
    expect(crearSpy).toHaveBeenCalledWith(proveedores[0]);
    expect(historialSpy).toHaveBeenCalledWith(proveedores[0]);
    expect(editarSpy).toHaveBeenCalledWith(proveedores[0]);
    expect(eliminarSpy).toHaveBeenCalledWith(proveedores[0]);
  });

  it('debería mostrar vacío y contacto fallback', () => {
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('proveedores', []);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.proveedor-empty')).nativeElement.textContent).toContain('No se encontraron proveedores');
    expect(component.contactoProveedor(proveedores[0])).toBe('11223344');
    expect(component.contactoProveedor(proveedores[1])).toBe('Sin telefono registrado');
    expect(component.trackPorId(0, proveedores[1])).toBe(2);
  });
});
