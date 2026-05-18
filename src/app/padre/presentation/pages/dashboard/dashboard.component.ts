import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PadreRepository } from '../../../core/domain/ports/padre.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { HijoInfo } from '../../../core/domain/models/hijo-info.model';

@Component({
  selector: 'app-dashboard-padre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
            ¡Hola, {{ authState.usuarioActual()?.nombre ?? '' }}!
          </h1>
          <p class="text-sm text-slate-500 mt-1">Panel de Control • Monitorea el progreso y asistencia de tus hijos</p>
        </div>
        <div class="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-2xl">
          <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          <span class="text-xs font-semibold text-indigo-900 font-mono capitalize">{{ fechaActual() }}</span>
        </div>
      </header>

      <!-- Child Selector (If parent has multiple students) -->
      @if (hijos().length > 1) {
        <section class="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider block">Seguimiento Familiar</span>
            <h4 class="text-base font-bold text-slate-800 mt-0.5">Estudiante en consulta:</h4>
          </div>
          <div class="relative shrink-0">
            <select (change)="seleccionarHijo($event)"
              class="px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-sm font-bold text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer min-w-56 appearance-none">
              @for (h of hijos(); track h.estudianteId) {
                <option [value]="h.estudianteId">{{ h.estudianteApellido }}, {{ h.estudianteNombre }}</option>
              }
            </select>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>
        </section>
      }

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Bento Card 1: Asistencia Mensual del Estudiante (col-span-1) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Reporte de Asistencia</span>
            <h3 class="text-xl font-bold text-slate-800 mt-1 mb-2">Rendimiento en Clase</h3>
            <p class="text-sm text-slate-500 mb-6">Porcentaje del mes actual calculado en base a días hábiles y asistencias efectivas.</p>
          </div>

          <div class="space-y-4">
            <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <span class="text-xs text-emerald-700 block mb-0.5">Asistencias logradas</span>
                <span class="text-3xl font-black text-emerald-800 font-mono">{{ stats().porcentaje }}%</span>
              </div>
              <div class="w-10 h-10 bg-emerald-100/80 rounded-xl flex items-center justify-center">
                <svg class="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl">
                <span class="text-xs text-rose-700 block mb-0.5">Faltas totales</span>
                <span class="text-xl font-bold text-rose-900 font-mono">{{ stats().ausencias }}</span>
              </div>
              <div class="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl">
                <span class="text-xs text-amber-700 block mb-0.5">Sin Justificar</span>
                <span class="text-xl font-bold text-amber-900 font-mono">{{ stats().sinJustificar }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Bento Card 2: Accesos Directos (col-span-1) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Trámites y Consultas</span>
            <h3 class="text-xl font-bold text-slate-800 mt-1 mb-4">Servicios Escolares</h3>
          </div>

          <div class="space-y-3">
            <a routerLink="/padre/asistencia" class="flex items-center gap-3.5 p-3.5 bg-slate-50/50 hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 rounded-2xl transition duration-150 group">
              <div class="w-9 h-9 bg-indigo-50 group-hover:bg-indigo-100/70 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
              </div>
              <div>
                <span class="text-sm font-bold block">Historial Asistencia</span>
                <span class="text-xs text-slate-400">Ver días detallados</span>
              </div>
            </a>

            <a routerLink="/padre/justificaciones" class="flex items-center gap-3.5 p-3.5 bg-slate-50/50 hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 rounded-2xl transition duration-150 group">
              <div class="w-9 h-9 bg-indigo-50 group-hover:bg-indigo-100/70 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div>
                <span class="text-sm font-bold block">Enviar Justificación</span>
                <span class="text-xs text-slate-400">Justificar inasistencias</span>
              </div>
            </a>
          </div>
        </section>

        <!-- Bento Card 3: Datos de Apoyo Escolar (col-span-1) -->
        <section class="bg-indigo-50/30 rounded-3xl p-6 border border-indigo-100/30 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md hover:border-indigo-150 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Acompañamiento</span>
            <h3 class="text-xl font-bold text-slate-800 mt-1 mb-3">Escuela para Padres</h3>
            <p class="text-sm text-slate-500 leading-relaxed">Apoya la constancia escolar de tus hijos participando activamente. Si tienen una falta injustificada, recuerda regularizarla de inmediato.</p>
          </div>
          <div class="mt-6 flex justify-between items-center">
            <span class="text-xs text-indigo-700 font-bold bg-indigo-100/50 px-3 py-1 rounded-full">EdTech Tutor</span>
            <span class="text-xs text-slate-400 font-mono">2024</span>
          </div>
        </section>

        <!-- Bento Card 4: Notificaciones Familiares (col-span-2) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] md:col-span-2 flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div class="flex justify-between items-center mb-3">
              <div>
                <span class="text-xs font-semibold text-amber-600 uppercase tracking-wider">Alertas y Mensajes</span>
                <h3 class="text-xl font-bold text-slate-800 mt-1">Estado de tus Hijos</h3>
              </div>
              <span class="bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">INCIDENTE</span>
            </div>
            <p class="text-sm text-slate-500 mb-4">Información generada por auxiliares y coordinadores en relación a la asistencia del alumno.</p>
          </div>

          <div class="space-y-3">
            @if (stats().sinJustificar > 0) {
              <div class="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                <span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">ACCION</span>
                <p class="text-xs text-rose-950 leading-relaxed">
                  Tu hijo(a) registra <strong>{{ stats().sinJustificar }} falta(s) sin justificar</strong> este mes. Por favor, regulariza su situación.
                </p>
              </div>
            } @else {
              <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">AL DÍA</span>
                <p class="text-xs text-emerald-950 leading-relaxed">
                  ¡Excelente! Tu hijo(a) no cuenta con faltas pendientes de justificación en este periodo escolar.
                </p>
              </div>
            }
            <div class="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-start gap-3">
              <span class="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">REUNION</span>
              <p class="text-xs text-slate-600 leading-relaxed">Convocatoria para la <strong>Reunión General de Padres de Familia</strong> programada para este Viernes a las <span class="font-mono">18:00</span>.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class DashboardPadreComponent implements OnInit {
  readonly authState = inject(AuthState);
  private readonly repo = inject(PadreRepository);

  readonly stats = signal({ porcentaje: 0, ausencias: 0, sinJustificar: 0 });
  readonly hijos = signal<HijoInfo[]>([]);
  readonly fechaActual = signal<string>('');
  private hijoActual: HijoInfo | null = null;

  async ngOnInit(): Promise<void> {
    const hoy = new Date();
    this.fechaActual.set(hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) return;

    const r = await this.repo.obtenerHijos(usuarioId);
    if (r.error !== null || r.datos.length === 0) return;

    this.hijos.set(r.datos);
    this.hijoActual = r.datos[0];
    await this.cargarStats();
  }

  seleccionarHijo(evento: Event): void {
    const id = (evento.target as HTMLSelectElement).value;
    this.hijoActual = this.hijos().find((h) => h.estudianteId === id) ?? null;
    this.cargarStats();
  }

  private async cargarStats(): Promise<void> {
    if (!this.hijoActual) return;

    const hoy = new Date();
    const fechaIso = hoy.toISOString().slice(0, 10);
    const inicio = new Date();
    inicio.setDate(1);
    const inicioMes = inicio.toISOString().slice(0, 10);

    const r = await this.repo.obtenerAsistenciaHijo(this.hijoActual.estudianteId, inicioMes, fechaIso);
    if (r.error === null) {
      const total = r.datos.length;
      const presentes = r.datos.filter((a) => a.estado === 'presente' || a.estado === 'justificado').length;
      const ausencias = r.datos.filter((a) => a.estado === 'ausente').length;
      const sinJustificar = r.datos.filter((a) => a.estado === 'ausente' && !a.tieneJustificacion).length;
      this.stats.set({
        porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 100,
        ausencias,
        sinJustificar,
      });
    }
  }
}
