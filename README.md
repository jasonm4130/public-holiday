# Your Next Public Holiday 🇦🇺

Find your next Australian public holiday and optimize your leave days for maximum time off.

## Features

- **Next Holiday**: Instantly see your next public holiday for any Australian state or territory
- **Leave Optimizer**: Input your available leave days and get ranked suggestions for the best times to take off — maximizing consecutive days away (e.g., take 3 days around Easter → 10 days off)
- State-specific holidays for ACT, NSW, NT, QLD, SA, TAS, VIC, and WA
- Powered by the [Nager.Date](https://date.nager.at/) public holidays API

## Tech Stack

- **React 19** with TypeScript
- **Vite** for builds
- **Tailwind CSS v4** for styling
- **date-fns** for date manipulation
- **Vitest** for testing
- Deployed on **Cloudflare Pages**

## Development

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## Deploy to Cloudflare Pages

1. Push to GitHub
2. Connect the repo in the [Cloudflare Pages dashboard](https://dash.cloudflare.com/)
3. Set build command: `npm run build`
4. Set build output directory: `dist`
5. Deploy
