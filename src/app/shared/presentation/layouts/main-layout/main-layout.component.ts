import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { LogoutUseCase } from '../../../../auth/core/application/logout.usecase';
import { Router } from '@angular/router';
import { Rol } from '../../../domain/types/rol.type';

interface ItemNavegacion {
  etiqueta: string;
  ruta: string;
  icono: string;
}

const NAVEGACION: Record<Rol, ItemNavegacion[]> = {
  admin: [
    { etiqueta: 'Dashboard', ruta: '/admin/dashboard', icono: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { etiqueta: 'Estudiantes', ruta: '/admin/estudiantes', icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { etiqueta: 'Docentes', ruta: '/admin/docentes', icono: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { etiqueta: 'Asignaturas', ruta: '/admin/asignaturas', icono: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { etiqueta: 'Grados y Secciones', ruta: '/admin/grados', icono: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { etiqueta: 'Matrículas', ruta: '/admin/matriculas', icono: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { etiqueta: 'Horarios', ruta: '/admin/horarios', icono: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { etiqueta: 'Asistencia', ruta: '/admin/asistencia', icono: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { etiqueta: 'Apoderados', ruta: '/admin/apoderados', icono: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { etiqueta: 'Reportes', ruta: '/admin/reportes', icono: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ],
  docente: [
    { etiqueta: 'Dashboard', ruta: '/docente/dashboard', icono: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { etiqueta: 'Mis Clases', ruta: '/docente/mis-clases', icono: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { etiqueta: 'Tomar Asistencia', ruta: '/docente/asistencia', icono: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { etiqueta: 'Justificaciones', ruta: '/docente/justificaciones', icono: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { etiqueta: 'Reportes', ruta: '/docente/reportes', icono: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ],
  padre: [
    { etiqueta: 'Dashboard', ruta: '/padre/dashboard', icono: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { etiqueta: 'Asistencia', ruta: '/padre/asistencia', icono: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { etiqueta: 'Justificaciones', ruta: '/padre/justificaciones', icono: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  ],
  estudiante: [
    { etiqueta: 'Dashboard', ruta: '/estudiante/dashboard', icono: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { etiqueta: 'Mi Asistencia', ruta: '/estudiante/asistencia', icono: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { etiqueta: 'Mi Horario', ruta: '/estudiante/horario', icono: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ],
};

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-50 overflow-hidden">

      <aside
        class="flex flex-col w-64 bg-white border-r border-gray-200 shrink-0 transition-transform duration-300 z-20"
        [class.-translate-x-full]="!sidebarAbierto()"
        [class.translate-x-0]="sidebarAbierto()"
        aria-label="Navegación principal"
      >
        <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-3.922L12 14z"/>
            </svg>
          </div>
          <span class="text-sm font-bold text-gray-900 leading-tight">Sistema Escolar</span>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          @for (item of itemsNavegacion(); track item.ruta) {
            <a
              [routerLink]="item.ruta"
              routerLinkActive="bg-indigo-50 text-indigo-700 font-semibold"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600
                     hover:bg-gray-50 hover:text-gray-900 transition group"
              [attr.aria-label]="item.etiqueta"
            >
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" [attr.d]="item.icono"/>
              </svg>
              {{ item.etiqueta }}
            </a>
          }
        </nav>

        <div class="px-3 py-4 border-t border-gray-100">
          <div class="flex items-center gap-3 px-3 py-2 mb-1">
            <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <span class="text-xs font-bold text-indigo-700">{{ inicialesUsuario() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ nombreCompleto() }}</p>
              <p class="text-xs text-gray-400 truncate capitalize">{{ authState.rolUsuario() }}</p>
            </div>
          </div>
          <button
            (click)="cerrarSesion()"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600
                   hover:bg-red-50 hover:text-red-600 transition"
            aria-label="Cerrar sesión"
          >
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <button
            (click)="toggleSidebar()"
            class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition lg:hidden"
            aria-label="Abrir menú"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </header>

        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>

    </div>
  `,
})
export class MainLayoutComponent {
  readonly authState = inject(AuthState);
  private readonly logoutUseCase = inject(LogoutUseCase);
  private readonly router = inject(Router);

  readonly sidebarAbierto = signal(true);

  readonly itemsNavegacion = computed(() => {
    const rol = this.authState.rolUsuario();
    return rol ? (NAVEGACION[rol] ?? []) : [];
  });

  readonly nombreCompleto = computed(() => {
    const usuario = this.authState.usuarioActual();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '';
  });

  readonly inicialesUsuario = computed(() => {
    const usuario = this.authState.usuarioActual();
    if (!usuario) return '';
    return `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();
  });

  toggleSidebar(): void {
    this.sidebarAbierto.update((abierto) => !abierto);
  }

  async cerrarSesion(): Promise<void> {
    await this.logoutUseCase.ejecutar();
    this.router.navigateByUrl('/auth/login');
  }
}
