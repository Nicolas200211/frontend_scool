import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';
import { GradosRepository } from '../../../core/domain/ports/grados.repository';
import {
  CrearGradoDto,
  CrearSeccionDto,
  GradoConSecciones,
  Nivel,
  Seccion,
} from '../../../core/domain/models/grado.model';

type ModoModal = 'grado-crear' | 'grado-editar' | 'seccion-crear' | 'seccion-editar';

@Component({
  selector: 'app-grados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ModalComponent,
    BuscadorComponent,
  ],
  template: `
    <app-page-header
      titulo="Grados y Secciones"
      subtitulo="Organiza los grados y sus secciones por año académico"
    />

    <!-- Top Action Bar -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-md">
        <app-buscador placeholder="Buscar grado o sección..." (busquedaCambia)="filtro.set($event)" />
      </div>
      <button (click)="abrirModalGrado()"
        class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Agregar Grado
      </button>
    </div>

    @if (cargando()) {
      <app-loading-spinner mensaje="Cargando grados..." />
    } @else if (gradosFiltrados().length === 0) {
      <app-empty-state
        titulo="No se encontraron grados"
        descripcion="No hay grados o secciones que coincidan con la búsqueda."
      />
    } @else {
      <!-- Grados Bento Grid -->
      <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" aria-label="Lista de grados">
        @for (grado of gradosFiltrados(); track grado.id) {
          <article class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-6 hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
            <div>
              <header class="flex items-start justify-between mb-5">
                <div class="space-y-1.5">
                  <h2 class="text-lg font-black text-slate-800 leading-tight">{{ grado.nombre }}</h2>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border tracking-wider"
                    [class]="grado.nivel === 'primaria' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'">
                    {{ grado.nivel === 'primaria' ? 'Primaria' : 'Secundaria' }}
                  </span>
                </div>
                <div class="flex gap-1.5 shrink-0">
                  <button (click)="abrirModalGradoEditar(grado)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition duration-150"
                    aria-label="Editar grado">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button (click)="eliminarGrado(grado.id)"
                    class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition duration-150"
                    aria-label="Eliminar grado">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </header>

              <div class="mt-4 pt-4 border-t border-slate-50">
                <p class="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3 font-mono">
                  Secciones — {{ anioActual }}
                </p>
                <div class="flex flex-wrap gap-2">
                  @for (seccion of grado.secciones; track seccion.id) {
                    <span class="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 hover:border-indigo-200 hover:bg-white transition-all duration-150">
                      <span class="font-extrabold">{{ seccion.nombre }}</span>
                      
                      <div class="flex items-center gap-1 border-l border-slate-200 pl-1.5 ml-0.5">
                        <button (click)="abrirModalSeccionEditar(seccion, grado.id)"
                          class="text-slate-400 hover:text-indigo-600 transition duration-100"
                          [attr.aria-label]="'Editar sección ' + seccion.nombre">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button (click)="eliminarSeccion(seccion.id, grado.id)"
                          class="text-slate-400 hover:text-rose-600 transition duration-100"
                          [attr.aria-label]="'Eliminar sección ' + seccion.nombre">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    </span>
                  }
                  <button (click)="abrirModalSeccionCrear(grado.id)"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 rounded-2xl text-xs font-bold text-slate-400 hover:text-indigo-600 transition duration-150">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Añadir
                  </button>
                </div>
              </div>
            </div>
          </article>
        }
      </section>
    }

    @if (modalAbierto() === 'grado-crear' || modalAbierto() === 'grado-editar') {
      <app-modal
        [titulo]="modalAbierto() === 'grado-crear' ? 'Nuevo Grado' : 'Editar Grado'"
        (cerrar)="cerrarModal()"
      >
        <form [formGroup]="formularioGrado" (ngSubmit)="guardarGrado()" class="space-y-5" novalidate>
          <div>
            <label for="nombre-grado" class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
            <input id="nombre-grado" type="text" formControlName="nombre" placeholder="Ej: 1° Primaria"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
              [class.border-rose-400]="gradoCampoInvalido('nombre')" />
            @if (gradoCampoInvalido('nombre')) {
              <p class="mt-1 text-[10px] text-rose-600 font-bold">El nombre es requerido.</p>
            }
          </div>

          <div>
            <label for="nivel-grado" class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nivel</label>
            <select id="nivel-grado" formControlName="nivel"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              <option value="primaria">Primaria</option>
              <option value="secundaria">Secundaria</option>
            </select>
          </div>

          <div>
            <label for="orden-grado" class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Orden secuencial</label>
            <input id="orden-grado" type="number" formControlName="orden" min="1" placeholder="Ej: 1"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"
              [class.border-rose-400]="gradoCampoInvalido('orden')" />
            @if (gradoCampoInvalido('orden')) {
              <p class="mt-1 text-[10px] text-rose-600 font-bold">El orden debe ser mayor a 0.</p>
            }
          </div>

          <footer class="flex justify-end gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="cerrarModal()"
              class="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition duration-150">
              Cancelar
            </button>
            <button type="submit" [disabled]="guardando()"
              class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl disabled:opacity-60 transition duration-150 shadow-sm shadow-indigo-600/10">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </app-modal>
    }

    @if (modalAbierto() === 'seccion-crear' || modalAbierto() === 'seccion-editar') {
      <app-modal
        [titulo]="modalAbierto() === 'seccion-crear' ? 'Nueva Sección' : 'Editar Sección'"
        (cerrar)="cerrarModal()"
      >
        <form [formGroup]="formularioSeccion" (ngSubmit)="guardarSeccion()" class="space-y-5" novalidate>
          <div>
            <label for="nombre-seccion" class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Nombre</label>
            <input id="nombre-seccion" type="text" formControlName="nombre" placeholder="Ej: A"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
              [class.border-rose-400]="seccionCampoInvalido('nombre')" />
            @if (seccionCampoInvalido('nombre')) {
              <p class="mt-1 text-[10px] text-rose-600 font-bold">El nombre es requerido.</p>
            }
          </div>

          <div>
            <label for="anio-seccion" class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Año académico</label>
            <input id="anio-seccion" type="number" formControlName="anioAcademico" [min]="2020" [max]="2050"
              class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800" />
          </div>

          <footer class="flex justify-end gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="cerrarModal()"
              class="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition duration-150">
              Cancelar
            </button>
            <button type="submit" [disabled]="guardando()"
              class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl disabled:opacity-60 transition duration-150 shadow-sm shadow-indigo-600/10">
              {{ guardando() ? 'Guardando...' : 'Guardar' }}
            </button>
          </footer>
        </form>
      </app-modal>
    }
  `,
})
export class GradosComponent implements OnInit {
  private readonly gradosRepository = inject(GradosRepository);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly anioActual = new Date().getFullYear();
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly grados = signal<GradoConSecciones[]>([]);
  readonly modalAbierto = signal<ModoModal | null>(null);
  readonly filtro = signal<string>('');

  readonly gradosFiltrados = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    if (!busqueda) return this.grados();
    return this.grados().filter((g) =>
      g.nombre.toLowerCase().includes(busqueda) ||
      g.nivel.toLowerCase().includes(busqueda) ||
      g.secciones.some((s) => s.nombre.toLowerCase().includes(busqueda))
    );
  });

  private readonly gradoEditandoId = signal<string | null>(null);
  private readonly seccionEditandoId = signal<string | null>(null);
  private readonly gradoIdParaSeccion = signal<string | null>(null);

  readonly formularioGrado = this.formBuilder.group({
    nombre: ['', Validators.required],
    nivel: ['primaria' as Nivel, Validators.required],
    orden: [1, [Validators.required, Validators.min(1)]],
  });

  readonly formularioSeccion = this.formBuilder.group({
    nombre: ['', Validators.required],
    anioAcademico: [this.anioActual, Validators.required],
  });

  async ngOnInit(): Promise<void> {
    await this.cargarGrados();
  }

  async cargarGrados(): Promise<void> {
    this.cargando.set(true);
    const respuesta = await this.gradosRepository.obtenerTodos();
    this.cargando.set(false);
    if (respuesta.error !== null) { toast.error(respuesta.error); return; }
    this.grados.set(respuesta.datos);
  }

  abrirModalGrado(): void {
    this.formularioGrado.reset({ nombre: '', nivel: 'primaria', orden: 1 });
    this.gradoEditandoId.set(null);
    this.modalAbierto.set('grado-crear');
  }

  abrirModalGradoEditar(grado: GradoConSecciones): void {
    this.formularioGrado.setValue({ nombre: grado.nombre, nivel: grado.nivel, orden: grado.orden });
    this.gradoEditandoId.set(grado.id);
    this.modalAbierto.set('grado-editar');
  }

  abrirModalSeccionCrear(gradoId: string): void {
    this.formularioSeccion.reset({ nombre: '', anioAcademico: this.anioActual });
    this.gradoIdParaSeccion.set(gradoId);
    this.seccionEditandoId.set(null);
    this.modalAbierto.set('seccion-crear');
  }

  abrirModalSeccionEditar(seccion: Seccion, gradoId: string): void {
    this.formularioSeccion.setValue({ nombre: seccion.nombre, anioAcademico: seccion.anioAcademico });
    this.seccionEditandoId.set(seccion.id);
    this.gradoIdParaSeccion.set(gradoId);
    this.modalAbierto.set('seccion-editar');
  }

  cerrarModal(): void { this.modalAbierto.set(null); }

  async guardarGrado(): Promise<void> {
    if (this.formularioGrado.invalid) { this.formularioGrado.markAllAsTouched(); return; }
    this.guardando.set(true);
    const { nombre, nivel, orden } = this.formularioGrado.getRawValue();
    const dto: CrearGradoDto = { nombre: nombre!, nivel: nivel as Nivel, orden: orden! };
    const editandoId = this.gradoEditandoId();
    const respuesta = editandoId
      ? await this.gradosRepository.actualizar(editandoId, dto)
      : await this.gradosRepository.crear(dto);
    this.guardando.set(false);
    if (respuesta.error !== null) { toast.error(respuesta.error); return; }
    this.cerrarModal();
    await this.cargarGrados();

    if (editandoId) {
      toast.success('Grado actualizado correctamente');
    } else if (respuesta.datos) {
      const creadoId = respuesta.datos.id;
      toast.success('Grado creado correctamente', {
        description: '¿Deseas añadir una sección para este grado ahora?',
        action: {
          label: 'Añadir Sección',
          onClick: () => this.abrirModalSeccionCrear(creadoId)
        },
        duration: 10000
      });
    }
  }

  async guardarSeccion(): Promise<void> {
    if (this.formularioSeccion.invalid) { this.formularioSeccion.markAllAsTouched(); return; }
    this.guardando.set(true);
    const { nombre, anioAcademico } = this.formularioSeccion.getRawValue();
    const editandoId = this.seccionEditandoId();
    const dto: CrearSeccionDto = { gradoId: this.gradoIdParaSeccion()!, nombre: nombre!, anioAcademico: anioAcademico! };
    const respuesta = editandoId
      ? await this.gradosRepository.actualizarSeccion(editandoId, dto)
      : await this.gradosRepository.crearSeccion(dto);
    this.guardando.set(false);
    if (respuesta.error !== null) { toast.error(respuesta.error); return; }
    this.cerrarModal();
    await this.cargarGrados();

    if (editandoId) {
      toast.success('Sección actualizada con éxito');
    } else {
      toast.success('Sección añadida correctamente', {
        description: '¿Deseas programar un horario para esta sección ahora?',
        action: {
          label: 'Ir a Horarios',
          onClick: () => this.router.navigateByUrl('/admin/horarios')
        },
        duration: 10000
      });
    }
  }

  async eliminarGrado(id: string): Promise<void> {
    if (!confirm('¿Eliminar este grado? También se eliminarán sus secciones.')) return;
    const respuesta = await this.gradosRepository.eliminar(id);
    if (respuesta.error !== null) { toast.error(respuesta.error); return; }
    this.grados.update((lista) => lista.filter((g) => g.id !== id));
    toast.success('Grado y secciones asociadas eliminados correctamente');
  }

  async eliminarSeccion(seccionId: string, gradoId: string): Promise<void> {
    if (!confirm('¿Eliminar esta sección?')) return;
    const respuesta = await this.gradosRepository.eliminarSeccion(seccionId);
    if (respuesta.error !== null) { toast.error(respuesta.error); return; }
    this.grados.update((lista) =>
      lista.map((g) => g.id === gradoId ? { ...g, secciones: g.secciones.filter((s) => s.id !== seccionId) } : g)
    );
    toast.success('Sección eliminada con éxito');
  }

  gradoCampoInvalido(campo: 'nombre' | 'nivel' | 'orden'): boolean {
    const c = this.formularioGrado.get(campo);
    return !!(c?.invalid && c.touched);
  }

  seccionCampoInvalido(campo: 'nombre' | 'anioAcademico'): boolean {
    const c = this.formularioSeccion.get(campo);
    return !!(c?.invalid && c.touched);
  }
}
