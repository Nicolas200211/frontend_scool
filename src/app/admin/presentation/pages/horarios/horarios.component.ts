import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';
import { HorariosRepository } from '../../../core/domain/ports/horarios.repository';

const POR_PAGINA = 10;
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

@Component({
  selector: 'app-horarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent, ModalComponent, PaginadorComponent],
  template: `
    <app-page-header titulo="Horarios" subtitulo="Asigna docentes a secciones y asignaturas por día y hora" />

    <div class="flex justify-end mb-6">
      <button (click)="abrirModal()" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nuevo Horario
      </button>
    </div>

    @if (cargando()) { <app-loading-spinner /> }
    @else if (horarios().length === 0) { <app-empty-state titulo="Sin horarios" descripcion="Agrega el primer horario" /> }
    @else {
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Sección</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Asignatura</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Docente</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Día</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-600">Hora</th>
              <th class="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (h of horariosPagina(); track h.id) {
              <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3 text-gray-900">{{ h.gradoNombre }} — {{ h.seccionNombre }}</td>
                <td class="px-4 py-3 font-medium text-gray-900">{{ h.asignaturaNombre }}</td>
                <td class="px-4 py-3 text-gray-500">{{ h.docenteNombre }}</td>
                <td class="px-4 py-3 text-gray-500 capitalize">{{ h.diaSemana }}</td>
                <td class="px-4 py-3 text-gray-500">{{ h.horaInicio }} – {{ h.horaFin }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="inline-flex gap-1">
                    <button (click)="abrirModalEditar(h)" class="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button (click)="eliminar(h.id)" class="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-paginador [paginaActual]="pagina()" [total]="horarios().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
    }

    @if (error()) {
      <div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 shadow z-50" role="alert">
        <p class="text-sm text-red-600">{{ error() }}</p>
      </div>
    }

    @if (modalAbierto()) {
      <app-modal [titulo]="editandoId() ? 'Editar Horario' : 'Nuevo Horario'" (cerrar)="cerrarModal()">
        <form [formGroup]="formulario" (ngSubmit)="guardar()" class="space-y-4" novalidate>
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
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Asignatura</label>
            <select formControlName="asignaturaId" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              <option value="">Seleccionar asignatura</option>
              @for (a of asignaturas(); track a.id) {
                <option [value]="a.id">{{ a.nombre }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Docente</label>
            <select formControlName="docenteId" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              <option value="">Seleccionar docente</option>
              @for (d of docentes(); track d.id) {
                <option [value]="d.id">{{ d.nombre }} {{ d.apellido }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Día</label>
            <select formControlName="diaSemana" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition">
              @for (d of dias; track d.valor) {
                <option [value]="d.valor">{{ d.etiqueta }}</option>
              }
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Hora inicio</label>
              <input type="time" formControlName="horaInicio" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Hora fin</label>
              <input type="time" formControlName="horaFin" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"/>
            </div>
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
export class HorariosComponent implements OnInit {
  private readonly repo = inject(HorariosRepository);
  private readonly gradosRepo = inject(GradosRepository);
  private readonly asignaturasRepo = inject(AsignaturasRepository);
  private readonly docentesRepo = inject(DocentesRepository);
  private readonly fb = inject(FormBuilder);

  readonly dias = DIAS;
  readonly porPagina = POR_PAGINA;
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly horarios = signal<Horario[]>([]);
  readonly grados = signal<GradoConSecciones[]>([]);
  readonly asignaturas = signal<Asignatura[]>([]);
  readonly docentes = signal<Docente[]>([]);
  readonly modalAbierto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly pagina = signal(1);

  readonly horariosPagina = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.horarios().slice(inicio, inicio + POR_PAGINA);
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
    if (h.error !== null) { this.mostrarError(h.error); return; }
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
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.cerrarModal();
    const h = await this.repo.obtenerTodos();
    if (h.error === null) this.horarios.set(h.datos);
  }

  async eliminar(id: string): Promise<void> {
    if (!confirm('¿Eliminar este horario?')) return;
    const r = await this.repo.eliminar(id);
    if (r.error !== null) { this.mostrarError(r.error); return; }
    this.horarios.update((l) => l.filter((h) => h.id !== id));
  }

  private mostrarError(m: string): void { this.error.set(m); setTimeout(() => this.error.set(null), 4000); }
}
