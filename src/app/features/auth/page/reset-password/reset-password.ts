import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  resetForm: FormGroup;
  email = '';
  token = '';
  enviando = false;
  mensajeError = '';

  passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
  forbiddenCharsRegex = /^[^"';]+$/;

  constructor(
    private fb: FormBuilder, 
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      contrasena: ['', [
        Validators.required, 
        Validators.pattern(this.passwordRegex),
        Validators.pattern(this.forbiddenCharsRegex)
      ]],
      repetirContrasena: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  passwordsMatchValidator(group: FormGroup) {
    const password = group.get('contrasena')?.value;
    const confirmPassword = group.get('repetirContrasena')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.token = params['token'] || '';
      
      if (!this.email || !this.token) {
        this.mensajeError = 'Enlace inválido o incompleto.';
        this.resetForm.disable();
      }
    });
  }

  onSubmit() {
    if (this.resetForm.valid && this.email && this.token) {
      this.enviando = true;
      this.mensajeError = '';
      const nuevaContrasena = this.resetForm.value.contrasena;

      this.authService.ejecutarReset(this.email, this.token, nuevaContrasena).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: () => {
          this.mensajeError = 'Ocurrió un error o el enlace ya expiró. Volvé a solicitar uno nuevo.';
          this.enviando = false;
        }
      });
    }
  }
}
