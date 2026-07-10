import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageToolbar } from '../../../../../shared/ui/page-toolbar/page-toolbar';
import { GlassCard } from '../../../../../shared/ui/glass-card/glass-card';
import { ReportesState } from '../../services/reportes-state';
import { ReporteService } from '../../../../gerente/services/reporte.service';

@Component({
  selector: 'app-reportes-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageToolbar, GlassCard],
  providers: [ReportesState, ReporteService],
  templateUrl: './reportes-page.html',
  styleUrl: './reportes-page.css'
})
export class ReportesPage {
  readonly state = inject(ReportesState);

  readonly hoy = new Date().toISOString().slice(0, 10);
}
