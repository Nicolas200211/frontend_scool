import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-700">{{ titulo() }}</p>
      @if (descripcion()) {
        <p class="text-sm text-gray-400 mt-1">{{ descripcion() }}</p>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly titulo = input('Sin resultados');
  readonly descripcion = input('');
}
