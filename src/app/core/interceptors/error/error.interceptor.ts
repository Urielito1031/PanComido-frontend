import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let mensaje = 'Ha ocurrido un error inesperado';
      
      if (error.status === 0) {
        mensaje = 'No hay conexión con el servidor. Verificá tu red.';
      } else if (error.status === 403) {
        mensaje = 'No tenés permisos para realizar esta acción.';
      } else if (error.status === 500) {
        mensaje = 'Error interno del servidor. Intentá más tarde.';
      } else if (error.status === 503) {
        mensaje = 'El servidor no está disponible momentáneamente.';
      }

      if (error.status === 0 || error.status === 403 || error.status >= 500) {
        toast.mostrar(mensaje, 'info');
      }

      return throwError(() => error);
    })
  );
};
