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
    <main class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div class="w-full max-w-md">

        <header class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 14l9-5-9-5-9 5 9 5z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-3.922L12 14z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Sistema Escolar</h1>
          <p class="text-sm text-gray-500 mt-1">Ingresa tus credenciales para continuar</p>
        </header>

        <section class="bg-white rounded-2xl shadow-xl p-8">
          <form [formGroup]="formulario" (ngSubmit)="iniciarSesion()" novalidate>

            <div class="space-y-5">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="usuario@colegio.edu"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         disabled:bg-gray-50 disabled:text-gray-400 transition"
                  [class.border-red-400]="campoInvalido('email')"
                  aria-describedby="email-error"
                />
                @if (campoInvalido('email')) {
                  <p id="email-error" class="mt-1 text-xs text-red-500" role="alert">
                    Ingresa un correo electrónico válido.
                  </p>
                }
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         disabled:bg-gray-50 disabled:text-gray-400 transition"
                  [class.border-red-400]="campoInvalido('password')"
                  aria-describedby="password-error"
                />
                @if (campoInvalido('password')) {
                  <p id="password-error" class="mt-1 text-xs text-red-500" role="alert">
                    La contraseña es requerida.
                  </p>
                }
              </div>
            </div>

            @if (errorMensaje()) {
              <div class="mt-5 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <p class="text-sm text-red-600">{{ errorMensaje() }}</p>
              </div>
            }

            <button
              type="submit"
              [disabled]="cargando()"
              class="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5
                     bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                     text-white text-sm font-semibold rounded-lg shadow
                     disabled:opacity-60 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                     transition"
            >
              @if (cargando()) {
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Ingresando...
              } @else {
                Ingresar
              }
            </button>
          </form>
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
