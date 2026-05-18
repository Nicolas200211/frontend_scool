import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { JustificacionesRepository } from '../../../../admin/core/domain/ports/justificaciones.repository';
import { AsistenciaRepository } from '../../../../admin/core/domain/ports/asistencia.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { Justificacion } from '../../../../admin/core/domain/models/justificacion.model';

const COLORES: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-600',
};

@Component({
  selector: 'app-justificaciones-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header titulo="Justificaciones" subtitulo="Revisa y aprueba justificaciones de inasistencia" />

    @if (cargando()) { <app-loading-spinner /> }
    @else if (justificaciones().length === 0) {
      <app-empty-state titulo="Sin justificaciones" descripcion="No hay justificaciones registradas" />
    } @else {
      <div class="space-y-3">
        @for (j of justificaciones(); track j.id) {
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-semibold text-gray-900">{{ j.estudianteApellido }}, {{ j.estudianteNombre }}</p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" [class]="colorEstado(j.estado)">
                    {{ j.estado }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mb-1">{{ j.asignaturaNombre }} — {{ j.fecha }}</p>
                <p class="text-sm text-gray-700 leading-relaxed">{{ j.motivo }}</p>
                <p class="text-xs text-gray-400 mt-1">Apoderado: {{ j.apoderadoNombre }}</p>
              </div>
              @if (j.estado === 'pendiente') {
                <div class="flex gap-2 shrink-0">
                  <button (click)="cambiarEstado(j.id, 'aprobado')"
                    class="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition">
                    Aprobar
                  </button>
                  <button (click)="cambiarEstado(j.id, 'rechazado')"
                    class="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition">
                    Rechazar
                  </button>
                </div>
              }
            </div>
          </div>
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
export class JustificacionesDocenteComponent implements OnInit {
  private readonly repo = inject(JustificacionesRepository);
  private readonly asistenciaRepo = inject(AsistenciaRepository);
  private readonly authState = inject(AuthState);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly justificaciones = signal<Justificacion[]>([]);

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const docenteId = await this.asistenciaRepo.obtenerIdDocente(usuarioId);
    if (!docenteId) { this.cargando.set(false); return; }

    const r = await this.repo.obtenerPorDocente(docenteId);
    this.cargando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.justificaciones.set(r.datos);
  }

  async cambiarEstado(id: string, estado: 'aprobado' | 'rechazado'): Promise<void> {
    const r = await this.repo.actualizarEstado(id, estado);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.justificaciones.update((lista) =>
      lista.map((j) => (j.id === id ? { ...j, estado } : j))
    );
  }

  colorEstado(estado: string): string { return COLORES[estado] ?? 'bg-gray-100 text-gray-600'; }
  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
