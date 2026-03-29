# Your Next Public Holiday �

Find your next public holiday and optimize your leave for maximum time off. Supports **100+ countries** worldwide.

**[mynextpublicholiday.com](https://mynextpublicholiday.com)**

## Features

- **Next Holiday** — instantly see your next public holiday with a live countdown
- **Leave Optimizer** — input your available leave days and get multiple ranked plans for the best times to take off, maximizing consecutive days away
- **Worldwide** — supports 100+ countries with automatic location detection and regional holiday support (e.g. AU-QLD, US-CA, DE-BY)
- **Light & dark mode** — tropical-themed palette with accessible contrast ratios (WCAG AA)
- Powered by the [Nager.Date](https://date.nager.at/) public holidays API

## Tech Stack

- **React 19** with TypeScript 5.8
- **Vite 6** for builds
- **Tailwind CSS v4** for styling
- **date-fns** for date manipulation
- **Vitest** for testing
- **ESLint 9** with TypeScript, React hooks, JSX a11y, and Prettier integration
- **Prettier** with Tailwind CSS class sorting
- Deployed on **Cloudflare Pages**

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |

## Project Structure

```
src/
├── components/
│   ├── holiday-display/   # Next holiday card + countdown
│   ├── leave-optimizer/   # Leave optimization UI
│   └── select/            # Country & region selector
├── hooks/
│   └── useCountdown.ts    # Live countdown hook
├── services/
│   ├── geolocation.ts     # Auto-detect user country
│   ├── holidays.ts        # Nager.Date API client
│   └── leave-optimizer.ts # Leave optimization algorithm
├── types/
│   └── holiday.ts         # Shared TypeScript types
├── utils/
│   └── countries.ts       # Country & region helpers
├── App.tsx                # Root component with routing & theming
├── index.css              # Tailwind + theme variables
└── main.tsx               # Entry point
```

## Deploy to Cloudflare Pages

1. Push to GitHub
2. Connect the repo in the [Cloudflare Pages dashboard](https://dash.cloudflare.com/)
3. Set build command: `npm run build`
4. Set build output directory: `dist`
5. Deploy

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
