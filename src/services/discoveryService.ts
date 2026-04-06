/**
 * Discovery Service
 * 
 * This service handles chain-specific discovery of movies, cinemas, and sessions.
 * Currently provides simulated discovery results. When a Playwright-based collector
 * is connected, it will call real chain APIs/pages.
 * 
 * Architecture:
 * 1. User selects chain + movie title
 * 2. Service creates a discovery_run record
 * 3. Chain-specific discovery logic runs (simulated for now)
 * 4. Results are presented for review
 * 5. User approves → screenings + monitoring targets are created
 */

import { supabase } from '@/integrations/supabase/client';
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

// Simulated discovery data by chain
const SIMULATED_DISCOVERIES: Record<string, (movieTitle: string) => DiscoveredSession[]> = {
  amc: (movieTitle: string) => {
    const cinemas = [
      { name: 'AMC Empire 25', city: 'New York', state: 'NY' },
      { name: 'AMC Lincoln Square 13', city: 'New York', state: 'NY' },
      { name: 'AMC Burbank 16', city: 'Los Angeles', state: 'CA' },
      { name: 'AMC Metreon 16', city: 'San Francisco', state: 'CA' },
      { name: 'AMC Aventura 24', city: 'Miami', state: 'FL' },
      { name: 'AMC River East 21', city: 'Chicago', state: 'IL' },
    ];
    const competitors = ['Thunderstrike', 'The Last Frontier', 'Neon Shadows', 'Crimson Tide II'];
    const formats = ['IMAX', 'Standard', 'Dolby Atmos', '3D'];
    const times = ['10:30', '13:00', '15:30', '18:00', '20:30', '22:45'];
    const today = new Date();
    const results: DiscoveredSession[] = [];
    let idx = 0;

    for (const cinema of cinemas) {
      // Primary movie sessions
      for (let d = 0; d < 5; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];
        for (let t = 0; t < 2 + Math.floor(Math.random() * 3); t++) {
          results.push({
            id: `disc-${idx++}`,
            cinemaName: cinema.name,
            city: cinema.city,
            state: cinema.state,
            country: 'US',
            movieTitle: movieTitle,
            isPrimaryTitle: true,
            screeningDate: dateStr,
            screeningTime: times[t % times.length],
            format: formats[t % formats.length],
            bookingUrl: `https://www.amctheatres.com/showtimes/${dateStr}/${cinema.name.toLowerCase().replace(/\s+/g, '-')}`,
            matchType: 'exact',
            discoveryConfidence: 90 + Math.floor(Math.random() * 10),
            approved: false,
          });
        }
        // Competitor movies in same cinema/date
        for (const comp of competitors.slice(0, 2 + Math.floor(Math.random() * 2))) {
          results.push({
            id: `disc-${idx++}`,
            cinemaName: cinema.name,
            city: cinema.city,
            state: cinema.state,
            country: 'US',
            movieTitle: comp,
            isPrimaryTitle: false,
            screeningDate: dateStr,
            screeningTime: times[(idx + 2) % times.length],
            format: formats[(idx + 1) % formats.length],
            bookingUrl: `https://www.amctheatres.com/showtimes/${dateStr}/${cinema.name.toLowerCase().replace(/\s+/g, '-')}`,
            matchType: 'competitor',
            discoveryConfidence: 80 + Math.floor(Math.random() * 15),
            approved: false,
          });
        }
      }
    }
    return results;
  },
  regal: (movieTitle: string) => {
    const cinemas = [
      { name: 'Regal LA Live', city: 'Los Angeles', state: 'CA' },
      { name: 'Regal Union Square', city: 'New York', state: 'NY' },
      { name: 'Regal Sawgrass', city: 'Miami', state: 'FL' },
      { name: 'Regal Crossgates', city: 'Albany', state: 'NY' },
    ];
    const competitors = ['Thunderstrike', 'The Last Frontier', 'Neon Shadows'];
    const formats = ['IMAX', 'Standard', 'RPX', '4DX'];
    const times = ['11:00', '14:00', '17:00', '19:30', '22:00'];
    const today = new Date();
    const results: DiscoveredSession[] = [];
    let idx = 0;

    for (const cinema of cinemas) {
      for (let d = 0; d < 5; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        const dateStr = date.toISOString().split('T')[0];
        for (let t = 0; t < 2 + Math.floor(Math.random() * 2); t++) {
          results.push({
            id: `disc-${idx++}`,
            cinemaName: cinema.name,
            city: cinema.city,
            state: cinema.state,
            country: 'US',
            movieTitle: movieTitle,
            isPrimaryTitle: true,
            screeningDate: dateStr,
            screeningTime: times[t % times.length],
            format: formats[t % formats.length],
            bookingUrl: `https://www.regmovies.com/theatres/${cinema.name.toLowerCase().replace(/\s+/g, '-')}/showtimes`,
            matchType: 'exact',
            discoveryConfidence: 85 + Math.floor(Math.random() * 15),
            approved: false,
          });
        }
        for (const comp of competitors.slice(0, 1 + Math.floor(Math.random() * 2))) {
          results.push({
            id: `disc-${idx++}`,
            cinemaName: cinema.name,
            city: cinema.city,
            state: cinema.state,
            country: 'US',
            movieTitle: comp,
            isPrimaryTitle: false,
            screeningDate: dateStr,
            screeningTime: times[(idx + 1) % times.length],
            format: formats[(idx) % formats.length],
            bookingUrl: `https://www.regmovies.com/theatres/${cinema.name.toLowerCase().replace(/\s+/g, '-')}/showtimes`,
            matchType: 'competitor',
            discoveryConfidence: 78 + Math.floor(Math.random() * 18),
            approved: false,
          });
        }
      }
    }
    return results;
  },
};

export async function runDiscovery(chainSlug: string, movieTitle: string): Promise<DiscoveredSession[]> {
  const config = getChainConfig(chainSlug);
  if (!config || !config.parserEnabled) {
    throw new Error(`Chain ${chainSlug} is not enabled for discovery`);
  }

  const discoveryFn = SIMULATED_DISCOVERIES[chainSlug.toLowerCase()];
  if (!discoveryFn) {
    throw new Error(`No discovery implementation for chain: ${chainSlug}`);
  }

  // Simulate async discovery
  await new Promise(resolve => setTimeout(resolve, 1500));
  return discoveryFn(movieTitle);
}
