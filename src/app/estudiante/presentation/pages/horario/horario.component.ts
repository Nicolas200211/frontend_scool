import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { EstudianteRepository } from '../../../core/domain/ports/estudiante.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { MiHorario, DiaSemana } from '../../../core/domain/models/mi-horario.model';

const DIAS_ORDEN: DiaSemana[] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const ETIQUETAS: Record<DiaSemana, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado',
};

@Component({
  selector: 'app-horario-estudiante',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header titulo="Mi Horario" subtitulo="Distribución semanal de tus asignaturas" />

    @if (cargando()) { <app-loading-spinner /> }
    @else if (horario().length === 0) {
      <app-empty-state titulo="Sin horario" descripcion="No tienes clases programadas asignadas" />
    } @else {
      <!-- Contenedor scrollable horizontal en móviles, grid de columnas en escritorio -->
      <div class="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:overflow-visible gap-6 items-start snap-x">
        @for (dia of diasConClases(); track dia) {
          <!-- Columna por cada Día -->
          <section class="flex-shrink-0 w-80 lg:w-auto snap-center flex flex-col">
            <!-- Header del Día -->
            <div class="flex items-center gap-2 px-1 mb-4 sticky top-0 bg-slate-50 py-2 z-10">
              <span class="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              <h2 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">{{ etiquetaDia(dia) }}</h2>
              <span class="ml-auto bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">{{ clasesPorDia(dia).length }}</span>
            </div>
            
            <!-- Lista de clases del Día -->
            <div class="space-y-4">
              @for (h of clasesPorDia(dia); track h.id) {
                <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
                  <div class="space-y-3">
                    <div class="flex items-center gap-2">
                      <div class="px-3 py-1 bg-indigo-50/60 border border-indigo-100/50 text-indigo-700 text-[10px] font-black font-mono rounded-xl shrink-0 leading-none">
                        {{ h.horaInicio }} – {{ h.horaFin }}
                      </div>
                    </div>

                    <div>
                      <h4 class="font-black text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition duration-150">{{ h.asignaturaNombre }}</h4>
                      <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Asignatura</p>
                    </div>
                  </div>

                  <div class="h-px bg-slate-50 my-4"></div>

                  <div class="flex items-center gap-2.5">
                    <div class="w-7 h-7 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <span class="text-[9px] font-black text-indigo-700 uppercase leading-none">
                        {{ h.docenteNombre[0] }}{{ h.docenteApellido[0] }}
                      </span>
                    </div>
                    <div>
                      <p class="text-xs font-extrabold text-slate-700 leading-none">{{ h.docenteNombre }} {{ h.docenteApellido }}</p>
                      <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Docente</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      </div>
    }
  `,
})
export class HorarioEstudianteComponent implements OnInit {
  private readonly repo = inject(EstudianteRepository);
  private readonly authState = inject(AuthState);

  readonly cargando = signal(true);
  readonly horario = signal<MiHorario[]>([]);

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const estudianteId = await this.repo.obtenerEstudianteId(usuarioId);
    if (!estudianteId) { this.cargando.set(false); return; }

    const r = await this.repo.obtenerMiHorario(estudianteId);
    this.cargando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.horario.set(r.datos);
  }

  diasConClases(): DiaSemana[] {
    const dias = new Set(this.horario().map((h) => h.diaSemana));
    return DIAS_ORDEN.filter((d) => dias.has(d));
  }

  clasesPorDia(dia: DiaSemana): MiHorario[] {
    return this.horario().filter((h) => h.diaSemana === dia).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  etiquetaDia(dia: DiaSemana): string { return ETIQUETAS[dia]; }
}
