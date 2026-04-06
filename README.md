# 2DIE4 Ticket Tracker

Internal cinema intelligence platform for monitoring estimated ticket sales per movie session, comparing 2DIE4 against competitors across cinema chains.

## Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, RLS)
- **Charts**: Recharts
- **UI**: shadcn/ui components

### Route Structure
| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | KPI cards, trends, recent runs |
| `/discovery` | Network Discovery | Chain-based movie/cinema discovery |
| `/targets` | Monitoring Targets | CRUD for monitored sessions |
| `/session/:id` | Session Detail | Occupancy charts, snapshot history |
| `/movies` | Movie Comparison | 2DIE4 vs competitors ranking |
| `/cinemas` | Cinemas | All monitored cinemas |
| `/cinemas/:id` | Cinema Detail | Per-cinema performance |
| `/exports` | Exports | CSV/Excel data exports |
| `/settings` | Settings | Tool configuration |

### Database Schema
- `cinema_chains` — AMC, Regal, etc. with parser configs
- `cinemas` — Individual theaters linked to chains
- `movies` — Tracked titles (2DIE4 = primary)
- `screenings` — Movie+cinema+date+time+format
- `monitoring_targets` — URLs to monitor with frequency
- `scrape_runs` — Each scrape attempt with status
- `occupancy_results` — Seat estimates per run
- `parser_logs` — Warnings/errors per run
- `discovery_runs` — Chain discovery attempts
- `comparison_snapshots` — Pre-computed comparisons
- `content_events` — PR/content activity tracking
- `tool_settings` — App configuration

### Discovery Workflow
1. User selects chain (AMC/Regal) + movie title
2. System runs chain-specific discovery (simulated, ready for Playwright)
3. Results show cinemas, dates, times, competitor movies
4. User approves sessions → monitoring targets created automatically

### Scrape Ingestion Flow
Edge function `scrape-ingest` accepts POST with:
```json
{
  "monitoring_target_id": "uuid",
  "occupied_seats_estimated": 150,
  "available_seats_estimated": 50,
  "total_seats_estimated": 200,
  "confidence_score": 92,
  "confidence_reason": "Seat map fully loaded and parsed",
  "parser_key": "amc",
  "parser_version": "1.0",
  "status": "success"
}
```
Creates scrape_run + occupancy_result + parser_logs + updates last_run_at.

### Confidence Scoring
- 90-100: High confidence (green)
- 70-89: Moderate confidence (yellow)
- 0-69: Review needed (red)
- Failed runs: Invalid

### Chain-Specific Parsers
`src/services/chainRegistry.ts` defines per-chain configs:
- AMC: movie_search strategy, seat map selectors, known risks
- Regal: movie_search strategy, different selectors
- Cinemark: placeholder (disabled)

### Future Playwright Collector Integration
1. Collector calls `scrape-ingest` edge function with results
2. Each chain has its own parser in chainRegistry
3. Discovery service can be replaced with real API/page scraping
4. Scheduled jobs via Supabase pg_cron or external scheduler

### Export Flow
Real CSV/Excel exports from Supabase data with filters:
- Date range, chain, cinema, movie, IMAX-only, high-confidence
- Preset reports: Daily, 2DIE4 vs Competitors, IMAX, Audit
