import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { EstudiantesRepository } from '../../../core/domain/ports/estudiantes.repository';
import { Estudiante } from '../../../core/domain/models/estudiante.model';

const POR_PAGINA = 10;

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent, BuscadorComponent],
  template: `
    <app-page-header titulo="Estudiantes" subtitulo="Alumnado matriculado en la institución" />

    <!-- Top Action Bar -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-md">
        <app-buscador placeholder="Buscar estudiante..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
      <button (click)="abrirModalCrear()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nuevo Estudiante
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (estudiantes().length === 0) { 
      <app-empty-state titulo="Sin estudiantes" descripcion="Aún no hay estudiantes registrados en el sistema del colegio." /> 
    } @else {
      <!-- Bento Table Card -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="px-6 py-4 text-left">Código</th>
                <th class="px-6 py-4 text-left">Estudiante</th>
                <th class="px-6 py-4 text-left">Correo Electrónico</th>
                <th class="px-6 py-4 text-left">F. Nacimiento</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (e of estudiantesPagina(); track e.id) {
                <tr class="hover:bg-slate-50/30 transition duration-150">
                  <td class="px-6 py-4">
                    <span class="inline-block px-2.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 font-mono text-xs font-bold rounded-xl">
                      {{ e.codigo }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <p class="font-extrabold text-slate-800 text-sm">{{ e.nombre }} {{ e.apellido }}</p>
                    <p class="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider mt-0.5">Estudiante ID: {{ e.id }}</p>
                  </td>
                  <td class="px-6 py-4 text-slate-500 font-semibold font-mono text-xs">{{ e.email }}</td>
                  <td class="px-6 py-4 text-slate-500 font-bold font-mono text-xs">{{ e.fechaNacimiento ?? '—' }}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="inline-flex gap-2">
                      <button (click)="abrirModalEditar(e)" class="p-2 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition duration-150">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button (click)="eliminar(e.id)" class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition duration-150">
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
          <app-paginador [paginaActual]="pagina()" [total]="estudiantesFiltrados().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
        </div>
      </div>
    }

    @if (modalCrear()) {
      <app-modal titulo="Nuevo Estudiante" (cerrar)="modalCrear.set(false)">
        <form [formGroup]="formCrear" (ngSubmit)="crear()" class="space-y-5" novalidate>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
              <input type="text" formControlName="nombre" placeholder="Nombre"
                class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
                [class.border-rose-400]="invalido(formCrear,'nombre')"/>
            </div>
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Apellido</label>
              <input type="text" formControlName="apellido" placeholder="Apellido"
                class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
                [class.border-rose-400]="invalido(formCrear,'apellido')"/>
            </div>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Código de estudiante</label>
            <input type="text" formControlName="codigo" placeholder="Ej: 2024-001"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"
              [class.border-rose-400]="invalido(formCrear,'codigo')"/>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Correo electrónico</label>
            <input type="email" formControlName="email" placeholder="estudiante@colegio.edu"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"
              [class.border-rose-400]="invalido(formCrear,'email')"/>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Contraseña temporal</label>
            <input type="password" formControlName="password" placeholder="••••••"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"
              [class.border-rose-400]="invalido(formCrear,'password')"/>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">F. Nacimiento</label>
              <input type="date" formControlName="fechaNacimiento"
                class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"/>
            </div>
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Dirección</label>
              <input type="text" formControlName="direccion" placeholder="Calle Falsa 123"
                class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"/>
            </div>
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
      <app-modal titulo="Editar Estudiante" (cerrar)="modalEditar.set(false)">
        <form [formGroup]="formEditar" (ngSubmit)="guardarEdicion()" class="space-y-5" novalidate>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Código</label>
            <input type="text" formControlName="codigo"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"/>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">F. Nacimiento</label>
            <input type="date" formControlName="fechaNacimiento"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"/>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Dirección</label>
            <input type="text" formControlName="direccion"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"/>
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
export class EstudiantesComponent implements OnInit {
  private readonly repo = inject(EstudiantesRepository);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly estudiantes = signal<Estudiante[]>([]);
  readonly modalCrear = signal(false);
  readonly modalEditar = signal(false);
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');
  private readonly editandoId = signal<string | null>(null);

  readonly estudiantesFiltrados = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    if (!busqueda) return this.estudiantes();
    return this.estudiantes().filter((e) =>
      e.nombre.toLowerCase().includes(busqueda) ||
      e.apellido.toLowerCase().includes(busqueda) ||
      e.codigo.toLowerCase().includes(busqueda) ||
      e.email.toLowerCase().includes(busqueda)
    );
  });

  readonly estudiantesPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.estudiantesFiltrados().slice(inicio, inicio + POR_PAGINA);
  });

  readonly formCrear = this.fb.group({
    nombre: ['', Validators.required], apellido: ['', Validators.required],
    codigo: ['', Validators.required], email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    fechaNacimiento: [''], direccion: [''],
  });

  readonly formEditar = this.fb.group({ codigo: [''], fechaNacimiento: [''], direccion: [''] });

  async ngOnInit(): Promise<void> { await this.cargar(); }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    const r = await this.repo.obtenerTodos();
    this.cargando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.estudiantes.set(r.datos);
    this.pagina.set(1);
  }

  abrirModalCrear(): void { this.formCrear.reset(); this.modalCrear.set(true); }

  abrirModalEditar(e: Estudiante): void {
    this.formEditar.setValue({ codigo: e.codigo, fechaNacimiento: e.fechaNacimiento ?? '', direccion: e.direccion ?? '' });
    this.editandoId.set(e.id); this.modalEditar.set(true);
  }

  async crear(): Promise<void> {
    if (this.formCrear.invalid) { this.formCrear.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.formCrear.getRawValue();
    const r = await this.repo.crear({ nombre: v.nombre!, apellido: v.apellido!, codigo: v.codigo!, email: v.email!, password: v.password!, fechaNacimiento: v.fechaNacimiento || undefined, direccion: v.direccion || undefined });
    this.guardando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.modalCrear.set(false); await this.cargar();
    toast.success('Estudiante registrado correctamente', {
      description: 'El alumno ha sido dado de alta. ¿Deseas matricularlo en un grado y sección ahora?',
      action: {
        label: 'Matricular alumno',
        onClick: () => this.router.navigateByUrl('/admin/matriculas')
      },
      duration: 10000
    });
  }

  async guardarEdicion(): Promise<void> {
    this.guardando.set(true);
    const v = this.formEditar.getRawValue();
    const r = await this.repo.actualizar(this.editandoId()!, { codigo: v.codigo || undefined, fechaNacimiento: v.fechaNacimiento || undefined, direccion: v.direccion || undefined });
    this.guardando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.modalEditar.set(false); await this.cargar();
    toast.success('Estudiante actualizado correctamente');
  }

  async eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar este estudiante?')) return;
    const r = await this.repo.eliminar(id);
    if (r.error !== null) { toast.error(r.error); return; }
    this.estudiantes.update((l) => l.filter((e) => e.id !== id));
    toast.success('Estudiante eliminado con éxito');
  }

  invalido(form: any, c: string): boolean { const f = form.get(c); return !!(f?.invalid && f.touched); }
}
