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

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';

@Component({
  selector: 'app-reportes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent, BuscadorComponent, PaginadorComponent],
  template: `
    <app-page-header titulo="Reportes" subtitulo="Estadísticas de asistencia por asignatura" />

    <!-- Filters bento box -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex flex-wrap items-center gap-4 flex-1">
        <div class="flex items-center gap-2 shrink-0">
          <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          <span class="text-xs font-bold text-slate-800 uppercase tracking-wider">Rango Académico</span>
        </div>
        
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="relative w-1/2 sm:w-44">
            <label class="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Desde</label>
            <input type="date" [(ngModel)]="fechaDesde" (change)="cargar()"
              class="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono"/>
          </div>
          <div class="relative w-1/2 sm:w-44">
            <label class="absolute -top-2 left-3 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Hasta</label>
            <input type="date" [(ngModel)]="fechaHasta" (change)="cargar()"
              class="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono"/>
          </div>
        </div>
      </div>
      
      <div class="w-full sm:w-auto flex-1 max-w-xs shrink-0">
        <app-buscador placeholder="Buscar asignatura..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else {
      <!-- Bento Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <article class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <p class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total registros</p>
          <p class="text-3xl font-black text-indigo-700 font-mono mt-4 inline-flex items-center gap-1.5">
            {{ totales().total }}
            <span class="text-[10px] font-extrabold uppercase text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-full border border-indigo-100/30">Clases</span>
          </p>
        </article>
        
        <article class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <p class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">% Asistencia general</p>
          <p class="text-3xl font-black text-emerald-600 font-mono mt-4 inline-flex items-center gap-1.5">
            {{ totales().porcentaje }}%
            <span class="text-[10px] font-extrabold uppercase text-emerald-600 bg-emerald-50 border border-emerald-100/30 px-2 py-0.5 rounded-full">Presentes</span>
          </p>
        </article>
        
        <article class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <p class="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total ausencias</p>
          <p class="text-3xl font-black text-rose-600 font-mono mt-4 inline-flex items-center gap-1.5">
            {{ totales().ausentes }}
            <span class="text-[10px] font-extrabold uppercase text-rose-600 bg-rose-50 border border-rose-100/30 px-2 py-0.5 rounded-full">Faltas</span>
          </p>
        </article>
      </div>

      @if (resumenPorAsignaturaFiltrado().length > 0) {
        <!-- Bento Table Card -->
        <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th class="px-6 py-4 text-left">Asignatura</th>
                  <th class="px-6 py-4 text-right">Clases Programadas</th>
                  <th class="px-6 py-4 text-right">Poder de Asistencia (Presentes)</th>
                  <th class="px-6 py-4 text-right">Ausentes</th>
                  <th class="px-6 py-4 text-right">% Asistencia</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (r of resumenPorAsignaturaPagina(); track r.asignaturaNombre) {
                  <tr class="hover:bg-slate-50/30 transition duration-150">
                    <td class="px-6 py-4 font-extrabold text-slate-800 text-sm">{{ r.asignaturaNombre }}</td>
                    <td class="px-6 py-4 text-right text-slate-500 font-bold font-mono text-xs">{{ r.total }}</td>
                    <td class="px-6 py-4 text-right text-emerald-600 font-bold font-mono text-xs">{{ r.presentes }}</td>
                    <td class="px-6 py-4 text-right text-rose-500 font-bold font-mono text-xs">{{ r.ausentes }}</td>
                    <td class="px-6 py-4 text-right">
                      <span class="inline-block px-3 py-1 rounded-full text-xs font-extrabold border font-mono"
                        [class]="r.porcentaje >= 80 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : r.porcentaje >= 60 
                          ? 'bg-amber-50 border-amber-100 text-amber-700' 
                          : 'bg-rose-50 border-rose-100 text-rose-700'">
                        {{ r.porcentaje }}%
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="p-4 border-t border-slate-50">
            <app-paginador [paginaActual]="pagina()" [total]="resumenPorAsignaturaFiltrado().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
          </div>
        </div>
      } @else {
        <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center justify-center py-16">
          <p class="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">Sin datos para el período seleccionado</p>
        </div>
      }
    }
  `,
})
export class ReportesComponent implements OnInit {
  private readonly repo = inject(AsistenciaRepository);
  private readonly registros = signal<RegistroAsistenciaAdmin[]>([]);

  readonly cargando = signal(true);

  readonly porPagina = 10;
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');

  readonly resumenPorAsignaturaFiltrado = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    const resumenes = this.resumenPorAsignatura();
    if (!busqueda) return resumenes;
    return resumenes.filter((r) => r.asignaturaNombre.toLowerCase().includes(busqueda));
  });

  readonly resumenPorAsignaturaPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.porPagina;
    return this.resumenPorAsignaturaFiltrado().slice(inicio, inicio + this.porPagina);
  });

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
