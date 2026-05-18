import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { JustificacionesRepository } from '../../../../admin/core/domain/ports/justificaciones.repository';
import { AsistenciaRepository } from '../../../../admin/core/domain/ports/asistencia.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { Justificacion } from '../../../../admin/core/domain/models/justificacion.model';

const COLORES: Record<string, string> = {
  pendiente: 'bg-amber-50 border-amber-100/50 text-amber-700',
  aprobado: 'bg-emerald-50 border-emerald-100/50 text-emerald-700',
  rechazado: 'bg-rose-50 border-rose-100/50 text-rose-700',
};

const POR_PAGINA = 5;

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-justificaciones-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, PaginadorComponent, BuscadorComponent],
  template: `
    <app-page-header titulo="Justificaciones" subtitulo="Revisión y aprobación de inasistencias justificadas" />
 
    <!-- Top Action Bar -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-md">
        <app-buscador placeholder="Buscar justificación..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (justificacionesFiltradas().length === 0) {
      <app-empty-state titulo="Sin justificaciones" descripcion="No se encontraron justificaciones que coincidan con la búsqueda." />
    } @else {
      <!-- Bento Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
        @for (j of justificacionesPagina(); track j.id) {
          <article class="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex flex-col justify-between">
            
            <div class="space-y-3">
              <header class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="font-extrabold text-slate-800 text-xs leading-snug break-words">
                    {{ j.estudianteApellido }}, {{ j.estudianteNombre }}
                  </h3>
                </div>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border capitalize tracking-wider font-mono shrink-0" [class]="colorEstado(j.estado)">
                  {{ j.estado }}
                </span>
              </header>
              
              <div class="flex flex-wrap gap-1.5 text-[10px] font-extrabold text-slate-400 font-mono">
                <span class="inline-flex items-center px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                  {{ j.asignaturaNombre }}
                </span>
                <span class="inline-flex items-center px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500 font-mono">
                  {{ j.fecha }}
                </span>
              </div>

              <div class="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50">
                <span class="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1 font-mono">Motivo</span>
                <p class="text-xs font-semibold text-slate-600 leading-relaxed break-words line-clamp-3">{{ j.motivo }}</p>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-50 space-y-2">
              <p class="text-[9px] font-extrabold text-slate-400 font-mono truncate">
                Apoderado: {{ j.apoderadoNombre }}
              </p>

              @if (j.estado === 'pendiente') {
                <div class="flex gap-2 w-full pt-1">
                  <button (click)="cambiarEstado(j.id, 'aprobado')"
                    class="flex-1 py-1.5 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all duration-150 hover:-translate-y-0.5 text-center">
                    Aprobar
                  </button>
                  <button (click)="cambiarEstado(j.id, 'rechazado')"
                    class="flex-1 py-1.5 text-[10px] font-black text-slate-700 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-lg transition-all duration-150 text-center">
                    Rechazar
                  </button>
                </div>
              }
            </div>

          </article>
        }
      </div>

      <div class="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <app-paginador [paginaActual]="pagina()" [total]="justificacionesFiltradas().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
      </div>
    }
  `,
})
export class JustificacionesDocenteComponent implements OnInit {
  private readonly repo = inject(JustificacionesRepository);
  private readonly asistenciaRepo = inject(AsistenciaRepository);
  private readonly authState = inject(AuthState);

  readonly cargando = signal(true);
  readonly justificaciones = signal<Justificacion[]>([]);

  readonly porPagina = POR_PAGINA;
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');

  readonly justificacionesFiltradas = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    const lista = this.justificaciones();
    if (!busqueda) return lista;
    return lista.filter((j) =>
      j.estudianteNombre.toLowerCase().includes(busqueda) ||
      j.estudianteApellido.toLowerCase().includes(busqueda) ||
      j.asignaturaNombre.toLowerCase().includes(busqueda) ||
      j.motivo.toLowerCase().includes(busqueda) ||
      j.estado.toLowerCase().includes(busqueda)
    );
  });

  readonly justificacionesPagina = computed(() => {
    const start = (this.pagina() - 1) * POR_PAGINA;
    return this.justificacionesFiltradas().slice(start, start + POR_PAGINA);
  });

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const docenteId = await this.asistenciaRepo.obtenerIdDocente(usuarioId);
    if (!docenteId) { this.cargando.set(false); return; }

    const r = await this.repo.obtenerPorDocente(docenteId);
    this.cargando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.justificaciones.set(r.datos);
  }

  async cambiarEstado(id: string, estado: 'aprobado' | 'rechazado'): Promise<void> {
    const r = await this.repo.actualizarEstado(id, estado);
    if (r.error !== null) { toast.error(r.error); return; }
    this.justificaciones.update((lista) =>
      lista.map((j) => (j.id === id ? { ...j, estado } : j))
    );
    const maxPaginas = Math.ceil(this.justificaciones().length / POR_PAGINA);
    if (this.pagina() > maxPaginas && maxPaginas > 0) {
      this.pagina.set(maxPaginas);
    }
    toast.success(`Justificación ${estado} correctamente`);
  }

  colorEstado(estado: string): string { return COLORES[estado] ?? 'bg-gray-100 text-gray-600'; }
}
