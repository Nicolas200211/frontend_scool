import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { EstudiantesRepository } from '../../../core/domain/ports/estudiantes.repository';
import { DocentesRepository } from '../../../core/domain/ports/docentes.repository';
import { AsistenciaRepository } from '../../../core/domain/ports/asistencia.repository';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Control</h1>
          <p class="text-sm text-slate-500 mt-1">Resumen operativo general de la institución</p>
        </div>
        <div class="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-2xl">
          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span class="text-xs font-semibold text-indigo-900 font-mono capitalize">{{ fechaActual() }}</span>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Bento Card 1: Estadísticas Clave (col-span-2) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] md:col-span-2 flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div class="flex justify-between items-start mb-4">
              <div>
                <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Institución</span>
                <h3 class="text-xl font-bold text-slate-800 mt-1">Resumen del Alumnado y Docentes</h3>
              </div>
              <span class="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold">Activo 2024</span>
            </div>
            <p class="text-sm text-slate-500 mb-6">Información registrada de matrículas y personal educativo de este año lectivo.</p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <span class="text-xs text-slate-500 block mb-1">Estudiantes</span>
              <span class="text-3xl font-black text-slate-900 font-mono">{{ totalEstudiantes() }}</span>
            </div>
            <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <span class="text-xs text-slate-500 block mb-1">Docentes</span>
              <span class="text-3xl font-black text-slate-900 font-mono">{{ totalDocentes() }}</span>
            </div>
            <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <span class="text-xs text-slate-500 block mb-1">Secciones</span>
              <span class="text-3xl font-black text-slate-900 font-mono">22</span>
            </div>
            <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <span class="text-xs text-slate-500 block mb-1">Cursos</span>
              <span class="text-3xl font-black text-slate-900 font-mono">10</span>
            </div>
          </div>
        </section>

        <!-- Bento Card 2: Asistencia de Hoy (col-span-1) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] md:col-span-1 flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Control Diario</span>
            <h3 class="text-xl font-bold text-slate-800 mt-1 mb-2">Asistencia de Hoy</h3>
            <p class="text-sm text-slate-500 mb-6">Estado en tiempo real de los alumnos matriculados en las secciones activas.</p>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span class="text-sm font-semibold">Presentes</span>
              </div>
              <span class="font-mono font-black text-lg">{{ presentesHoy() }}</span>
            </div>

            <div class="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl">
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 bg-rose-500 rounded-full"></div>
                <span class="text-sm font-semibold">Ausentes</span>
              </div>
              <span class="font-mono font-black text-lg">{{ ausentesHoy() }}</span>
            </div>
          </div>
        </section>

        <!-- Bento Card 3: Accesos Rápidos (col-span-1) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Accesos directos</span>
          <h3 class="text-xl font-bold text-slate-800 mt-1 mb-4">Administración</h3>
          <div class="space-y-2.5">
            <a href="/admin/matriculas" class="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 rounded-2xl transition duration-150 group">
              <div class="w-8 h-8 bg-indigo-50 group-hover:bg-indigo-100/70 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              </div>
              <span class="text-sm font-semibold">Nuevas Matrículas</span>
            </a>
            <a href="/admin/horarios" class="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 rounded-2xl transition duration-150 group">
              <div class="w-8 h-8 bg-indigo-50 group-hover:bg-indigo-100/70 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
              </div>
              <span class="text-sm font-semibold">Configurar Horarios</span>
            </a>
          </div>
        </section>

        <!-- Bento Card 4: Alertas de Control Escolar (col-span-2) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] md:col-span-2 flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div class="flex justify-between items-center mb-3">
              <div>
                <span class="text-xs font-semibold text-amber-600 uppercase tracking-wider">Control de Eventos</span>
                <h3 class="text-xl font-bold text-slate-800 mt-1">Incidentes Recientes</h3>
              </div>
              <span class="bg-amber-50 text-amber-800 text-xs px-2.5 py-1 rounded-full font-semibold">Monitoreo</span>
            </div>
            <p class="text-sm text-slate-500 mb-4">Eventos que requieren revisión o seguimiento por parte del equipo administrativo.</p>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div class="flex items-center gap-3">
                <span class="bg-rose-50 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full font-mono">ALERTA</span>
                <span class="text-sm font-medium text-slate-700">Se han reportado inasistencias sin justificar en 5to Año</span>
              </div>
              <span class="text-xs text-slate-400 font-mono">Hoy</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div class="flex items-center gap-3">
                <span class="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full font-mono">SISTEMA</span>
                <span class="text-sm font-medium text-slate-700">La carga de matrículas para el periodo 2024 finalizó correctamente</span>
              </div>
              <span class="text-xs text-slate-400 font-mono">Ayer</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class DashboardAdminComponent implements OnInit {
  private readonly estudiantesRepo = inject(EstudiantesRepository);
  private readonly docentesRepo = inject(DocentesRepository);
  private readonly asistenciaRepo = inject(AsistenciaRepository);

  readonly totalEstudiantes = signal<string>('...');
  readonly totalDocentes = signal<string>('...');
  readonly presentesHoy = signal<string>('...');
  readonly ausentesHoy = signal<string>('...');
  readonly fechaActual = signal<string>('');

  async ngOnInit(): Promise<void> {
    const hoy = new Date();
    this.fechaActual.set(hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    
    const fechaIso = hoy.toISOString().slice(0, 10);
    const [e, d, r] = await Promise.all([
      this.estudiantesRepo.obtenerTodos(),
      this.docentesRepo.obtenerTodos(),
      this.asistenciaRepo.obtenerResumenHoy(fechaIso),
    ]);

    this.totalEstudiantes.set(e.error === null ? String(e.datos.length) : '—');
    this.totalDocentes.set(d.error === null ? String(d.datos.length) : '—');
    this.presentesHoy.set(r.error === null ? String(r.datos.presentes) : '—');
    this.ausentesHoy.set(r.error === null ? String(r.datos.ausentes) : '—');
  }
}
