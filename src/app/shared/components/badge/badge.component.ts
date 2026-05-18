import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type VarianteBadge = 'verde' | 'rojo' | 'amarillo' | 'azul' | 'gris';

const CLASES: Record<VarianteBadge, string> = {
  verde: 'bg-green-100 text-green-700',
  rojo: 'bg-red-100 text-red-700',
  amarillo: 'bg-yellow-100 text-yellow-700',
  azul: 'bg-indigo-100 text-indigo-700',
  gris: 'bg-gray-100 text-gray-600',
};

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {{ clases() }}">
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  readonly variante = input<VarianteBadge>('gris');
  readonly clases = () => CLASES[this.variante()];
}
