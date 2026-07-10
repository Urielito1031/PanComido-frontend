import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthState } from '../../auth-state';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
 private authState = inject(AuthState);

  cargando = this.authState.cargando;
  error = this.authState.error;

  email = signal('');
  contrasenia = signal('');

  onSubmit(event: Event): void {
    event.preventDefault();
    this.authState.login(this.email(), this.contrasenia());
  
  }
}
