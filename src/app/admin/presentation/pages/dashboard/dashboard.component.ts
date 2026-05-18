import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EstudiantesRepository } from '../../../core/domain/ports/estudiantes.repository';
import { DocentesRepository } from '../../../core/domain/ports/docentes.repository';
import { AsistenciaRepository } from '../../../core/domain/ports/asistencia.repository';
import { ComunicadosRepository } from '../../../../shared/domain/ports/comunicados.repository';
import { Comunicado } from '../../../../shared/domain/models/comunicado.model';
import { toast } from 'ngx-sonner';
import { PaginadorComponent } from '../../../../shared/components/paginador/paginador.component';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PaginadorComponent],
  template: `
    <div class="space-y-6">
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Control</h1>
          <p class="text-sm text-slate-500 mt-1">Resumen operativo general de la institución</p>
        </div>
        <div class="flex items-center gap-4">
          <button (click)="abrirModal()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm hover:shadow transition duration-150 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
            Publicar Comunicado
          </button>
          <div class="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100/50 px-4 py-2 rounded-2xl">
            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span class="text-xs font-semibold text-indigo-900 font-mono capitalize">{{ fechaActual() }}</span>
          </div>
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
              <span class="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold">Activo 2026</span>
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
                <span class="text-xs font-semibold text-amber-600 uppercase tracking-wider">Últimos Avisos Globales</span>
                <h3 class="text-xl font-bold text-slate-800 mt-1">Comunicados Institucionales</h3>
              </div>
              <span class="bg-amber-50 text-amber-800 text-xs px-2.5 py-1 rounded-full font-semibold">Difusión</span>
            </div>
          </div>

          <div class="space-y-2 mt-4 flex-1">
            @if (comunicados().length === 0) {
              <div class="flex items-center justify-center p-6 bg-slate-50/50 border border-slate-100 rounded-2xl">
                <span class="text-sm font-medium text-slate-400">No hay comunicados publicados recientemente.</span>
              </div>
            } @else {
              @for (c of comunicadosPagina(); track c.id) {
                <div class="flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  @if (c.importancia === 'alta') {
                    <span class="bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">ALTA</span>
                  } @else if (c.importancia === 'informativo') {
                    <span class="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">INFO</span>
                  } @else {
                    <span class="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full font-mono shrink-0 mt-0.5">NORMAL</span>
                  }
                  <div class="flex-1">
                    <p class="text-xs font-bold text-slate-800">{{ c.titulo }}</p>
                    <p class="text-xs text-slate-600 leading-relaxed mt-0.5">{{ c.mensaje }}</p>
                    <p class="text-[9px] text-slate-400 font-mono mt-1">Dirigido a: <span class="uppercase font-bold">{{ c.audiencia }}</span></p>
                  </div>
                </div>
              }
            }
          </div>
          
          @if (comunicados().length > porPagina) {
            <div class="mt-4 pt-4 border-t border-slate-50">
              <app-paginador [paginaActual]="paginaComunicados()" [total]="comunicados().length" [porPagina]="porPagina" (paginaCambia)="paginaComunicados.set($event)" />
            </div>
          }
        </section>
      </div>

      @if (modalAbierto()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" (click)="cerrarModal()">
          <div class="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden" (click)="$event.stopPropagation()">
            <div class="p-6 pb-4 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 class="text-lg font-black text-slate-900">Publicar Comunicado</h3>
                <p class="text-xs text-slate-400 mt-0.5">Difundir aviso a toda la comunidad educativa</p>
              </div>
              <button type="button" (click)="cerrarModal()" class="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form (submit)="publicarComunicado($event)" class="p-6 space-y-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dirigido A</label>
                <select name="audiencia" required class="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-sm font-semibold text-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer">
                  <option value="todos">Todos (Docentes y Estudiantes)</option>
                  <option value="docentes">Solo Docentes</option>
                  <option value="estudiantes">Solo Estudiantes</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Importancia del Aviso</label>
                <select name="importancia" required class="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-sm font-semibold text-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer">
                  <option value="normal">Normal (Azul)</option>
                  <option value="alta">Alta / Urgente (Rojo)</option>
                  <option value="informativo">Informativo / Positivo (Verde)</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Título del Comunicado</label>
                <input type="text" name="titulo" placeholder="Ej: FERIADO NACIONAL, FUMIGACIÓN" required class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mensaje Completo</label>
                <textarea name="mensaje" rows="4" placeholder="Redacta el contenido general aquí..." required class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
                <button type="button" (click)="cerrarModal()" class="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-black rounded-2xl transition duration-150">Cancelar</button>
                <button type="submit" [disabled]="publicando()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm hover:shadow transition duration-150 disabled:opacity-50">
                  @if (publicando()) { Publicando... } @else { Publicar }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardAdminComponent implements OnInit {
  private readonly estudiantesRepo = inject(EstudiantesRepository);
  private readonly docentesRepo = inject(DocentesRepository);
  private readonly asistenciaRepo = inject(AsistenciaRepository);
  private readonly comunicadosRepo = inject(ComunicadosRepository);

  readonly totalEstudiantes = signal<string>('...');
  readonly totalDocentes = signal<string>('...');
  readonly presentesHoy = signal<string>('...');
  readonly ausentesHoy = signal<string>('...');
  readonly fechaActual = signal<string>('');
  
  readonly comunicados = signal<Comunicado[]>([]);
  readonly modalAbierto = signal(false);
  readonly publicando = signal(false);

  readonly porPagina = 3;
  readonly paginaComunicados = signal(1);
  readonly comunicadosPagina = computed(() => {
    const start = (this.paginaComunicados() - 1) * this.porPagina;
    return this.comunicados().slice(start, start + this.porPagina);
  });

  async ngOnInit(): Promise<void> {
    const hoy = new Date();
    this.fechaActual.set(hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    
    const fechaIso = hoy.toISOString().slice(0, 10);
    const [e, d, r, c] = await Promise.all([
      this.estudiantesRepo.obtenerTodos(),
      this.docentesRepo.obtenerTodos(),
      this.asistenciaRepo.obtenerResumenHoy(fechaIso),
      this.comunicadosRepo.obtenerPorAudiencia('admin'),
    ]);

    this.totalEstudiantes.set(e.error === null ? String(e.datos.length) : '—');
    this.totalDocentes.set(d.error === null ? String(d.datos.length) : '—');
    this.presentesHoy.set(r.error === null ? String(r.datos.presentes) : '—');
    this.ausentesHoy.set(r.error === null ? String(r.datos.ausentes) : '—');
    
    if (c.error === null) {
      this.comunicados.set(c.datos);
    }
  }

  abrirModal(): void {
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  async publicarComunicado(event: Event): Promise<void> {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const audiencia = formData.get('audiencia') as string;
    const importancia = formData.get('importancia') as string;
    const titulo = formData.get('titulo') as string;
    const mensaje = formData.get('mensaje') as string;

    if (!audiencia || !importancia || !titulo || !mensaje) {
      toast.error('Por favor completa todos los campos.');
      return;
    }

    this.publicando.set(true);

    const result = await this.comunicadosRepo.crear({
      audiencia,
      importancia,
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
    });

    this.publicando.set(false);

    if (result.error !== null) {
      toast.error('Error al publicar comunicado');
      return;
    }

    toast.success('Comunicado publicado correctamente');
    this.cerrarModal();
    
    // Refresh list
    const c = await this.comunicadosRepo.obtenerPorAudiencia('admin');
    if (c.error === null) {
      this.comunicados.set(c.datos);
      this.paginaComunicados.set(1);
    }
  }
}
