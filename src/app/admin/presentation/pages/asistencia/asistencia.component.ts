import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { AsistenciaRepository } from '../../../core/domain/ports/asistencia.repository';
import { RegistroAsistenciaAdmin } from '../../../core/domain/models/asistencia.model';

const POR_PAGINA = 15;

const COLORES_ESTADO: Record<string, string> = {
  presente: 'bg-green-100 text-green-700',
  ausente: 'bg-red-100 text-red-600',
  tardanza: 'bg-yellow-100 text-yellow-700',
  justificado: 'bg-blue-100 text-blue-700',
};

@Component({
  selector: 'app-asistencia-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, PaginadorComponent],
  template: `
    <app-page-header titulo="Asistencia" subtitulo="Consulta el registro de asistencia por período" />

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
    @else if (registros().length === 0) { <app-empty-state titulo="Sin registros" descripcion="No hay asistencia registrada en este período" /> }
    @else {
      <p class="text-sm text-gray-500 mb-3">{{ registros().length }} registro(s)</p>
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Fecha</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Estudiante</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Asignatura</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Sección</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (r of registrosPagina(); track r.id) {
              <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3 text-gray-500 tabular-nums">{{ r.fecha }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900">{{ r.estudianteNombre }} {{ r.estudianteApellido }}</p>
                  <p class="text-xs text-gray-400 font-mono">{{ r.estudianteCodigo }}</p>
                </td>
                <td class="px-4 py-3 text-gray-700">{{ r.asignaturaNombre }}</td>
                <td class="px-4 py-3 text-gray-500">{{ r.gradoNombre }} — {{ r.seccionNombre }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize" [class]="colorEstado(r.estado)">
                    {{ r.estado }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-paginador [paginaActual]="pagina()" [total]="registros().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
    }

    @if (error()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-red-600">{{ error() }}</p>
      </div>
    }
  `,
})
export class AsistenciaAdminComponent implements OnInit {
  private readonly repo = inject(AsistenciaRepository);

  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly registros = signal<RegistroAsistenciaAdmin[]>([]);
  readonly pagina = signal(1);

  readonly registrosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.registros().slice(inicio, inicio + POR_PAGINA);
  });

  fechaDesde = new Date().toISOString().slice(0, 10);
  fechaHasta = new Date().toISOString().slice(0, 10);

  async ngOnInit(): Promise<void> { await this.cargar(); }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    const r = await this.repo.obtenerRegistrosAdmin(this.fechaDesde, this.fechaHasta);
    this.cargando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.registros.set(r.datos);
    this.pagina.set(1);
  }

  colorEstado(estado: string): string { return COLORES_ESTADO[estado] ?? 'bg-gray-100 text-gray-600'; }
  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
