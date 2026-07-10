import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recuperar-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.css'
})
export class RecuperarPassword {
  recuperarForm: FormGroup;
  enviando = false;
  mensajeExito = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.recuperarForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.recuperarForm.valid) {
      this.enviando = true;
      this.authService.solicitarRecuperacion(this.recuperarForm.value.email).subscribe({
        next: () => {
          setTimeout(() => {
            this.mensajeExito = '¡Listo! Revisá tu casilla de correo para restablecer tu contraseña (revisá si está en la carpeta de spam si no lo encontrás).';
            this.enviando = false;
          }, 2000);
        },
        error: () => {
          setTimeout(() => {
            this.mensajeExito = '¡Listo! Revisá tu casilla de correo para restablecer tu contraseña (revisá si está en la carpeta de spam si no lo encontrás).';
            this.enviando = false;
          }, 2000);
        }
      });
    }
  }
}
