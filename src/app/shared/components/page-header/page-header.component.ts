import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ titulo() }}</h1>
      @if (subtitulo()) {
        <p class="text-sm text-gray-500 mt-1">{{ subtitulo() }}</p>
      }
    </header>
  `,
})
export class PageHeaderComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
}
