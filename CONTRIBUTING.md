# Contributing

Thanks for your interest in contributing! Here's how to get started.

## Setup

```bash
git clone https://github.com/jasonm4130/public-holiday.git
cd public-holiday
npm install
npm run dev
```

## Development Workflow

1. Create a branch from `master`
2. Make your changes
3. Ensure everything passes before committing:

```bash
npm run lint        # ESLint (TypeScript, React hooks, JSX a11y)
npm run format      # Prettier with Tailwind class sorting
npm run build       # Type-check + production build
npm test            # Vitest test suite
```

## Code Style

- **TypeScript** — strict mode enabled, no `any`
- **ESLint** — flat config with `typescript-eslint`, `react-hooks`, `react-refresh`, and `jsx-a11y`
- **Prettier** — auto-formatted on save; Tailwind classes are auto-sorted via `prettier-plugin-tailwindcss`
- **Tailwind CSS v4** — use semantic color tokens (`page`, `surface`, `fg`, `muted`, `accent`, `accent-fg`) rather than raw hex values

## Accessibility

- Use `accent-fg` (not `accent`) for text to ensure WCAG AA contrast in both light and dark modes
- Use `accent` for backgrounds (pair with `text-ocean-deep` for contrast)
- All interactive elements need keyboard support and appropriate ARIA attributes
- The `eslint-plugin-jsx-a11y` plugin catches common issues automatically

## Theme Colors

The app uses CSS custom properties for light/dark theming. See `src/index.css` for the full palette. When adding new UI, stick to the semantic tokens rather than introducing new colors.

## Pull Requests

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Make sure CI passes (lint, build, tests)
