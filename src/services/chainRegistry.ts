export interface ChainParserConfig {
  chainName: string;
  slug: string;
  baseUrl: string;
  discoveryStrategy: string;
  movieSearchUrl?: string;
  cinemaListUrl?: string;
  sessionPagePattern?: string;
  seatMapSelector?: string;
  knownRisks: string[];
  parserEnabled: boolean;
  notes: string;
}

export const CHAIN_CONFIGS: Record<string, ChainParserConfig> = {
  amc: {
    chainName: 'AMC',
    slug: 'amc',
    baseUrl: 'https://www.amctheatres.com',
    discoveryStrategy: 'movie_search',
    movieSearchUrl: 'https://www.amctheatres.com/movies/{movie_slug}',
    cinemaListUrl: 'https://www.amctheatres.com/movie-theatres',
    sessionPagePattern: 'https://www.amctheatres.com/showtimes/all/{date}/{cinema_slug}/all',
    seatMapSelector: '.SeatMapContainer, .seat-map, [data-testid="seat-map"]',
    knownRisks: [
      'JavaScript-rendered seat maps',
      'Rate limiting on API calls',
      'Session tokens required for booking pages',
      'Dynamic pricing may affect seat availability signals',
    ],
    parserEnabled: true,
    notes: 'AMC uses a React SPA. Playwright required for seat map rendering. API endpoints available for showtime listing.',
  },
  regal: {
    chainName: 'Regal',
    slug: 'regal',
    baseUrl: 'https://www.regmovies.com',
    discoveryStrategy: 'movie_search',
    movieSearchUrl: 'https://www.regmovies.com/movies/{movie_slug}',
    cinemaListUrl: 'https://www.regmovies.com/theatres',
    sessionPagePattern: 'https://www.regmovies.com/theatres/{cinema_slug}/showtimes',
    seatMapSelector: '.seat-layout, .SeatPicker, [data-seat]',
    knownRisks: [
      'Cloudflare protection may block automated access',
      'Seat maps load via separate API call',
      'Different layout for IMAX vs standard',
    ],
    parserEnabled: true,
    notes: 'Regal uses server-side rendering with client hydration. Seat map API can be called directly with proper headers.',
  },
  cinemark: {
    chainName: 'Cinemark',
    slug: 'cinemark',
    baseUrl: 'https://www.cinemark.com',
    discoveryStrategy: 'movie_search',
    movieSearchUrl: 'https://www.cinemark.com/movies/{movie_slug}',
    cinemaListUrl: 'https://www.cinemark.com/theatres',
    sessionPagePattern: 'https://www.cinemark.com/theatres/{cinema_slug}',
    seatMapSelector: '.seat-map-container, [data-seat-id]',
    knownRisks: [
      'Bot detection via Akamai',
      'Seat availability requires authentication context',
    ],
    parserEnabled: false,
    notes: 'Not yet implemented. Requires investigation of their API structure.',
  },
};

export function getChainConfig(slug: string): ChainParserConfig | null {
  return CHAIN_CONFIGS[slug.toLowerCase()] || null;
}

export function getAvailableChains(): ChainParserConfig[] {
  return Object.values(CHAIN_CONFIGS);
}

export function getEnabledChains(): ChainParserConfig[] {
  return Object.values(CHAIN_CONFIGS).filter(c => c.parserEnabled);
}
