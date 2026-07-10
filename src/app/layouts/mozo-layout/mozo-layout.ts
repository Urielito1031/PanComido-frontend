import { Component , ChangeDetectionStrategy, inject} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MozoTabNavigation } from '../../features/mozo/components/mozo-tab-navigation/mozo-tab-navigation';
import { AuthService } from '../../core/services/auth.service';
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
export class MozoLayout {
  private authService = inject(AuthService);
  readonly faRightFromBracket = faRightFromBracket;

  logout(): void {
    this.authService.logout();
  }
}
