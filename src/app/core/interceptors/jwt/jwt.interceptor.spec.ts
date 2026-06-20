import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let routerMock: any;
  function ejecutarInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    return TestBed.runInInjectionContext(() => jwtInterceptor(req, next));
  }
  beforeEach(() => {
    routerMock = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerMock }],
    });

    localStorage.clear();
  });

  describe('cuando hay token en localStorage', () => {
    it('deberia agregar el header Authorization con el token', async () => {
      localStorage.setItem('pancomido_token', 'mi-token-jwt');

      const req = new HttpRequest('GET', '/api/test');
      let capturedReq: HttpRequest<unknown> | null = null;

      const next: HttpHandlerFn = (modifiedReq) => {
        capturedReq = modifiedReq;
        return of({} as HttpEvent<unknown>);
      };

      await firstValueFrom(ejecutarInterceptor(req, next));

      expect(capturedReq!.headers.get('Authorization')).toBe('Bearer mi-token-jwt');
    });
  });

  describe('cuando NO hay token en localStorage', () => {
    it('NO deberia agregar el header Authorization', async () => {
      const req = new HttpRequest('GET', '/api/test');
      let capturedReq: HttpRequest<unknown> | null = null;

      const next: HttpHandlerFn = (modifiedReq) => {
        capturedReq = modifiedReq;
        return of({} as HttpEvent<unknown>);
      };

      await firstValueFrom(ejecutarInterceptor(req, next));

      expect(capturedReq!.headers.has('Authorization')).toBe(false);
    });
  });

  describe('manejo de errores', () => {
    it('deberia eliminar el token y navegar a login en error 401', async () => {
      localStorage.setItem('pancomido_token', 'token-que-expiró');

      const req = new HttpRequest('GET', '/api/test');
      const next: HttpHandlerFn = () => throwError(() => ({ status: 401 }));

      try {
        await firstValueFrom(ejecutarInterceptor(req, next));
      } catch (error) {
        expect(localStorage.getItem('pancomido_token')).toBeNull();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
      }
    });

    it('NO deberia hacer nada en errores que no son 401', async () => {
      localStorage.setItem('pancomido_token', 'token-valido');

      const req = new HttpRequest('GET', '/api/test');
      const next: HttpHandlerFn = () => throwError(() => ({ status: 500 }));

      try {
        await firstValueFrom(ejecutarInterceptor(req, next));
      } catch (error) {
        expect(localStorage.getItem('pancomido_token')).toBe('token-valido');
        expect(routerMock.navigate).not.toHaveBeenCalled();
      }
    });

    it('deberia re-lanzar el error para que el componente lo maneje', async () => {
      const req = new HttpRequest('GET', '/api/test');
      const errorOriginal = { status: 401 };
      const next: HttpHandlerFn = () => throwError(() => errorOriginal);

      try {
        await firstValueFrom(ejecutarInterceptor(req, next));

        expect.fail('El interceptor debería haber arrojado un error pero no lo hizo');
      } catch (err) {
        expect(err).toBe(errorOriginal);
      }
    });
  });
});
