import { TestBed } from '@angular/core/testing';
import { GuardResult, Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let authServiceMock: any;
  let routerMock: any;

  function ejecutarGuard(
    rolesRequeridos?: string[],
  ): GuardResult{
    const route = { data: { roles: rolesRequeridos } } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });
    return TestBed.runInInjectionContext(() => roleGuard(route, state)) as GuardResult;
  }

  beforeEach(() => {
    authServiceMock = {
      esAutenticado: vi.fn(),
      tieneRoles: vi.fn(),
      obtenerRutaHome: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
      createUrlTree: vi.fn((segments) => ({ segments } as any)),
    };
  });

  describe('usuario no autenticado', () => {
    it('deberia redirigir a /login', () => {
      authServiceMock.esAutenticado.mockReturnValue(false);

      const result = ejecutarGuard();

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/login']);
      expect((result as any).segments).toEqual(['/login']);
    });
  });

  describe('usuario autenticado sin roles requeridos', () => {
    it('deberia retornar true si no se requieren roles', () => {
      authServiceMock.esAutenticado.mockReturnValue(true);

      const result = ejecutarGuard(undefined);

      expect(result).toBe(true);
    });

    it('deberia retornar true si el array de roles esta vacio', () => {
      authServiceMock.esAutenticado.mockReturnValue(true);

      const result = ejecutarGuard([]);

      expect(result).toBe(true);
    });
  });

  describe('usuario autenticado con roles requeridos', () => {
    it('deberia retornar true si el usuario tiene el rol requerido', () => {
      authServiceMock.esAutenticado.mockReturnValue(true);
      authServiceMock.tieneRoles.mockReturnValue(true);

      const result = ejecutarGuard(['Gerente']);

      expect(authServiceMock.tieneRoles).toHaveBeenCalledWith(['Gerente']);
      expect(result).toBe(true);
    });

    it('deberia redirigir al home si el usuario NO tiene el rol requerido', () => {
      authServiceMock.esAutenticado.mockReturnValue(true);
      authServiceMock.tieneRoles.mockReturnValue(false);
      authServiceMock.obtenerRutaHome.mockReturnValue('staff/mozo');

      const result = ejecutarGuard(['Gerente']);

      expect(authServiceMock.tieneRoles).toHaveBeenCalledWith(['Gerente']);
      expect(routerMock.createUrlTree).toHaveBeenCalledWith(['staff/mozo']);
      expect((result as any).segments).toEqual(['staff/mozo']);
    });
  });
});