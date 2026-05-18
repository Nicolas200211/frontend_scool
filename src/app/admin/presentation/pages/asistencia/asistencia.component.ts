import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { AsistenciaRepository } from '../../../core/domain/ports/asistencia.repository';
import { RegistroAsistenciaAdmin } from '../../../core/domain/models/asistencia.model';

const POR_PAGINA = 15;

const COLORES_ESTADO: Record<string, string> = {
  presente: 'bg-emerald-50 border-emerald-100/50 text-emerald-700 font-bold',
  ausente: 'bg-rose-50 border-rose-100/50 text-rose-700 font-bold',
  tardanza: 'bg-amber-50 border-amber-100/50 text-amber-700 font-bold',
  justificado: 'bg-indigo-50 border-indigo-100/50 text-indigo-700 font-bold',
};

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-asistencia-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, PaginadorComponent, BuscadorComponent],
  template: `
    <app-page-header titulo="Asistencia General" subtitulo="Supervisión global de registros de asistencia por fecha" />

    <!-- Filters bento box -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex flex-wrap items-center gap-4 flex-1">
        <div class="flex items-center gap-2 shrink-0">
          <span class="w-2 h-2 bg-indigo-500 rounded-full"></span>
          <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Filtrar Rango</span>
        </div>
        
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="relative w-1/2 sm:w-44">
            <label class="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Desde</label>
            <input type="date" [(ngModel)]="fechaDesde" (change)="cargar()"
              class="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono"/>
          </div>
          <div class="relative w-1/2 sm:w-44">
            <label class="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hasta</label>
            <input type="date" [(ngModel)]="fechaHasta" (change)="cargar()"
              class="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono"/>
          </div>
        </div>
      </div>
      
      <div class="w-full sm:w-auto flex-1 max-w-xs shrink-0">
        <app-buscador placeholder="Buscar registro..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (registros().length === 0) { <app-empty-state titulo="Sin registros" descripcion="No hay asistencia registrada en este período" /> }
    @else {
      <div class="flex items-center gap-2 mb-3">
        <span class="inline-flex items-center justify-center px-2.5 py-0.5 bg-indigo-50 border border-indigo-100/30 text-indigo-700 text-[10px] font-extrabold rounded-full font-mono">
          {{ registrosFiltrados().length }} REGISTROS ENCONTRADOS
        </span>
      </div>

      <!-- General attendance table card -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="px-6 py-4 text-left">Fecha</th>
                <th class="px-6 py-4 text-left">Estudiante</th>
                <th class="px-6 py-4 text-left">Asignatura</th>
                <th class="px-6 py-4 text-left">Sección</th>
                <th class="px-6 py-4 text-left">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (r of registrosPagina(); track r.id) {
                <tr class="hover:bg-slate-50/30 transition duration-150">
                  <td class="px-6 py-4 text-slate-500 font-mono font-bold">{{ r.fecha }}</td>
                  <td class="px-6 py-4 shrink-0">
                    <p class="font-extrabold text-slate-800">{{ r.estudianteNombre }} {{ r.estudianteApellido }}</p>
                    <p class="text-[10px] text-slate-400 font-mono font-bold">{{ r.estudianteCodigo }}</p>
                  </td>
                  <td class="px-6 py-4 font-bold text-slate-700">{{ r.asignaturaNombre }}</td>
                  <td class="px-6 py-4 text-slate-500 font-semibold text-xs">{{ r.gradoNombre }} — {{ r.seccionNombre }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border capitalize" [class]="colorEstado(r.estado)">
                      {{ r.estado }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-4 border-t border-slate-50">
          <app-paginador [paginaActual]="pagina()" [total]="registrosFiltrados().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
        </div>
      </div>
    }
  `,
})
export class AsistenciaAdminComponent implements OnInit {
  private readonly repo = inject(AsistenciaRepository);

  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly registros = signal<RegistroAsistenciaAdmin[]>([]);
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');

  readonly registrosFiltrados = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    if (!busqueda) return this.registros();
    return this.registros().filter((r) =>
      r.fecha.toLowerCase().includes(busqueda) ||
      r.estudianteNombre.toLowerCase().includes(busqueda) ||
      r.estudianteApellido.toLowerCase().includes(busqueda) ||
      r.estudianteCodigo.toLowerCase().includes(busqueda) ||
      r.asignaturaNombre.toLowerCase().includes(busqueda) ||
      r.gradoNombre.toLowerCase().includes(busqueda) ||
      r.seccionNombre.toLowerCase().includes(busqueda) ||
      r.estado.toLowerCase().includes(busqueda)
    );
  });

  readonly registrosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.registrosFiltrados().slice(inicio, inicio + POR_PAGINA);
  });

  fechaDesde = new Date().toISOString().slice(0, 10);
  fechaHasta = new Date().toISOString().slice(0, 10);

  async ngOnInit(): Promise<void> { await this.cargar(); }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    const r = await this.repo.obtenerRegistrosAdmin(this.fechaDesde, this.fechaHasta);
    this.cargando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.registros.set(r.datos);
    this.pagina.set(1);
  }

  colorEstado(estado: string): string { return COLORES_ESTADO[estado] ?? 'bg-gray-100 text-gray-600'; }
}
