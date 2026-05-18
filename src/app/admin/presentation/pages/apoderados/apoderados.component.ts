import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ApoderadosRepository } from '../../../core/domain/ports/apoderados.repository';
import { EstudiantesRepository } from '../../../core/domain/ports/estudiantes.repository';
import { ApoderadoAgrupado } from '../../../core/domain/models/apoderado.model';
import { Estudiante } from '../../../core/domain/models/estudiante.model';

@Component({
  selector: 'app-apoderados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent],
  template: `
    <app-page-header titulo="Apoderados" subtitulo="Registra padres de familia y vincúlalos a sus hijos" />

    <div class="flex justify-end mb-6">
      <button (click)="abrirModalCrear()" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nuevo Apoderado
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (apoderados().length === 0) { <app-empty-state titulo="Sin apoderados" descripcion="Registra el primer apoderado" /> }
    @else {
      <div class="space-y-3">
        @for (a of apoderados(); track a.usuarioId) {
          <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                    <span class="text-sm font-bold text-indigo-700">{{ inicial(a.nombre) }}</span>
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">{{ a.nombre }} {{ a.apellido }}</p>
                    <p class="text-xs text-gray-400">{{ a.email }}</p>
                  </div>
                </div>

                <div class="ml-12">
                  <p class="text-xs font-medium text-gray-500 mb-1.5">Hijo(s) vinculado(s):</p>
                  <div class="flex flex-wrap gap-2">
                    @for (h of a.hijos; track h.apoderadoId) {
                      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                        <span class="text-gray-700 font-medium">{{ h.estudianteApellido }}, {{ h.estudianteNombre }}</span>
                        <span class="text-gray-400 font-mono text-xs">({{ h.estudianteCodigo }})</span>
                        <span class="text-gray-400 text-xs">— {{ h.parentesco }}</span>
                        <button (click)="desvincularHijo(h.apoderadoId, a.hijos.length)"
                          class="ml-1 text-gray-300 hover:text-red-500 transition" title="Desvincular">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    }
                    <button (click)="abrirModalVincular(a)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                      Agregar hijo
                    </button>
                  </div>
                </div>
              </div>

              <button (click)="eliminar(a.usuarioId)" class="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition shrink-0" title="Eliminar apoderado">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
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

    @if (modalCrear()) {
      <app-modal titulo="Nuevo Apoderado" (cerrar)="modalCrear.set(false)">
        <form [formGroup]="formCrear" (ngSubmit)="crear()" class="space-y-4" novalidate>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
              <input type="text" formControlName="nombre" placeholder="María"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                [class.border-red-400]="invalido('nombre')"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
              <input type="text" formControlName="apellido" placeholder="García"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                [class.border-red-400]="invalido('apellido')"/>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
            <input type="email" formControlName="email" placeholder="padre@email.com"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              [class.border-red-400]="invalido('email')"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña temporal</label>
            <input type="password" formControlName="password"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              [class.border-red-400]="invalido('password')"/>
          </div>
          <fieldset class="border border-gray-200 rounded-lg p-3">
            <legend class="text-xs font-semibold text-gray-500 px-1">Primer hijo a vincular</legend>
            <div class="space-y-3 mt-1">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Estudiante</label>
                <select formControlName="estudianteId"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  [class.border-red-400]="invalido('estudianteId')">
                  <option value="">Seleccionar estudiante</option>
                  @for (e of estudiantes(); track e.id) {
                    <option [value]="e.id">{{ e.apellido }}, {{ e.nombre }} ({{ e.codigo }})</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Parentesco</label>
                <select formControlName="parentesco"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                  <option value="padre">Padre</option>
                  <option value="madre">Madre</option>
                  <option value="tutor">Tutor legal</option>
                  <option value="abuelo">Abuelo/a</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
          </fieldset>
          <footer class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="modalCrear.set(false)" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </app-modal>
    }

    @if (modalVincular()) {
      <app-modal titulo="Agregar hijo" (cerrar)="modalVincular.set(false)">
        <form [formGroup]="formVincular" (ngSubmit)="vincular()" class="space-y-4" novalidate>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Estudiante</label>
            <select formControlName="estudianteId"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              <option value="">Seleccionar estudiante</option>
              @for (e of estudiantesDisponibles(); track e.id) {
                <option [value]="e.id">{{ e.apellido }}, {{ e.nombre }} ({{ e.codigo }})</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Parentesco</label>
            <select formControlName="parentesco"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              <option value="padre">Padre</option>
              <option value="madre">Madre</option>
              <option value="tutor">Tutor legal</option>
              <option value="abuelo">Abuelo/a</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <footer class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="modalVincular.set(false)" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">
              {{ guardando() ? 'Vinculando...' : 'Vincular' }}
            </button>
          </footer>
        </form>
      </app-modal>
    }
  `,
})
export class ApoderadosComponent implements OnInit {
  private readonly repo = inject(ApoderadosRepository);
  private readonly estudiantesRepo = inject(EstudiantesRepository);
  private readonly fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly apoderados = signal<ApoderadoAgrupado[]>([]);
  readonly estudiantes = signal<Estudiante[]>([]);
  readonly modalCrear = signal(false);
  readonly modalVincular = signal(false);
  readonly estudiantesDisponibles = signal<Estudiante[]>([]);
  private apoderadoSeleccionado: ApoderadoAgrupado | null = null;

  readonly formCrear = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    estudianteId: ['', Validators.required],
    parentesco: ['padre', Validators.required],
  });

  readonly formVincular = this.fb.group({
    estudianteId: ['', Validators.required],
    parentesco: ['padre', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    const [a, e] = await Promise.all([this.repo.obtenerTodos(), this.estudiantesRepo.obtenerTodos()]);
    this.cargando.set(false);
    if (a.error === null) this.apoderados.set(a.datos);
    if (e.error === null) this.estudiantes.set(e.datos);
  }

  abrirModalCrear(): void { this.formCrear.reset({ parentesco: 'padre' }); this.modalCrear.set(true); }

  abrirModalVincular(apoderado: ApoderadoAgrupado): void {
    this.apoderadoSeleccionado = apoderado;
    const hijosIds = new Set(apoderado.hijos.map((h) => h.estudianteId));
    this.estudiantesDisponibles.set(this.estudiantes().filter((e) => !hijosIds.has(e.id)));
    this.formVincular.reset({ parentesco: 'padre' });
    this.modalVincular.set(true);
  }

  async crear(): Promise<void> {
    if (this.formCrear.invalid) { this.formCrear.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.formCrear.getRawValue();
    const r = await this.repo.crear({ nombre: v.nombre!, apellido: v.apellido!, email: v.email!, password: v.password!, estudianteId: v.estudianteId!, parentesco: v.parentesco! });
    this.guardando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.modalCrear.set(false);
    await this.recargar();
  }

  async vincular(): Promise<void> {
    if (this.formVincular.invalid || !this.apoderadoSeleccionado) { this.formVincular.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.formVincular.getRawValue();
    const r = await this.repo.vincularHijo({ usuarioId: this.apoderadoSeleccionado.usuarioId, estudianteId: v.estudianteId!, parentesco: v.parentesco! });
    this.guardando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.modalVincular.set(false);
    await this.recargar();
  }

  async desvincularHijo(apoderadoId: string, totalHijos: number): Promise<void> {
    if (totalHijos <= 1) {
      if (!confirm('Este es el único hijo vinculado. Si desvincula, el padre quedará sin hijos pero su cuenta se mantendrá. ¿Continuar?')) return;
    }
    const r = await this.repo.desvincularHijo(apoderadoId);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    await this.recargar();
  }

  async eliminar(usuarioId: string): Promise<void> {
    if (!confirm('¿Eliminar este apoderado y su cuenta? Esta acción no se puede deshacer.')) return;
    const r = await this.repo.eliminar(usuarioId);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.apoderados.update((l) => l.filter((a) => a.usuarioId !== usuarioId));
  }

  private async recargar(): Promise<void> {
    const r = await this.repo.obtenerTodos();
    if (r.error === null) this.apoderados.set(r.datos);
  }

  inicial(nombre: string): string { return nombre.charAt(0).toUpperCase(); }
  invalido(c: string): boolean { const f = this.formCrear.get(c); return !!(f?.invalid && f.touched); }
  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
