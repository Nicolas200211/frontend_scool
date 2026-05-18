import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AsistenciaRepository } from '../../../core/domain/ports/asistencia.repository';
import { RegistroAsistenciaAdmin } from '../../../core/domain/models/asistencia.model';

interface ResumenPorAsignatura {
  asignaturaNombre: string;
  total: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  porcentaje: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header titulo="Reportes" subtitulo="Estadísticas de asistencia por asignatura" />

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
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <article class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500 mb-1">Total registros</p>
          <p class="text-2xl font-bold text-gray-900">{{ totales().total }}</p>
        </article>
        <article class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500 mb-1">% Asistencia general</p>
          <p class="text-2xl font-bold text-green-600">{{ totales().porcentaje }}%</p>
        </article>
        <article class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500 mb-1">Total ausencias</p>
          <p class="text-2xl font-bold text-red-500">{{ totales().ausentes }}</p>
        </article>
      </div>

      @if (resumenPorAsignatura().length > 0) {
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Asignatura</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">Clases</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">Presentes</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">Ausentes</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-600">% Asistencia</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (r of resumenPorAsignatura(); track r.asignaturaNombre) {
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ r.asignaturaNombre }}</td>
                  <td class="px-4 py-3 text-right text-gray-500 tabular-nums">{{ r.total }}</td>
                  <td class="px-4 py-3 text-right text-green-600 tabular-nums">{{ r.presentes }}</td>
                  <td class="px-4 py-3 text-right text-red-500 tabular-nums">{{ r.ausentes }}</td>
                  <td class="px-4 py-3 text-right">
                    <span class="font-semibold" [class]="r.porcentaje >= 80 ? 'text-green-600' : r.porcentaje >= 60 ? 'text-yellow-600' : 'text-red-500'">
                      {{ r.porcentaje }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center py-14">
          <p class="text-sm text-gray-400">Sin datos para el período seleccionado</p>
        </div>
      }
    }
  `,
})
export class ReportesComponent implements OnInit {
  private readonly repo = inject(AsistenciaRepository);
  private readonly registros = signal<RegistroAsistenciaAdmin[]>([]);

  readonly cargando = signal(true);

  readonly resumenPorAsignatura = computed<ResumenPorAsignatura[]>(() => {
    const mapa = new Map<string, ResumenPorAsignatura>();
    for (const r of this.registros()) {
      const k = r.asignaturaNombre;
      if (!mapa.has(k)) mapa.set(k, { asignaturaNombre: k, total: 0, presentes: 0, ausentes: 0, tardanzas: 0, porcentaje: 0 });
      const entrada = mapa.get(k)!;
      entrada.total++;
      if (r.estado === 'presente' || r.estado === 'justificado') entrada.presentes++;
      else if (r.estado === 'ausente') entrada.ausentes++;
      else if (r.estado === 'tardanza') entrada.tardanzas++;
      entrada.porcentaje = Math.round((entrada.presentes / entrada.total) * 100);
    }
    return Array.from(mapa.values()).sort((a, b) => a.asignaturaNombre.localeCompare(b.asignaturaNombre));
  });

  readonly totales = computed(() => {
    const lista = this.resumenPorAsignatura();
    const total = lista.reduce((s, r) => s + r.total, 0);
    const presentes = lista.reduce((s, r) => s + r.presentes, 0);
    const ausentes = lista.reduce((s, r) => s + r.ausentes, 0);
    return { total, presentes, ausentes, porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0 };
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
