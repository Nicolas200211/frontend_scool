import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { HorariosRepository } from '../../../core/domain/ports/horarios.repository';
import { GradosRepository } from '../../../core/domain/ports/grados.repository';
import { AsignaturasRepository } from '../../../core/domain/ports/asignaturas.repository';
import { DocentesRepository } from '../../../core/domain/ports/docentes.repository';
import { Horario, CrearHorarioDto, DiaSemana } from '../../../core/domain/models/horario.model';
import { GradoConSecciones, Seccion } from '../../../core/domain/models/grado.model';
import { Asignatura } from '../../../core/domain/models/asignatura.model';
import { Docente } from '../../../core/domain/models/docente.model';

const DIAS: { valor: DiaSemana; etiqueta: string }[] = [
  { valor: 'lunes', etiqueta: 'Lunes' }, { valor: 'martes', etiqueta: 'Martes' },
  { valor: 'miercoles', etiqueta: 'Miércoles' }, { valor: 'jueves', etiqueta: 'Jueves' },
  { valor: 'viernes', etiqueta: 'Viernes' }, { valor: 'sabado', etiqueta: 'Sábado' },
];

const POR_PAGINA = 10;

import { BuscadorComponent } from '../../../../shared/components/buscador/buscador.component';

@Component({
  selector: 'app-horarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent, BuscadorComponent],
  template: `
    <app-page-header titulo="Horarios" subtitulo="Cronograma de asignaturas, secciones y docentes" />

    <!-- Top Action Bar -->
    <div class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-4 w-full sm:w-auto flex-1 max-w-md">
        <app-buscador placeholder="Buscar horario..." (busquedaCambia)="filtro.set($event); pagina.set(1)" />
      </div>
      <button (click)="abrirModal()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nuevo Horario
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (horarios().length === 0) { 
      <app-empty-state titulo="Sin horarios" descripcion="Aún no hay horarios programados en el calendario escolar." /> 
    } @else {
      <!-- Bento Table Card -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="px-6 py-4 text-left">Grado y Sección</th>
                <th class="px-6 py-4 text-left">Asignatura</th>
                <th class="px-6 py-4 text-left">Docente</th>
                <th class="px-6 py-4 text-left">Día</th>
                <th class="px-6 py-4 text-left">Bloque de Horario</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @for (h of horariosPagina(); track h.id) {
                <tr class="hover:bg-slate-50/30 transition duration-150">
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700">
                      {{ h.gradoNombre }} — {{ h.seccionNombre }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-extrabold text-slate-800 text-sm">{{ h.asignaturaNombre }}</td>
                  <td class="px-6 py-4 text-slate-500 font-semibold text-xs">{{ h.docenteNombre }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-block px-2.5 py-0.5 bg-indigo-50/60 border border-indigo-100/50 text-indigo-700 text-[10px] font-extrabold rounded-2xl uppercase tracking-wider">
                      {{ h.diaSemana }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-600 font-bold font-mono text-xs">
                    {{ h.horaInicio }} – {{ h.horaFin }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="inline-flex gap-2">
                      <button (click)="abrirModalEditar(h)" class="p-2 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition duration-150">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button (click)="eliminar(h.id)" class="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition duration-150">
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
          <app-paginador [paginaActual]="pagina()" [total]="horariosFiltrados().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
        </div>
      </div>
    }

    @if (modalAbierto()) {
      <app-modal [titulo]="editandoId() ? 'Editar Horario' : 'Nuevo Horario'" (cerrar)="cerrarModal()">
        <form [formGroup]="formulario" (ngSubmit)="guardar()" class="space-y-5" novalidate>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Sección</label>
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
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Asignatura</label>
            <select formControlName="asignaturaId" class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              <option value="">Seleccionar asignatura</option>
              @for (a of asignaturas(); track a.id) {
                <option [value]="a.id">{{ a.nombre }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Docente</label>
            <select formControlName="docenteId" class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              <option value="">Seleccionar docente</option>
              @for (d of docentes(); track d.id) {
                <option [value]="d.id">{{ d.nombre }} {{ d.apellido }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Día de la Semana</label>
            <select formControlName="diaSemana" class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800">
              @for (d of dias; track d.valor) {
                <option [value]="d.valor">{{ d.etiqueta }}</option>
              }
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Hora de Inicio</label>
              <input type="time" formControlName="horaInicio" class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"/>
            </div>
            <div>
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Hora de Fin</label>
              <input type="time" formControlName="horaFin" class="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-mono text-slate-800"/>
            </div>
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
export class HorariosComponent implements OnInit {
  private readonly repo = inject(HorariosRepository);
  private readonly gradosRepo = inject(GradosRepository);
  private readonly asignaturasRepo = inject(AsignaturasRepository);
  private readonly docentesRepo = inject(DocentesRepository);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly dias = DIAS;
  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly horarios = signal<Horario[]>([]);
  readonly grados = signal<GradoConSecciones[]>([]);
  readonly asignaturas = signal<Asignatura[]>([]);
  readonly docentes = signal<Docente[]>([]);
  readonly modalAbierto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly pagina = signal(1);
  readonly filtro = signal<string>('');

  readonly horariosFiltrados = computed(() => {
    const busqueda = this.filtro().toLowerCase().trim();
    if (!busqueda) return this.horarios();
    return this.horarios().filter((h) =>
      h.gradoNombre.toLowerCase().includes(busqueda) ||
      h.seccionNombre.toLowerCase().includes(busqueda) ||
      h.asignaturaNombre.toLowerCase().includes(busqueda) ||
      h.docenteNombre.toLowerCase().includes(busqueda) ||
      h.diaSemana.toLowerCase().includes(busqueda) ||
      h.horaInicio.toLowerCase().includes(busqueda) ||
      h.horaFin.toLowerCase().includes(busqueda)
    );
  });

  readonly horariosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.horariosFiltrados().slice(inicio, inicio + POR_PAGINA);
  });

  readonly formulario = this.fb.group({
    seccionId: ['', Validators.required], asignaturaId: ['', Validators.required],
    docenteId: ['', Validators.required], diaSemana: ['lunes', Validators.required],
    horaInicio: ['07:00', Validators.required], horaFin: ['08:00', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    const [h, g, a, d] = await Promise.all([
      this.repo.obtenerTodos(), this.gradosRepo.obtenerTodos(),
      this.asignaturasRepo.obtenerTodas(), this.docentesRepo.obtenerTodos(),
    ]);
    this.cargando.set(false);
    if (h.error !== null) { toast.error(h.error); return; }
    this.horarios.set(h.datos);
    this.pagina.set(1);
    if (g.error === null) this.grados.set(g.datos);
    if (a.error === null) this.asignaturas.set(a.datos);
    if (d.error === null) this.docentes.set(d.datos);
  }

  abrirModal(): void { this.formulario.reset({ diaSemana: 'lunes', horaInicio: '07:00', horaFin: '08:00' }); this.editandoId.set(null); this.modalAbierto.set(true); }

  abrirModalEditar(h: Horario): void {
    this.formulario.setValue({ seccionId: h.seccionId, asignaturaId: h.asignaturaId, docenteId: h.docenteId, diaSemana: h.diaSemana, horaInicio: h.horaInicio, horaFin: h.horaFin });
    this.editandoId.set(h.id); this.modalAbierto.set(true);
  }

  cerrarModal(): void { this.modalAbierto.set(false); }

  async guardar(): Promise<void> {
    if (this.formulario.invalid) { this.formulario.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.formulario.getRawValue();
    const dto: CrearHorarioDto = { seccionId: v.seccionId!, asignaturaId: v.asignaturaId!, docenteId: v.docenteId!, diaSemana: v.diaSemana as DiaSemana, horaInicio: v.horaInicio!, horaFin: v.horaFin! };
    const id = this.editandoId();
    const r = id ? await this.repo.actualizar(id, dto) : await this.repo.crear(dto);
    this.guardando.set(false);
    if (r.error !== null) { toast.error(r.error); return; }
    this.cerrarModal();
    const h = await this.repo.obtenerTodos();
    if (h.error === null) this.horarios.set(h.datos);

    if (id) {
      toast.success('Horario actualizado con éxito');
    } else {
      toast.success('Horario programado correctamente', {
        description: 'El docente asignado ya puede ver su agenda desde su portal de clases.',
        action: {
          label: 'Ir a Matrículas',
          onClick: () => this.router.navigateByUrl('/admin/matriculas')
        },
        duration: 10000
      });
    }
  }

  async eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar este horario?')) return;
    const r = await this.repo.eliminar(id);
    if (r.error !== null) { toast.error(r.error); return; }
    this.horarios.update((l) => l.filter((h) => h.id !== id));
    toast.success('Horario eliminado correctamente');
  }
}
