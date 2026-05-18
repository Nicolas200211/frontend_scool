import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { toast } from 'ngx-sonner';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { AsistenciaRepository } from '../../../../admin/core/domain/ports/asistencia.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { obtenerClienteSupabase } from '../../../../shared/infrastructure/supabase/supabase.client';

interface HorarioClase {
  id: string;
  seccionId: string;
  asignaturaNombre: string;
  seccionNombre: string;
  gradoNombre: string;
  horaInicio: string;
  horaFin: string;
  diaSemana: string;
}

@Component({
  selector: 'app-mis-clases',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header titulo="Mi Horario Semanal" subtitulo="Cronograma y distribución de tus clases asignadas de lunes a viernes" />

    @if (cargando()) { 
      <app-loading-spinner mensaje="Cargando tu horario de clases..." /> 
    } @else if (clases().length === 0) {
      <app-empty-state titulo="Sin clases asignadas" descripcion="No tienes horarios de clases registrados en el sistema académico." />
    } @else {
      <!-- Horario Semanal Bento Grid (Lunes a Viernes) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        @for (dia of diasSemana; track dia) {
          <article class="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md hover:border-indigo-100 transition-all duration-200 min-h-[360px]">
            
            <div>
              <header class="flex items-center gap-2 mb-4 pb-3 border-b border-slate-50">
                <span class="w-2.5 h-2.5 rounded-full" [class]="obtenerColorDia(dia)"></span>
                <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider capitalize">{{ dia }}</h3>
              </header>
              
              <div class="space-y-3">
                @if (horarioPorDia()[dia].length === 0) {
                  <div class="flex items-center justify-center py-8 border border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Libre</p>
                  </div>
                } @else {
                  @for (c of clasesPorDiaPaginadas()[dia]; track c.id) {
                    <div class="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/70 hover:bg-white hover:border-indigo-150 hover:shadow-[0_4px_20px_rgb(99,102,241,0.05)] transition-all duration-150 space-y-3">
                      <div>
                        <p class="font-extrabold text-slate-800 text-xs leading-tight">{{ c.asignaturaNombre }}</p>
                        <div class="flex flex-col gap-1 text-[10px] mt-1.5">
                          <span class="text-slate-400 font-bold">{{ c.gradoNombre }} — {{ c.seccionNombre }}</span>
                          <span class="font-mono font-black text-indigo-900 bg-indigo-50/60 px-2 py-0.5 rounded-md inline-block w-fit">{{ c.horaInicio }} – {{ c.horaFin }}</span>
                        </div>
                      </div>
                      <button type="button" 
                        (click)="abrirModalAnuncio(c)"
                        class="w-full text-center py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-xl transition duration-150">
                        Publicar Anuncio
                      </button>
                    </div>
                  }
                }
              </div>
            </div>

            <!-- Micro Pagination inside each Day Card -->
            @if (horarioPorDia()[dia].length > 3) {
              <footer class="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 text-[10px] font-bold font-mono">
                <button type="button" 
                  (click)="cambiarPaginaDia(dia, -1)" 
                  [disabled]="paginaPorDia()[dia] === 1"
                  class="flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 transition duration-150 shrink-0">
                  ←
                </button>
                <span class="text-slate-400">
                  {{ paginaPorDia()[dia] }} / {{ obtenerTotalPaginas(dia) }}
                </span>
                <button type="button" 
                  (click)="cambiarPaginaDia(dia, 1)" 
                  [disabled]="paginaPorDia()[dia] >= obtenerTotalPaginas(dia)"
                  class="flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-200/60 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 transition duration-150 shrink-0">
                  →
                </button>
              </footer>
            }
            
          </article>
        }
      </div>
    }

    @if (modalAbierto()) {
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden transform transition-all duration-300">
          <div class="p-6 pb-4 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-black text-slate-900">Publicar Anuncio</h3>
              <p class="text-xs text-slate-400 mt-0.5">Publicar un aviso para la sección {{ claseSeleccionada()?.gradoNombre }} - {{ claseSeleccionada()?.seccionNombre }}</p>
            </div>
            <button type="button" (click)="cerrarModal()" class="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form (submit)="publicarAnuncio($event)" class="p-6 space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Importancia del Aviso</label>
              <select name="tipo" required
                class="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-sm font-semibold text-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer">
                <option value="aviso">Aviso General (Normal)</option>
                <option value="examen">Alta / Urgente (Destacado)</option>
                <option value="entregado">Positivo / Tarea (Éxito)</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Título / Etiqueta del Aviso</label>
              <input type="text" name="titulo" placeholder="Ej: REUNIÓN, MATERIAL, TAREA, IMPORTANTE" required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>

            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mensaje Completo</label>
              <textarea name="mensaje" rows="4" placeholder="Redacta el contenido de tu aviso para la clase aquí..." required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"></textarea>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
              <button type="button" (click)="cerrarModal()"
                class="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-black rounded-2xl transition duration-150">
                Cancelar
              </button>
              <button type="submit" [disabled]="publicando()"
                class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl shadow-sm hover:shadow transition duration-150 disabled:opacity-50">
                @if (publicando()) { Publicando... } @else { Publicar Aviso }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class MisClasesComponent implements OnInit {
  private readonly repo = inject(AsistenciaRepository);
  private readonly authState = inject(AuthState);
  private readonly supabase = obtenerClienteSupabase();

  readonly cargando = signal(true);
  readonly clases = signal<HorarioClase[]>([]);
  readonly diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

  readonly modalAbierto = signal(false);
  readonly claseSeleccionada = signal<HorarioClase | null>(null);
  readonly publicando = signal(false);
  private docenteId = '';

  readonly paginaPorDia = signal<Record<string, number>>({
    lunes: 1, martes: 1, miercoles: 1, jueves: 1, viernes: 1
  });

  readonly horarioPorDia = computed(() => {
    const mapa: Record<string, HorarioClase[]> = {
      lunes: [], martes: [], miercoles: [], jueves: [], viernes: []
    };
    for (const h of this.clases()) {
      const dia = h.diaSemana.toLowerCase();
      if (mapa[dia]) {
        mapa[dia].push(h);
      }
    }
    for (const dia of Object.keys(mapa)) {
      mapa[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    }
    return mapa;
  });

  readonly clasesPorDiaPaginadas = computed(() => {
    const mapa = this.horarioPorDia();
    const paginas = this.paginaPorDia();
    const porPagina = 3;
    const resultado: Record<string, HorarioClase[]> = {};
    
    for (const dia of this.diasSemana) {
      const lista = mapa[dia];
      const pag = paginas[dia] || 1;
      const start = (pag - 1) * porPagina;
      resultado[dia] = lista.slice(start, start + porPagina);
    }
    return resultado;
  });

  async ngOnInit(): Promise<void> {
    const usuarioId = this.authState.usuarioActual()?.id;
    if (!usuarioId) { this.cargando.set(false); return; }

    const docenteId = await this.repo.obtenerIdDocente(usuarioId);
    if (!docenteId) { this.cargando.set(false); return; }
    this.docenteId = docenteId;

    const { data, error: dbError } = await this.supabase
      .from('horarios')
      .select('id, seccion_id, hora_inicio, hora_fin, dia_semana, asignaturas(nombre), secciones(nombre, grados(nombre))')
      .eq('docente_id', docenteId);

    this.cargando.set(false);

    if (dbError) {
      toast.error(dbError.message);
      return;
    }

    const mapeado: HorarioClase[] = (data ?? []).map((h: any) => ({
      id: h.id,
      seccionId: h.seccion_id,
      asignaturaNombre: h.asignaturas?.nombre ?? '',
      seccionNombre: h.secciones?.nombre ?? '',
      gradoNombre: h.secciones?.grados?.nombre ?? '',
      horaInicio: h.hora_inicio,
      horaFin: h.hora_fin,
      diaSemana: h.dia_semana,
    }));

    this.clases.set(mapeado);
  }

  obtenerColorDia(dia: string): string {
    const colores: Record<string, string> = {
      lunes: 'bg-indigo-500',
      martes: 'bg-emerald-500',
      miercoles: 'bg-amber-500',
      jueves: 'bg-rose-500',
      viernes: 'bg-sky-500',
    };
    return colores[dia] ?? 'bg-slate-400';
  }

  obtenerTotalPaginas(dia: string): number {
    return Math.ceil(this.horarioPorDia()[dia].length / 3);
  }

  cambiarPaginaDia(dia: string, delta: number): void {
    this.paginaPorDia.update((paginas) => {
      const actual = paginas[dia] || 1;
      const total = this.obtenerTotalPaginas(dia);
      const nueva = Math.min(Math.max(actual + delta, 1), total);
      return { ...paginas, [dia]: nueva };
    });
  }

  abrirModalAnuncio(clase: HorarioClase): void {
    this.claseSeleccionada.set(clase);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.claseSeleccionada.set(null);
  }

  async publicarAnuncio(evento: Event): Promise<void> {
    evento.preventDefault();
    const formulario = evento.target as HTMLFormElement;
    const datos = new FormData(formulario);
    
    const tipo = datos.get('tipo') as string;
    const titulo = datos.get('titulo') as string;
    const mensaje = datos.get('mensaje') as string;
    const clase = this.claseSeleccionada();

    if (!clase || !this.docenteId) {
      toast.error('Ocurrió un error al identificar la clase o docente.');
      return;
    }

    this.publicando.set(true);

    const { error } = await this.supabase
      .from('anuncios')
      .insert({
        docente_id: this.docenteId,
        seccion_id: clase.seccionId,
        tipo,
        titulo,
        mensaje,
      });

    this.publicando.set(false);

    if (error) {
      toast.error('Error al publicar: ' + error.message);
    } else {
      toast.success(`¡Anuncio publicado correctamente para ${clase.gradoNombre} - ${clase.seccionNombre}!`);
      this.cerrarModal();
    }
  }
}
