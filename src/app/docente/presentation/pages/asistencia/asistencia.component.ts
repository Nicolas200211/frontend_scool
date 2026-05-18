import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { AsistenciaRepository } from '../../../../admin/core/domain/ports/asistencia.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { HorarioHoy, RegistroAsistencia, EstadoAsistencia } from '../../../../admin/core/domain/models/asistencia.model';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';

const ESTADOS: { valor: EstadoAsistencia; etiqueta: string; claseActiva: string }[] = [
  { valor: 'presente', etiqueta: 'Presente', claseActiva: 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' },
  { valor: 'ausente', etiqueta: 'Ausente', claseActiva: 'bg-rose-50 border-rose-200 text-rose-800 font-bold' },
  { valor: 'tardanza', etiqueta: 'Tardanza', claseActiva: 'bg-amber-50 border-amber-200 text-amber-800 font-bold' },
  { valor: 'justificado', etiqueta: 'Justificado', claseActiva: 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold' },
];

interface FilaAsistencia extends RegistroAsistencia {
  estadoSeleccionado: EstadoAsistencia;
  observacionTexto: string;
}

@Component({
  selector: 'app-asistencia-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, PaginadorComponent],
  template: `
    <app-page-header titulo="Tomar Asistencia" [subtitulo]="'Control diario de clases • ' + fechaFormateada()" />

    @if (cargandoClases()) { <app-loading-spinner /> }
    @else if (!claseSeleccionada()) {
      @if (clasesHoy().length === 0) {
        <app-empty-state titulo="Sin clases hoy" descripcion="No tienes clases programadas para hoy" />
      } @else {
        <p class="text-sm text-slate-500 mb-6">Selecciona una asignatura de tu agenda diaria para iniciar la toma de asistencia:</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
          @for (c of clasesHoyPagina(); track c.id) {
            <button (click)="seleccionarClase(c)"
              class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-left flex flex-col justify-between hover:shadow-md hover:border-indigo-150 hover:-translate-y-0.5 transition-all duration-200"
              [class.opacity-90]="c.asistenciaTomada">
              
              <div class="w-full">
                <div class="flex items-start justify-between gap-3 mb-4">
                  <h4 class="font-extrabold text-slate-800 text-base leading-tight">{{ c.asignaturaNombre }}</h4>
                  @if (c.asistenciaTomada) {
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-full shrink-0">
                      Completo
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-extrabold rounded-full shrink-0 animate-pulse">
                      Pendiente
                    </span>
                  }
                </div>
                
                <div class="space-y-1 text-xs mb-6">
                  <p class="text-slate-500 font-semibold">{{ c.gradoNombre }} — {{ c.seccionNombre }}</p>
                  <p class="text-indigo-900 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded-md font-mono text-[10px] inline-block mt-1">{{ c.horaInicio }} – {{ c.horaFin }}</p>
                </div>
              </div>

              <div class="w-full pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-indigo-600 font-bold group">
                <span>{{ c.asistenciaTomada ? 'Revisar registro' : 'Iniciar registro' }}</span>
                <span class="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          }
        </div>

        <div class="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <app-paginador [paginaActual]="pagina()" [total]="clasesHoy().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
        </div>
      }
    } @else {
      <!-- Taking Attendance Mode -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-3">
          <button (click)="volverAClases()" class="flex items-center justify-center w-9 h-9 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl transition shadow-sm shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h3 class="font-extrabold text-slate-800 text-lg leading-tight">{{ claseSeleccionada()!.asignaturaNombre }}</h3>
            <p class="text-xs text-slate-400 font-semibold">{{ claseSeleccionada()!.gradoNombre }} • {{ claseSeleccionada()!.seccionNombre }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-2xl shrink-0">
          <span class="text-xs text-indigo-900 font-mono font-bold">{{ claseSeleccionada()!.horaInicio }} – {{ claseSeleccionada()!.horaFin }}</span>
        </div>
      </div>

      @if (cargandoLista()) { <app-loading-spinner /> }
      @else if (filas().length === 0) {
        <app-empty-state titulo="Sin estudiantes" descripcion="No hay estudiantes matriculados en esta sección" />
      } @else {
        <!-- Students list table card -->
        <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden mb-6">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th class="px-6 py-4 text-left">Estudiante</th>
                  <th class="px-6 py-4 text-left">Estado de Asistencia</th>
                  <th class="px-6 py-4 text-left">Observación</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (fila of filas(); track fila.matriculaId) {
                  <tr class="hover:bg-slate-50/30 transition duration-150">
                    <td class="px-6 py-4 shrink-0">
                      <p class="font-extrabold text-slate-800">{{ fila.estudianteApellido }}, {{ fila.estudianteNombre }}</p>
                      <p class="text-[10px] text-slate-400 font-mono font-bold">{{ fila.estudianteCodigo }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex gap-1.5 flex-wrap">
                        @for (estado of estadosAsistencia; track estado.valor) {
                          <button type="button" (click)="cambiarEstado(fila, estado.valor)"
                            class="px-3 py-1.5 rounded-2xl text-xs font-extrabold border transition-all duration-150"
                            [class]="fila.estadoSeleccionado === estado.valor 
                              ? estado.claseActiva + ' border-transparent shadow-sm' 
                              : 'bg-slate-50/80 text-slate-500 border-slate-200/60 hover:bg-slate-100 hover:text-slate-800'">
                            {{ estado.etiqueta }}
                          </button>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <input type="text" [(ngModel)]="fila.observacionTexto" placeholder="Añadir comentario..."
                        class="w-full px-4 py-2 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all"/>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Action buttons footer -->
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-3xl">
          <button (click)="marcarTodos('presente')" class="px-4 py-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100/50 hover:bg-emerald-100 border border-emerald-200/50 rounded-2xl transition">
            Marcar todos como Presentes
          </button>
          
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <button (click)="volverAClases()" class="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition shadow-sm">
              Cancelar
            </button>
            <button (click)="guardar()" [disabled]="guardando()"
              class="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-2xl shadow-sm hover:shadow transition">
              {{ guardando() ? 'Guardando...' : 'Guardar asistencia' }}
            </button>
          </div>
        </div>
      }
    }
  `,
})
export class AsistenciaDocenteComponent implements OnInit {
  private readonly repo = inject(AsistenciaRepository);
  private readonly authState = inject(AuthState);

  readonly estadosAsistencia = ESTADOS;
  readonly cargandoClases = signal(true);
  readonly cargandoLista = signal(false);
  readonly guardando = signal(false);
  readonly porPagina = 8;
  readonly pagina = signal(1);
  readonly clasesHoyPagina = computed(() => {
    const start = (this.pagina() - 1) * this.porPagina;
    return this.clasesHoy().slice(start, start + this.porPagina);
  });

  readonly clasesHoy = signal<HorarioHoy[]>([]);
  readonly claseSeleccionada = signal<HorarioHoy | null>(null);
  readonly filas = signal<FilaAsistencia[]>([]);

  readonly fecha = new Date().toISOString().slice(0, 10);
  readonly fechaFormateada = signal<string>('');
  private docenteId: string | null = null;

  async ngOnInit(): Promise<void> {
    const hoy = new Date();
    this.fechaFormateada.set(hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargandoClases.set(false); return; }

    this.docenteId = await this.repo.obtenerIdDocente(usuarioId);
    if (!this.docenteId) { this.cargandoClases.set(false); return; }

    const r = await this.repo.obtenerHorariosHoy(this.docenteId, this.fecha);
    this.cargandoClases.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.clasesHoy.set(r.datos);
  }

  async seleccionarClase(clase: HorarioHoy): Promise<void> {
    this.claseSeleccionada.set(clase);
    this.cargandoLista.set(true);
    const r = await this.repo.obtenerListaAsistencia(clase.id, this.fecha);
    this.cargandoLista.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.filas.set(r.datos.map((registro) => ({
      ...registro,
      estadoSeleccionado: registro.estado ?? 'presente',
      observacionTexto: registro.observacion ?? '',
    })));
  }

  volverAClases(): void { this.claseSeleccionada.set(null); this.filas.set([]); }

  cambiarEstado(fila: FilaAsistencia, estado: EstadoAsistencia): void {
    this.filas.update((lista) => lista.map((f) => f.matriculaId === fila.matriculaId ? { ...f, estadoSeleccionado: estado } : f));
  }

  marcarTodos(estado: EstadoAsistencia): void {
    this.filas.update((lista) => lista.map((f) => ({ ...f, estadoSeleccionado: estado })));
  }

  async guardar(): Promise<void> {
    const clase = this.claseSeleccionada();
    if (!clase) return;
    this.guardando.set(true);
    const dtos = this.filas().map((f) => ({
      matriculaId: f.matriculaId,
      horarioId: clase.id,
      fecha: this.fecha,
      estado: f.estadoSeleccionado,
      observacion: f.observacionTexto || undefined,
    }));
    const r = await this.repo.guardarAsistencia(dtos);
    this.guardando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    toast.success('¡Asistencia guardada correctamente!');
    this.clasesHoy.update((lista) => lista.map((c) => c.id === clase.id ? { ...c, asistenciaTomada: true } : c));
    this.volverAClases();
  }
}
