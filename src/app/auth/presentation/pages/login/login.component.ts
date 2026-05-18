import { ChangeDetectionStrategy, Component, inject, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginUseCase } from '../../../core/application/login.usecase';
import { AuthState } from '../../../infrastructure/state/auth.state';
import { Rol } from '../../../../shared/domain/types/rol.type';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const RUTA_POR_ROL: Record<Rol, string> = {
  admin: '/admin/dashboard',
  docente: '/docente/dashboard',
  padre: '/padre/dashboard',
  estudiante: '/estudiante/dashboard',
};

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <!-- Contenedor principal anclado por GSAP ScrollTrigger -->
    <div #mainWrapper class="grid grid-cols-1 lg:grid-cols-2 bg-slate-50 h-screen w-full overflow-hidden">
      
      <!-- Lado Izquierdo: Galería GSAP -->
      <section class="hidden lg:block relative h-full bg-slate-900 overflow-hidden">
        
        <!-- Imágenes Dinámicas -->
        <div class="absolute inset-0 w-full h-full">
          <!-- Imagen 1 (Base) -->
          <img #img1 src="/login_bg_school.png" class="absolute inset-0 w-full h-full object-cover z-10" />
          
          <!-- Imagen 2 (Capa Media) -->
          <img #img2 src="/students_tablet.png" class="absolute inset-0 w-full h-full object-cover z-20" style="clip-path: inset(100% 0% 0% 0%);" />
          
          <!-- Imagen 3 (Capa Superior) -->
          <img #img3 src="/modern_classroom.png" class="absolute inset-0 w-full h-full object-cover z-30" style="clip-path: inset(100% 0% 0% 0%);" />
        </div>

        <!-- Overlay de gradiente -->
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent z-40 pointer-events-none"></div>

        <!-- Textos Izquierda -->
        <div class="absolute inset-0 flex flex-col justify-end p-12 lg:p-16 z-50 pointer-events-none">
          <div #textBlock class="space-y-6">
            <div class="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-2xl w-fit shadow-xl">
              <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
              <span class="text-xs font-extrabold text-white uppercase tracking-wider font-mono">EdTech Platform 2026</span>
            </div>
            <h1 class="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
              Sistema Escolar <br>
              <span class="text-indigo-400">Bento Classroom</span>
            </h1>
            <p class="text-lg text-slate-200 max-w-lg leading-relaxed drop-shadow-lg font-medium">
              Sigue bajando (scroll) para descubrir la magia. Una plataforma educativa construida con excelencia.
            </p>
          </div>
        </div>
      </section>

      <!-- Lado Derecho: Formulario de Login -->
      <section class="flex flex-col items-center justify-center p-6 sm:p-12 relative h-full overflow-y-auto z-50 bg-slate-50">
        
        <!-- Header Móvil -->
        <div class="lg:hidden w-full max-w-md mb-8 text-center mt-10">
          <div class="inline-flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm mb-4">
            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span class="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider font-mono">EdTech Platform 2026</span>
          </div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
            Bento Classroom
          </h1>
          <p class="text-sm text-slate-500">Accede a tu cuenta institucional</p>
        </div>

        <div #formContainer class="w-full max-w-md my-auto">
          <div class="bg-white rounded-[32px] p-8 border border-slate-100/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300">
            <header class="mb-6 text-center sm:text-left form-element">
              <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Iniciar sesión</h2>
              <p class="text-xs text-slate-400 mt-1">Ingresa tus credenciales autorizadas del colegio</p>
            </header>

            <form [formGroup]="formulario" (ngSubmit)="iniciarSesion()" novalidate class="space-y-4">
              <div class="form-element">
                <label for="email" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="usuario@colegio.edu"
                  class="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-mono"
                  [class.border-red-400]="campoInvalido('email')"
                />
                @if (campoInvalido('email')) {
                  <p class="mt-1.5 text-xs text-red-500 font-medium">Ingresa un correo electrónico válido.</p>
                }
              </div>

              <div class="form-element">
                <label for="password" class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all font-mono"
                  [class.border-red-400]="campoInvalido('password')"
                />
                @if (campoInvalido('password')) {
                  <p class="mt-1.5 text-xs text-red-500 font-medium">La contraseña es requerida.</p>
                }
              </div>

              @if (errorMensaje()) {
                <div class="form-element p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs font-medium">
                  {{ errorMensaje() }}
                </div>
              }

              <button
                type="submit"
                [disabled]="cargando()"
                class="form-element w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold rounded-2xl shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                @if (cargando()) {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Ingresando...</span>
                } @else {
                  <span>Ingresar al Portal</span>
                }
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: []
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  @ViewChild('mainWrapper') mainWrapper!: ElementRef<HTMLElement>;
  @ViewChild('img1') img1!: ElementRef<HTMLElement>;
  @ViewChild('img2') img2!: ElementRef<HTMLElement>;
  @ViewChild('img3') img3!: ElementRef<HTMLElement>;
  @ViewChild('textBlock') textBlock!: ElementRef<HTMLElement>;
  @ViewChild('formContainer') formContainer!: ElementRef<HTMLElement>;

  private scrollTriggers: ScrollTrigger[] = [];

  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly formulario = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  ngAfterViewInit() {
    // 1. Animaciones de entrada iniciales (Al cargar la página)
    gsap.from(this.formContainer.nativeElement.querySelectorAll('.form-element'), {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.2
    });

    gsap.from(this.textBlock.nativeElement.children, {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      delay: 0.4
    });

    // 2. Animaciones de ScrollTrigger (Scrollytelling)
    // Usamos matchMedia para que esto solo pase en PC (donde hay 2 columnas)
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: this.mainWrapper.nativeElement,
          pin: true,
          start: "top top",
          end: "+=300%", // Obliga al usuario a hacer scroll por 3 veces la altura de la pantalla
          scrub: 1,      // Suavizado del scroll
        }
      });

      // La imagen base hace zoom infinito
      tl.to(this.img1.nativeElement, { scale: 1.3, duration: 1 }, 0);

      // La imagen 2 hace un barrido (wipe) desde abajo hacia arriba y hace zoom
      tl.to(this.img2.nativeElement, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: 'none' }, 0.5);
      tl.to(this.img2.nativeElement, { scale: 1.15, duration: 1.5, ease: 'none' }, 0.5);

      // La imagen 3 hace el mismo barrido desde abajo
      tl.to(this.img3.nativeElement, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: 'none' }, 1.5);
      tl.to(this.img3.nativeElement, { scale: 1.15, duration: 1.5, ease: 'none' }, 1.5);

      // Los textos de la izquierda se desplazan lentamente hacia arriba con el scroll
      tl.to(this.textBlock.nativeElement, { y: -80, duration: 3, ease: 'none' }, 0);

      this.scrollTriggers = ScrollTrigger.getAll();
    });
  }

  ngOnDestroy() {
    this.scrollTriggers.forEach(st => st.kill());
    ScrollTrigger.clearMatchMedia();
  }

  campoInvalido(campo: 'email' | 'password'): boolean {
    const control = this.formulario.get(campo);
    return !!(control?.invalid && control.touched);
  }

  async iniciarSesion(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const { email, password } = this.formulario.getRawValue();
    const respuesta = await this.loginUseCase.ejecutar({
      email: email!,
      password: password!,
    });

    this.cargando.set(false);

    if (respuesta.error) {
      this.errorMensaje.set(respuesta.error);
      return;
    }

    const rol = this.authState.rolUsuario();
    if (rol) {
      this.router.navigateByUrl(RUTA_POR_ROL[rol]);
    }
  }
}
