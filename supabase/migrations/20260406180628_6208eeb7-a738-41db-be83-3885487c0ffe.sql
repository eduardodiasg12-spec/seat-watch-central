
-- Create cinema_chains table
CREATE TABLE public.cinema_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  discovery_strategy TEXT DEFAULT 'manual',
  parser_key TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cinemas table
CREATE TABLE public.cinemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_id UUID REFERENCES public.cinema_chains(id) ON DELETE CASCADE,
  external_cinema_id TEXT,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create movies table
CREATE TABLE public.movies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  is_primary_title BOOLEAN NOT NULL DEFAULT false,
  release_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create screenings table
CREATE TABLE public.screenings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cinema_id UUID NOT NULL REFERENCES public.cinemas(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  external_screening_id TEXT,
  screening_date DATE NOT NULL,
  screening_time TIME NOT NULL,
  format TEXT NOT NULL DEFAULT 'Standard',
  auditorium_type TEXT,
  booking_url TEXT,
  source_url TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monitoring_targets table
CREATE TABLE public.monitoring_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  screening_id UUID NOT NULL REFERENCES public.screenings(id) ON DELETE CASCADE,
  target_url TEXT,
  monitoring_frequency_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scrape_runs table
CREATE TABLE public.scrape_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monitoring_target_id UUID NOT NULL REFERENCES public.monitoring_targets(id) ON DELETE CASCADE,
  run_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parser_key TEXT,
  parser_version TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'partial', 'failed')),
  raw_html_reference TEXT,
  raw_payload_json JSONB,
  screenshot_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create occupancy_results table
CREATE TABLE public.occupancy_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scrape_run_id UUID NOT NULL REFERENCES public.scrape_runs(id) ON DELETE CASCADE,
  occupied_seats_estimated INTEGER NOT NULL DEFAULT 0,
  available_seats_estimated INTEGER NOT NULL DEFAULT 0,
  total_seats_estimated INTEGER NOT NULL DEFAULT 0,
  occupancy_rate NUMERIC(5,2) DEFAULT 0,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  confidence_reason TEXT,
  extraction_type TEXT,
  anomaly_flag BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parser_logs table
CREATE TABLE public.parser_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scrape_run_id UUID NOT NULL REFERENCES public.scrape_runs(id) ON DELETE CASCADE,
  log_level TEXT NOT NULL DEFAULT 'info' CHECK (log_level IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discovery_runs table
CREATE TABLE public.discovery_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain_id UUID REFERENCES public.cinema_chains(id) ON DELETE SET NULL,
  query_movie_title TEXT NOT NULL,
  run_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  cinemas_found INTEGER DEFAULT 0,
  screenings_found INTEGER DEFAULT 0,
  notes TEXT,
  raw_payload_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comparison_snapshots table
CREATE TABLE public.comparison_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cinema_id UUID REFERENCES public.cinemas(id) ON DELETE CASCADE,
  screening_date DATE NOT NULL,
  primary_movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  competitor_movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  primary_occupied_estimated INTEGER DEFAULT 0,
  competitor_occupied_estimated INTEGER DEFAULT 0,
  primary_confidence_avg NUMERIC(5,2) DEFAULT 0,
  competitor_confidence_avg NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_events table
CREATE TABLE public.content_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tool_settings table
CREATE TABLE public.tool_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  default_chain_id UUID REFERENCES public.cinema_chains(id) ON DELETE SET NULL,
  primary_movie_title TEXT NOT NULL DEFAULT '2DIE4',
  default_monitoring_interval_minutes INTEGER NOT NULL DEFAULT 60,
  high_confidence_threshold INTEGER NOT NULL DEFAULT 90,
  medium_confidence_threshold INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cinema_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parser_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_settings ENABLE ROW LEVEL SECURITY;

-- Internal tool: allow anonymous full access to all tables
CREATE POLICY "anon_all" ON public.cinema_chains FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.cinemas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.movies FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.screenings FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.monitoring_targets FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.scrape_runs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.occupancy_results FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.parser_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.discovery_runs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.comparison_snapshots FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.content_events FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON public.tool_settings FOR ALL TO anon USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_cinemas_chain_id ON public.cinemas(chain_id);
CREATE INDEX idx_screenings_cinema_id ON public.screenings(cinema_id);
CREATE INDEX idx_screenings_movie_id ON public.screenings(movie_id);
CREATE INDEX idx_screenings_date ON public.screenings(screening_date);
CREATE INDEX idx_monitoring_targets_screening_id ON public.monitoring_targets(screening_id);
CREATE INDEX idx_scrape_runs_target ON public.scrape_runs(monitoring_target_id);
CREATE INDEX idx_scrape_runs_timestamp ON public.scrape_runs(run_timestamp);
CREATE INDEX idx_occupancy_results_run ON public.occupancy_results(scrape_run_id);
CREATE INDEX idx_parser_logs_run ON public.parser_logs(scrape_run_id);
CREATE INDEX idx_discovery_runs_chain ON public.discovery_runs(chain_id);
CREATE INDEX idx_comparison_snapshots_cinema ON public.comparison_snapshots(cinema_id);
CREATE INDEX idx_comparison_snapshots_date ON public.comparison_snapshots(screening_date);

-- Updated_at trigger for tool_settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tool_settings_updated_at
  BEFORE UPDATE ON public.tool_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
