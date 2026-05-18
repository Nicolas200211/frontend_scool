import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { PadreRepository } from '../../../core/domain/ports/padre.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { Justificacion } from '../../../core/domain/models/justificacion.model';
import { AsistenciaHijo } from '../../../core/domain/models/asistencia-hijo.model';
import { HijoInfo } from '../../../core/domain/models/hijo-info.model';

const COLORES: Record<string, string> = {
  pendiente: 'bg-amber-50 border-amber-100/50 text-amber-700',
  aprobado: 'bg-emerald-50 border-emerald-100/50 text-emerald-700',
  rechazado: 'bg-rose-50 border-rose-100/50 text-rose-700',
};

const POR_PAGINA = 5;

@Component({
  selector: 'app-justificaciones-padre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent],
  template: `
    <app-page-header titulo="Justificaciones" subtitulo="Envío de justificantes de inasistencia médica o personal" />

    <!-- Top Bento filter & action bar -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      
      @if (hijos().length > 1) {
        <div class="flex items-center gap-2 shrink-0">
          <label class="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono">Hijo(a):</label>
          <select (change)="seleccionarHijo($event)"
            class="px-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
            @for (h of hijos(); track h.estudianteId) {
              <option [value]="h.estudianteId">{{ h.estudianteApellido }}, {{ h.estudianteNombre }}</option>
            }
          </select>
        </div>
      } @else {
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center px-2.5 py-0.5 bg-indigo-50 border border-indigo-100/30 text-indigo-700 text-[10px] font-extrabold rounded-full font-mono">
            {{ justificaciones().length }} ENVIADOS
          </span>
        </div>
      }

      <button (click)="abrirModal()" [disabled]="ausenciasSinJustificar().length === 0"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Nueva Justificación
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (justificaciones().length === 0) {
      <app-empty-state titulo="Sin justificaciones" descripcion="Aún no has registrado solicitudes de justificación para tu hijo(a)." />
    } @else {
      <!-- Bento Cards Grid -->
      <div class="space-y-4 mb-6">
        @for (j of justificacionesPagina(); track j.id) {
          <article class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 hover:shadow-md hover:border-indigo-100 transition-all duration-200">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                
                <div class="flex flex-wrap items-center gap-2 mb-2">
                  <h3 class="font-extrabold text-slate-800 text-sm leading-snug">{{ j.asignaturaNombre }}</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border capitalize tracking-wider font-mono" [class]="colorEstado(j.estado)">
                    {{ j.estado }}
                  </span>
                </div>
                
                <p class="text-xs font-extrabold font-mono text-slate-400 mb-3 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 inline-block">
                  Fecha de falta: {{ j.fecha }}
                </p>
                
                <div class="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                  <p class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 font-mono">Motivo del justificante</p>
                  <p class="text-xs font-semibold text-slate-700 leading-relaxed">{{ j.motivo }}</p>
                </div>

              </div>
            </div>
          </article>
        }
      </div>

      <div class="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <app-paginador [paginaActual]="pagina()" [total]="justificaciones().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
      </div>
    }

    @if (modalAbierto()) {
      <app-modal titulo="Nueva Justificación" (cerrar)="cerrarModal()">
        <form [formGroup]="formulario" (ngSubmit)="enviar()" class="space-y-5" novalidate>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Inasistencia a justificar</label>
            <select formControlName="asistenciaId"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              <option value="">Seleccionar inasistencia</option>
              @for (a of ausenciasSinJustificar(); track a.asistenciaId) {
                <option [value]="a.asistenciaId">{{ a.fecha }} — {{ a.asignaturaNombre }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Motivo justificativo</label>
            <textarea formControlName="motivo" rows="4" placeholder="Detalla de manera explícita el motivo..."
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800 resize-none"></textarea>
          </div>
          <footer class="flex justify-end gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="cerrarModal()"
              class="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition duration-150 font-bold">
              Cancelar
            </button>
            <button type="submit" [disabled]="guardando()"
              class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl disabled:opacity-60 transition duration-150 shadow-sm shadow-indigo-600/10">
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
  readonly justificaciones = signal<Justificacion[]>([]);
  readonly ausenciasSinJustificar = signal<AsistenciaHijo[]>([]);
  readonly modalAbierto = signal(false);
  readonly hijos = signal<HijoInfo[]>([]);
  private hijoActual: HijoInfo | null = null;

  readonly porPagina = POR_PAGINA;
  readonly pagina = signal(1);
  readonly justificacionesPagina = computed(() => {
    const start = (this.pagina() - 1) * POR_PAGINA;
    return this.justificaciones().slice(start, start + POR_PAGINA);
  });

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
    this.pagina.set(1);
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
    if (r.error !== null) { toast.error(r.error); return; }
    this.cerrarModal();
    await this.cargar();
    this.pagina.set(1);
    toast.success('Justificación enviada correctamente');
  }

  colorEstado(estado: string): string { return COLORES[estado] ?? 'bg-gray-100 text-gray-600'; }
}
