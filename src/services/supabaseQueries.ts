import { supabase } from '@/integrations/supabase/client';

// ============ Cinema Chains ============
export async function fetchChains() {
  const { data, error } = await supabase.from('cinema_chains').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function upsertChain(chain: { name: string; slug: string; base_url?: string; parser_key?: string; discovery_strategy?: string; notes?: string }) {
  const { data, error } = await supabase.from('cinema_chains').upsert(chain, { onConflict: 'slug' }).select().single();
  if (error) throw error;
  return data;
}

// ============ Cinemas ============
export async function fetchCinemas(chainId?: string) {
  let q = supabase.from('cinemas').select('*, cinema_chains(name, slug)').order('name');
  if (chainId) q = q.eq('chain_id', chainId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function fetchCinemaById(id: string) {
  const { data, error } = await supabase.from('cinemas').select('*, cinema_chains(name, slug)').eq('id', id).single();
  if (error) throw error;
  return data;
}

// ============ Movies ============
export async function fetchMovies() {
  const { data, error } = await supabase.from('movies').select('*').order('title');
  if (error) throw error;
  return data;
}

// ============ Screenings ============
export async function fetchScreenings(filters?: { cinema_id?: string; movie_id?: string; date?: string }) {
  let q = supabase.from('screenings').select('*, movies(title, is_primary_title, normalized_title), cinemas(name, city, state, chain_id, cinema_chains(name))').order('screening_date', { ascending: false });
  if (filters?.cinema_id) q = q.eq('cinema_id', filters.cinema_id);
  if (filters?.movie_id) q = q.eq('movie_id', filters.movie_id);
  if (filters?.date) q = q.eq('screening_date', filters.date);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function fetchScreeningById(id: string) {
  const { data, error } = await supabase.from('screenings').select('*, movies(title, is_primary_title, normalized_title), cinemas(name, city, state, chain_id, cinema_chains(name, slug))').eq('id', id).single();
  if (error) throw error;
  return data;
}

// ============ Monitoring Targets ============
export async function fetchMonitoringTargets(filters?: { activeOnly?: boolean; search?: string }) {
  let q = supabase.from('monitoring_targets').select(`
    *,
    screenings(
      id, screening_date, screening_time, format, booking_url, source_url,
      movies(id, title, is_primary_title),
      cinemas(id, name, city, state, chain_id, cinema_chains(name))
    )
  `).order('created_at', { ascending: false });
  if (filters?.activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createMonitoringTarget(target: {
  screening_id: string;
  target_url?: string;
  monitoring_frequency_minutes?: number;
  is_active?: boolean;
}) {
  const { data, error } = await supabase.from('monitoring_targets').insert(target).select().single();
  if (error) throw error;
  return data;
}

export async function updateMonitoringTarget(id: string, updates: { is_active?: boolean; monitoring_frequency_minutes?: number; target_url?: string }) {
  const { data, error } = await supabase.from('monitoring_targets').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMonitoringTarget(id: string) {
  const { error } = await supabase.from('monitoring_targets').delete().eq('id', id);
  if (error) throw error;
}

// ============ Scrape Runs & Occupancy ============
export async function fetchScrapeRunsForTarget(targetId: string) {
  const { data, error } = await supabase.from('scrape_runs').select('*, occupancy_results(*), parser_logs(*)').eq('monitoring_target_id', targetId).order('run_timestamp', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchRecentScrapeRuns(limit = 20) {
  const { data, error } = await supabase.from('scrape_runs').select(`
    *,
    occupancy_results(*),
    monitoring_targets(
      screening_id,
      screenings(
        movies(title),
        cinemas(name, city)
      )
    )
  `).order('run_timestamp', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export async function fetchLatestOccupancyForTarget(targetId: string) {
  const { data, error } = await supabase.from('scrape_runs')
    .select('*, occupancy_results(*)')
    .eq('monitoring_target_id', targetId)
    .eq('status', 'success')
    .order('run_timestamp', { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

// ============ Dashboard KPIs ============
export async function fetchDashboardKPIs() {
  const [chainsRes, cinemasRes, screeningsRes, runsRes, occupancyRes] = await Promise.all([
    supabase.from('cinema_chains').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('cinemas').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('screenings').select('id', { count: 'exact', head: true }),
    supabase.from('scrape_runs').select('id', { count: 'exact', head: true }),
    supabase.from('occupancy_results').select('occupied_seats_estimated, confidence_score'),
  ]);

  const totalChains = chainsRes.count || 0;
  const totalCinemas = cinemasRes.count || 0;
  const totalSessions = screeningsRes.count || 0;
  const totalRuns = runsRes.count || 0;
  const occupancyData = occupancyRes.data || [];
  const totalEstimatedTickets = occupancyData.reduce((s, o) => s + (o.occupied_seats_estimated || 0), 0);
  const lowConfidence = occupancyData.filter(o => (o.confidence_score || 0) < 70).length;
  const totalSnapshots = occupancyData.length;

  return { totalChains, totalCinemas, totalSessions, totalRuns, totalEstimatedTickets, totalSnapshots, lowConfidence };
}

export async function fetchOccupancyTrend() {
  const { data, error } = await supabase.from('scrape_runs')
    .select(`
      run_timestamp, status,
      occupancy_results(occupied_seats_estimated, total_seats_estimated),
      monitoring_targets(
        screenings(
          movies(title, is_primary_title),
          cinemas(name)
        )
      )
    `)
    .eq('status', 'success')
    .order('run_timestamp', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchTopCinemasBySales() {
  const { data, error } = await supabase.from('scrape_runs')
    .select(`
      occupancy_results(occupied_seats_estimated),
      monitoring_targets(
        screenings(
          cinemas(id, name)
        )
      )
    `)
    .eq('status', 'success');
  if (error) throw error;

  const cinemaSeats: Record<string, { name: string; seats: number }> = {};
  for (const run of data || []) {
    const cinemaName = (run as any).monitoring_targets?.screenings?.cinemas?.name;
    const cinemaId = (run as any).monitoring_targets?.screenings?.cinemas?.id;
    const occupied = (run as any).occupancy_results?.[0]?.occupied_seats_estimated || 0;
    if (cinemaName && cinemaId) {
      if (!cinemaSeats[cinemaId]) cinemaSeats[cinemaId] = { name: cinemaName, seats: 0 };
      cinemaSeats[cinemaId].seats += occupied;
    }
  }
  return Object.values(cinemaSeats).sort((a, b) => b.seats - a.seats).slice(0, 8);
}

export async function fetchMovieComparison() {
  const { data, error } = await supabase.from('scrape_runs')
    .select(`
      occupancy_results(occupied_seats_estimated, total_seats_estimated, confidence_score),
      monitoring_targets(
        screenings(
          format,
          movies(id, title, is_primary_title),
          cinemas(id, name, city)
        )
      )
    `)
    .eq('status', 'success');
  if (error) throw error;
  return data;
}

// ============ Discovery Runs ============
export async function fetchDiscoveryRuns(chainId?: string) {
  let q = supabase.from('discovery_runs').select('*, cinema_chains(name)').order('run_timestamp', { ascending: false });
  if (chainId) q = q.eq('chain_id', chainId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function createDiscoveryRun(run: {
  chain_id: string;
  query_movie_title: string;
  status?: string;
  cinemas_found?: number;
  screenings_found?: number;
  notes?: string;
  raw_payload_json?: any;
}) {
  const { data, error } = await supabase.from('discovery_runs').insert(run).select().single();
  if (error) throw error;
  return data;
}

export async function updateDiscoveryRun(id: string, updates: Partial<{ status: string; cinemas_found: number; screenings_found: number; notes: string }>) {
  const { data, error } = await supabase.from('discovery_runs').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// ============ Bulk Creation (Discovery → Targets) ============
export async function bulkCreateFromDiscovery(items: Array<{
  chain_id: string;
  cinema: { name: string; city: string; state: string; country: string; external_cinema_id?: string };
  movie: { title: string; is_primary_title: boolean };
  screening: { screening_date: string; screening_time: string; format: string; booking_url?: string; source_url?: string };
  monitor: boolean;
}>) {
  const results = [];
  for (const item of items) {
    // Upsert cinema
    let { data: existingCinema } = await supabase.from('cinemas')
      .select('id').eq('name', item.cinema.name).eq('chain_id', item.chain_id).maybeSingle();
    let cinemaId: string;
    if (existingCinema) {
      cinemaId = existingCinema.id;
    } else {
      const { data: newCinema, error } = await supabase.from('cinemas').insert({
        chain_id: item.chain_id,
        name: item.cinema.name,
        city: item.cinema.city,
        state: item.cinema.state,
        country: item.cinema.country,
        external_cinema_id: item.cinema.external_cinema_id,
      }).select('id').single();
      if (error) throw error;
      cinemaId = newCinema.id;
    }

    // Upsert movie
    const normalizedTitle = item.movie.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    let { data: existingMovie } = await supabase.from('movies')
      .select('id').eq('normalized_title', normalizedTitle).maybeSingle();
    let movieId: string;
    if (existingMovie) {
      movieId = existingMovie.id;
    } else {
      const { data: newMovie, error } = await supabase.from('movies').insert({
        title: item.movie.title,
        normalized_title: normalizedTitle,
        is_primary_title: item.movie.is_primary_title,
      }).select('id').single();
      if (error) throw error;
      movieId = newMovie.id;
    }

    // Create screening
    const { data: screening, error: scrErr } = await supabase.from('screenings').insert({
      cinema_id: cinemaId,
      movie_id: movieId,
      screening_date: item.screening.screening_date,
      screening_time: item.screening.screening_time,
      format: item.screening.format,
      booking_url: item.screening.booking_url,
      source_url: item.screening.source_url,
    }).select('id').single();
    if (scrErr) throw scrErr;

    // Create monitoring target if requested
    if (item.monitor) {
      await createMonitoringTarget({
        screening_id: screening.id,
        target_url: item.screening.booking_url || item.screening.source_url,
        is_active: true,
      });
    }

    results.push({ cinemaId, movieId, screeningId: screening.id });
  }
  return results;
}

// ============ Tool Settings ============
export async function fetchToolSettings() {
  const { data, error } = await supabase.from('tool_settings').select('*').limit(1).single();
  if (error) return null;
  return data;
}

export async function updateToolSettings(updates: {
  primary_movie_title?: string;
  default_monitoring_interval_minutes?: number;
  high_confidence_threshold?: number;
  medium_confidence_threshold?: number;
  default_chain_id?: string | null;
}) {
  const settings = await fetchToolSettings();
  if (!settings) return null;
  const { data, error } = await supabase.from('tool_settings').update(updates).eq('id', settings.id).select().single();
  if (error) throw error;
  return data;
}

// ============ Comparison Snapshots ============
export async function fetchComparisonSnapshots(filters?: { cinema_id?: string; date?: string }) {
  let q = supabase.from('comparison_snapshots').select(`
    *,
    cinemas(name, city),
    primary_movie:movies!comparison_snapshots_primary_movie_id_fkey(title),
    competitor_movie:movies!comparison_snapshots_competitor_movie_id_fkey(title)
  `).order('screening_date', { ascending: false });
  if (filters?.cinema_id) q = q.eq('cinema_id', filters.cinema_id);
  if (filters?.date) q = q.eq('screening_date', filters.date);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// ============ Die4 Leadership ============
export async function fetchDie4LeadershipCount() {
  const { data } = await supabase.from('comparison_snapshots').select('primary_occupied_estimated, competitor_occupied_estimated');
  if (!data) return 0;
  return data.filter(d => (d.primary_occupied_estimated || 0) > (d.competitor_occupied_estimated || 0)).length;
}
