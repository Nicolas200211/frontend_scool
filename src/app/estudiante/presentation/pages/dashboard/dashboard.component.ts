import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EstudianteRepository } from '../../../core/domain/ports/estudiante.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';

@Component({
  selector: 'app-dashboard-estudiante',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <app-page-header
      [titulo]="'Hola, ' + (authState.usuarioActual()?.nombre ?? '')"
      subtitulo="Tu resumen de asistencia"
    />

    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" aria-label="Mi asistencia">
      <article class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">% Asistencia (mes)</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats().porcentaje }}%</p>
      </article>
      <article class="bg-red-50 rounded-xl p-5 shadow-sm border border-red-100">
        <p class="text-sm text-red-500 mb-1">Faltas</p>
        <p class="text-2xl font-bold text-red-600">{{ stats().ausentes }}</p>
      </article>
      <article class="bg-yellow-50 rounded-xl p-5 shadow-sm border border-yellow-100">
        <p class="text-sm text-yellow-600 mb-1">Tardanzas</p>
        <p class="text-2xl font-bold text-yellow-700">{{ stats().tardanzas }}</p>
      </article>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <a routerLink="/estudiante/asistencia" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition block">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          </div>
          <p class="font-semibold text-gray-900">Mi asistencia</p>
        </div>
        <p class="text-sm text-gray-500">Consulta tu historial de asistencia</p>
      </a>
      <a routerLink="/estudiante/horario" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition block">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          </div>
          <p class="font-semibold text-gray-900">Mi horario</p>
        </div>
        <p class="text-sm text-gray-500">Consulta tu horario de clases</p>
      </a>
    </section>
  `,
})
export class DashboardEstudianteComponent implements OnInit {
  readonly authState = inject(AuthState);
  private readonly repo = inject(EstudianteRepository);

  readonly stats = signal({ porcentaje: 0, ausentes: 0, tardanzas: 0 });

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) return;

    const estudianteId = await this.repo.obtenerEstudianteId(usuarioId);
    if (!estudianteId) return;

    const hoy = new Date().toISOString().slice(0, 10);
    const inicio = new Date();
    inicio.setDate(1);
    const inicioMes = inicio.toISOString().slice(0, 10);

    const r = await this.repo.obtenerMiAsistencia(estudianteId, inicioMes, hoy);
    if (r.error === null) {
      const total = r.datos.length;
      const presentes = r.datos.filter((a) => a.estado === 'presente' || a.estado === 'justificado').length;
      const ausentes = r.datos.filter((a) => a.estado === 'ausente').length;
      const tardanzas = r.datos.filter((a) => a.estado === 'tardanza').length;
      this.stats.set({ porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 100, ausentes, tardanzas });
    }
  }
}
