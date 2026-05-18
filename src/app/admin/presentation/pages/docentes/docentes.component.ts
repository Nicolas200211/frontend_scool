import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { DocentesRepository } from '../../../core/domain/ports/docentes.repository';
import { AsignaturasRepository } from '../../../core/domain/ports/asignaturas.repository';
import { Docente } from '../../../core/domain/models/docente.model';
import { Asignatura } from '../../../core/domain/models/asignatura.model';

const POR_PAGINA = 10;

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-docentes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent, BuscadorComponent],
  template: `
    <app-page-header titulo="Docentes" subtitulo="Personal docente registrado en la institución" />

    <!-- Top Action Bar -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-md">
        <app-buscador placeholder="Buscar docente..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
      <button (click)="abrirModalCrear()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nuevo Docente
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (docentes().length === 0) { 
      <app-empty-state titulo="Sin docentes" descripcion="Aún no hay docentes registrados en la institución escolar." /> 
    } @else {
      <!-- Bento Table Card -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="px-6 py-4 text-left">Docente</th>
                <th class="px-6 py-4 text-left">Correo Electrónico</th>
                <th class="px-6 py-4 text-left">Especialidad</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
               @for (d of docentesPagina(); track d.id) {
                <tr class="hover:bg-slate-50/30 transition duration-150">
                  <td class="px-6 py-4">
                    <p class="font-extrabold text-slate-800 text-sm">{{ d.nombre }} {{ d.apellido }}</p>
                    <p class="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">Docente ID: {{ d.id }}</p>
                  </td>
                  <td class="px-6 py-4 text-slate-500 font-semibold font-mono text-xs">{{ d.email }}</td>
                  <td class="px-6 py-4">
                    @if (d.especialidad) {
                      <span class="inline-flex items-center px-3 py-1 bg-indigo-50/60 border border-indigo-100/50 text-indigo-700 text-xs font-extrabold rounded-2xl">
                        {{ d.especialidad }}
                      </span>
                    } @else {
                      <span class="text-slate-300 font-mono">—</span>
                    }
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="inline-flex gap-2">
                       <button (click)="abrirModalEditar(d)" class="p-2 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition duration-150">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button (click)="eliminar(d.id)" class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition duration-150">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="p-4 border-t border-slate-50">
          <app-paginador
            [paginaActual]="pagina()"
            [total]="docentesFiltrados().length"
            [porPagina]="porPagina"
            (paginaCambia)="pagina.set($event)" />
        </div>
      </div>
    }

    @if (modalCrear()) {
      <app-modal titulo="Nuevo Docente" (cerrar)="modalCrear.set(false)">
        <form [formGroup]="formCrear" (ngSubmit)="crear()" class="space-y-5" novalidate>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
              <input type="text" formControlName="nombre" placeholder="Juan"
                class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
                [class.border-rose-400]="invalido(formCrear, 'nombre')"/>
            </div>
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Apellido</label>
              <input type="text" formControlName="apellido" placeholder="Pérez"
                class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
                [class.border-rose-400]="invalido(formCrear, 'apellido')"/>
            </div>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Correo electrónico</label>
            <input type="email" formControlName="email" placeholder="docente@colegio.edu"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"
              [class.border-rose-400]="invalido(formCrear, 'email')"/>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Contraseña temporal</label>
            <input type="password" formControlName="password" placeholder="••••••"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"
              [class.border-rose-400]="invalido(formCrear, 'password')"/>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Especialidad (opcional)</label>
            <select formControlName="especialidad"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              <option value="">Sin especialidad</option>
              @for (a of asignaturas(); track a.id) {
                <option [value]="a.nombre">{{ a.nombre }}</option>
              }
            </select>
          </div>
          <footer class="flex justify-end gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="modalCrear.set(false)" class="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition duration-150">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl disabled:opacity-60 transition duration-150 shadow-sm shadow-indigo-600/10">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </app-modal>
    }

    @if (modalEditar()) {
      <app-modal titulo="Editar Especialidad" (cerrar)="modalEditar.set(false)">
        <form [formGroup]="formEditar" (ngSubmit)="guardarEdicion()" class="space-y-5" novalidate>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Especialidad</label>
            <select formControlName="especialidad"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              <option value="">Sin especialidad</option>
              @for (a of asignaturas(); track a.id) {
                <option [value]="a.nombre">{{ a.nombre }}</option>
              }
            </select>
          </div>
          <footer class="flex justify-end gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="modalEditar.set(false)" class="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition duration-150">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl disabled:opacity-60 transition duration-150 shadow-sm shadow-indigo-600/10">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </app-modal>
    }
  `,
})
export class DocentesComponent implements OnInit {
  private readonly repo = inject(DocentesRepository);
  private readonly asignaturasRepo = inject(AsignaturasRepository);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly docentes = signal<Docente[]>([]);
  readonly asignaturas = signal<Asignatura[]>([]);
  readonly modalCrear = signal(false);
  readonly modalEditar = signal(false);
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');
  private readonly editandoId = signal<string | null>(null);

  readonly docentesFiltrados = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    if (!busqueda) return this.docentes();
    return this.docentes().filter((d) =>
      d.nombre.toLowerCase().includes(busqueda) ||
      d.apellido.toLowerCase().includes(busqueda) ||
      d.email.toLowerCase().includes(busqueda) ||
      (d.especialidad && d.especialidad.toLowerCase().includes(busqueda))
    );
  });

  readonly docentesPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.docentesFiltrados().slice(inicio, inicio + POR_PAGINA);
  });

  readonly formCrear = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    especialidad: [''],
  });

  readonly formEditar = this.fb.group({ especialidad: [''] });

  async ngOnInit(): Promise<void> {
    const [, a] = await Promise.all([this.cargar(), this.asignaturasRepo.obtenerTodas()]);
    if (a.error === null) this.asignaturas.set(a.datos);
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    const r = await this.repo.obtenerTodos();
    this.cargando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.docentes.set(r.datos);
    this.pagina.set(1);
  }

  abrirModalCrear(): void { this.formCrear.reset(); this.modalCrear.set(true); }

  abrirModalEditar(d: Docente): void {
    this.formEditar.setValue({ especialidad: d.especialidad ?? '' });
    this.editandoId.set(d.id); this.modalEditar.set(true);
  }

  async crear(): Promise<void> {
    if (this.formCrear.invalid) { this.formCrear.markAllAsTouched(); return; }
    this.guardando.set(true);
    const { nombre, apellido, email, password, especialidad } = this.formCrear.getRawValue();
    const r = await this.repo.crear({ nombre: nombre!, apellido: apellido!, email: email!, password: password!, especialidad: especialidad || undefined });
    this.guardando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.modalCrear.set(false);
    await this.cargar();
    toast.success('Docente registrado correctamente', {
      description: '¿Quieres programar su horario semanal ahora?',
      action: {
        label: 'Crear Horario',
        onClick: () => this.router.navigateByUrl('/admin/horarios')
      },
      duration: 10000
    });
  }

  async guardarEdicion(): Promise<void> {
    this.guardando.set(true);
    const r = await this.repo.actualizar(this.editandoId()!, this.formEditar.getRawValue().especialidad ?? '');
    this.guardando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.modalEditar.set(false);
    await this.cargar();
    toast.success('Especialidad del docente actualizada con éxito');
  }

  async eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar este docente?')) return;
    const r = await this.repo.eliminar(id);
    if (r.error !== null) { toast.error(r.error); return; }
    this.docentes.update((l) => l.filter((d) => d.id !== id));
    toast.success('Docente eliminado de la institución');
  }

  invalido(form: ReturnType<FormBuilder['group']>, c: string): boolean { const f = form.get(c); return !!(f?.invalid && f.touched); }
}
