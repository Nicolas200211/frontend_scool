import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { AsistenciaRepository } from '../../../../admin/core/domain/ports/asistencia.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { HorarioHoy } from '../../../../admin/core/domain/models/asistencia.model';

@Component({
  selector: 'app-mis-clases',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header titulo="Mis Clases" [subtitulo]="'Clases de hoy, ' + fecha" />

    @if (cargando()) { <app-loading-spinner /> }
    @else if (clases().length === 0) {
      <app-empty-state titulo="Sin clases hoy" descripcion="No tienes clases programadas para hoy" />
    } @else {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (c of clases(); track c.id) {
          <article class="bg-white rounded-xl p-4 border shadow-sm"
            [class.border-green-200]="c.asistenciaTomada"
            [class.border-gray-100]="!c.asistenciaTomada">
            <div class="flex items-start justify-between mb-3">
              <p class="font-semibold text-gray-900">{{ c.asignaturaNombre }}</p>
              @if (c.asistenciaTomada) {
                <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Tomada</span>
              } @else {
                <span class="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pendiente</span>
              }
            </div>
            <p class="text-sm text-gray-600 mb-1">{{ c.gradoNombre }} — {{ c.seccionNombre }}</p>
            <p class="text-xs text-gray-400 tabular-nums mb-4">{{ c.horaInicio }} – {{ c.horaFin }}</p>
            @if (!c.asistenciaTomada) {
              <a routerLink="/docente/asistencia" class="block text-center px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
                Tomar asistencia
              </a>
            }
          </article>
        }
      </div>
    }

    @if (error()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-red-600">{{ error() }}</p>
      </div>
    }
  `,
})
export class MisClasesComponent implements OnInit {
  private readonly repo = inject(AsistenciaRepository);
  private readonly authState = inject(AuthState);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly clases = signal<HorarioHoy[]>([]);
  readonly fecha = new Date().toISOString().slice(0, 10);

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const docenteId = await this.repo.obtenerIdDocente(usuarioId);
    if (!docenteId) { this.cargando.set(false); return; }

    const r = await this.repo.obtenerHorariosHoy(docenteId, this.fecha);
    this.cargando.set(false);
    if (r.error !== null) { this.error.set(r.error); setTimeout(() => this.error.set(null), 4000); return; }
    this.clases.set(r.datos);
  }
}
