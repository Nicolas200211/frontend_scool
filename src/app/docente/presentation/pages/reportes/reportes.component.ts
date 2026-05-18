import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AsistenciaRepository } from '../../../../admin/core/domain/ports/asistencia.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { RegistroAsistenciaAdmin } from '../../../../admin/core/domain/models/asistencia.model';

interface ResumenEstudiante {
  nombre: string;
  apellido: string;
  codigo: string;
  total: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  porcentaje: number;
}

@Component({
  selector: 'app-reportes-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header titulo="Reportes" subtitulo="Estadísticas de asistencia de tus clases" />

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

    @if (cargando()) { <app-loading-spinner /> }
    @else {
      @if (resumenEstudiantes().length === 0) {
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center py-14">
          <p class="text-sm text-gray-400">Sin datos para el período seleccionado</p>
        </div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Estudiante</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">Clases</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">Presentes</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">Ausentes</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">Tardanzas</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">% Asist.</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (r of resumenEstudiantes(); track r.codigo) {
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-4 py-3">
                    <p class="font-medium text-gray-900">{{ r.apellido }}, {{ r.nombre }}</p>
                    <p class="text-xs text-gray-400 font-mono">{{ r.codigo }}</p>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-500 tabular-nums">{{ r.total }}</td>
                  <td class="px-4 py-3 text-right text-green-600 tabular-nums">{{ r.presentes }}</td>
                  <td class="px-4 py-3 text-right text-red-500 tabular-nums">{{ r.ausentes }}</td>
                  <td class="px-4 py-3 text-right text-yellow-600 tabular-nums">{{ r.tardanzas }}</td>
                  <td class="px-4 py-3 text-right">
                    <span class="font-semibold tabular-nums" [class]="r.porcentaje >= 80 ? 'text-green-600' : r.porcentaje >= 60 ? 'text-yellow-600' : 'text-red-500'">
                      {{ r.porcentaje }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  `,
})
export class ReportesDocenteComponent implements OnInit {
  private readonly repo = inject(AsistenciaRepository);
  private readonly authState = inject(AuthState);
  private readonly registros = signal<RegistroAsistenciaAdmin[]>([]);

  readonly cargando = signal(true);

  readonly resumenEstudiantes = computed<ResumenEstudiante[]>(() => {
    const mapa = new Map<string, ResumenEstudiante>();
    for (const r of this.registros()) {
      const k = r.estudianteCodigo;
      if (!mapa.has(k)) mapa.set(k, { nombre: r.estudianteNombre, apellido: r.estudianteApellido, codigo: r.estudianteCodigo, total: 0, presentes: 0, ausentes: 0, tardanzas: 0, porcentaje: 0 });
      const entrada = mapa.get(k)!;
      entrada.total++;
      if (r.estado === 'presente' || r.estado === 'justificado') entrada.presentes++;
      else if (r.estado === 'ausente') entrada.ausentes++;
      else if (r.estado === 'tardanza') entrada.tardanzas++;
      entrada.porcentaje = Math.round((entrada.presentes / entrada.total) * 100);
    }
    return Array.from(mapa.values()).sort((a, b) => a.apellido.localeCompare(b.apellido));
  });

  fechaDesde: string;
  fechaHasta: string;

  constructor() {
    const hoy = new Date();
    this.fechaHasta = hoy.toISOString().slice(0, 10);
    hoy.setDate(1);
    this.fechaDesde = hoy.toISOString().slice(0, 10);
  }

  async ngOnInit(): Promise<void> { await this.cargar(); }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    const r = await this.repo.obtenerRegistrosAdmin(this.fechaDesde, this.fechaHasta);
    this.cargando.set(false);
    if (r.error === null) this.registros.set(r.datos);
  }
}
