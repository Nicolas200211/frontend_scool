import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginUseCase } from '../../../core/application/login.usecase';
import { AuthState } from '../../../infrastructure/state/auth.state';
import { Rol } from '../../../../shared/domain/types/rol.type';

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
    <main class="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-emerald-50/50 flex flex-col items-center justify-center p-4">
      <div class="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        <!-- Left Side: Welcome and Brand (col-span-7) -->
        <section class="lg:col-span-7 text-center lg:text-left space-y-6 px-4">
          <div class="inline-flex items-center gap-3 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.01)] hover:shadow-sm transition-all duration-200">
            <span class="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></span>
            <span class="text-xs font-extrabold text-indigo-950 uppercase tracking-wider font-mono">EdTech Platform 2024</span>
          </div>
          
          <h1 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Sistema Escolar <br>
            <span class="text-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">Bento Classroom</span>
          </h1>
          <p class="text-base text-slate-500 max-w-lg leading-relaxed">
            Una plataforma educativa moderna, intuitiva y rápida diseñada para alumnos, profesores, directivos y padres de familia.
          </p>
        </section>

        <!-- Right Side: Login Form Box (col-span-5) -->
        <section class="lg:col-span-5 w-full">
          <div class="bg-white rounded-[32px] p-8 border border-slate-100/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300">
            <header class="mb-6">
              <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Iniciar sesión</h2>
              <p class="text-xs text-slate-400 mt-1">Ingresa tus credenciales autorizadas del colegio</p>
            </header>

            <form [formGroup]="formulario" (ngSubmit)="iniciarSesion()" novalidate class="space-y-4">
              <div>
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
                  aria-describedby="email-error"
                />
                @if (campoInvalido('email')) {
                  <p id="email-error" class="mt-1.5 text-xs text-red-500 font-medium" role="alert">
                    Ingresa un correo electrónico válido.
                  </p>
                }
              </div>

              <div>
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
                  aria-describedby="password-error"
                />
                @if (campoInvalido('password')) {
                  <p id="password-error" class="mt-1.5 text-xs text-red-500 font-medium" role="alert">
                    La contraseña es requerida.
                  </p>
                }
              </div>

              @if (errorMensaje()) {
                <div class="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs font-medium" role="alert">
                  {{ errorMensaje() }}
                </div>
              }

              <button
                type="submit"
                [disabled]="cargando()"
                class="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold rounded-2xl shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
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
        </section>

      </div>
    </main>
  `,
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly loginUseCase = inject(LoginUseCase);
  private readonly authState = inject(AuthState);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly formulario = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

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
