import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { AsignaturasRepository } from '../../../core/domain/ports/asignaturas.repository';

const POR_PAGINA = 10;
import { Asignatura, CrearAsignaturaDto } from '../../../core/domain/models/asignatura.model';

@Component({
  selector: 'app-asignaturas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent],
  template: `
    <app-page-header titulo="Asignaturas" subtitulo="Gestiona las materias del colegio" />

    <div class="flex justify-end mb-6">
      <button (click)="abrirModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nueva Asignatura
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (asignaturas().length === 0) { <app-empty-state titulo="Sin asignaturas" descripcion="Agrega la primera asignatura" /> }
    @else {
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Nombre</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Código</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Descripción</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (a of asignaturasPagina(); track a.id) {
              <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3 font-medium text-gray-900">{{ a.nombre }}</td>
                <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ a.codigo }}</td>
                <td class="px-4 py-3 text-gray-500">{{ a.descripcion ?? '—' }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="inline-flex gap-1">
                    <button (click)="abrirModalEditar(a)" class="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition" aria-label="Editar">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button (click)="eliminar(a.id)" class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition" aria-label="Eliminar">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-paginador [paginaActual]="pagina()" [total]="asignaturas().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
    }

    @if (error()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-red-600">{{ error() }}</p>
      </div>
    }

    @if (modalAbierto()) {
      <app-modal [titulo]="editandoId() ? 'Editar Asignatura' : 'Nueva Asignatura'" (cerrar)="cerrarModal()">
        <form [formGroup]="formulario" (ngSubmit)="guardar()" class="space-y-4" novalidate>
          <div>
            <label for="nombre" class="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input id="nombre" type="text" formControlName="nombre" placeholder="Ej: Matemáticas"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              [class.border-red-400]="invalido('nombre')"/>
            @if (invalido('nombre')) { <p class="mt-1 text-xs text-red-500">Requerido.</p> }
          </div>
          <div>
            <label for="codigo" class="block text-sm font-medium text-gray-700 mb-1.5">Código</label>
            <input id="codigo" type="text" formControlName="codigo" placeholder="Ej: MAT-01"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              [class.border-red-400]="invalido('codigo')"/>
            @if (invalido('codigo')) { <p class="mt-1 text-xs text-red-500">Requerido.</p> }
          </div>
          <div>
            <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-1.5">Descripción (opcional)</label>
            <textarea id="descripcion" formControlName="descripcion" rows="2"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"></textarea>
          </div>
          <footer class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="cerrarModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </app-modal>
    }
  `,
})
export class AsignaturasComponent implements OnInit {
  private readonly repo = inject(AsignaturasRepository);
  private readonly fb = inject(FormBuilder);

  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly asignaturas = signal<Asignatura[]>([]);
  readonly modalAbierto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly pagina = signal(1);

  readonly asignaturasPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.asignaturas().slice(inicio, inicio + POR_PAGINA);
  });

  readonly formulario = this.fb.group({
    nombre: ['', Validators.required],
    codigo: ['', Validators.required],
    descripcion: [''],
  });

  async ngOnInit(): Promise<void> { await this.cargar(); }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    const r = await this.repo.obtenerTodas();
    this.cargando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.asignaturas.set(r.datos);
    this.pagina.set(1);
  }

  abrirModal(): void { this.formulario.reset(); this.editandoId.set(null); this.modalAbierto.set(true); }

  abrirModalEditar(a: Asignatura): void {
    this.formulario.setValue({ nombre: a.nombre, codigo: a.codigo, descripcion: a.descripcion ?? '' });
    this.editandoId.set(a.id); this.modalAbierto.set(true);
  }

  cerrarModal(): void { this.modalAbierto.set(false); }

  async guardar(): Promise<void> {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    this.guardando.set(true);
    const { nombre, codigo, descripcion } = this.formulario.getRawValue();
    const dto: CrearAsignaturaDto = { nombre: nombre!, codigo: codigo!, descripcion: descripcion || undefined };
    const id = this.editandoId();
    const r = id ? await this.repo.actualizar(id, dto) : await this.repo.crear(dto);
    this.guardando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.cerrarModal(); await this.cargar();
  }

  async eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar esta asignatura?')) return;
    const r = await this.repo.eliminar(id);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.asignaturas.update((l) => l.filter((a) => a.id !== id));
  }

  invalido(c: string): boolean { const f = this.formulario.get(c); return !!(f?.invalid && f.touched); }
  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
