export interface Cinema {
  id: string;
  name: string;
  chain: string;
  city: string;
  state: string;
  country: string;
  created_at: string;
}

export interface Movie {
  id: string;
  title: string;
  is_primary_title: boolean;
  created_at: string;
}

export interface Screening {
  id: string;
  movie_id: string;
  cinema_id: string;
  session_date: string;
  session_time: string;
  format: string;
  auditorium_type: string;
  notes: string;
  created_at: string;
}

export interface MonitoringTarget {
  id: string;
  screening_id: string;
  target_url: string;
  frequency_minutes: number;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
}

export interface ScrapeRun {
  id: string;
  monitoring_target_id: string;
  run_timestamp: string;
  status: 'success' | 'partial' | 'failed';
  parser_method: string;
  raw_html_reference: string | null;
  raw_payload_json: string | null;
  created_at: string;
}

export interface OccupancyResult {
  id: string;
  scrape_run_id: string;
  occupied_seats_estimated: number;
  available_seats_estimated: number;
  total_seats_estimated: number;
  confidence_score: number;
  confidence_reason: string;
  extraction_type: string;
  anomaly_flag: boolean;
  created_at: string;
}

export interface ParserLog {
  id: string;
  scrape_run_id: string;
  log_level: 'info' | 'warning' | 'error';
  message: string;
  error_message: string | null;
  created_at: string;
}

export interface ContentEvent {
  id: string;
  event_date: string;
  event_type: string;
  title: string;
  description: string;
  movie_id: string;
  created_at: string;
}

export type SessionFormat = 'IMAX' | 'Standard' | '3D' | 'Dolby Atmos' | '4DX';

export interface ConfidenceCategory {
  label: string;
  min: number;
  max: number;
  color: string;
}

export const CONFIDENCE_CATEGORIES: ConfidenceCategory[] = [
  { label: 'High', min: 90, max: 100, color: 'success' },
  { label: 'Moderate', min: 70, max: 89, color: 'warning' },
  { label: 'Review Needed', min: 0, max: 69, color: 'destructive' },
];

export function getConfidenceCategory(score: number): ConfidenceCategory {
  return CONFIDENCE_CATEGORIES.find(c => score >= c.min && score <= c.max) || CONFIDENCE_CATEGORIES[2];
}

export interface DashboardFilters {
  dateRange: [Date | null, Date | null];
  city: string;
  cinema: string;
  chain: string;
  movie: string;
  format: string;
  imaxOnly: boolean;
  activeOnly: boolean;
  minConfidence: number;
  includePaused: boolean;
}
