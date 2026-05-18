import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AsistenciaRepository } from '../../../../admin/core/domain/ports/asistencia.repository';
import { JustificacionesRepository } from '../../../../admin/core/domain/ports/justificaciones.repository';
import { ComunicadosRepository } from '../../../../shared/domain/ports/comunicados.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { HorarioHoy } from '../../../../admin/core/domain/models/asistencia.model';
import { Comunicado } from '../../../../shared/domain/models/comunicado.model';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';

@Component({
  selector: 'app-dashboard-docente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PaginadorComponent],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
            ¡Hola, {{ authState.usuarioActual()?.nombre ?? '' }}!
          </h1>
          <p class="text-sm text-slate-500 mt-1">Panel del Docente • Gestiona tus clases y registros del día</p>
        </div>
        <div class="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-2xl">
          <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          <span class="text-xs font-semibold text-indigo-900 font-mono capitalize">{{ fechaActual() }}</span>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Tu Jornada</span>
            <h3 class="text-xl font-bold text-slate-800 mt-1 mb-3">Agenda de Hoy</h3>
            <p class="text-sm text-slate-500 mb-6">Estado global de la toma de asistencia para tus asignaturas programadas.</p>
          </div>

          <div class="space-y-4">
            <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <span class="text-xs text-slate-500 block">Clases Programadas</span>
                <span class="text-2xl font-black text-slate-900 font-mono">{{ clases().length || '0' }}</span>
              </div>
              <div class="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13"/></svg>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <span class="text-xs text-emerald-700 block mb-0.5">Tomadas</span>
                <span class="text-xl font-bold text-emerald-800 font-mono">{{ clasesTomadas() }}</span>
              </div>
              <div class="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                <span class="text-xs text-amber-700 block mb-0.5">Pendientes</span>
                <span class="text-xl font-bold text-amber-800 font-mono">{{ clases().length - clasesTomadas() }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] md:col-span-2 flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div class="flex justify-between items-center mb-4">
              <div>
                <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Horario Diario</span>
                <h3 class="text-xl font-bold text-slate-800 mt-1">Tus Clases</h3>
              </div>
              <a routerLink="/docente/asistencia" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">Registrar Asistencia →</a>
            </div>
          </div>

          <div class="overflow-x-auto flex-1">
            @if (cargando()) {
              <div class="flex items-center justify-center py-10">
                <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else if (clases().length === 0) {
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <p class="text-sm text-slate-400">No tienes asignaturas programadas para hoy.</p>
              </div>
            } @else {
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th class="pb-3 text-left">Asignatura</th>
                    <th class="pb-3 text-left">Sección</th>
                    <th class="pb-3 text-left">Horario</th>
                    <th class="pb-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (c of clasesPagina(); track c.id) {
                    <tr class="hover:bg-slate-50/50 transition duration-150">
                      <td class="py-3.5 font-semibold text-slate-800">{{ c.asignaturaNombre }}</td>
                      <td class="py-3.5 text-slate-500 text-xs">{{ c.gradoNombre }} — {{ c.seccionNombre }}</td>
                      <td class="py-3.5 text-slate-600 font-mono text-xs">{{ c.horaInicio }} – {{ c.horaFin }}</td>
                      <td class="py-3.5 text-right">
                        @if (c.asistenciaTomada) {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Completo
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold rounded-full animate-pulse">
                            <span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            Pendiente
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              <app-paginador [paginaActual]="pagina()" [total]="clases().length" [porPagina]="porPagina" (paginaCambia)="pagina.set($event)" />
            }
          </div>
        </section>

        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Herramientas</span>
          <h3 class="text-xl font-bold text-slate-800 mt-1 mb-4">Acceso Rápido</h3>
          <div class="space-y-2.5">
            <a routerLink="/docente/asistencia" class="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 rounded-2xl transition duration-150 group">
              <div class="w-8 h-8 bg-indigo-50 group-hover:bg-indigo-100/70 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/></svg>
              </div>
              <span class="text-sm font-semibold">Toma de Asistencia</span>
            </a>
            <a routerLink="/docente/justificaciones" class="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 rounded-2xl transition duration-150 group">
              <div class="w-8 h-8 bg-indigo-50 group-hover:bg-indigo-100/70 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13"/></svg>
              </div>
              <span class="text-sm font-semibold">Justificaciones</span>
            </a>
          </div>
        </section>

        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] md:col-span-2 flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <span class="text-xs font-semibold text-amber-600 uppercase tracking-wider">Avisos Escolares</span>
            <h3 class="text-xl font-bold text-slate-800 mt-1 mb-2">Recordatorios y Comunicados</h3>
            <p class="text-sm text-slate-500 mb-4">Mantente al día con tus tareas administrativas y los comunicados de Dirección.</p>
          </div>

          <div class="space-y-3">
            @if (paginaComunicados() === 1) {
              <div class="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-start gap-3">
                <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">PENDIENTE</span>
                @if (justificacionesPendientes() > 0) {
                  <p class="text-xs text-slate-600 leading-relaxed">Tienes <strong>{{ justificacionesPendientes() }} solicitudes de justificación</strong> por evaluar en la bandeja de entrada.</p>
                } @else {
                  <p class="text-xs text-slate-600 leading-relaxed">No tienes solicitudes de justificación pendientes por evaluar. ¡Todo al día!</p>
                }
              </div>
            }

            @for (c of comunicadosPagina(); track c.id) {
              <div class="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-start gap-3">
                @if (c.importancia === 'alta') {
                  <span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">URGENTE</span>
                } @else if (c.importancia === 'informativo') {
                  <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">ÉXITO</span>
                } @else {
                  <span class="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">AVISO</span>
                }
                <div>
                  <p class="text-xs font-bold text-slate-800">{{ c.titulo }}</p>
                  <p class="text-xs text-slate-600 leading-relaxed mt-0.5">{{ c.mensaje }}</p>
                </div>
              </div>
            }
          </div>

          @if (comunicados().length > porPagina) {
            <div class="mt-4 pt-4 border-t border-slate-50">
              <app-paginador [paginaActual]="paginaComunicados()" [total]="comunicados().length" [porPagina]="porPagina" (paginaCambia)="paginaComunicados.set($event)" />
            </div>
          }
        </section>
      </div>
    </div>
  `,
})
export class DashboardDocenteComponent implements OnInit {
  readonly authState = inject(AuthState);
  private readonly repo = inject(AsistenciaRepository);
  private readonly justificacionesRepo = inject(JustificacionesRepository);
  private readonly comunicadosRepo = inject(ComunicadosRepository);

  readonly cargando = signal(true);
  readonly clases = signal<HorarioHoy[]>([]);
  readonly fechaActual = signal<string>('');
  readonly justificacionesPendientes = signal<number>(0);
  readonly comunicados = signal<Comunicado[]>([]);

  readonly porPagina = 3;
  
  readonly pagina = signal(1);
  readonly clasesPagina = computed(() => {
    const start = (this.pagina() - 1) * this.porPagina;
    return this.clases().slice(start, start + this.porPagina);
  });

  readonly paginaComunicados = signal(1);
  readonly comunicadosPagina = computed(() => {
    const start = (this.paginaComunicados() - 1) * this.porPagina;
    return this.comunicados().slice(start, start + this.porPagina);
  });

  get clasesTomadas(): () => number {
    return () => this.clases().filter((c) => c.asistenciaTomada).length;
  }

  async ngOnInit(): Promise<void> {
    const hoy = new Date();
    this.fechaActual.set(hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const docenteId = await this.repo.obtenerIdDocente(usuarioId);
    if (!docenteId) { this.cargando.set(false); return; }

    const fechaIso = hoy.toISOString().slice(0, 10);
    
    const [horarioRes, justificacionesRes, comunicadosRes] = await Promise.all([
      this.repo.obtenerHorariosHoy(docenteId, fechaIso),
      this.justificacionesRepo.obtenerPorDocente(docenteId),
      this.comunicadosRepo.obtenerPorAudiencia('docentes')
    ]);

    this.cargando.set(false);
    if (horarioRes.error === null) this.clases.set(horarioRes.datos);

    if (justificacionesRes.error === null) {
      const count = justificacionesRes.datos.filter((j) => j.estado === 'pendiente').length;
      this.justificacionesPendientes.set(count);
    }
    
    if (comunicadosRes.error === null) {
      this.comunicados.set(comunicadosRes.datos);
    }
  }
}
