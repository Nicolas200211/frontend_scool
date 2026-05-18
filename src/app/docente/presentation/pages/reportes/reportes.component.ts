import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
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

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-reportes-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent, PaginadorComponent, BuscadorComponent],
  template: `
    <app-page-header titulo="Reportes" subtitulo="Estadísticas de asistencia del periodo seleccionado" />

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
        <app-buscador placeholder="Buscar estudiante..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else {
      @if (resumenEstudiantesFiltrados().length === 0) {
        <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center py-16 text-center">
          <p class="text-sm text-slate-400">Sin datos de registros para el período seleccionado.</p>
        </div>
      } @else {
        <!-- Report table bento card -->
        <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th class="px-6 py-4 text-left">Estudiante</th>
                  <th class="px-6 py-4 text-right">Clases</th>
                  <th class="px-6 py-4 text-right">Presentes</th>
                  <th class="px-6 py-4 text-right">Ausentes</th>
                  <th class="px-6 py-4 text-right">Tardanzas</th>
                  <th class="px-6 py-4 text-right">% Asist.</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (r of resumenEstudiantesPagina(); track r.codigo) {
                  <tr class="hover:bg-slate-50/30 transition duration-150">
                    <td class="px-6 py-4 shrink-0">
                      <p class="font-extrabold text-slate-800">{{ r.apellido }}, {{ r.nombre }}</p>
                      <p class="text-[10px] text-slate-400 font-mono font-bold">{{ r.codigo }}</p>
                    </td>
                    <td class="px-6 py-4 text-right text-slate-500 font-mono font-bold">{{ r.total }}</td>
                    <td class="px-6 py-4 text-right text-emerald-600 font-mono font-bold">{{ r.presentes }}</td>
                    <td class="px-6 py-4 text-right text-rose-500 font-mono font-bold">{{ r.ausentes }}</td>
                    <td class="px-6 py-4 text-right text-amber-600 font-mono font-bold">{{ r.tardanzas }}</td>
                    <td class="px-6 py-4 text-right">
                      <span class="font-black font-mono shrink-0" 
                        [class]="r.porcentaje >= 80 ? 'text-emerald-600' : r.porcentaje >= 60 ? 'text-amber-600' : 'text-rose-500'">
                        {{ r.porcentaje }}%
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="p-4 border-t border-slate-50">
            <app-paginador [paginaActual]="pagina()" [total]="resumenEstudiantesFiltrados().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
          </div>
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

  readonly porPagina = 10;
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');

  readonly resumenEstudiantesFiltrados = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    const lista = this.resumenEstudiantes();
    if (!busqueda) return lista;
    return lista.filter((e) =>
      e.nombre.toLowerCase().includes(busqueda) ||
      e.apellido.toLowerCase().includes(busqueda) ||
      e.codigo.toLowerCase().includes(busqueda)
    );
  });

  readonly resumenEstudiantesPagina = computed<ResumenEstudiante[]>(() => {
    const start = (this.pagina() - 1) * this.porPagina;
    return this.resumenEstudiantesFiltrados().slice(start, start + this.porPagina);
  });

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
    if (r.error === null) {
      this.registros.set(r.datos);
      this.pagina.set(1);
    }
  }
}
