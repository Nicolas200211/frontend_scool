# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200 (auto-reload)
npm run build      # Production build → dist/
npm run watch      # Dev build with watch mode
npm test           # Unit tests via Vitest
```

Generate Angular artifacts with the CLI:
```bash
ng generate component <name>
ng generate service <name>
ng generate pipe <name>
```

## Architecture

Angular 21 standalone-component application (no NgModules). Entry point is `src/main.ts`; the root component is `src/app/app.ts`, which renders only `<router-outlet>`. Routes are defined in `src/app/app.routes.ts` (currently empty — all feature routes go here). Global providers live in `src/app/app.config.ts`.

**Styling:** Tailwind CSS v4 via PostCSS (`@tailwindcss/postcss`). The single global stylesheet is `src/styles.css`, which just imports Tailwind. Components should use Tailwind utility classes; avoid component-scoped stylesheets unless necessary.

**Testing:** Vitest (not Karma/Jest). Test files use the `.spec.ts` convention. Run a single test file with `npx vitest run <path>`.

## TypeScript

Strict mode is fully enabled (`strict`, `noImplicitOverride`, `noImplicitReturns`, `strictTemplates`, etc.). `any` is **absolutely forbidden** — every variable, parameter, and API response must have a strongly-typed interface or type.

## Formatting

Prettier with `singleQuote: true`, `printWidth: 100`, and the Angular HTML parser for `.html` files. Run `npx prettier --write <file>` before committing.

---

## Project Rules (mandatory)

### Folder structure — Vertical Slicing + Hexagonal

Each feature (e.g. `dashboard`, `login`) is an independent module with this internal layout:

```
<feature>/
  core/
    domain/          # Entities, types, Port interfaces
    application/     # Use cases and application flows
  infrastructure/
    repositories/    # Concrete implementations of domain interfaces
    services/        # HTTP calls / API adapters
  presentation/
    pages/           # Routable Smart Components
    components/      # Reusable Dumb Components
    layouts/         # Global visual structures
```

### Code quality

- **No comments** — code must be self-documenting through clean naming.
- **No abbreviations** — use full, intention-revealing names (e.g. `obtenerDatosDelEstudiante`, not `getEstDat`).
- **DRY** — duplicated code, interfaces, or UI elements (buttons, inputs) must be extracted to a shared location.
- **No memory leaks** — always unsubscribe from Observables (prefer `takeUntilDestroyed`) and clean up event listeners on component teardown.

### Angular practices

- **Standalone components only** — no NgModules.
- **`ChangeDetectionStrategy.OnPush` + Signals** — all components must use OnPush; reactive state via Angular Signals.
- **Inline templates** — use `template: \`...\`` when the HTML is short; avoid extra files.
- **Tailwind only** — no custom CSS unless strictly necessary for a very complex feature.

### SEO, performance & accessibility

- **Semantic HTML5** — use `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`. Avoid div-soup.
- **One `<h1>` per route** — respect the `<h1>`→`<h6>` hierarchy strictly.
- **Dynamic meta tags** — Smart Components must update `Title` and `Meta` (description, Open Graph) on init using Angular's `Title` and `Meta` services.
- **Accessibility** — `aria-*` attributes when semantics are insufficient; descriptive `alt` on every image.
