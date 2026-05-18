import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { EstudiantesRepository } from '../../../core/domain/ports/estudiantes.repository';
import { Estudiante } from '../../../core/domain/models/estudiante.model';

const POR_PAGINA = 10;

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent],
  template: `
    <app-page-header titulo="Estudiantes" subtitulo="Gestiona los estudiantes matriculados" />

    <div class="flex justify-between items-center mb-6">
      <p class="text-sm text-gray-500">{{ estudiantes().length }} estudiante(s) registrado(s)</p>
      <button (click)="abrirModalCrear()" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nuevo Estudiante
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (estudiantes().length === 0) { <app-empty-state titulo="Sin estudiantes" descripcion="Agrega el primer estudiante" /> }
    @else {
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Código</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Nombre</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">F. Nacimiento</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (e of estudiantesPagina(); track e.id) {
              <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ e.codigo }}</td>
                <td class="px-4 py-3 font-medium text-gray-900">{{ e.nombre }} {{ e.apellido }}</td>
                <td class="px-4 py-3 text-gray-500">{{ e.email }}</td>
                <td class="px-4 py-3 text-gray-500">{{ e.fechaNacimiento ?? '—' }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="inline-flex gap-1">
                    <button (click)="abrirModalEditar(e)" class="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button (click)="eliminar(e.id)" class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-paginador [paginaActual]="pagina()" [total]="estudiantes().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
    }

    @if (error()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-red-600">{{ error() }}</p>
      </div>
    }

    @if (modalCrear()) {
      <app-modal titulo="Nuevo Estudiante" (cerrar)="modalCrear.set(false)">
        <form [formGroup]="formCrear" (ngSubmit)="crear()" class="space-y-4" novalidate>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
              <input type="text" formControlName="nombre" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" [class.border-red-400]="invalido(formCrear,'nombre')"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
              <input type="text" formControlName="apellido" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" [class.border-red-400]="invalido(formCrear,'apellido')"/>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Código de estudiante</label>
            <input type="text" formControlName="codigo" placeholder="Ej: 2024-001" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" [class.border-red-400]="invalido(formCrear,'codigo')"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
            <input type="email" formControlName="email" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" [class.border-red-400]="invalido(formCrear,'email')"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Contraseña temporal</label>
            <input type="password" formControlName="password" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" [class.border-red-400]="invalido(formCrear,'password')"/>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">F. Nacimiento</label>
              <input type="date" formControlName="fechaNacimiento" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
              <input type="text" formControlName="direccion" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
          </div>
          <footer class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="modalCrear.set(false)" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">{{ guardando() ? 'Guardando...' : 'Guardar' }}</button>
          </footer>
        </form>
      </app-modal>
    }

    @if (modalEditar()) {
      <app-modal titulo="Editar Estudiante" (cerrar)="modalEditar.set(false)">
        <form [formGroup]="formEditar" (ngSubmit)="guardarEdicion()" class="space-y-4" novalidate>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
            <input type="text" formControlName="codigo" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">F. Nacimiento</label>
            <input type="date" formControlName="fechaNacimiento" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
            <input type="text" formControlName="direccion" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
          </div>
          <footer class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="modalEditar.set(false)" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">{{ guardando() ? 'Guardando...' : 'Guardar' }}</button>
          </footer>
        </form>
      </app-modal>
    }
  `,
})
export class EstudiantesComponent implements OnInit {
  private readonly repo = inject(EstudiantesRepository);
  private readonly fb = inject(FormBuilder);

  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly estudiantes = signal<Estudiante[]>([]);
  readonly modalCrear = signal(false);
  readonly modalEditar = signal(false);
  readonly pagina = signal(1);
  private readonly editandoId = signal<string | null>(null);

  readonly estudiantesPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.estudiantes().slice(inicio, inicio + POR_PAGINA);
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
    if (r.error !== null) { this.mostrarError(r.error); return; }
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
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.modalCrear.set(false); await this.cargar();
  }

  async guardarEdicion(): Promise<void> {
    this.guardando.set(true);
    const v = this.formEditar.getRawValue();
    const r = await this.repo.actualizar(this.editandoId()!, { codigo: v.codigo || undefined, fechaNacimiento: v.fechaNacimiento || undefined, direccion: v.direccion || undefined });
    this.guardando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.modalEditar.set(false); await this.cargar();
  }

  async eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar este estudiante?')) return;
    const r = await this.repo.eliminar(id);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.estudiantes.update((l) => l.filter((e) => e.id !== id));
  }

  invalido(form: any, c: string): boolean { const f = form.get(c); return !!(f?.invalid && f.touched); }
  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
