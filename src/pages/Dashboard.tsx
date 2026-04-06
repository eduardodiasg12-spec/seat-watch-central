import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Film, Camera, Ticket, TrendingUp, AlertTriangle, Trophy, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import KPICard from '@/components/KPICard';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { computeKPIs, getOccupancyTrend, scrapeRuns, monitoringTargets, screenings, movies, cinemas, occupancyResults, getScreeningDetails } from '@/data/mockData';

export default function Dashboard() {
  const kpis = useMemo(() => computeKPIs(), []);

  const trendData = useMemo(() => {
    const allPoints = getOccupancyTrend();
    const grouped: Record<string, Record<string, number>> = {};
    for (const p of allPoints) {
      const hour = p.time.slice(0, 13);
      if (!grouped[hour]) grouped[hour] = {};
      if (!grouped[hour][p.movie]) grouped[hour][p.movie] = 0;
      grouped[hour][p.movie] += p.occupied;
    }
    return Object.entries(grouped).slice(-24).map(([hour, movies]) => ({
      hour: hour.slice(5),
      ...movies,
    }));
  }, []);

  const movieColors: Record<string, string> = {
    '2DIE4': 'hsl(38, 92%, 55%)',
    'Thunderstrike': 'hsl(210, 92%, 55%)',
    'The Last Frontier': 'hsl(142, 71%, 45%)',
    'Neon Shadows': 'hsl(280, 65%, 60%)',
    'Crimson Tide II': 'hsl(0, 72%, 51%)',
  };

  const topCinemas = useMemo(() => {
    const cinemaSeats: Record<string, number> = {};
    for (const occ of occupancyResults) {
      const run = scrapeRuns.find(r => r.id === occ.scrape_run_id);
      if (!run) continue;
      const target = monitoringTargets.find(t => t.id === run.monitoring_target_id);
      if (!target) continue;
      const d = getScreeningDetails(target.screening_id);
      if (!d?.cinema) continue;
      cinemaSeats[d.cinema.name] = (cinemaSeats[d.cinema.name] || 0) + occ.occupied_seats_estimated;
    }
    return Object.entries(cinemaSeats).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, seats]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, seats }));
  }, []);

  const recentRuns = useMemo(() => {
    return scrapeRuns.slice(-10).reverse().map(run => {
      const target = monitoringTargets.find(t => t.id === run.monitoring_target_id);
      const details = target ? getScreeningDetails(target.screening_id) : null;
      const occ = occupancyResults.find(o => o.scrape_run_id === run.id);
      return { ...run, movie: details?.movie?.title || '—', cinema: details?.cinema?.name || '—', occupied: occ?.occupied_seats_estimated, confidence: occ?.confidence_score };
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Cinemas Monitored" value={kpis.totalCinemas} icon={Building2} />
        <KPICard label="Sessions Monitored" value={kpis.totalSessions} icon={Film} />
        <KPICard label="Total Snapshots" value={kpis.totalSnapshots} icon={Camera} />
        <KPICard label="Est. Tickets Sold" value={kpis.totalEstimatedTickets} icon={Ticket} variant="primary" />
        <KPICard label="Avg Occupancy (2DIE4)" value={`${kpis.avgOccByMovie.find(m => m.title === '2DIE4')?.avgOccupancy || 0}%`} icon={BarChart3} variant="primary" />
        <KPICard label="Growth (24h)" value={`+${kpis.growthLast24h}%`} icon={TrendingUp} variant="success" trend={kpis.growthLast24h} />
        <KPICard label="2DIE4 Leading In" value={`${kpis.die4Leading} cinemas`} icon={Trophy} variant="success" />
        <KPICard label="Low Confidence" value={kpis.lowConfidence} icon={AlertTriangle} variant={kpis.lowConfidence > 20 ? 'warning' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Occupancy Trend — All Movies</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
              <XAxis dataKey="hour" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {movies.map(m => (
                <Line key={m.id} type="monotone" dataKey={m.title} stroke={movieColors[m.title]} strokeWidth={m.is_primary_title ? 3 : 1.5} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Top Cinemas by Est. Sales</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topCinemas} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
              <XAxis type="number" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} width={130} />
              <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="seats" fill="hsl(38,92%,55%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Avg Occupancy by Movie</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={kpis.avgOccByMovie}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
            <XAxis dataKey="title" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="avgOccupancy" name="Avg Occupancy %" radius={[4, 4, 0, 0]}>
              {kpis.avgOccByMovie.map((entry, i) => (
                <rect key={i} fill={movieColors[entry.title] || 'hsl(215,12%,50%)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Recent Scrape Runs</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Movie</th>
                <th className="py-2 pr-4">Cinema</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Est. Occupied</th>
                <th className="py-2 pr-4">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map(run => (
                <tr key={run.id} className="border-b border-border/50 hover:bg-accent/30">
                  <td className="py-2 pr-4 text-xs text-muted-foreground">{new Date(run.run_timestamp).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-sm font-medium">{run.movie}</td>
                  <td className="py-2 pr-4 text-sm">{run.cinema}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-medium ${run.status === 'success' ? 'text-success' : run.status === 'partial' ? 'text-warning' : 'text-destructive'}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-sm font-mono">{run.occupied ?? '—'}</td>
                  <td className="py-2 pr-4">{run.confidence ? <ConfidenceBadge score={run.confidence} /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
