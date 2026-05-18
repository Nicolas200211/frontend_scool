import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { PadreRepository } from '../../../core/domain/ports/padre.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { AsistenciaHijo } from '../../../core/domain/models/asistencia-hijo.model';
import { HijoInfo } from '../../../core/domain/models/hijo-info.model';

const COLORES: Record<string, string> = {
  presente: 'bg-emerald-50 border-emerald-150 text-emerald-700 font-bold',
  ausente: 'bg-rose-50 border-rose-150 text-rose-600 font-bold',
  tardanza: 'bg-amber-50 border-amber-150 text-amber-700 font-bold',
  justificado: 'bg-indigo-50 border-indigo-150 text-indigo-700 font-bold',
};

@Component({
  selector: 'app-asistencia-padre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, PaginadorComponent],
  template: `
    <app-page-header titulo="Asistencia de Alumnos" subtitulo="Consulta y supervisa la puntualidad de tus hijos" />

    <!-- Filters bento box -->
    <div class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap gap-5 items-end mb-6">
      @if (hijos().length > 1) {
        <div class="w-full sm:w-auto min-w-[200px]">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar hijo</label>
          <select (change)="seleccionarHijo($event)"
            class="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
            @for (h of hijos(); track h.estudianteId) {
              <option [value]="h.estudianteId">{{ h.estudianteApellido }}, {{ h.estudianteNombre }}</option>
            }
          </select>
        </div>
      }
      
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

    <!-- Summary Stats cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <article class="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-center flex flex-col justify-center">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clases Totales</p>
        <p class="text-3xl font-black text-slate-800 font-mono">{{ estadisticas().total }}</p>
      </article>
      
      <article class="bg-emerald-50/40 border border-emerald-100/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-center flex flex-col justify-center">
        <p class="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Clases Presente</p>
        <p class="text-3xl font-black text-emerald-700 font-mono">{{ estadisticas().presentes }}</p>
      </article>
      
      <article class="bg-rose-50/40 border border-rose-100/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-center flex flex-col justify-center">
        <p class="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Clases Ausente</p>
        <p class="text-3xl font-black text-rose-700 font-mono">{{ estadisticas().ausentes }}</p>
      </article>
      
      <article class="bg-amber-50/40 border border-amber-100/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-center flex flex-col justify-center">
        <p class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Tardanzas</p>
        <p class="text-3xl font-black text-amber-700 font-mono">{{ estadisticas().tardanzas }}</p>
      </article>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (registros().length === 0) {
      <app-empty-state titulo="Sin registros" descripcion="No hay asistencia registrada en este período" />
    } @else {
      <!-- Attendance list table card -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="px-6 py-4 text-left">Fecha</th>
                <th class="px-6 py-4 text-left">Asignatura</th>
                <th class="px-6 py-4 text-left">Horario</th>
                <th class="px-6 py-4 text-left">Estado</th>
                <th class="px-6 py-4 text-left">Justificación</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (r of registrosPagina(); track r.id) {
                <tr class="hover:bg-slate-50/30 transition duration-150">
                  <td class="px-6 py-4 text-slate-500 font-mono font-bold">{{ r.fecha }}</td>
                  <td class="px-6 py-4 font-extrabold text-slate-800">{{ r.asignaturaNombre }}</td>
                  <td class="px-6 py-4 text-slate-400 font-mono text-xs">{{ r.horaInicio }} – {{ r.horaFin }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border capitalize"
                      [class]="colorEstado(r.estado)">
                      {{ r.estado }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    @if (r.tieneJustificacion) {
                      <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold rounded-full">
                        <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                        Enviada
                      </span>
                    } @else if (r.estado === 'ausente') {
                      <span class="text-xs text-slate-400 font-medium">No justificada</span>
                    } @else {
                      <span class="text-slate-300 font-mono">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-4 border-t border-slate-50">
          <app-paginador [paginaActual]="pagina()" [total]="registros().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
        </div>
      </div>
    }
  `,
})
export class AsistenciaPadreComponent implements OnInit {
  private readonly repo = inject(PadreRepository);
  private readonly authState = inject(AuthState);

  readonly cargando = signal(true);
  readonly registros = signal<AsistenciaHijo[]>([]);
  readonly estadisticas = signal({ total: 0, presentes: 0, ausentes: 0, tardanzas: 0 });
  readonly hijos = signal<HijoInfo[]>([]);
  private hijoActual: HijoInfo | null = null;

  readonly porPagina = 8;
  readonly pagina = signal(1);

  readonly registrosPagina = computed(() => {
    const start = (this.pagina() - 1) * this.porPagina;
    return this.registros().slice(start, start + this.porPagina);
  });

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
    if (r.error !== null) { this.cargando.set(false); toast.error(r.error); return; }
    if (r.datos.length === 0) { this.cargando.set(false); return; }

    this.hijos.set(r.datos);
    this.hijoActual = r.datos[0];
    await this.cargar();
  }

  seleccionarHijo(evento: Event): void {
    const id = (evento.target as HTMLSelectElement).value;
    this.hijoActual = this.hijos().find((h) => h.estudianteId === id) ?? null;
    this.pagina.set(1);
    this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.hijoActual) { this.cargando.set(false); return; }
    this.cargando.set(true);
    const r = await this.repo.obtenerAsistenciaHijo(this.hijoActual.estudianteId, this.fechaDesde, this.fechaHasta);
    this.cargando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.registros.set(r.datos);
    this.pagina.set(1);
    const stats = { total: r.datos.length, presentes: 0, ausentes: 0, tardanzas: 0 };
    r.datos.forEach((rec) => {
      if (rec.estado === 'presente' || rec.estado === 'justificado') stats.presentes++;
      else if (rec.estado === 'ausente') stats.ausentes++;
      else if (rec.estado === 'tardanza') stats.tardanzas++;
    });
    this.estadisticas.set(stats);
  }

  colorEstado(estado: string): string { return COLORES[estado] ?? 'bg-gray-100 text-gray-600'; }
}
