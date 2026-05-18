import { ChangeDetectionStrategy, Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-paginador',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPaginas() > 1) {
      <nav class="flex items-center justify-between mt-4 px-1" aria-label="Paginación">
        <p class="text-xs text-gray-500">
          Mostrando {{ desde() }}–{{ hasta() }} de {{ total() }}
        </p>
        <div class="flex items-center gap-1">
          <button
            (click)="irA(paginaActual() - 1)"
            [disabled]="paginaActual() === 1"
            class="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Página anterior">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>

          @for (pagina of paginas(); track pagina) {
            @if (pagina === -1) {
              <span class="px-1 text-gray-400 text-sm select-none">…</span>
            } @else {
              <button
                (click)="irA(pagina)"
                class="w-8 h-8 rounded-lg text-sm font-medium transition"
                [class]="pagina === paginaActual() ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'"
                [attr.aria-current]="pagina === paginaActual() ? 'page' : null">
                {{ pagina }}
              </button>
            }
          }

          <button
            (click)="irA(paginaActual() + 1)"
            [disabled]="paginaActual() === totalPaginas()"
            class="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Página siguiente">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </nav>
    }
  `,
})
export class PaginadorComponent {
  readonly paginaActual = input.required<number>();
  readonly total = input.required<number>();
  readonly porPagina = input<number>(10);
  readonly paginaCambia = output<number>();

  readonly totalPaginas = computed(() => Math.ceil(this.total() / this.porPagina()));
  readonly desde = computed(() => (this.paginaActual() - 1) * this.porPagina() + 1);
  readonly hasta = computed(() => Math.min(this.paginaActual() * this.porPagina(), this.total()));

  readonly paginas = computed<number[]>(() => {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const resultado: number[] = [1];
    if (actual > 3) resultado.push(-1);
    for (let p = Math.max(2, actual - 1); p <= Math.min(total - 1, actual + 1); p++) resultado.push(p);
    if (actual < total - 2) resultado.push(-1);
    resultado.push(total);
    return resultado;
  });

  irA(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaCambia.emit(pagina);
  }
}
