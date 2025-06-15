# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A modern sports live streaming aggregation platform that provides multi-source streams for various sports events (NBA, CBA, Premier League, La Liga, etc.). The platform features intelligent stream recommendation, multiple quality options (4K, 1080P), and cross-platform support (Web, Mobile, Apple TV).

## Project Architecture

### Core Components

1. **Backend API Server** (`app.js`)
   - Express.js server with intelligent caching system
   - Stream parsing and proxy services
   - RESTful API endpoints for game data and stream resolution
   - KV storage integration for distributed caching

2. **Data Collection Layer**
   - `fetchGamesDataFunction.js` - Main scraper using Puppeteer/Axios
   - `fetchGamesDataFunction-nba.js` - NBA-specific scraper variant
   - `fetchGamesDataFunction-server.js` - Server deployment version
   - Scrapers fetch real-time game data from multiple sports streaming sites

3. **Stream Processing**
   - `decode_url.js` - Extracts actual streaming URLs from iframe sources
   - `m3u8-proxy.js` - HLS stream proxy to bypass CORS restrictions
   - `streamQueue.js` - Manages concurrent stream parsing operations

4. **Frontend Application** (`src/`)
   - Vue 3 SPA with Composition API
   - Multiple UI modes: `HomePro.vue` (advanced), `Home.vue` (simple)
   - Video players: `Player.vue` (HLS.js), `IframePlayer.vue` (embedded)
   - Pinia stores for state management (`stores/`)
   - Responsive design with Tailwind CSS + DaisyUI

5. **tvOS Application** (`Sources/LeeguooTV/`)
   - Native SwiftUI app for Apple TV
   - Consumes the same backend API
   - Alamofire for networking, SwiftyJSON for parsing

6. **Serverless Functions** (`api/`)
   - Vercel deployment endpoints
   - Cache management and manual refresh capabilities
   - Webhook handlers for automated updates

## Development Commands

### Frontend Development
```bash
pnpm dev          # Start Vite dev server with HMR
npm run dev       # Alternative using npm
```

### Backend Development
```bash
npm start         # Start Express server
node app.js       # Direct server execution
```

### Build & Production
```bash
pnpm build        # Build frontend for production
npm run build     # Alternative using npm
```

### Data Operations
```bash
npm run fetchGamesData    # Manual data fetch
```

### Swift tvOS Development
```bash
swift build       # Build tvOS app
swift run         # Run tvOS app locally
swift test        # Run test suite
```

### Docker Deployment
```bash
docker build -t leeguoo-app .
docker run -p 3000:3000 -e API_KEY=your_key leeguoo-app
```

### Combined Development
```bash
./start-dev.sh    # Starts both frontend and backend
```

## API Endpoints

### Public Endpoints
- `GET /api/games` - Fetch all games (cached, 5-minute TTL)
- `GET /api/games?type=NBA` - Filter by league type
- `GET /api/parseLiveLinks?url=<url>` - Extract streaming links from page
- `GET /api/getIframeSrc?url=<url>` - Decode iframe sources
- `GET /api/getStreamUrl?url=<url>` - Get final stream URL
- `GET /proxy/m3u8?url=<url>` - Proxy HLS streams
- `GET /proxy/iframe?url=<url>` - Proxy iframe content

### Protected Endpoints (requires API_KEY)
- `POST /api/updateGames` - Force cache refresh
- `GET /api/cache-status` - View cache statistics
- `POST /api/webhook/update` - Webhook for automated updates

## Environment Variables

```bash
API_KEY                           # Required for protected endpoints
PORT                             # Server port (default: 3000)
PUPPETEER_EXECUTABLE_PATH        # Chrome path for Docker
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD # Skip Puppeteer Chrome download
NODE_ENV                         # Environment (development/production)
```

## Data Flow Architecture

1. **Data Collection**: Scrapers fetch game data → Parsed and normalized
2. **Caching**: Data stored with timestamps → 5-minute TTL → Auto-refresh
3. **API Layer**: Express routes serve cached data → JSON responses
4. **Stream Resolution**: URL parsing → iframe extraction → HLS proxy if needed
5. **Frontend**: Reactive UI updates → Stream selection → Video playback

## Key Technical Decisions

- **Caching Strategy**: In-memory cache with KV storage fallback for scalability
- **Stream Parsing**: Queue-based system to handle concurrent requests
- **CORS Handling**: Proxy services for cross-origin stream access
- **Frontend Architecture**: Vue 3 Composition API for reactive state management
- **Deployment**: Supports both serverless (Vercel) and containerized (Docker) deployments

## Testing Approach

The project uses integration testing through the actual application flow. When testing:
1. Check `package.json` for available test commands
2. Ensure backend server is running for API tests
3. Use browser DevTools for frontend debugging

## Deployment Configurations

### Vercel (Serverless)
- Configuration in `vercel.json`
- 30-second function timeout
- Automatic edge caching

### Docker (Container)
- Multi-stage build for optimization
- Alpine Linux with Chromium for Puppeteer
- Health check endpoint at `/`

### Local Development
- Frontend: `http://localhost:5173` (Vite)
- Backend: `http://localhost:3000` (Express)
- tvOS: Update `ContentView.swift` baseURL for production