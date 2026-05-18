import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { EstudianteRepository } from '../../../core/domain/ports/estudiante.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { MiAsistencia } from '../../../core/domain/models/mi-asistencia.model';

const COLORES: Record<string, string> = {
  presente: 'bg-green-100 text-green-700',
  ausente: 'bg-red-100 text-red-600',
  tardanza: 'bg-yellow-100 text-yellow-700',
  justificado: 'bg-blue-100 text-blue-700',
};

@Component({
  selector: 'app-asistencia-estudiante',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header titulo="Mi Asistencia" subtitulo="Historial de tus asistencias" />

    <div class="flex flex-wrap gap-3 mb-6">
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Desde</label>
        <input type="date" [(ngModel)]="fechaDesde" (change)="cargar()"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
        <input type="date" [(ngModel)]="fechaHasta" (change)="cargar()"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <article class="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
        <p class="text-xs text-gray-500 mb-1">Total</p>
        <p class="text-xl font-bold text-gray-900">{{ stats().total }}</p>
      </article>
      <article class="bg-green-50 rounded-xl p-4 border border-green-100 shadow-sm text-center">
        <p class="text-xs text-green-600 mb-1">Presentes</p>
        <p class="text-xl font-bold text-green-700">{{ stats().presentes }}</p>
      </article>
      <article class="bg-red-50 rounded-xl p-4 border border-red-100 shadow-sm text-center">
        <p class="text-xs text-red-500 mb-1">Ausentes</p>
        <p class="text-xl font-bold text-red-600">{{ stats().ausentes }}</p>
      </article>
      <article class="bg-yellow-50 rounded-xl p-4 border border-yellow-100 shadow-sm text-center">
        <p class="text-xs text-yellow-600 mb-1">% Asistencia</p>
        <p class="text-xl font-bold text-yellow-700">{{ stats().porcentaje }}%</p>
      </article>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (registros().length === 0) { <app-empty-state titulo="Sin registros" descripcion="No hay asistencia registrada en este período" /> }
    @else {
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Asignatura</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Horario</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Observación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (r of registros(); track r.id) {
              <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3 text-gray-500 tabular-nums">{{ r.fecha }}</td>
                <td class="px-4 py-3 font-medium text-gray-900">{{ r.asignaturaNombre }}</td>
                <td class="px-4 py-3 text-gray-400 text-xs tabular-nums">{{ r.horaInicio }} – {{ r.horaFin }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize" [class]="colorEstado(r.estado)">
                    {{ r.estado }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ r.observacion ?? '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (error()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-red-600">{{ error() }}</p>
      </div>
    }
  `,
})
export class AsistenciaEstudianteComponent implements OnInit {
  private readonly repo = inject(EstudianteRepository);
  private readonly authState = inject(AuthState);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly registros = signal<MiAsistencia[]>([]);
  readonly stats = signal({ total: 0, presentes: 0, ausentes: 0, porcentaje: 0 });

  fechaDesde: string;
  fechaHasta: string;
  private estudianteId: string | null = null;

  constructor() {
    const hoy = new Date();
    this.fechaHasta = hoy.toISOString().slice(0, 10);
    hoy.setDate(1);
    this.fechaDesde = hoy.toISOString().slice(0, 10);
  }

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }
    this.estudianteId = await this.repo.obtenerEstudianteId(usuarioId);
    await this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.estudianteId) { this.cargando.set(false); return; }
    this.cargando.set(true);
    const r = await this.repo.obtenerMiAsistencia(this.estudianteId, this.fechaDesde, this.fechaHasta);
    this.cargando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.registros.set(r.datos);
    const total = r.datos.length;
    const presentes = r.datos.filter((a) => a.estado === 'presente' || a.estado === 'justificado').length;
    const ausentes = r.datos.filter((a) => a.estado === 'ausente').length;
    this.stats.set({ total, presentes, ausentes, porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 100 });
  }

  colorEstado(estado: string): string { return COLORES[estado] ?? 'bg-gray-100 text-gray-600'; }
  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
