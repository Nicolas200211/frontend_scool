import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
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
    <app-page-header titulo="Mi Horario" subtitulo="Distribución de clases por día" />

    @if (cargando()) { <app-loading-spinner /> }
    @else if (horario().length === 0) {
      <app-empty-state titulo="Sin horario" descripcion="No tienes clases asignadas" />
    } @else {
      <div class="space-y-5">
        @for (dia of diasConClases(); track dia) {
          <section>
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{{ etiquetaDia(dia) }}</h2>
            <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table class="w-full text-sm">
                <tbody class="divide-y divide-gray-50">
                  @for (h of clasesPorDia(dia); track h.id) {
                    <tr class="hover:bg-gray-50 transition">
                      <td class="px-4 py-3 tabular-nums text-gray-400 text-xs w-28">{{ h.horaInicio }} – {{ h.horaFin }}</td>
                      <td class="px-4 py-3 font-medium text-gray-900">{{ h.asignaturaNombre }}</td>
                      <td class="px-4 py-3 text-gray-500">{{ h.docenteNombre }} {{ h.docenteApellido }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }
      </div>
    }

    @if (error()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-red-600">{{ error() }}</p>
      </div>
    }
  `,
})
export class HorarioEstudianteComponent implements OnInit {
  private readonly repo = inject(EstudianteRepository);
  private readonly authState = inject(AuthState);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly horario = signal<MiHorario[]>([]);

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const estudianteId = await this.repo.obtenerEstudianteId(usuarioId);
    if (!estudianteId) { this.cargando.set(false); return; }

    const r = await this.repo.obtenerMiHorario(estudianteId);
    this.cargando.set(false);
    if (r.error !== null) { this.error.set(r.error); setTimeout(() => this.error.set(null), 4000); return; }
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
