import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sin-acceso',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <main class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="text-center">
        <p class="text-6xl font-bold text-indigo-200 mb-4">403</p>
        <h1 class="text-xl font-semibold text-gray-800 mb-2">Sin permiso de acceso</h1>
        <p class="text-sm text-gray-500 mb-6">No tienes permiso para ver esta página.</p>
        <a routerLink="/auth/login"
           class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          Volver al inicio
        </a>
      </div>
    </main>
  `,
})
export class SinAccesoComponent {}
