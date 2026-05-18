import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { EstudiantesRepository } from '../../../core/domain/ports/estudiantes.repository';
import { DocentesRepository } from '../../../core/domain/ports/docentes.repository';
import { AsistenciaRepository } from '../../../core/domain/ports/asistencia.repository';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header titulo="Dashboard" subtitulo="Resumen general del sistema" />

    <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Estadísticas generales">
      @for (tarjeta of tarjetas(); track tarjeta.etiqueta) {
        <article class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-gray-500">{{ tarjeta.etiqueta }}</span>
            <div class="w-9 h-9 rounded-lg flex items-center justify-center" [class]="tarjeta.colorFondo">
              <svg class="w-5 h-5" [class]="tarjeta.colorIcono" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" [attr.d]="tarjeta.icono"/>
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ tarjeta.valor }}</p>
        </article>
      }
    </section>
  `,
})
export class DashboardAdminComponent implements OnInit {
  private readonly estudiantesRepo = inject(EstudiantesRepository);
  private readonly docentesRepo = inject(DocentesRepository);
  private readonly asistenciaRepo = inject(AsistenciaRepository);

  readonly tarjetas = signal([
    { etiqueta: 'Estudiantes', valor: '...', icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', colorFondo: 'bg-indigo-50', colorIcono: 'text-indigo-600' },
    { etiqueta: 'Docentes', valor: '...', icono: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', colorFondo: 'bg-blue-50', colorIcono: 'text-blue-600' },
    { etiqueta: 'Presentes hoy', valor: '...', icono: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', colorFondo: 'bg-green-50', colorIcono: 'text-green-600' },
    { etiqueta: 'Ausentes hoy', valor: '...', icono: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', colorFondo: 'bg-red-50', colorIcono: 'text-red-500' },
  ]);

  async ngOnInit(): Promise<void> {
    const hoy = new Date().toISOString().slice(0, 10);
    const [e, d, r] = await Promise.all([
      this.estudiantesRepo.obtenerTodos(),
      this.docentesRepo.obtenerTodos(),
      this.asistenciaRepo.obtenerResumenHoy(hoy),
    ]);

    this.tarjetas.update((t) => {
      const copia = [...t];
      copia[0] = { ...copia[0], valor: e.error === null ? String(e.datos.length) : '—' };
      copia[1] = { ...copia[1], valor: d.error === null ? String(d.datos.length) : '—' };
      copia[2] = { ...copia[2], valor: r.error === null ? String(r.datos.presentes) : '—' };
      copia[3] = { ...copia[3], valor: r.error === null ? String(r.datos.ausentes) : '—' };
      return copia;
    });
  }
}
