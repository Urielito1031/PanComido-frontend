import { Component , ChangeDetectionStrategy, inject, OnDestroy, OnInit} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MozoTabNavigation } from '../../features/mozo/components/mozo-tab-navigation/mozo-tab-navigation';
import { AuthService } from '../../core/services/auth.service';
import { LlamadoState } from '../../features/mozo/services/llamado-state';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mozo-layout',
  standalone: true,
  imports: [RouterModule, MozoTabNavigation, FontAwesomeModule],
  templateUrl: './mozo-layout.html',
  styleUrl: './mozo-layout.css'
})
export class MozoLayout implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private llamadoState = inject(LlamadoState);
  readonly faRightFromBracket = faRightFromBracket;

  ngOnInit(): void {
    this.llamadoState.cargar(this.authService.empleadoId, this.authService.restauranteId);
    void this.llamadoState.conectarHub();
  }

  ngOnDestroy(): void {
    this.llamadoState.desconectarHub();
  }

  logout(): void {
    this.authService.logout();
  }
}
