# Gold Price Tracker

A real-time gold price tracking application built with React, Tailwind CSS, and Recharts. Monitor international gold prices in multiple currencies with interactive charts and historical data.

## Features

- **Real-time Gold Prices**: Display current gold prices in multiple currencies (USD, EUR, GBP, JPY)
- **Interactive Charts**: Visualize price trends with smooth, animated line charts
- **Time Range Selection**: View price data for different time periods (Real-time, 1 Month, 3 Months)
- **Price Details**: Ask price, bid price, and per-gram pricing (22K purity)
- **Dark Theme**: Professional dark-themed UI optimized for readability
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Auto-refresh**: Automatically updates price data every 30 seconds
- **Guest Mode**: Run the application without authentication.
- **High Precision**: Supports up to 8 decimal places for prices and weights.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Charting**: Recharts
- **Routing**: Wouter
- **Build Tool**: Vite
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm

### Installation

1. Clone the repository:
```bash
cd gold-tracker-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file in the `client` directory (optional):
```env
VITE_GOLD_API_KEY=your_api_key_here
```

> **Note**: The application includes a demo mode that works without an API key. To use real data from GoldAPI.io, sign up at https://www.goldapi.io/ and add your API key.

### Development

Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the application:
```bash
pnpm build
```

Preview the production build:
```bash
pnpm preview
```

## Guest Mode

This application supports a guest mode that allows running the application without authentication.

The feature is controlled by the `VITE_ENABLE_AUTH` environment variable:

- `VITE_ENABLE_AUTH=false` - Guest mode (auth disabled)
- `VITE_ENABLE_AUTH=true` - Normal mode (auth enabled)

When guest mode is enabled, a mock guest user is used, and all authentication UI and features are disabled.

## Precision Implementation

The application handles numeric values with up to 8 decimal places of precision for prices and weights, using `decimal.js-light` to avoid floating-point errors.

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts and select the project settings.

### Option 2: Deploy via GitHub (Recommended)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/gold-tracker-app.git
git push -u origin main
```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "Add New..." → "Project"

4. Import your GitHub repository

5. Configure project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

6. Click "Deploy" - no environment variables needed!

**Note:** The application uses the free GoldPrice.org API which requires no authentication.

## API Integration

### GoldPrice.org

The application uses the [GoldPrice.org](https://goldprice.org/) API for real-time gold price data.

**API Features:**
- **Endpoint**: `https://data-asg.goldprice.org/dbXRates/{currency_code}`
- Real-time spot prices in multiple currencies
- **No authentication required** - completely free to use
- CORS enabled for browser requests
- Supported currencies: USD, EUR, GBP, JPY, and many more

**No setup required!** The API is completely free and public with no registration needed.

## Project Structure

```
client/
  public/          # Static assets
  src/
    components/    # Reusable UI components
      GoldChart.tsx      # Price chart component
    hooks/         # Custom React hooks
      useGoldPrice.ts    # Gold price data hook
    lib/           # Utility functions
      goldApi.ts         # API integration
    pages/         # Page components
      Home.tsx           # Main tracker page
    App.tsx        # Root component
    index.css      # Global styles with theme
    main.tsx       # Entry point
```

## Customization

### Changing the Theme

Edit `client/src/index.css` to modify the color scheme:

```css
:root {
  --primary: oklch(0.8 0.2 60);  /* Gold color */
  --background: oklch(0.141 0.005 285.823);  /* Dark background */
  /* ... other colors ... */
}
```

### Adding More Currencies

Edit `client/src/pages/Home.tsx` and update the currency selector:

```tsx
{['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'].map((curr) => (
  // ...
))}
```

### Adjusting Auto-refresh Interval

Edit `client/src/hooks/useGoldPrice.ts`:

```tsx
// Change 30000 (30 seconds) to your desired interval in milliseconds
const interval = setInterval(fetchData, 30000);
```

## Performance Optimization

- **Lazy Loading**: Components are code-split automatically by Vite
- **Caching**: Historical data is cached to reduce API calls
- **Responsive Images**: Static assets are optimized for different screen sizes
- **CSS Optimization**: Tailwind CSS is purged to include only used styles

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android 90+

## Troubleshooting

### API Key Not Working

1. Verify your API key is correct at https://www.goldapi.io/dashboard
2. Check that your request count hasn't exceeded the monthly limit
3. Ensure the environment variable is properly set

### Chart Not Displaying

1. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. Check browser console for errors (F12)

### Build Errors

1. Delete `node_modules` and `.pnpm-store`:
   ```bash
   rm -rf node_modules .pnpm-store
   pnpm install
   ```

2. Clear Vite cache:
   ```bash
   rm -rf dist .vite
   pnpm build
   ```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the [GoldAPI.io documentation](https://www.goldapi.io/)
2. Review the [Recharts documentation](https://recharts.org/)
3. Check the [Vercel deployment guide](https://vercel.com/docs)

## Roadmap

- [ ] Add more precious metals (Silver, Platinum, Palladium)
- [ ] Historical price comparison
- [ ] Price alerts and notifications
- [ ] User accounts and watchlists
- [ ] Mobile app version
- [ ] Advanced charting with technical indicators
- [ ] Multi-language support

---

**Made with ❤️ for gold enthusiasts and traders**