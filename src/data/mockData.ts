import { Cinema, Movie, Screening, MonitoringTarget, ScrapeRun, OccupancyResult, ParserLog, ContentEvent } from '@/types';

const uid = (prefix: string, i: number) => `${prefix}-${String(i).padStart(3, '0')}`;

export const cinemas: Cinema[] = [
  { id: uid('cin', 1), name: 'AMC Empire 25', chain: 'AMC', city: 'New York', state: 'NY', country: 'US', created_at: '2025-03-01' },
  { id: uid('cin', 2), name: 'AMC Lincoln Square 13', chain: 'AMC', city: 'New York', state: 'NY', country: 'US', created_at: '2025-03-01' },
  { id: uid('cin', 3), name: 'Regal LA Live', chain: 'Regal', city: 'Los Angeles', state: 'CA', country: 'US', created_at: '2025-03-01' },
  { id: uid('cin', 4), name: 'AMC Burbank 16', chain: 'AMC', city: 'Los Angeles', state: 'CA', country: 'US', created_at: '2025-03-01' },
  { id: uid('cin', 5), name: 'Regal Union Square', chain: 'Regal', city: 'New York', state: 'NY', country: 'US', created_at: '2025-03-01' },
  { id: uid('cin', 6), name: 'AMC Metreon 16', chain: 'AMC', city: 'San Francisco', state: 'CA', country: 'US', created_at: '2025-03-01' },
  { id: uid('cin', 7), name: 'Regal Sawgrass', chain: 'Regal', city: 'Miami', state: 'FL', country: 'US', created_at: '2025-03-01' },
  { id: uid('cin', 8), name: 'AMC Aventura 24', chain: 'AMC', city: 'Miami', state: 'FL', country: 'US', created_at: '2025-03-01' },
];

export const movies: Movie[] = [
  { id: uid('mov', 1), title: '2DIE4', is_primary_title: true, created_at: '2025-03-01' },
  { id: uid('mov', 2), title: 'Thunderstrike', is_primary_title: false, created_at: '2025-03-01' },
  { id: uid('mov', 3), title: 'The Last Frontier', is_primary_title: false, created_at: '2025-03-01' },
  { id: uid('mov', 4), title: 'Neon Shadows', is_primary_title: false, created_at: '2025-03-01' },
  { id: uid('mov', 5), title: 'Crimson Tide II', is_primary_title: false, created_at: '2025-03-01' },
];

const formats = ['IMAX', 'Standard', 'Standard', 'Dolby Atmos', '3D'];
const audTypes = ['IMAX Laser', 'Standard', 'Standard', 'Dolby Cinema', 'RealD 3D'];

function generateScreenings(): Screening[] {
  const result: Screening[] = [];
  let idx = 0;
  const dates = ['2025-04-01', '2025-04-02', '2025-04-03', '2025-04-04', '2025-04-05'];
  const times = ['14:00', '17:00', '20:00', '22:30'];

  for (const cinema of cinemas) {
    for (const movie of movies) {
      for (let d = 0; d < dates.length; d++) {
        const fmtIdx = idx % formats.length;
        const timeIdx = idx % times.length;
        result.push({
          id: uid('scr', idx),
          movie_id: movie.id,
          cinema_id: cinema.id,
          session_date: dates[d],
          session_time: times[timeIdx],
          format: formats[fmtIdx],
          auditorium_type: audTypes[fmtIdx],
          notes: '',
          created_at: '2025-03-15',
        });
        idx++;
      }
    }
  }
  return result;
}

export const screenings = generateScreenings();

function generateMonitoringTargets(): MonitoringTarget[] {
  return screenings.map((s, i) => ({
    id: uid('mt', i),
    screening_id: s.id,
    target_url: `https://cinema-tickets.example.com/session/${s.id}`,
    frequency_minutes: 60,
    is_active: Math.random() > 0.1,
    last_run_at: '2025-04-05T' + String(8 + (i % 14)).padStart(2, '0') + ':00:00Z',
    created_at: '2025-03-15',
  }));
}

export const monitoringTargets = generateMonitoringTargets();

function generateScrapeRuns(): ScrapeRun[] {
  const runs: ScrapeRun[] = [];
  let idx = 0;
  for (const mt of monitoringTargets.slice(0, 80)) {
    const numRuns = 12 + Math.floor(Math.random() * 36);
    for (let r = 0; r < numRuns; r++) {
      const hour = r;
      const failed = Math.random() < 0.05;
      runs.push({
        id: uid('run', idx),
        monitoring_target_id: mt.id,
        run_timestamp: `2025-04-${String(3 + Math.floor(hour / 24)).padStart(2, '0')}T${String(hour % 24).padStart(2, '0')}:00:00Z`,
        status: failed ? 'failed' : Math.random() < 0.1 ? 'partial' : 'success',
        parser_method: 'seat_map_v2',
        raw_html_reference: null,
        raw_payload_json: null,
        created_at: `2025-04-${String(3 + Math.floor(hour / 24)).padStart(2, '0')}`,
      });
      idx++;
    }
  }
  return runs;
}

export const scrapeRuns = generateScrapeRuns();

function generateOccupancyResults(): OccupancyResult[] {
  const results: OccupancyResult[] = [];
  let idx = 0;
  for (const run of scrapeRuns) {
    if (run.status === 'failed') continue;
    const mt = monitoringTargets.find(m => m.id === run.monitoring_target_id)!;
    const scr = screenings.find(s => s.id === mt.screening_id)!;
    const movie = movies.find(m => m.id === scr.movie_id)!;
    const totalSeats = scr.format === 'IMAX' ? 350 : 200;
    const baseOccupancy = movie.is_primary_title ? 0.55 : 0.35 + Math.random() * 0.2;
    const hourNum = parseInt(run.run_timestamp.split('T')[1].split(':')[0]);
    const timeFactor = 1 + (hourNum / 24) * 0.4;
    const occupied = Math.min(totalSeats, Math.floor(totalSeats * baseOccupancy * timeFactor * (0.85 + Math.random() * 0.3)));
    const isPartial = run.status === 'partial';
    const confidence = isPartial ? 50 + Math.floor(Math.random() * 25) : 80 + Math.floor(Math.random() * 20);
    const reasons = [
      'Seat map fully loaded and parsed',
      'Partial page load',
      'Fallback extraction used',
      'Inconsistent total seat count vs previous runs',
      'Parser warning detected',
    ];
    results.push({
      id: uid('occ', idx),
      scrape_run_id: run.id,
      occupied_seats_estimated: occupied,
      available_seats_estimated: totalSeats - occupied,
      total_seats_estimated: totalSeats,
      confidence_score: confidence,
      confidence_reason: isPartial ? reasons[1 + Math.floor(Math.random() * 3)] : reasons[0],
      extraction_type: 'seat_map',
      anomaly_flag: Math.random() < 0.03,
      created_at: run.run_timestamp,
    });
    idx++;
  }
  return results;
}

export const occupancyResults = generateOccupancyResults();

export const contentEvents: ContentEvent[] = [
  { id: uid('evt', 1), event_date: '2025-04-02', event_type: 'trailer', title: '2DIE4 Final Trailer Drop', description: 'Official final trailer released on YouTube', movie_id: uid('mov', 1), created_at: '2025-04-02' },
  { id: uid('evt', 2), event_date: '2025-04-04', event_type: 'press', title: '2DIE4 Premiere Coverage', description: 'Red carpet premiere in NYC', movie_id: uid('mov', 1), created_at: '2025-04-04' },
  { id: uid('evt', 3), event_date: '2025-04-03', event_type: 'social', title: '2DIE4 TikTok Trend', description: 'Viral challenge with 50M views', movie_id: uid('mov', 1), created_at: '2025-04-03' },
];

export const parserLogs: ParserLog[] = scrapeRuns.filter(r => r.status !== 'success').slice(0, 20).map((r, i) => ({
  id: uid('log', i),
  scrape_run_id: r.id,
  log_level: r.status === 'failed' ? 'error' as const : 'warning' as const,
  message: r.status === 'failed' ? 'Failed to load page' : 'Partial data extracted',
  error_message: r.status === 'failed' ? 'TimeoutError: Page load exceeded 30s' : null,
  created_at: r.run_timestamp,
}));

// Helper lookups
export function getScreeningDetails(screeningId: string) {
  const screening = screenings.find(s => s.id === screeningId);
  if (!screening) return null;
  const movie = movies.find(m => m.id === screening.movie_id);
  const cinema = cinemas.find(c => c.id === screening.cinema_id);
  return { screening, movie, cinema };
}

export function getTargetDetails(targetId: string) {
  const target = monitoringTargets.find(t => t.id === targetId);
  if (!target) return null;
  return { target, ...getScreeningDetails(target.screening_id) };
}

// Computed metrics
export function computeKPIs() {
  const totalCinemas = cinemas.length;
  const totalSessions = screenings.length;
  const totalSnapshots = occupancyResults.length;
  const totalEstimatedTickets = occupancyResults.reduce((sum, o) => sum + o.occupied_seats_estimated, 0);
  
  const movieOccupancy: Record<string, { total: number; seats: number; count: number }> = {};
  for (const occ of occupancyResults) {
    const run = scrapeRuns.find(r => r.id === occ.scrape_run_id);
    if (!run) continue;
    const target = monitoringTargets.find(t => t.id === run.monitoring_target_id);
    if (!target) continue;
    const details = getScreeningDetails(target.screening_id);
    if (!details?.movie) continue;
    const title = details.movie.title;
    if (!movieOccupancy[title]) movieOccupancy[title] = { total: 0, seats: 0, count: 0 };
    movieOccupancy[title].total += occ.total_seats_estimated;
    movieOccupancy[title].seats += occ.occupied_seats_estimated;
    movieOccupancy[title].count++;
  }

  const avgOccByMovie = Object.entries(movieOccupancy).map(([title, data]) => ({
    title,
    avgOccupancy: data.total > 0 ? Math.round((data.seats / data.total) * 100) : 0,
    totalEstimated: data.seats,
    snapshots: data.count,
  }));

  const lowConfidence = occupancyResults.filter(o => o.confidence_score < 70).length;
  const die4Leading = (() => {
    let count = 0;
    const cinemaGroups: Record<string, { die4: number; other: number }> = {};
    for (const occ of occupancyResults) {
      const run = scrapeRuns.find(r => r.id === occ.scrape_run_id);
      if (!run) continue;
      const target = monitoringTargets.find(t => t.id === run.monitoring_target_id);
      if (!target) continue;
      const details = getScreeningDetails(target.screening_id);
      if (!details) continue;
      const key = details.cinema!.id;
      if (!cinemaGroups[key]) cinemaGroups[key] = { die4: 0, other: 0 };
      if (details.movie!.is_primary_title) cinemaGroups[key].die4 += occ.occupied_seats_estimated;
      else cinemaGroups[key].other += occ.occupied_seats_estimated;
    }
    for (const g of Object.values(cinemaGroups)) {
      if (g.die4 > g.other) count++;
    }
    return count;
  })();

  return { totalCinemas, totalSessions, totalSnapshots, totalEstimatedTickets, avgOccByMovie, lowConfidence, die4Leading, growthLast24h: 12.4 };
}

export function getOccupancyTrend(movieTitle?: string) {
  const points: { time: string; occupied: number; movie: string }[] = [];
  for (const occ of occupancyResults) {
    const run = scrapeRuns.find(r => r.id === occ.scrape_run_id);
    if (!run) continue;
    const target = monitoringTargets.find(t => t.id === run.monitoring_target_id);
    if (!target) continue;
    const details = getScreeningDetails(target.screening_id);
    if (!details?.movie) continue;
    if (movieTitle && details.movie.title !== movieTitle) continue;
    points.push({ time: run.run_timestamp, occupied: occ.occupied_seats_estimated, movie: details.movie.title });
  }
  return points.sort((a, b) => a.time.localeCompare(b.time));
}
