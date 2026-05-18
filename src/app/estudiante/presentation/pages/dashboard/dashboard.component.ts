import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstudianteRepository } from '../../../core/domain/ports/estudiante.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';

@Component({
  selector: 'app-dashboard-estudiante',
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
          <p class="text-sm text-slate-500 mt-1">¡Que tengas un excelente día de aprendizaje hoy!</p>
        </div>
        <div class="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-2xl">
          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span class="text-xs font-semibold text-indigo-900 font-mono capitalize">{{ fechaActual() }}</span>
        </div>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Bento Card 1: Control de Asistencia (col-span-1) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Tu Registro</span>
            <h3 class="text-xl font-bold text-slate-800 mt-1 mb-2">Asistencia del Mes</h3>
            <p class="text-sm text-slate-500 mb-6">Tu porcentaje de permanencia y puntualidad en clases de este mes.</p>
          </div>

          <div class="space-y-4">
            <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <span class="text-xs text-emerald-700 block mb-0.5">Asistencia Promedio</span>
                <span class="text-3xl font-black text-emerald-800 font-mono">{{ stats().porcentaje }}%</span>
              </div>
              <div class="w-10 h-10 bg-emerald-100/80 rounded-xl flex items-center justify-center">
                <svg class="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl">
                <span class="text-xs text-rose-700 block mb-0.5">Faltas</span>
                <span class="text-xl font-bold text-rose-900 font-mono">{{ stats().ausentes }}</span>
              </div>
              <div class="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl">
                <span class="text-xs text-amber-700 block mb-0.5">Tardanzas</span>
                <span class="text-xl font-bold text-amber-900 font-mono">{{ stats().tardanzas }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Bento Card 2: Accesos Directos (col-span-1) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Tu Aula</span>
            <h3 class="text-xl font-bold text-slate-800 mt-1 mb-4">Mi Aula Virtual</h3>
          </div>

          <div class="space-y-3">
            <a routerLink="/estudiante/asistencia" class="flex items-center gap-3.5 p-3.5 bg-slate-50/50 hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 rounded-2xl transition duration-150 group">
              <div class="w-9 h-9 bg-indigo-50 group-hover:bg-indigo-100/70 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
              </div>
              <div>
                <span class="text-sm font-bold block">Mi Asistencia</span>
                <span class="text-xs text-slate-400">Ver récord académico completo</span>
              </div>
            </a>

            <a routerLink="/estudiante/horario" class="flex items-center gap-3.5 p-3.5 bg-slate-50/50 hover:bg-indigo-50/50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 rounded-2xl transition duration-150 group">
              <div class="w-9 h-9 bg-indigo-50 group-hover:bg-indigo-100/70 rounded-xl flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <span class="text-sm font-bold block">Mi Horario</span>
                <span class="text-xs text-slate-400">Ver cursos y salones de clase</span>
              </div>
            </a>
          </div>
        </section>

        <!-- Bento Card 3: Motivación Escolar (col-span-1) -->
        <section class="bg-emerald-50/30 rounded-3xl p-6 border border-emerald-100/30 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <span class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Motivación</span>
            <h3 class="text-xl font-bold text-slate-800 mt-1 mb-3">Meta del Día</h3>
            <p class="text-sm text-slate-500 leading-relaxed">"La educación es el arma más poderosa que puedes usar para cambiar el mundo." Recuerda participar en tus clases de hoy.</p>
          </div>
          <div class="mt-6 flex justify-between items-center">
            <span class="text-xs text-emerald-700 font-bold bg-emerald-100/50 px-3 py-1 rounded-full">EdTech School</span>
            <span class="text-xs text-slate-400 font-mono">2024</span>
          </div>
        </section>

        <!-- Bento Card 4: Tareas y Anuncios (col-span-2) -->
        <section class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] md:col-span-2 flex flex-col justify-between hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-200">
          <div>
            <div class="flex justify-between items-center mb-3">
              <div>
                <span class="text-xs font-semibold text-amber-600 uppercase tracking-wider">Avisos del Aula</span>
                <h3 class="text-xl font-bold text-slate-800 mt-1">Novedades y Anuncios</h3>
              </div>
              <span class="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">CLASE</span>
            </div>
            <p class="text-sm text-slate-500 mb-4 font-normal">Información relevante publicada por tus docentes o auxiliares de aula.</p>
          </div>

          <div class="space-y-3">
            <div class="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-start gap-3">
              <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">EXAMEN</span>
              <p class="text-xs text-slate-600 leading-relaxed">Examen parcial de <strong>Matemáticas / Álgebra</strong> programado para este Lunes a las <span class="font-mono">08:00</span>.</p>
            </div>
            <div class="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-start gap-3">
              <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">ENTREGADO</span>
              <p class="text-xs text-slate-600 leading-relaxed">Tu proyecto final de <strong>Ciencias y Tecnología</strong> ha sido calificado con un récord sobresaliente.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class DashboardEstudianteComponent implements OnInit {
  readonly authState = inject(AuthState);
  private readonly repo = inject(EstudianteRepository);

  readonly stats = signal({ porcentaje: 0, ausentes: 0, tardanzas: 0 });
  readonly fechaActual = signal<string>('');

  async ngOnInit(): Promise<void> {
    const hoy = new Date();
    this.fechaActual.set(hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) return;

    const estudianteId = await this.repo.obtenerEstudianteId(usuarioId);
    if (!estudianteId) return;

    const fechaIso = hoy.toISOString().slice(0, 10);
    const inicio = new Date();
    inicio.setDate(1);
    const inicioMes = inicio.toISOString().slice(0, 10);

    const r = await this.repo.obtenerMiAsistencia(estudianteId, inicioMes, fechaIso);
    if (r.error === null) {
      const total = r.datos.length;
      const presentes = r.datos.filter((a) => a.estado === 'presente' || a.estado === 'justificado').length;
      const ausentes = r.datos.filter((a) => a.estado === 'ausente').length;
      const tardanzas = r.datos.filter((a) => a.estado === 'tardanza').length;
      this.stats.set({ porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 100, ausentes, tardanzas });
    }
  }
}
