import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthState } from '../../../../auth/infrastructure/state/auth.state';
import { LogoutUseCase } from '../../../../auth/core/application/logout.usecase';
import { Router } from '@angular/router';
import { Rol } from '../../../domain/types/rol.type';
import { ModalComponent } from '../../../components/modal/modal.component';
import { FormsModule } from '@angular/forms';
import { obtenerClienteSupabase } from '../../../../shared/infrastructure/supabase/supabase.client';
import { toast } from 'ngx-sonner';

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ModalComponent, FormsModule],
  template: `
    <div class="flex h-screen bg-slate-50 overflow-hidden">

      <aside
        class="flex flex-col w-64 bg-white border-r border-slate-100 shrink-0 transition-transform duration-300 z-20"
        [class.-translate-x-full]="!sidebarAbierto()"
        [class.translate-x-0]="sidebarAbierto()"
        aria-label="Navegación principal"
      >
        <!-- Brand Header -->
        <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-50 shrink-0">
          <div class="w-9 h-9 bg-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/10">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-3.922L12 14z"/>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-black text-slate-800 leading-none">Bento School</span>
            <span class="text-[10px] font-semibold text-slate-400 mt-0.5">Control de Asistencia</span>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          @for (item of itemsNavegacion(); track item.ruta) {
            <a
              [routerLink]="item.ruta"
              routerLinkActive="bg-indigo-50/80 text-indigo-700 font-extrabold rounded-2xl"
              [routerLinkActiveOptions]="{ exact: false }"
              class="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm text-slate-500
                     hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 group"
              [attr.aria-label]="item.etiqueta"
            >
              <svg class="w-5 h-5 shrink-0 text-slate-400 group-hover:text-indigo-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.icono"/>
              </svg>
              <span>{{ item.etiqueta }}</span>
            </a>
          }
        </nav>

        <!-- User profile container at the bottom -->
        <div class="px-4 py-5 border-t border-slate-50 shrink-0">
          <button (click)="abrirPerfilModal()"
            class="w-full flex items-center gap-3 bg-slate-50/50 hover:bg-indigo-50/40 border border-slate-100/70 hover:border-indigo-100/50 p-3 rounded-2xl mb-3 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-left transition duration-150 group">
            
            @if (esFotoValida(fotoUrlUsuario()) && fotoUsuarioCargadaCorrectamente()) {
              <img [src]="fotoUrlUsuario()" (error)="fotoUsuarioCargadaCorrectamente.set(false)" alt="Avatar" class="w-9 h-9 rounded-full object-cover shrink-0 border border-indigo-100 shadow-sm" />
            } @else {
              <div class="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center shrink-0">
                <span class="text-xs font-bold text-indigo-700 group-hover:scale-105 transition">{{ inicialesUsuario() }}</span>
              </div>
            }

            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-slate-800 leading-tight break-words group-hover:text-indigo-900 transition">{{ nombreCompleto() }}</p>
              <span class="inline-block bg-indigo-100/60 text-indigo-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider mt-1 font-mono">
                {{ authState.rolUsuario() }}
              </span>
            </div>
          </button>
          
          <button
            (click)="cerrarSesion()"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
            aria-label="Cerrar sesión"
          >
            <svg class="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Toggle button on mobile view -->
        <header class="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-100 shrink-0 lg:hidden">
          <button
            (click)="toggleSidebar()"
            class="p-2 rounded-xl text-slate-500 hover:bg-slate-50 border border-slate-100 transition"
            aria-label="Abrir menú"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span class="text-sm font-bold text-slate-800">Bento School</span>
        </header>

        <main class="flex-1 overflow-y-auto p-6 md:p-8">
          <router-outlet />
        </main>
      </div>

    </div>

    <!-- Configure Profile Modal -->
    @if (modalPerfilAbierto()) {
      <app-modal titulo="Configurar mi Perfil" (cerrar)="cerrarPerfilModal()">
        <form (ngSubmit)="guardarPerfil()" class="space-y-5">
          
          <div class="flex flex-col items-center justify-center text-center space-y-2">
            <div class="relative group">
              @if (esFotoValida(fotoUrlTemp()) && fotoTempCargadaCorrectamente()) {
                <img [src]="fotoUrlTemp()" (error)="fotoTempCargadaCorrectamente.set(false)" alt="Vista previa avatar" class="w-20 h-20 rounded-full object-cover border-2 border-indigo-600 shadow-md" />
              } @else {
                <div class="w-20 h-20 bg-indigo-50 border-2 border-indigo-100 rounded-full flex items-center justify-center shadow-inner">
                  <span class="text-xl font-bold text-indigo-700">{{ inicialesUsuario() }}</span>
                </div>
              }
              <div class="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p class="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">Vista previa de foto</p>
          </div>

          <div class="bg-slate-50 p-1 rounded-2xl flex border border-slate-100 gap-1">
            <button type="button" (click)="opcionFoto.set('pc')"
              class="flex-1 py-1.5 text-xs font-bold rounded-xl transition duration-150"
              [class]="opcionFoto() === 'pc' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'">
              Subir desde PC
            </button>
            <button type="button" (click)="opcionFoto.set('enlace')"
              class="flex-1 py-1.5 text-xs font-bold rounded-xl transition duration-150"
              [class]="opcionFoto() === 'enlace' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'">
              Enlace de Internet
            </button>
          </div>

          @if (opcionFoto() === 'pc') {
            <div class="space-y-1.5">
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">Seleccionar archivo</label>
              <div class="relative flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                <input type="file" accept="image/*" (change)="onArchivoSeleccionado($event)" 
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div class="text-center space-y-1 pointer-events-none p-3">
                  <svg class="w-6 h-6 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p class="text-xs font-bold text-indigo-600">Haz clic para buscar imagen</p>
                  <p class="text-[9px] text-slate-400 font-medium">Formatos soportados: JPG, PNG, WEBP (Max 2MB)</p>
                </div>
              </div>
            </div>
          } @else {
            <div class="space-y-1.5">
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">Dirección URL de la Imagen</label>
              <input type="url" [(ngModel)]="enlaceFotoInput" name="enlaceFotoInput" (input)="onUrlCambia()"
                placeholder="https://ejemplo.com/mi-foto.png"
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all" />
            </div>
          }

          <div class="space-y-3 pt-2">
            <div class="space-y-1.5">
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">Nombre</label>
              <input type="text" [(ngModel)]="nombreInput" name="nombreInput" required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all" />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">Apellido</label>
              <input type="text" [(ngModel)]="apellidoInput" name="apellidoInput" required
                class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all" />
            </div>
          </div>

          <div class="flex gap-3 pt-3 border-t border-slate-50">
            <button type="button" (click)="cerrarPerfilModal()"
              class="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition shadow-sm text-center">
              Cancelar
            </button>
            <button type="submit" [disabled]="guardandoPerfil()"
              class="flex-1 px-4 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-2xl shadow-sm hover:shadow transition text-center">
              {{ guardandoPerfil() ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class MainLayoutComponent {
  readonly authState = inject(AuthState);
  private readonly logoutUseCase = inject(LogoutUseCase);
  private readonly router = inject(Router);

  readonly sidebarAbierto = signal(true);

  readonly modalPerfilAbierto = signal(false);
  readonly guardandoPerfil = signal(false);
  readonly opcionFoto = signal<'pc' | 'enlace'>('pc');

  readonly fotoUsuarioCargadaCorrectamente = signal(true);
  readonly fotoTempCargadaCorrectamente = signal(true);

  nombreInput = '';
  apellidoInput = '';
  enlaceFotoInput = '';
  readonly fotoUrlTemp = signal<string | null>(null);

  readonly itemsNavegacion = computed(() => {
    const rol = this.authState.rolUsuario();
    return rol ? (NAVEGACION[rol] ?? []) : [];
  });

  readonly nombreCompleto = computed(() => {
    const usuario = this.authState.usuarioActual();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '';
  });

  readonly fotoUrlUsuario = computed(() => {
    return this.authState.usuarioActual()?.fotoUrl ?? null;
  });

  esFotoValida(url: string | null | undefined): boolean {
    if (!url) return false;
    const cleanUrl = String(url).trim();
    return cleanUrl !== '' && cleanUrl !== 'null' && cleanUrl !== 'undefined';
  }

  readonly inicialesUsuario = computed(() => {
    const usuario = this.authState.usuarioActual();
    if (!usuario) return '';
    return `${usuario.nombre[0]}${usuario.apellido[0]}`.toUpperCase();
  });

  toggleSidebar(): void {
    this.sidebarAbierto.update((abierto) => !abierto);
  }

  abrirPerfilModal(): void {
    const usuario = this.authState.usuarioActual();
    if (!usuario) return;

    this.nombreInput = usuario.nombre;
    this.apellidoInput = usuario.apellido;
    this.fotoUrlTemp.set(usuario.fotoUrl ?? null);
    this.fotoUsuarioCargadaCorrectamente.set(true);
    this.fotoTempCargadaCorrectamente.set(true);
    
    if (usuario.fotoUrl && usuario.fotoUrl.startsWith('http')) {
      this.enlaceFotoInput = usuario.fotoUrl;
      this.opcionFoto.set('enlace');
    } else {
      this.enlaceFotoInput = '';
      this.opcionFoto.set('pc');
    }

    this.modalPerfilAbierto.set(true);
  }

  cerrarPerfilModal(): void {
    this.modalPerfilAbierto.set(false);
    this.fotoUrlTemp.set(null);
  }

  onArchivoSeleccionado(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const archivo = input.files[0];
      if (archivo.size > 2 * 1024 * 1024) {
        toast.error('La imagen supera el límite de 2MB');
        return;
      }

      this.fotoTempCargadaCorrectamente.set(true);
      const lector = new FileReader();
      lector.onload = () => {
        this.fotoUrlTemp.set(lector.result as string);
      };
      lector.readAsDataURL(archivo);
    }
  }

  onUrlCambia(): void {
    this.fotoTempCargadaCorrectamente.set(true);
    this.fotoUrlTemp.set(this.enlaceFotoInput.trim() || null);
  }

  async guardarPerfil(): Promise<void> {
    const usuario = this.authState.usuarioActual();
    if (!usuario) return;

    if (!this.nombreInput.trim() || !this.apellidoInput.trim()) {
      toast.error('Nombre y Apellido son obligatorios');
      return;
    }

    this.guardandoPerfil.set(true);

    try {
      const supabase = obtenerClienteSupabase();
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: this.nombreInput.trim(),
          apellido: this.apellidoInput.trim(),
          foto_url: this.fotoUrlTemp() || null,
        })
        .eq('id', usuario.id);

      if (error) {
        toast.error('Error al actualizar el perfil');
        console.error(error);
        return;
      }

      this.fotoUsuarioCargadaCorrectamente.set(true);
      this.authState.actualizarUsuario({
        nombre: this.nombreInput.trim(),
        apellido: this.apellidoInput.trim(),
        fotoUrl: this.fotoUrlTemp() || null,
      });

      toast.success('¡Perfil actualizado correctamente!');
      this.cerrarPerfilModal();
    } catch (e) {
      toast.error('Ocurrió un error inesperado');
      console.error(e);
    } finally {
      this.guardandoPerfil.set(false);
    }
  }

  async cerrarSesion(): Promise<void> {
    await this.logoutUseCase.ejecutar();
    this.router.navigateByUrl('/auth/login');
  }
}
