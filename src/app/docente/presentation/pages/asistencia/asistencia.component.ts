import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { AsistenciaRepository } from '../../../../admin/core/domain/ports/asistencia.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { HorarioHoy, RegistroAsistencia, EstadoAsistencia } from '../../../../admin/core/domain/models/asistencia.model';

const ESTADOS: { valor: EstadoAsistencia; etiqueta: string; clase: string }[] = [
  { valor: 'presente', etiqueta: 'Presente', clase: 'bg-green-100 text-green-700 ring-green-400' },
  { valor: 'ausente', etiqueta: 'Ausente', clase: 'bg-red-100 text-red-600 ring-red-400' },
  { valor: 'tardanza', etiqueta: 'Tardanza', clase: 'bg-yellow-100 text-yellow-700 ring-yellow-400' },
  { valor: 'justificado', etiqueta: 'Justificado', clase: 'bg-blue-100 text-blue-700 ring-blue-400' },
];

interface FilaAsistencia extends RegistroAsistencia {
  estadoSeleccionado: EstadoAsistencia;
  observacionTexto: string;
}

@Component({
  selector: 'app-asistencia-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header titulo="Tomar Asistencia" [subtitulo]="'Fecha: ' + fecha" />

    @if (cargandoClases()) { <app-loading-spinner /> }
    @else if (!claseSeleccionada()) {
      @if (clasesHoy().length === 0) {
        <app-empty-state titulo="Sin clases hoy" descripcion="No tienes clases programadas para hoy" />
      } @else {
        <p class="text-sm text-gray-500 mb-4">Selecciona la clase para tomar asistencia:</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          @for (c of clasesHoy(); track c.id) {
            <button (click)="seleccionarClase(c)"
              class="bg-white rounded-xl p-4 border shadow-sm text-left hover:shadow-md hover:border-indigo-300 transition"
              [class.border-indigo-300]="c.asistenciaTomada"
              [class.opacity-75]="c.asistenciaTomada">
              <div class="flex items-start justify-between mb-2">
                <p class="font-semibold text-gray-900">{{ c.asignaturaNombre }}</p>
                @if (c.asistenciaTomada) {
                  <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Tomada</span>
                }
              </div>
              <p class="text-sm text-gray-500">{{ c.gradoNombre }} — {{ c.seccionNombre }}</p>
              <p class="text-xs text-gray-400 mt-1 tabular-nums">{{ c.horaInicio }} – {{ c.horaFin }}</p>
            </button>
          }
        </div>
      }
    } @else {
      <div class="flex items-center gap-3 mb-5">
        <button (click)="volverAClases()" class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Volver
        </button>
        <div>
          <p class="font-semibold text-gray-900">{{ claseSeleccionada()!.asignaturaNombre }}</p>
          <p class="text-sm text-gray-500">{{ claseSeleccionada()!.gradoNombre }} — {{ claseSeleccionada()!.seccionNombre }}</p>
        </div>
      </div>

      @if (cargandoLista()) { <app-loading-spinner /> }
      @else if (filas().length === 0) {
        <app-empty-state titulo="Sin estudiantes" descripcion="No hay estudiantes matriculados en esta sección" />
      } @else {
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-100">
              <tr>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Estudiante</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-600">Observación</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              @for (fila of filas(); track fila.matriculaId) {
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-4 py-3">
                    <p class="font-medium text-gray-900">{{ fila.estudianteApellido }}, {{ fila.estudianteNombre }}</p>
                    <p class="text-xs text-gray-400 font-mono">{{ fila.estudianteCodigo }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-1 flex-wrap">
                      @for (estado of estadosAsistencia; track estado.valor) {
                        <button type="button" (click)="cambiarEstado(fila, estado.valor)"
                          class="px-2.5 py-1 rounded-lg text-xs font-medium border transition"
                          [class]="fila.estadoSeleccionado === estado.valor ? estado.clase + ' ring-1' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'">
                          {{ estado.etiqueta }}
                        </button>
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <input type="text" [(ngModel)]="fila.observacionTexto" placeholder="Opcional"
                      class="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="flex justify-end gap-3">
          <button (click)="marcarTodos('presente')" class="px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition">Todos presentes</button>
          <button (click)="guardar()" [disabled]="guardando()"
            class="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">
            {{ guardando() ? 'Guardando...' : 'Guardar asistencia' }}
          </button>
        </div>
      }
    }

    @if (exito()) {
      <div class="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-green-700">Asistencia guardada correctamente</p>
      </div>
    }

    @if (error()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-red-600">{{ error() }}</p>
      </div>
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
  readonly error = signal<string | null>(null);
  readonly exito = signal(false);
  readonly clasesHoy = signal<HorarioHoy[]>([]);
  readonly claseSeleccionada = signal<HorarioHoy | null>(null);
  readonly filas = signal<FilaAsistencia[]>([]);

  readonly fecha = new Date().toISOString().slice(0, 10);
  private docenteId: string | null = null;

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargandoClases.set(false); return; }

    this.docenteId = await this.repo.obtenerIdDocente(usuarioId);
    if (!this.docenteId) { this.cargandoClases.set(false); return; }

    const r = await this.repo.obtenerHorariosHoy(this.docenteId, this.fecha);
    this.cargandoClases.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.clasesHoy.set(r.datos);
  }

  async seleccionarClase(clase: HorarioHoy): Promise<void> {
    this.claseSeleccionada.set(clase);
    this.cargandoLista.set(true);
    const r = await this.repo.obtenerListaAsistencia(clase.id, this.fecha);
    this.cargandoLista.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
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
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.exito.set(true);
    setTimeout(() => this.exito.set(false), 3000);
    this.clasesHoy.update((lista) => lista.map((c) => c.id === clase.id ? { ...c, asistenciaTomada: true } : c));
    this.volverAClases();
  }

  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
