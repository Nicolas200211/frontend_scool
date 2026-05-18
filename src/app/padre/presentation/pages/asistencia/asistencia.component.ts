import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PadreRepository } from '../../../core/domain/ports/padre.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { AsistenciaHijo } from '../../../core/domain/models/asistencia-hijo.model';
import { HijoInfo } from '../../../core/domain/models/hijo-info.model';

const COLORES: Record<string, string> = {
  presente: 'bg-green-100 text-green-700',
  ausente: 'bg-red-100 text-red-600',
  tardanza: 'bg-yellow-100 text-yellow-700',
  justificado: 'bg-blue-100 text-blue-700',
};

@Component({
  selector: 'app-asistencia-padre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header titulo="Asistencia" subtitulo="Historial de asistencia por período" />

    @if (hijos().length > 1) {
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-500 mb-1">Seleccionar hijo</label>
        <select (change)="seleccionarHijo($event)"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          @for (h of hijos(); track h.estudianteId) {
            <option [value]="h.estudianteId">{{ h.estudianteApellido }}, {{ h.estudianteNombre }}</option>
          }
        </select>
      </div>
    }

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
        <p class="text-xl font-bold text-gray-900">{{ estadisticas().total }}</p>
      </article>
      <article class="bg-green-50 rounded-xl p-4 border border-green-100 shadow-sm text-center">
        <p class="text-xs text-green-600 mb-1">Presentes</p>
        <p class="text-xl font-bold text-green-700">{{ estadisticas().presentes }}</p>
      </article>
      <article class="bg-red-50 rounded-xl p-4 border border-red-100 shadow-sm text-center">
        <p class="text-xs text-red-500 mb-1">Ausentes</p>
        <p class="text-xl font-bold text-red-600">{{ estadisticas().ausentes }}</p>
      </article>
      <article class="bg-yellow-50 rounded-xl p-4 border border-yellow-100 shadow-sm text-center">
        <p class="text-xs text-yellow-600 mb-1">Tardanzas</p>
        <p class="text-xl font-bold text-yellow-700">{{ estadisticas().tardanzas }}</p>
      </article>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (registros().length === 0) {
      <app-empty-state titulo="Sin registros" descripcion="No hay asistencia registrada en este período" />
    } @else {
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Asignatura</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Horario</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Justif.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (r of registros(); track r.id) {
              <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3 text-gray-500 tabular-nums">{{ r.fecha }}</td>
                <td class="px-4 py-3 font-medium text-gray-900">{{ r.asignaturaNombre }}</td>
                <td class="px-4 py-3 text-gray-400 text-xs tabular-nums">{{ r.horaInicio }} – {{ r.horaFin }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                    [class]="colorEstado(r.estado)">
                    {{ r.estado }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  @if (r.tieneJustificacion) {
                    <span class="text-xs text-blue-600 font-medium">Enviada</span>
                  } @else if (r.estado === 'ausente') {
                    <span class="text-xs text-gray-400">—</span>
                  }
                </td>
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
export class AsistenciaPadreComponent implements OnInit {
  private readonly repo = inject(PadreRepository);
  private readonly authState = inject(AuthState);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly registros = signal<AsistenciaHijo[]>([]);
  readonly estadisticas = signal({ total: 0, presentes: 0, ausentes: 0, tardanzas: 0 });
  readonly hijos = signal<HijoInfo[]>([]);
  private hijoActual: HijoInfo | null = null;

  fechaDesde: string;
  fechaHasta: string;

  constructor() {
    const hoy = new Date();
    this.fechaHasta = hoy.toISOString().slice(0, 10);
    hoy.setDate(1);
    this.fechaDesde = hoy.toISOString().slice(0, 10);
  }

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const r = await this.repo.obtenerHijos(usuarioId);
    if (r.error !== null) { this.cargando.set(false); this.mostrarError(r.error); return; }
    if (r.datos.length === 0) { this.cargando.set(false); return; }

    this.hijos.set(r.datos);
    this.hijoActual = r.datos[0];
    await this.cargar();
  }

  seleccionarHijo(evento: Event): void {
    const id = (evento.target as HTMLSelectElement).value;
    this.hijoActual = this.hijos().find((h) => h.estudianteId === id) ?? null;
    this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.hijoActual) { this.cargando.set(false); return; }
    this.cargando.set(true);
    const r = await this.repo.obtenerAsistenciaHijo(this.hijoActual.estudianteId, this.fechaDesde, this.fechaHasta);
    this.cargando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.registros.set(r.datos);
    const stats = { total: r.datos.length, presentes: 0, ausentes: 0, tardanzas: 0 };
    r.datos.forEach((rec) => {
      if (rec.estado === 'presente' || rec.estado === 'justificado') stats.presentes++;
      else if (rec.estado === 'ausente') stats.ausentes++;
      else if (rec.estado === 'tardanza') stats.tardanzas++;
    });
    this.estadisticas.set(stats);
  }

  colorEstado(estado: string): string { return COLORES[estado] ?? 'bg-gray-100 text-gray-600'; }
  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
