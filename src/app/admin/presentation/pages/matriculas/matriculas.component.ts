import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { MatriculasRepository } from '../../../core/domain/ports/matriculas.repository';
import { EstudiantesRepository } from '../../../core/domain/ports/estudiantes.repository';
import { GradosRepository } from '../../../core/domain/ports/grados.repository';
import { Matricula, EstadoMatricula } from '../../../core/domain/models/matricula.model';
import { Estudiante } from '../../../core/domain/models/estudiante.model';
import { GradoConSecciones } from '../../../core/domain/models/grado.model';

const POR_PAGINA = 10;

const ESTADOS: { valor: EstadoMatricula; etiqueta: string }[] = [
  { valor: 'activo', etiqueta: 'Activo' },
  { valor: 'retirado', etiqueta: 'Retirado' },
  { valor: 'trasladado', etiqueta: 'Trasladado' },
];

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-matriculas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent, BuscadorComponent],
  template: `
    <app-page-header titulo="Matrículas" subtitulo="Administración y registro de alumnos en secciones" />

    <!-- Top Action Bar -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-md">
        <app-buscador placeholder="Buscar matrícula..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
      <button (click)="abrirModal()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nueva Matrícula
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (matriculas().length === 0) { 
      <app-empty-state titulo="Sin matrículas" descripcion="Aún no hay matrículas registradas en el periodo académico escolar." /> 
    } @else {
      <!-- Bento Table Card -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="px-6 py-4 text-left">Estudiante</th>
                <th class="px-6 py-4 text-left">Grado y Sección</th>
                <th class="px-6 py-4 text-left">Año Académico</th>
                <th class="px-6 py-4 text-left">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (m of matriculasPagina(); track m.id) {
                <tr class="hover:bg-slate-50/30 transition duration-150">
                  <td class="px-6 py-4">
                    <p class="font-extrabold text-slate-800 text-sm">{{ m.estudianteNombre }} {{ m.estudianteApellido }}</p>
                    <span class="inline-block mt-1 font-mono text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-2 py-0.5">
                      {{ m.estudianteCodigo }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-3 py-1 bg-indigo-50/60 border border-indigo-100/50 text-indigo-700 text-xs font-extrabold rounded-2xl">
                      {{ m.gradoNombre }} — Sección {{ m.seccionNombre }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-500 font-extrabold font-mono text-xs">{{ m.anioAcademico }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold border"
                      [class]="m.estado === 'activo'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : m.estado === 'retirado'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : 'bg-amber-50 border-amber-100 text-amber-700'">
                      {{ m.estado }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="inline-flex gap-2">
                      <button (click)="abrirModalEditar(m)" class="p-2 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition duration-150">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button (click)="eliminar(m.id)" class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition duration-150">
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
          <app-paginador [paginaActual]="pagina()" [total]="matriculasFiltradas().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
        </div>
      </div>
    }

    @if (modalAbierto()) {
      <app-modal [titulo]="editandoId() ? 'Editar Matrícula' : 'Nueva Matrícula'" (cerrar)="cerrarModal()">
        <form [formGroup]="formulario" (ngSubmit)="guardar()" class="space-y-5" novalidate>
          @if (!editandoId()) {
            <div class="relative">
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Estudiante</label>
              
              <button type="button" (click)="toggleEstudianteDropdown()" [disabled]="formulario.get('estudianteId')?.disabled"
                class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 text-left focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                <span>
                  @if (estudianteSeleccionado()) {
                    {{ estudianteSeleccionado()?.nombre }} {{ estudianteSeleccionado()?.apellido }} ({{ estudianteSeleccionado()?.codigo }})
                  } @else {
                    Seleccionar estudiante...
                  }
                </span>
                <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" [class.rotate-180]="estudianteDropdownAbierto()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              @if (estudianteDropdownAbierto() && !formulario.get('estudianteId')?.disabled) {
                <div class="absolute z-50 w-full mt-2 bg-white rounded-2xl border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div class="relative flex items-center">
                    <svg class="absolute left-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    <input type="text"
                      [value]="buscadorEstudiante()"
                      (input)="buscadorEstudiante.set($any($event.target).value)"
                      placeholder="Escribe para buscar por nombre o código..."
                      class="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
                      autofocus />
                  </div>

                  <div class="max-h-48 overflow-y-auto pr-1 space-y-1">
                    @for (e of estudiantesFiltrados(); track e.id) {
                      <button type="button" (click)="seleccionarEstudiante(e)"
                        class="w-full text-left px-3 py-2 hover:bg-indigo-50/50 hover:text-indigo-700 rounded-xl text-xs font-semibold text-slate-700 transition duration-150 flex items-center justify-between">
                        <span>{{ e.nombre }} {{ e.apellido }}</span>
                        <span class="font-mono text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5">{{ e.codigo }}</span>
                      </button>
                    } @empty {
                      <div class="py-4 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Sin resultados</div>
                    }
                  </div>
                </div>
              }
            </div>
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Grado y Sección</label>
              <select formControlName="seccionId" class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
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
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Año académico</label>
              <input type="number" formControlName="anioAcademico" min="2020" max="2099"
                class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"/>
            </div>
          }
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Estado de la Matrícula</label>
            <select formControlName="estado" class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              @for (e of estados; track e.valor) {
                <option [value]="e.valor">{{ e.etiqueta }}</option>
              }
            </select>
          </div>
          <footer class="flex justify-end gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="cerrarModal()" class="px-4 py-2.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition duration-150">Cancelar</button>
            <button type="submit" [disabled]="guardando()" class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl disabled:opacity-60 transition duration-150 shadow-sm shadow-indigo-600/10">{{ guardando() ? 'Guardando...' : 'Guardar' }}</button>
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
  private readonly router = inject(Router);

  readonly estados = ESTADOS;
  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly matriculas = signal<Matricula[]>([]);
  readonly estudiantes = signal<Estudiante[]>([]);
  readonly grados = signal<GradoConSecciones[]>([]);
  readonly modalAbierto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');

  readonly buscadorEstudiante = signal('');
  readonly estudianteDropdownAbierto = signal(false);
  readonly estudianteIdSeleccionado = signal<string | null>(null);

  readonly estudiantesFiltrados = computed(() => {
    const q = this.buscadorEstudiante().toLowerCase().trim();
    const lista = this.estudiantes();
    if (!q) return lista.slice(0, 15);
    return lista.filter((e) =>
      e.nombre.toLowerCase().includes(q) ||
      e.apellido.toLowerCase().includes(q) ||
      e.codigo.toLowerCase().includes(q)
    ).slice(0, 15);
  });

  readonly estudianteSeleccionado = computed(() => {
    const id = this.estudianteIdSeleccionado();
    if (!id) return null;
    return this.estudiantes().find((e) => e.id === id) ?? null;
  });

  readonly matriculasFiltradas = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    if (!busqueda) return this.matriculas();
    return this.matriculas().filter((m) =>
      m.estudianteNombre.toLowerCase().includes(busqueda) ||
      m.estudianteApellido.toLowerCase().includes(busqueda) ||
      m.estudianteCodigo.toLowerCase().includes(busqueda) ||
      m.gradoNombre.toLowerCase().includes(busqueda) ||
      m.seccionNombre.toLowerCase().includes(busqueda) ||
      m.estado.toLowerCase().includes(busqueda)
    );
  });

  readonly matriculasPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.matriculasFiltradas().slice(inicio, inicio + POR_PAGINA);
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
    if (m.error !== null) { toast.error(m.error); return; }
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
    this.estudianteIdSeleccionado.set(null);
    this.buscadorEstudiante.set('');
    this.estudianteDropdownAbierto.set(false);
    this.modalAbierto.set(true);
  }

  abrirModalEditar(m: Matricula): void {
    this.formulario.patchValue({ estado: m.estado });
    this.formulario.get('estudianteId')?.disable();
    this.formulario.get('seccionId')?.disable();
    this.formulario.get('anioAcademico')?.disable();
    this.editandoId.set(m.id);
    this.estudianteIdSeleccionado.set(m.estudianteId);
    this.buscadorEstudiante.set('');
    this.estudianteDropdownAbierto.set(false);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.estudianteDropdownAbierto.set(false);
    this.buscadorEstudiante.set('');
  }

  toggleEstudianteDropdown(): void {
    if (this.formulario.get('estudianteId')?.disabled) return;
    this.estudianteDropdownAbierto.update((v) => !v);
    if (this.estudianteDropdownAbierto()) {
      this.buscadorEstudiante.set('');
    }
  }

  seleccionarEstudiante(e: Estudiante): void {
    this.formulario.patchValue({ estudianteId: e.id });
    this.estudianteIdSeleccionado.set(e.id);
    this.estudianteDropdownAbierto.set(false);
    this.buscadorEstudiante.set('');
  }

  async guardar(): Promise<void> {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.formulario.getRawValue();
    const id = this.editandoId();
    const r = id
      ? await this.repo.actualizar(id, { estado: v.estado as EstadoMatricula })
      : await this.repo.crear({ estudianteId: v.estudianteId!, seccionId: v.seccionId!, anioAcademico: v.anioAcademico!, estado: v.estado as EstadoMatricula });
    this.guardando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.cerrarModal();
    const m = await this.repo.obtenerTodas();
    if (m.error === null) this.matriculas.set(m.datos);

    if (id) {
      toast.success('Estado de la matrícula actualizado correctamente');
    } else {
      toast.success('Matrícula registrada correctamente', {
        description: 'El alumno ya figura en la sección seleccionada. ¿Quieres ver o programar horarios?',
        action: {
          label: 'Ver Horarios',
          onClick: () => this.router.navigateByUrl('/admin/horarios')
        },
        duration: 10000
      });
    }
  }

  async eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar esta matrícula?')) return;
    const r = await this.repo.eliminar(id);
    if (r.error !== null) { toast.error(r.error); return; }
    this.matriculas.update((l) => l.filter((m) => m.id !== id));
    toast.success('Matrícula eliminada correctamente');
  }
}
