import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { ApoderadosRepository } from '../../../core/domain/ports/apoderados.repository';
import { EstudiantesRepository } from '../../../core/domain/ports/estudiantes.repository';
import { ApoderadoAgrupado } from '../../../core/domain/models/apoderado.model';
import { Estudiante } from '../../../core/domain/models/estudiante.model';

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-apoderados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent, BuscadorComponent],
  template: `
    <app-page-header titulo="Apoderados" subtitulo="Padres de familia y tutores del alumnado" />

    <!-- Top Action Bar -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-md">
        <app-buscador placeholder="Buscar apoderado..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
      <button (click)="abrirModalCrear()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nuevo Apoderado
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (apoderados().length === 0) { 
      <app-empty-state titulo="Sin apoderados" descripcion="Aún no hay padres de familia o apoderados registrados." /> 
    } @else {
      <!-- Bento Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        @for (a of apoderadosPagina(); track a.usuarioId) {
          <article class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex flex-col justify-between">
            
            <div>
              <!-- Header info of parent -->
              <div class="flex items-start justify-between gap-4 mb-5">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full flex items-center justify-center shrink-0 font-black text-sm">
                    {{ inicial(a.nombre) }}
                  </div>
                  <div>
                    <h3 class="font-extrabold text-slate-800 text-sm leading-snug">{{ a.nombre }} {{ a.apellido }}</h3>
                    <p class="text-xs font-mono text-slate-400 mt-0.5">{{ a.email }}</p>
                  </div>
                </div>

                <button (click)="eliminar(a.usuarioId)" class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition shrink-0" title="Eliminar apoderado">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>

              <!-- Linked students list -->
              <div class="pl-1 mr-2 mt-4 pt-4 border-t border-slate-50">
                <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3 font-mono">Hijos vinculados</p>
                <div class="flex flex-wrap gap-2">
                  @for (h of a.hijos; track h.apoderadoId) {
                    <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-700 hover:border-indigo-100 hover:bg-white transition-all duration-150">
                      <span class="font-bold">{{ h.estudianteApellido }}, {{ h.estudianteNombre }}</span>
                      <span class="font-mono text-[9px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-lg">
                        {{ h.estudianteCodigo }}
                      </span>
                      <span class="text-[10px] font-extrabold uppercase text-indigo-600 font-mono tracking-wider ml-1 bg-indigo-50/60 px-2 py-0.5 rounded-full border border-indigo-100/30">
                        {{ h.parentesco }}
                      </span>
                      <button (click)="desvincularHijo(h.apoderadoId, a.hijos.length)"
                        class="ml-1 text-slate-400 hover:text-rose-600 transition" title="Desvincular">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </span>
                  }
                  
                  <button (click)="abrirModalVincular(a)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/30 text-indigo-700 rounded-2xl text-xs font-black transition-all duration-150">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Vincular hijo
                  </button>
                </div>
              </div>
            </div>

          </article>
        }
      </div>

      <div class="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <app-paginador [paginaActual]="pagina()" [total]="apoderadosFiltrados().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
      </div>
    }

    @if (modalCrear()) {
      <app-modal titulo="Nuevo Apoderado" (cerrar)="modalCrear.set(false)">
        <form [formGroup]="formCrear" (ngSubmit)="crear()" class="space-y-5" novalidate>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
              <input type="text" formControlName="nombre" placeholder="María"
                class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
                [class.border-rose-400]="invalido('nombre')"/>
            </div>
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Apellido</label>
              <input type="text" formControlName="apellido" placeholder="García"
                class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
                [class.border-rose-400]="invalido('apellido')"/>
            </div>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Correo electrónico</label>
            <input type="email" formControlName="email" placeholder="padre@email.com"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"
              [class.border-rose-400]="invalido('email')"/>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Contraseña temporal</label>
            <input type="password" formControlName="password" placeholder="••••••"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"
              [class.border-rose-400]="invalido('password')"/>
          </div>
          
          <fieldset class="border border-slate-150/60 rounded-2xl p-4 bg-slate-50/50 mt-1">
            <legend class="text-[10px] font-extrabold text-slate-400 px-2 uppercase tracking-wider font-mono">Vincular primer hijo</legend>
            <div class="space-y-4 mt-2">
              <div>
                <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Estudiante</label>
                <select formControlName="estudianteId"
                  class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
                  [class.border-rose-400]="invalido('estudianteId')">
                  <option value="">Seleccionar estudiante</option>
                  @for (e of estudiantes(); track e.id) {
                    <option [value]="e.id">{{ e.apellido }}, {{ e.nombre }} ({{ e.codigo }})</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Parentesco</label>
                <select formControlName="parentesco"
                  class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
                  <option value="padre">Padre</option>
                  <option value="madre">Madre</option>
                  <option value="tutor">Tutor legal</option>
                  <option value="abuelo">Abuelo/a</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
          </fieldset>
          
          <footer class="flex justify-end gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="modalCrear.set(false)" class="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition duration-150 font-bold">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl disabled:opacity-60 transition duration-150 shadow-sm shadow-indigo-600/10">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </app-modal>
    }

    @if (modalVincular()) {
      <app-modal titulo="Agregar hijo" (cerrar)="modalVincular.set(false)">
        <form [formGroup]="formVincular" (ngSubmit)="vincular()" class="space-y-5" novalidate>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Estudiante</label>
            <select formControlName="estudianteId"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              <option value="">Seleccionar estudiante</option>
              @for (e of estudiantesDisponibles(); track e.id) {
                <option [value]="e.id">{{ e.apellido }}, {{ e.nombre }} ({{ e.codigo }})</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Parentesco</label>
            <select formControlName="parentesco"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              <option value="padre">Padre</option>
              <option value="madre">Madre</option>
              <option value="tutor">Tutor legal</option>
              <option value="abuelo">Abuelo/a</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <footer class="flex justify-end gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="modalVincular.set(false)" class="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition duration-150 font-bold">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl disabled:opacity-60 transition duration-150 shadow-sm shadow-indigo-600/10">
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
  private readonly router = inject(Router);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly apoderados = signal<ApoderadoAgrupado[]>([]);
  readonly estudiantes = signal<Estudiante[]>([]);
  readonly modalCrear = signal(false);
  readonly modalVincular = signal(false);
  readonly estudiantesDisponibles = signal<Estudiante[]>([]);
  private apoderadoSeleccionado: ApoderadoAgrupado | null = null;

  readonly porPagina = 10;
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');

  readonly apoderadosFiltrados = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    if (!busqueda) return this.apoderados();
    return this.apoderados().filter((a) =>
      a.nombre.toLowerCase().includes(busqueda) ||
      a.apellido.toLowerCase().includes(busqueda) ||
      a.email.toLowerCase().includes(busqueda) ||
      a.hijos.some((h) => 
        h.estudianteNombre.toLowerCase().includes(busqueda) || 
        h.estudianteApellido.toLowerCase().includes(busqueda) || 
        h.estudianteCodigo.toLowerCase().includes(busqueda)
      )
    );
  });

  readonly apoderadosPagina = computed(() => {
    const start = (this.pagina() - 1) * this.porPagina;
    return this.apoderadosFiltrados().slice(start, start + this.porPagina);
  });

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
    if (r.error !== null) { toast.error(r.error); return; }
    this.modalCrear.set(false);
    await this.recargar();
    this.pagina.set(1);
    toast.success('Apoderado registrado correctamente', {
      description: 'El apoderado y su hijo han sido vinculados. ¿Deseas matricular al alumno ahora?',
      action: {
        label: 'Ir a Matrículas',
        onClick: () => this.router.navigateByUrl('/admin/matriculas')
      },
      duration: 10000
    });
  }

  async vincular(): Promise<void> {
    if (this.formVincular.invalid || !this.apoderadoSeleccionado) { this.formVincular.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.formVincular.getRawValue();
    const r = await this.repo.vincularHijo({ usuarioId: this.apoderadoSeleccionado.usuarioId, estudianteId: v.estudianteId!, parentesco: v.parentesco! });
    this.guardando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.modalVincular.set(false);
    await this.recargar();
    toast.success('Hijo vinculado correctamente');
  }

  async desvincularHijo(apoderadoId: string, totalHijos: number): Promise<void> {
    if (totalHijos <= 1) {
      if (!confirm('Este es el único hijo vinculado. Si desvincula, el padre quedará sin hijos pero su cuenta se mantendrá. ¿Continuar?')) return;
    }
    const r = await this.repo.desvincularHijo(apoderadoId);
    if (r.error !== null) { toast.error(r.error); return; }
    await this.recargar();
    toast.success('Hijo desvinculado con éxito');
  }

  async eliminar(usuarioId: string): Promise<void> {
    if (!confirm('¿Eliminar este apoderado y su cuenta? Esta acción no se puede deshacer.')) return;
    const r = await this.repo.eliminar(usuarioId);
    if (r.error !== null) { toast.error(r.error); return; }
    this.apoderados.update((l) => l.filter((a) => a.usuarioId !== usuarioId));
    const maxPaginas = Math.ceil(this.apoderados().length / this.porPagina);
    if (this.pagina() > maxPaginas && maxPaginas > 0) {
      this.pagina.set(maxPaginas);
    }
    toast.success('Apoderado eliminado de la institución');
  }

  private async recargar(): Promise<void> {
    const r = await this.repo.obtenerTodos();
    if (r.error === null) this.apoderados.set(r.datos);
  }

  inicial(nombre: string): string { return nombre.charAt(0).toUpperCase(); }
  invalido(c: string): boolean { const f = this.formCrear.get(c); return !!(f?.invalid && f.touched); }
}
