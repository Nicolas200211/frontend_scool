import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PadreRepository } from '../../../core/domain/ports/padre.repository';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { HijoInfo } from '../../../core/domain/models/hijo-info.model';

@Component({
  selector: 'app-dashboard-padre',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <app-page-header
      [titulo]="'Hola, ' + (authState.usuarioActual()?.nombre ?? '')"
      subtitulo="Seguimiento de asistencia de tus hijos"
    />

    @if (hijos().length > 1) {
      <div class="mb-6">
        <label class="block text-xs font-medium text-gray-500 mb-1">Seleccionar hijo</label>
        <select (change)="seleccionarHijo($event)"
          class="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          @for (h of hijos(); track h.estudianteId) {
            <option [value]="h.estudianteId">{{ h.estudianteApellido }}, {{ h.estudianteNombre }}</option>
          }
        </select>
      </div>
    }

    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8" aria-label="Resumen asistencia">
      <article class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">% Asistencia (mes)</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats().porcentaje }}%</p>
      </article>
      <article class="bg-red-50 rounded-xl p-5 shadow-sm border border-red-100">
        <p class="text-sm text-red-500 mb-1">Faltas este mes</p>
        <p class="text-2xl font-bold text-red-600">{{ stats().ausencias }}</p>
      </article>
      <article class="bg-yellow-50 rounded-xl p-5 shadow-sm border border-yellow-100">
        <p class="text-sm text-yellow-600 mb-1">Sin justificar</p>
        <p class="text-2xl font-bold text-yellow-700">{{ stats().sinJustificar }}</p>
      </article>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <a routerLink="/padre/asistencia" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition block">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <p class="font-semibold text-gray-900">Ver asistencia</p>
        </div>
        <p class="text-sm text-gray-500">Consulta el historial completo de asistencia</p>
      </a>
      <a routerLink="/padre/justificaciones" class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition block">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <p class="font-semibold text-gray-900">Justificaciones</p>
        </div>
        <p class="text-sm text-gray-500">Envía justificaciones para las inasistencias</p>
      </a>
    </section>
  `,
})
export class DashboardPadreComponent implements OnInit {
  readonly authState = inject(AuthState);
  private readonly repo = inject(PadreRepository);

  readonly stats = signal({ porcentaje: 0, ausencias: 0, sinJustificar: 0 });
  readonly hijos = signal<HijoInfo[]>([]);
  private hijoActual: HijoInfo | null = null;

  async ngOnInit(): Promise<void> {
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

    const hoy = new Date().toISOString().slice(0, 10);
    const inicio = new Date();
    inicio.setDate(1);
    const inicioMes = inicio.toISOString().slice(0, 10);

    const r = await this.repo.obtenerAsistenciaHijo(this.hijoActual.estudianteId, inicioMes, hoy);
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
