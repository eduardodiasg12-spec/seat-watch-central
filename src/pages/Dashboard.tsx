import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Film, Camera, Ticket, TrendingUp, AlertTriangle, Trophy, BarChart3, Layers, Search, PlusCircle, Send } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import KPICard from '@/components/KPICard';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { fetchDashboardKPIs, fetchOccupancyTrend, fetchTopCinemasBySales, fetchRecentScrapeRuns, fetchDie4LeadershipCount } from '@/services/supabaseQueries';

const movieColors: Record<string, string> = {
  '2DIE4': 'hsl(38, 92%, 55%)',
  'Thunderstrike': 'hsl(210, 92%, 55%)',
  'The Last Frontier': 'hsl(142, 71%, 45%)',
  'Neon Shadows': 'hsl(280, 65%, 60%)',
  'Crimson Tide II': 'hsl(0, 72%, 51%)',
};

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topCinemas, setTopCinemas] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [die4Leading, setDie4Leading] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [kpiData, trend, cinemas, runs, leading] = await Promise.all([
          fetchDashboardKPIs(),
          fetchOccupancyTrend(),
          fetchTopCinemasBySales(),
          fetchRecentScrapeRuns(15),
          fetchDie4LeadershipCount(),
        ]);
        setKpis(kpiData);
        setDie4Leading(leading);
        setTopCinemas(cinemas);

        const grouped: Record<string, Record<string, number>> = {};
        for (const run of trend || []) {
          const ts = (run as any).run_timestamp;
          const movieTitle = (run as any).monitoring_targets?.screenings?.movies?.title;
          const occupied = (run as any).occupancy_results?.[0]?.occupied_seats_estimated || 0;
          if (!ts || !movieTitle) continue;
          const hour = ts.slice(0, 13);
          if (!grouped[hour]) grouped[hour] = {};
          grouped[hour][movieTitle] = (grouped[hour][movieTitle] || 0) + occupied;
        }
        const trendArr = Object.entries(grouped).slice(-24).map(([hour, movies]) => ({
          hour: hour.slice(5),
          ...movies,
        }));
        setTrendData(trendArr);

        const processedRuns = (runs || []).map((run: any) => ({
          id: run.id,
          run_timestamp: run.run_timestamp,
          status: run.status,
          movie: run.monitoring_targets?.screenings?.movies?.title || '—',
          cinema: run.monitoring_targets?.screenings?.cinemas?.name || '—',
          occupied: run.occupancy_results?.[0]?.occupied_seats_estimated,
          confidence: run.occupancy_results?.[0]?.confidence_score,
        }));
        setRecentRuns(processedRuns);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const movieTitles = useMemo(() => {
    const titles = new Set<string>();
    for (const d of trendData) {
      for (const key of Object.keys(d)) {
        if (key !== 'hour') titles.add(key);
      }
    }
    return Array.from(titles);
  }, [trendData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card p-4 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const noData = !kpis || kpis.totalSnapshots === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleString()}</span>
      </div>

      {noData && (
        <div className="glass-card p-8 space-y-4">
          <h2 className="text-lg font-semibold text-center">No real monitoring data yet</h2>
          <p className="text-sm text-muted-foreground text-center max-w-lg mx-auto">
            The dashboard displays only real persisted data from scrape runs and occupancy results. Follow these steps to populate it:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <Link to="/discovery" className="glass-card p-4 text-center hover:border-primary/30 transition-colors">
              <Search size={20} className="mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">1. Run Discovery</p>
              <p className="text-xs text-muted-foreground mt-1">Select a cinema chain and discover where 2DIE4 is playing</p>
            </Link>
            <Link to="/targets" className="glass-card p-4 text-center hover:border-primary/30 transition-colors">
              <PlusCircle size={20} className="mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">2. Create Targets</p>
              <p className="text-xs text-muted-foreground mt-1">Approve discovered sessions or add monitoring targets manually</p>
            </Link>
            <div className="glass-card p-4 text-center">
              <Send size={20} className="mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">3. Ingest Scrape Data</p>
              <p className="text-xs text-muted-foreground mt-1">Connect a Playwright collector to send occupancy results via the scrape-ingest endpoint</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Chains Monitored" value={kpis?.totalChains ?? 0} icon={Layers} />
        <KPICard label="Cinemas Monitored" value={kpis?.totalCinemas ?? 0} icon={Building2} />
        <KPICard label="Sessions Monitored" value={kpis?.totalSessions ?? 0} icon={Film} />
        <KPICard label="Total Snapshots" value={kpis?.totalSnapshots ?? 0} icon={Camera} />
        <KPICard label="Est. Tickets Sold" value={kpis?.totalEstimatedTickets ?? 0} icon={Ticket} variant="primary" />
        <KPICard label="Total Scrape Runs" value={kpis?.totalRuns ?? 0} icon={BarChart3} />
        <KPICard label="2DIE4 Leading In" value={`${die4Leading} comparisons`} icon={Trophy} variant="success" />
        <KPICard label="Low Confidence" value={kpis?.lowConfidence ?? 0} icon={AlertTriangle} variant={(kpis?.lowConfidence || 0) > 20 ? 'warning' : 'default'} />
      </div>

      {trendData.length > 0 ? (
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
                {movieTitles.map(title => (
                  <Line key={title} type="monotone" dataKey={title} stroke={movieColors[title] || 'hsl(215,50%,50%)'} strokeWidth={title === '2DIE4' ? 3 : 1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-3">Top Cinemas by Est. Sales</h3>
            {topCinemas.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topCinemas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
                  <XAxis type="number" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} width={130} />
                  <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="seats" fill="hsl(38,92%,55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No cinema sales data available yet.</p>
            )}
          </div>
        </div>
      ) : !noData ? (
        <div className="glass-card p-6 text-center text-muted-foreground text-sm">
          No occupancy trend data available. Scrape runs with successful occupancy results will appear here.
        </div>
      ) : null}

      {recentRuns.length > 0 ? (
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
                      <span className={`text-xs font-medium ${run.status === 'success' ? 'text-green-400' : run.status === 'partial' ? 'text-yellow-400' : 'text-red-400'}`}>
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
      ) : !noData ? (
        <div className="glass-card p-6 text-center text-muted-foreground text-sm">
          No scrape runs recorded yet. Connect a collector and send results to the scrape-ingest endpoint.
        </div>
      ) : null}
    </div>
  );
}
