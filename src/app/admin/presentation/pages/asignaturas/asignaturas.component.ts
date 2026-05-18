import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { AsignaturasRepository } from '../../../core/domain/ports/asignaturas.repository';
import { Asignatura, CrearAsignaturaDto } from '../../../core/domain/models/asignatura.model';

const POR_PAGINA = 10;

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-asignaturas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent, BuscadorComponent],
  template: `
    <app-page-header titulo="Asignaturas" subtitulo="Plan de estudios y materias del colegio" />

    <!-- Top Action Bar -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-md">
        <app-buscador placeholder="Buscar asignatura..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
      <button (click)="abrirModal()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nueva Asignatura
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (asignaturas().length === 0) { 
      <app-empty-state titulo="Sin asignaturas" descripcion="Aún no hay materias registradas en el plan de estudios." /> 
    } @else {
      <!-- Bento Table Card -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="px-6 py-4 text-left">Asignatura</th>
                <th class="px-6 py-4 text-left">Código</th>
                <th class="px-6 py-4 text-left">Descripción</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (a of asignaturasPagina(); track a.id) {
                <tr class="hover:bg-slate-50/30 transition duration-150">
                  <td class="px-6 py-4 font-extrabold text-slate-800 text-sm">{{ a.nombre }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-block px-2.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-500 font-mono text-xs font-bold rounded-xl">
                      {{ a.codigo }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-500 font-semibold text-xs">{{ a.descripcion ?? '—' }}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="inline-flex gap-2">
                      <button (click)="abrirModalEditar(a)" class="p-2 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition duration-150" aria-label="Editar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button (click)="eliminar(a.id)" class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition duration-150" aria-label="Eliminar">
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
          <app-paginador [paginaActual]="pagina()" [total]="asignaturasFiltradas().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
        </div>
      </div>
    }

    @if (modalAbierto()) {
      <app-modal [titulo]="editandoId() ? 'Editar Asignatura' : 'Nueva Asignatura'" (cerrar)="cerrarModal()">
        <form [formGroup]="formulario" (ngSubmit)="guardar()" class="space-y-5" novalidate>
          <div>
            <label for="nombre" class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
            <input id="nombre" type="text" formControlName="nombre" placeholder="Ej: Matemáticas"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
              [class.border-rose-400]="invalido('nombre')"/>
            @if (invalido('nombre')) { <p class="mt-1 text-[10px] text-rose-600 font-bold">Requerido.</p> }
          </div>
          <div>
            <label for="codigo" class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Código</label>
            <input id="codigo" type="text" formControlName="codigo" placeholder="Ej: MAT-01"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"
              [class.border-rose-400]="invalido('codigo')"/>
            @if (invalido('codigo')) { <p class="mt-1 text-[10px] text-rose-600 font-bold">Requerido.</p> }
          </div>
          <div>
            <label for="descripcion" class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Descripción (opcional)</label>
            <textarea id="descripcion" formControlName="descripcion" rows="2" placeholder="Breve detalle de la materia..."
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800 resize-none"></textarea>
          </div>
          <footer class="flex justify-end gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="cerrarModal()" class="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition duration-150">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl disabled:opacity-60 transition duration-150 shadow-sm shadow-indigo-600/10">
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
  private readonly router = inject(Router);

  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly asignaturas = signal<Asignatura[]>([]);
  readonly modalAbierto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');

  readonly asignaturasFiltradas = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    if (!busqueda) return this.asignaturas();
    return this.asignaturas().filter((a) =>
      a.nombre.toLowerCase().includes(busqueda) ||
      a.codigo.toLowerCase().includes(busqueda) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(busqueda))
    );
  });

  readonly asignaturasPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.asignaturasFiltradas().slice(inicio, inicio + POR_PAGINA);
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
    if (r.error !== null) { toast.error(r.error); return; }
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
    if (r.error !== null) { toast.error(r.error); return; }
    this.cerrarModal(); await this.cargar();

    if (id) {
      toast.success('Asignatura actualizada con éxito');
    } else {
      toast.success('Asignatura creada correctamente', {
        description: 'La materia ha sido dada de alta. ¿Deseas programarla en un horario ahora?',
        action: {
          label: 'Ir a Horarios',
          onClick: () => this.router.navigateByUrl('/admin/horarios')
        },
        duration: 10000
      });
    }
  }

  async eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar esta asignatura?')) return;
    const r = await this.repo.eliminar(id);
    if (r.error !== null) { toast.error(r.error); return; }
    this.asignaturas.update((l) => l.filter((a) => a.id !== id));
    toast.success('Asignatura eliminada correctamente');
  }

  invalido(c: string): boolean { const f = this.formulario.get(c); return !!(f?.invalid && f.touched); }
}
