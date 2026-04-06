/**
 * Discovery Service
 * 
 * This service handles chain-specific discovery of movies, cinemas, and sessions.
 * Discovery is designed to be powered by an external Playwright-based collector
 * that sends results to the scrape-ingest edge function.
 * 
 * Currently, no simulated/mock data is generated. When a real collector is connected,
 * it will call chain APIs/pages and push discovered sessions into the database.
 * 
 * Architecture:
 * 1. User selects chain + movie title
 * 2. Service creates a discovery_run record
 * 3. Chain-specific discovery logic runs via external collector
 * 4. Results are stored in the database
 * 5. User reviews discovered screenings and approves them
 * 6. Approved screenings become monitoring targets
 */

import { getChainConfig } from './chainRegistry';

export interface DiscoveredSession {
  id: string;
  cinemaName: string;
  city: string;
  state: string;
  country: string;
  movieTitle: string;
  isPrimaryTitle: boolean;
  screeningDate: string;
  screeningTime: string;
  format: string;
  bookingUrl: string;
  matchType: 'exact' | 'competitor' | 'related';
  discoveryConfidence: number;
  approved: boolean;
}

export async function runDiscovery(chainSlug: string, _movieTitle: string): Promise<DiscoveredSession[]> {
  const config = getChainConfig(chainSlug);
  if (!config) {
    throw new Error(`Chain "${chainSlug}" is not registered in the chain registry.`);
  }
  if (!config.parserEnabled) {
    throw new Error(`Discovery is not yet enabled for ${config.chainName}. Connect a Playwright-based collector to enable real discovery for this chain.`);
  }

  // Real discovery requires an external collector.
  // This function will be called by the collector via the scrape-ingest edge function.
  // For now, return an empty array — no simulated data.
  throw new Error(
    `Real-time discovery for ${config.chainName} requires an external Playwright collector. ` +
    `Configure the collector to target ${config.baseUrl} and send results to the scrape-ingest endpoint.`
  );
}
