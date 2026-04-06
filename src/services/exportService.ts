import { supabase } from '@/integrations/supabase/client';

export interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  chainId?: string;
  cinemaId?: string;
  movieId?: string;
  imaxOnly?: boolean;
  highConfidenceOnly?: boolean;
  dataType: 'snapshots' | 'sessions' | 'comparison';
}

async function fetchExportData(filters: ExportFilters) {
  if (filters.dataType === 'comparison') {
    let q = supabase.from('comparison_snapshots').select(`
      screening_date,
      primary_occupied_estimated,
      competitor_occupied_estimated,
      primary_confidence_avg,
      competitor_confidence_avg,
      cinemas(name, city),
      primary_movie:movies!comparison_snapshots_primary_movie_id_fkey(title),
      competitor_movie:movies!comparison_snapshots_competitor_movie_id_fkey(title)
    `).order('screening_date', { ascending: false });

    if (filters.cinemaId) q = q.eq('cinema_id', filters.cinemaId);
    if (filters.dateFrom) q = q.gte('screening_date', filters.dateFrom);
    if (filters.dateTo) q = q.lte('screening_date', filters.dateTo);
    const { data } = await q;
    return (data || []).map((d: any) => ({
      date: d.screening_date,
      cinema: d.cinemas?.name,
      city: d.cinemas?.city,
      primary_movie: d.primary_movie?.title,
      competitor_movie: d.competitor_movie?.title,
      primary_occupied: d.primary_occupied_estimated,
      competitor_occupied: d.competitor_occupied_estimated,
      primary_confidence: d.primary_confidence_avg,
      competitor_confidence: d.competitor_confidence_avg,
    }));
  }

  if (filters.dataType === 'sessions') {
    let q = supabase.from('screenings').select(`
      screening_date, screening_time, format,
      movies(title), cinemas(name, city, cinema_chains(name))
    `).order('screening_date', { ascending: false });
    if (filters.cinemaId) q = q.eq('cinema_id', filters.cinemaId);
    if (filters.movieId) q = q.eq('movie_id', filters.movieId);
    if (filters.imaxOnly) q = q.eq('format', 'IMAX');
    if (filters.dateFrom) q = q.gte('screening_date', filters.dateFrom);
    if (filters.dateTo) q = q.lte('screening_date', filters.dateTo);
    const { data } = await q;
    return (data || []).map((d: any) => ({
      date: d.screening_date,
      time: d.screening_time,
      format: d.format,
      movie: d.movies?.title,
      cinema: d.cinemas?.name,
      city: d.cinemas?.city,
      chain: d.cinemas?.cinema_chains?.name,
    }));
  }

  // Snapshots
  let q = supabase.from('scrape_runs').select(`
    run_timestamp, status, parser_key,
    occupancy_results(occupied_seats_estimated, available_seats_estimated, total_seats_estimated, occupancy_rate, confidence_score, confidence_reason, anomaly_flag),
    monitoring_targets(screenings(screening_date, screening_time, format, movies(title), cinemas(name, city, cinema_chains(name))))
  `).order('run_timestamp', { ascending: false });

  if (filters.dateFrom) q = q.gte('run_timestamp', filters.dateFrom);
  if (filters.dateTo) q = q.lte('run_timestamp', filters.dateTo + 'T23:59:59');
  const { data } = await q;

  return (data || []).map((d: any) => {
    const occ = d.occupancy_results?.[0];
    const scr = d.monitoring_targets?.screenings;
    return {
      timestamp: d.run_timestamp,
      status: d.status,
      parser: d.parser_key,
      movie: scr?.movies?.title,
      cinema: scr?.cinemas?.name,
      city: scr?.cinemas?.city,
      chain: scr?.cinemas?.cinema_chains?.name,
      date: scr?.screening_date,
      time: scr?.screening_time,
      format: scr?.format,
      occupied: occ?.occupied_seats_estimated,
      available: occ?.available_seats_estimated,
      total: occ?.total_seats_estimated,
      occupancy_rate: occ?.occupancy_rate,
      confidence: occ?.confidence_score,
      confidence_reason: occ?.confidence_reason,
      anomaly: occ?.anomaly_flag,
    };
  }).filter((d: any) => {
    if (filters.imaxOnly && d.format !== 'IMAX') return false;
    if (filters.highConfidenceOnly && (d.confidence || 0) < 90) return false;
    return true;
  });
}

function toCsv(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','));
  }
  return lines.join('\n');
}

export async function exportData(filters: ExportFilters, format: 'csv' | 'xlsx'): Promise<Blob> {
  const rows = await fetchExportData(filters);
  if (format === 'csv') {
    const csv = toCsv(rows);
    return new Blob([csv], { type: 'text/csv' });
  }
  // For xlsx, generate as CSV with xlsx extension (simplified)
  const csv = toCsv(rows);
  return new Blob([csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
