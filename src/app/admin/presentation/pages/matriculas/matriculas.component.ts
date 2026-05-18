import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { MatriculasRepository } from '../../../core/domain/ports/matriculas.repository';

const POR_PAGINA = 10;
import { EstudiantesRepository } from '../../../core/domain/ports/estudiantes.repository';
import { GradosRepository } from '../../../core/domain/ports/grados.repository';
import { Matricula, EstadoMatricula } from '../../../core/domain/models/matricula.model';
import { Estudiante } from '../../../core/domain/models/estudiante.model';
import { GradoConSecciones } from '../../../core/domain/models/grado.model';

const ESTADOS: { valor: EstadoMatricula; etiqueta: string }[] = [
  { valor: 'activo', etiqueta: 'Activo' },
  { valor: 'retirado', etiqueta: 'Retirado' },
  { valor: 'trasladado', etiqueta: 'Trasladado' },
];

@Component({
  selector: 'app-matriculas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent],
  template: `
    <app-page-header titulo="Matrículas" subtitulo="Administra la inscripción de estudiantes en secciones" />

    <div class="flex justify-end mb-6">
      <button (click)="abrirModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nueva Matrícula
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (matriculas().length === 0) { <app-empty-state titulo="Sin matrículas" descripcion="Matricula el primer estudiante" /> }
    @else {
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Estudiante</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Sección</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Año</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Estado</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (m of matriculasPagina(); track m.id) {
              <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900">{{ m.estudianteNombre }} {{ m.estudianteApellido }}</p>
                  <p class="text-xs text-gray-400 font-mono">{{ m.estudianteCodigo }}</p>
                </td>
                <td class="px-4 py-3 text-gray-700">{{ m.gradoNombre }} — {{ m.seccionNombre }}</td>
                <td class="px-4 py-3 text-gray-500">{{ m.anioAcademico }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    [class]="m.estado === 'activo' ? 'bg-green-100 text-green-700' : m.estado === 'retirado' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'">
                    {{ m.estado }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="inline-flex gap-1">
                    <button (click)="abrirModalEditar(m)" class="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button (click)="eliminar(m.id)" class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-paginador [paginaActual]="pagina()" [total]="matriculas().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
    }

    @if (error()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-red-600">{{ error() }}</p>
      </div>
    }

    @if (modalAbierto()) {
      <app-modal [titulo]="editandoId() ? 'Editar Matrícula' : 'Nueva Matrícula'" (cerrar)="cerrarModal()">
        <form [formGroup]="formulario" (ngSubmit)="guardar()" class="space-y-4" novalidate>
          @if (!editandoId()) {
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Estudiante</label>
              <select formControlName="estudianteId" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                <option value="">Seleccionar estudiante</option>
                @for (e of estudiantes(); track e.id) {
                  <option [value]="e.id">{{ e.nombre }} {{ e.apellido }} ({{ e.codigo }})</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Sección</label>
              <select formControlName="seccionId" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
                <option value="">Seleccionar sección</option>
                @for (g of grados(); track g.id) {
                  <optgroup [label]="g.nombre">
                    @for (s of g.secciones; track s.id) {
                      <option [value]="s.id">{{ g.nombre }} — Sección {{ s.nombre }}</option>
                    }
                  </optgroup>
                }
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Año académico</label>
              <input type="number" formControlName="anioAcademico" min="2020" max="2099"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
          }
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
            <select formControlName="estado" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              @for (e of estados; track e.valor) {
                <option [value]="e.valor">{{ e.etiqueta }}</option>
              }
            </select>
          </div>
          <footer class="flex justify-end gap-3 pt-2">
            <button type="button" (click)="cerrarModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition">{{ guardando() ? 'Guardando...' : 'Guardar' }}</button>
          </footer>
        </form>
      </app-modal>
    }
  `,
})
export class MatriculasComponent implements OnInit {
  private readonly repo = inject(MatriculasRepository);
  private readonly estudiantesRepo = inject(EstudiantesRepository);
  private readonly gradosRepo = inject(GradosRepository);
  private readonly fb = inject(FormBuilder);

  readonly estados = ESTADOS;
  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly matriculas = signal<Matricula[]>([]);
  readonly estudiantes = signal<Estudiante[]>([]);
  readonly grados = signal<GradoConSecciones[]>([]);
  readonly modalAbierto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly pagina = signal(1);

  readonly matriculasPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.matriculas().slice(inicio, inicio + POR_PAGINA);
  });

  readonly formulario = this.fb.group({
    estudianteId: ['', Validators.required],
    seccionId: ['', Validators.required],
    anioAcademico: [new Date().getFullYear(), Validators.required],
    estado: ['activo' as EstadoMatricula, Validators.required],
  });

  async ngOnInit(): Promise<void> {
    const [m, e, g] = await Promise.all([
      this.repo.obtenerTodas(),
      this.estudiantesRepo.obtenerTodos(),
      this.gradosRepo.obtenerTodos(),
    ]);
    this.cargando.set(false);
    if (m.error !== null) { this.mostrarError(m.error); return; }
    this.matriculas.set(m.datos);
    this.pagina.set(1);
    if (e.error === null) this.estudiantes.set(e.datos);
    if (g.error === null) this.grados.set(g.datos);
  }

  abrirModal(): void {
    this.formulario.reset({ anioAcademico: new Date().getFullYear(), estado: 'activo' });
    this.formulario.get('estudianteId')?.enable();
    this.formulario.get('seccionId')?.enable();
    this.formulario.get('anioAcademico')?.enable();
    this.editandoId.set(null);
    this.modalAbierto.set(true);
  }

  abrirModalEditar(m: Matricula): void {
    this.formulario.patchValue({ estado: m.estado });
    this.formulario.get('estudianteId')?.disable();
    this.formulario.get('seccionId')?.disable();
    this.formulario.get('anioAcademico')?.disable();
    this.editandoId.set(m.id);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void { this.modalAbierto.set(false); }

  async guardar(): Promise<void> {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.formulario.getRawValue();
    const id = this.editandoId();
    const r = id
      ? await this.repo.actualizar(id, { estado: v.estado as EstadoMatricula })
      : await this.repo.crear({ estudianteId: v.estudianteId!, seccionId: v.seccionId!, anioAcademico: v.anioAcademico!, estado: v.estado as EstadoMatricula });
    this.guardando.set(false);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.cerrarModal();
    const m = await this.repo.obtenerTodas();
    if (m.error === null) this.matriculas.set(m.datos);
  }

  async eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar esta matrícula?')) return;
    const r = await this.repo.eliminar(id);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.matriculas.update((l) => l.filter((m) => m.id !== id));
  }

  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
