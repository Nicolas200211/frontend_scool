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
      <div class="space-y-8">
        @for (dia of diasConClases(); track dia) {
          <section class="space-y-3">
            <div class="flex items-center gap-2 px-1">
              <span class="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              <h2 class="text-sm font-extrabold text-slate-800 uppercase tracking-wider">{{ etiquetaDia(dia) }}</h2>
            </div>
            
            <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <tbody class="divide-y divide-slate-50">
                    @for (h of clasesPorDia(dia); track h.id) {
                      <tr class="hover:bg-slate-50/30 transition duration-150">
                        <td class="px-6 py-4 w-36 shrink-0">
                          <span class="inline-block text-center font-mono font-bold text-[10px] text-indigo-900 bg-indigo-50/60 border border-indigo-100/50 px-3 py-1 rounded-2xl">
                            {{ h.horaInicio }} – {{ h.horaFin }}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <p class="font-extrabold text-slate-800 text-sm">{{ h.asignaturaNombre }}</p>
                          <p class="text-[10px] text-slate-400 font-semibold mt-0.5">Asignatura</p>
                        </td>
                        <td class="px-6 py-4 text-slate-500 font-semibold text-xs text-right">
                          <span class="inline-block bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100 text-slate-600">
                            {{ h.docenteNombre }} {{ h.docenteApellido }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
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
