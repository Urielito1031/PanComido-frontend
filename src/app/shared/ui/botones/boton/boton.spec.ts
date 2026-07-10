import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { Boton } from './boton';

describe('Boton', () => {
  let component: Boton;
  let fixture: ComponentFixture<Boton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Boton],
    }).compileComponents();

    fixture = TestBed.createComponent(Boton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería usar primary como variante por defecto', () => {
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;

    expect(button.className).toContain('btn-primary');
  });

  it('debería aplicar variante secondary cuando se configura', () => {
    fixture.componentRef.setInput('variante', 'secondary');
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;

    expect(button.className).toContain('btn-secondary');
  });

  it('no debería emitir click cuando está deshabilitado', () => {
    const clickSpy = vi.fn();
    component.clicked.subscribe(clickSpy);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    component.manejarClick(new MouseEvent('click'));

    expect(clickSpy).not.toHaveBeenCalled();
  });
});
