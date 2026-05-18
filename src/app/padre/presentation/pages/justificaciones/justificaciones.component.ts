import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PadreRepository } from '../../../core/domain/ports/padre.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { Justificacion } from '../../../core/domain/models/justificacion.model';
import { AsistenciaHijo } from '../../../core/domain/models/asistencia-hijo.model';
import { HijoInfo } from '../../../core/domain/models/hijo-info.model';

const COLORES: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-600',
};

@Component({
  selector: 'app-justificaciones-padre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent],
  template: `
    <app-page-header titulo="Justificaciones" subtitulo="Envía justificaciones para las inasistencias de tus hijos" />

    @if (hijos().length > 1) {
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-500 mb-1">Seleccionar hijo</label>
        <select (change)="seleccionarHijo($event)"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          @for (h of hijos(); track h.estudianteId) {
            <option [value]="h.estudianteId">{{ h.estudianteApellido }}, {{ h.estudianteNombre }}</option>
          }
        </select>
      </div>
    }

    <div class="flex justify-end mb-6">
      <button (click)="abrirModal()" [disabled]="ausenciasSinJustificar().length === 0"
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nueva Justificación
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (justificaciones().length === 0) {
      <app-empty-state titulo="Sin justificaciones" descripcion="No has enviado justificaciones aún" />
    } @else {
      <div class="space-y-3">
        @for (j of justificaciones(); track j.id) {
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-semibold text-gray-900">{{ j.asignaturaNombre }}</p>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" [class]="colorEstado(j.estado)">
                    {{ j.estado }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mb-2">Fecha: {{ j.fecha }}</p>
                <p class="text-sm text-gray-700 leading-relaxed">{{ j.motivo }}</p>
              </div>
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

    @if (modalAbierto()) {
      <app-modal titulo="Nueva Justificación" (cerrar)="cerrarModal()">
        <form [formGroup]="formulario" (ngSubmit)="enviar()" class="space-y-4" novalidate>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Inasistencia a justificar</label>
            <select formControlName="asistenciaId"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              <option value="">Seleccionar inasistencia</option>
              @for (a of ausenciasSinJustificar(); track a.asistenciaId) {
                <option [value]="a.asistenciaId">{{ a.fecha }} — {{ a.asignaturaNombre }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Motivo</label>
            <textarea formControlName="motivo" rows="4" placeholder="Describe el motivo de la inasistencia..."
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"></textarea>
          </div>
          <footer class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="cerrarModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="submit" [disabled]="guardando()"
              class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">
              {{ guardando() ? 'Enviando...' : 'Enviar' }}
            </button>
          </footer>
        </form>
      </app-modal>
    }
  `,
})
export class JustificacionesPadreComponent implements OnInit {
  private readonly repo = inject(PadreRepository);
  private readonly authState = inject(AuthState);
  private readonly fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly justificaciones = signal<Justificacion[]>([]);
  readonly ausenciasSinJustificar = signal<AsistenciaHijo[]>([]);
  readonly modalAbierto = signal(false);
  readonly hijos = signal<HijoInfo[]>([]);
  private hijoActual: HijoInfo | null = null;

  readonly formulario = this.fb.group({
    asistenciaId: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.minLength(10)]],
  });

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const r = await this.repo.obtenerHijos(usuarioId);
    if (r.error !== null || r.datos.length === 0) { this.cargando.set(false); return; }

    this.hijos.set(r.datos);
    this.hijoActual = r.datos[0];
    await this.cargar();
  }

  seleccionarHijo(evento: Event): void {
    const id = (evento.target as HTMLSelectElement).value;
    this.hijoActual = this.hijos().find((h) => h.estudianteId === id) ?? null;
    this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.hijoActual) { this.cargando.set(false); return; }

    const hoy = new Date().toISOString().slice(0, 10);
    const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [j, a] = await Promise.all([
      this.repo.obtenerJustificaciones(this.hijoActual.apoderadoId),
      this.repo.obtenerAsistenciaHijo(this.hijoActual.estudianteId, hace30, hoy),
    ]);

    this.cargando.set(false);
    if (j.error === null) this.justificaciones.set(j.datos);
    if (a.error === null) {
      this.ausenciasSinJustificar.set(a.datos.filter((r) => r.estado === 'ausente' && !r.tieneJustificacion));
    }
  }

  abrirModal(): void { this.formulario.reset(); this.modalAbierto.set(true); }
  cerrarModal(): void { this.modalAbierto.set(false); }

  async enviar(): Promise<void> {
    if (this.formulario.invalid || !this.hijoActual) { this.formulario.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.formulario.getRawValue();
    const r = await this.repo.enviarJustificacion({
      asistenciaId: v.asistenciaId!,
      apoderadoId: this.hijoActual.apoderadoId,
      motivo: v.motivo!,
    });
    this.guardando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.cerrarModal();
    await this.cargar();
  }

  colorEstado(estado: string): string { return COLORES[estado] ?? 'bg-gray-100 text-gray-600'; }
  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
