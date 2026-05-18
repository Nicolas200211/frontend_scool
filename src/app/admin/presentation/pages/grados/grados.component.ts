import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
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
    BadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ModalComponent,
  ],
  template: `
    <app-page-header
      titulo="Grados y Secciones"
      subtitulo="Organiza los grados y sus secciones por año académico"
    />

    <div class="flex justify-end mb-6">
      <button (click)="abrirModalGrado()"
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700
               text-white text-sm font-semibold rounded-lg shadow transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Agregar Grado
      </button>
    </div>

    @if (cargando()) {
      <app-loading-spinner mensaje="Cargando grados..." />
    } @else if (grados().length === 0) {
      <app-empty-state
        titulo="No hay grados registrados"
        descripcion="Agrega el primer grado para comenzar"
      />
    } @else {
      <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-label="Lista de grados">
        @for (grado of grados(); track grado.id) {
          <article class="bg-white rounded-xl border border-gray-100 shadow-sm p-5">

            <header class="flex items-start justify-between mb-4">
              <div class="space-y-1">
                <h2 class="text-base font-semibold text-gray-900">{{ grado.nombre }}</h2>
                <app-badge [variante]="grado.nivel === 'primaria' ? 'azul' : 'verde'">
                  {{ grado.nivel === 'primaria' ? 'Primaria' : 'Secundaria' }}
                </app-badge>
              </div>
              <div class="flex gap-1 shrink-0">
                <button (click)="abrirModalGradoEditar(grado)"
                  class="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                  aria-label="Editar grado">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button (click)="eliminarGrado(grado.id)"
                  class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                  aria-label="Eliminar grado">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </header>

            <div>
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Secciones {{ anioActual }}
              </p>
              <div class="flex flex-wrap gap-2">
                @for (seccion of grado.secciones; track seccion.id) {
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border
                               border-gray-200 rounded-lg text-sm font-medium text-gray-700">
                    {{ seccion.nombre }}
                    <button (click)="abrirModalSeccionEditar(seccion, grado.id)"
                      class="text-gray-300 hover:text-indigo-500 transition"
                      [attr.aria-label]="'Editar sección ' + seccion.nombre">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button (click)="eliminarSeccion(seccion.id, grado.id)"
                      class="text-gray-300 hover:text-red-500 transition"
                      [attr.aria-label]="'Eliminar sección ' + seccion.nombre">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                }
                <button (click)="abrirModalSeccionCrear(grado.id)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-gray-300
                         rounded-lg text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Sección
                </button>
              </div>
            </div>

          </article>
        }
      </section>
    }

    @if (errorGlobal()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow-md z-50" role="alert">
        <p class="text-sm text-red-600">{{ errorGlobal() }}</p>
      </div>
    }

    @if (modalAbierto() === 'grado-crear' || modalAbierto() === 'grado-editar') {
      <app-modal
        [titulo]="modalAbierto() === 'grado-crear' ? 'Nuevo Grado' : 'Editar Grado'"
        (cerrar)="cerrarModal()"
      >
        <form [formGroup]="formularioGrado" (ngSubmit)="guardarGrado()" class="space-y-4" novalidate>
          <div>
            <label for="nombre-grado" class="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input id="nombre-grado" type="text" formControlName="nombre" placeholder="Ej: 1° Primaria"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              [class.border-red-400]="gradoCampoInvalido('nombre')" />
            @if (gradoCampoInvalido('nombre')) {
              <p class="mt-1 text-xs text-red-500">El nombre es requerido.</p>
            }
          </div>

          <div>
            <label for="nivel-grado" class="block text-sm font-medium text-gray-700 mb-1.5">Nivel</label>
            <select id="nivel-grado" formControlName="nivel"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition">
              <option value="primaria">Primaria</option>
              <option value="secundaria">Secundaria</option>
            </select>
          </div>

          <div>
            <label for="orden-grado" class="block text-sm font-medium text-gray-700 mb-1.5">Orden</label>
            <input id="orden-grado" type="number" formControlName="orden" min="1" placeholder="Ej: 1"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              [class.border-red-400]="gradoCampoInvalido('orden')" />
            @if (gradoCampoInvalido('orden')) {
              <p class="mt-1 text-xs text-red-500">El orden debe ser mayor a 0.</p>
            }
          </div>

          <footer class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="cerrarModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                     rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="submit" [disabled]="guardando()"
              class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg
                     hover:bg-indigo-700 disabled:opacity-60 transition">
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
        <form [formGroup]="formularioSeccion" (ngSubmit)="guardarSeccion()" class="space-y-4" novalidate>
          <div>
            <label for="nombre-seccion" class="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input id="nombre-seccion" type="text" formControlName="nombre" placeholder="Ej: A"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              [class.border-red-400]="seccionCampoInvalido('nombre')" />
            @if (seccionCampoInvalido('nombre')) {
              <p class="mt-1 text-xs text-red-500">El nombre es requerido.</p>
            }
          </div>

          <div>
            <label for="anio-seccion" class="block text-sm font-medium text-gray-700 mb-1.5">Año académico</label>
            <input id="anio-seccion" type="number" formControlName="anioAcademico" [min]="2020" [max]="2050"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
          </div>

          <footer class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="cerrarModal()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                     rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="submit" [disabled]="guardando()"
              class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg
                     hover:bg-indigo-700 disabled:opacity-60 transition">
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

  readonly anioActual = new Date().getFullYear();
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly errorGlobal = signal<string | null>(null);
  readonly grados = signal<GradoConSecciones[]>([]);
  readonly modalAbierto = signal<ModoModal | null>(null);

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
    if (respuesta.error !== null) { this.mostrarError(respuesta.error); return; }
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
    if (respuesta.error !== null) { this.mostrarError(respuesta.error); return; }
    this.cerrarModal();
    await this.cargarGrados();
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
    if (respuesta.error !== null) { this.mostrarError(respuesta.error); return; }
    this.cerrarModal();
    await this.cargarGrados();
  }

  async eliminarGrado(id: string): Promise<void> {
    if (!confirm('¿Eliminar este grado? También se eliminarán sus secciones.')) return;
    const respuesta = await this.gradosRepository.eliminar(id);
    if (respuesta.error !== null) { this.mostrarError(respuesta.error); return; }
    this.grados.update((lista) => lista.filter((g) => g.id !== id));
  }

  async eliminarSeccion(seccionId: string, gradoId: string): Promise<void> {
    if (!confirm('¿Eliminar esta sección?')) return;
    const respuesta = await this.gradosRepository.eliminarSeccion(seccionId);
    if (respuesta.error !== null) { this.mostrarError(respuesta.error); return; }
    this.grados.update((lista) =>
      lista.map((g) => g.id === gradoId ? { ...g, secciones: g.secciones.filter((s) => s.id !== seccionId) } : g)
    );
  }

  gradoCampoInvalido(campo: 'nombre' | 'nivel' | 'orden'): boolean {
    const c = this.formularioGrado.get(campo);
    return !!(c?.invalid && c.touched);
  }

  seccionCampoInvalido(campo: 'nombre' | 'anioAcademico'): boolean {
    const c = this.formularioSeccion.get(campo);
    return !!(c?.invalid && c.touched);
  }

  private mostrarError(mensaje: string): void {
    this.errorGlobal.set(mensaje);
    setTimeout(() => this.errorGlobal.set(null), 4000);
  }
}
