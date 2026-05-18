import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-buscador',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full">
      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
      <input
        type="text"
        [placeholder]="placeholder()"
        [value]="valor()"
        (input)="alDigitar($event)"
        class="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs focus:outline-none transition-all font-semibold text-slate-800"
      />
    </div>
  `,
})
export class BuscadorComponent {
  readonly placeholder = input<string>('Buscar...');
  readonly valor = input<string>('');
  readonly busquedaCambia = output<string>();

  alDigitar(evento: Event): void {
    const valorDigitado = (evento.target as HTMLInputElement).value;
    this.busquedaCambia.emit(valorDigitado);
  }
}
