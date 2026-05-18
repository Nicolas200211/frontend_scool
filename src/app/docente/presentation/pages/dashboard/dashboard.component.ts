import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { AsistenciaRepository } from '../../../../admin/core/domain/ports/asistencia.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { HorarioHoy } from '../../../../admin/core/domain/models/asistencia.model';

@Component({
  selector: 'app-dashboard-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <app-page-header
      [titulo]="'Bienvenido, ' + (authState.usuarioActual()?.nombre ?? '')"
      subtitulo="Resumen de tus clases de hoy"
    />

    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" aria-label="Resumen del día">
      <article class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">Clases hoy</p>
        <p class="text-2xl font-bold text-gray-900">{{ clases().length || '—' }}</p>
      </article>
      <article class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">Asistencia tomada</p>
        <p class="text-2xl font-bold text-green-600">{{ clasesTomadas() }}</p>
      </article>
      <article class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">Pendientes</p>
        <p class="text-2xl font-bold text-yellow-600">{{ clases().length - clasesTomadas() }}</p>
      </article>
    </section>

    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-semibold text-gray-800">Clases de hoy</h2>
        <a routerLink="/docente/asistencia" class="text-xs font-medium text-indigo-600 hover:underline">Tomar asistencia →</a>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        @if (cargando()) {
          <div class="flex items-center justify-center py-10">
            <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (clases().length === 0) {
          <div class="flex flex-col items-center justify-center py-14 text-center">
            <p class="text-sm text-gray-400">No tienes clases programadas para hoy</p>
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Asignatura</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Sección</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Horario</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (c of clases(); track c.id) {
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ c.asignaturaNombre }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ c.gradoNombre }} — {{ c.seccionNombre }}</td>
                  <td class="px-4 py-3 text-gray-500 tabular-nums">{{ c.horaInicio }} – {{ c.horaFin }}</td>
                  <td class="px-4 py-3">
                    @if (c.asistenciaTomada) {
                      <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Tomada</span>
                    } @else {
                      <span class="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pendiente</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </section>
  `,
})
export class DashboardDocenteComponent implements OnInit {
  readonly authState = inject(AuthState);
  private readonly repo = inject(AsistenciaRepository);

  readonly cargando = signal(true);
  readonly clases = signal<HorarioHoy[]>([]);

  get clasesTomadas(): () => number {
    return () => this.clases().filter((c) => c.asistenciaTomada).length;
  }

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const docenteId = await this.repo.obtenerIdDocente(usuarioId);
    if (!docenteId) { this.cargando.set(false); return; }

    const hoy = new Date().toISOString().slice(0, 10);
    const r = await this.repo.obtenerHorariosHoy(docenteId, hoy);
    this.cargando.set(false);
    if (r.error === null) this.clases.set(r.datos);
  }
}
