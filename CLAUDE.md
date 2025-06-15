# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a sports live streaming application with multiple components:

1. **Node.js Web API** (`app.js`) - Express server providing game data and stream parsing
2. **SwiftUI tvOS App** (`Sources/LeeguooTV/`) - Apple TV client for viewing streams
3. **Web Frontend** (`public/`) - Vue.js web interface for desktop/mobile
4. **Data Fetchers** - Puppeteer-based scrapers for game information

### Key Components

- **Game Data Pipeline**: `fetchGamesDataFunction.js` → `app.js` API → Frontend/tvOS
- **Stream Processing**: `decode_url.js` extracts iframe sources from streaming sites
- **Caching Layer**: In-memory cache in `app.js` for game data with timestamp tracking
- **Dual Deployment**: Local Docker + Vercel serverless functions

## Development Commands

### Node.js Server
```bash
npm start                 # Start production server
node app.js              # Direct server start
npm run fetchGamesData   # Manual data fetch
```

### Swift tvOS App
```bash
swift build              # Build tvOS app
swift run               # Run tvOS app
swift test              # Run tests
```

### Docker
```bash
docker build -t leeguoo-app .
docker run -p 3000:3000 leeguoo-app
```

## API Endpoints

- `GET /api/games` - Fetch games data (cached)
- `GET /api/games?type=NBA` - Filter by league type
- `GET /api/parseLiveLinks?url=<url>` - Extract streaming links
- `GET /api/getIframeSrc?url=<url>` - Decode iframe sources
- `POST /api/updateGames` - Update games cache (requires API key)

## Environment Variables

- `API_KEY` - Required for data update endpoints
- `PORT` - Server port (default: 3000)
- `PUPPETEER_EXECUTABLE_PATH` - Chrome path for Docker
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` - Skip Puppeteer Chrome download

## Data Flow

1. **Scraping**: `fetchGamesDataFunction.js` scrapes game data using Puppeteer/Axios
2. **Caching**: Data stored in `cachedData` object with timestamp
3. **API**: Express routes serve cached data to clients
4. **Clients**: tvOS app and web frontend consume API data
5. **Stream Resolution**: URLs decoded through `decode_url.js` for playback

## Deployment Targets

- **Vercel**: Serverless functions (see `vercel.json`)
- **Docker**: Containerized deployment with Chrome dependencies
- **Local**: Direct Node.js execution

The tvOS app connects to `localhost:3000` for development - update URL for production deployment.