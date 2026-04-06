import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { movies, cinemas, occupancyResults, scrapeRuns, monitoringTargets, screenings, getScreeningDetails } from '@/data/mockData';

export default function MovieComparisonPage() {
  const movieColors: Record<string, string> = {
    '2DIE4': 'hsl(38,92%,55%)',
    'Thunderstrike': 'hsl(210,92%,55%)',
    'The Last Frontier': 'hsl(142,71%,45%)',
    'Neon Shadows': 'hsl(280,65%,60%)',
    'Crimson Tide II': 'hsl(0,72%,51%)',
  };

  const byCinema = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    for (const occ of occupancyResults) {
      const run = scrapeRuns.find(r => r.id === occ.scrape_run_id);
      if (!run) continue;
      const target = monitoringTargets.find(t => t.id === run.monitoring_target_id);
      if (!target) continue;
      const d = getScreeningDetails(target.screening_id);
      if (!d) continue;
      const key = d.cinema!.name;
      if (!data[key]) data[key] = {};
      data[key][d.movie!.title] = (data[key][d.movie!.title] || 0) + occ.occupied_seats_estimated;
    }
    return Object.entries(data).slice(0, 8).map(([cinema, movieData]) => ({ cinema: cinema.length > 15 ? cinema.slice(0, 15) + '…' : cinema, ...movieData }));
  }, []);

  const byMovie = useMemo(() => {
    const data: Record<string, { total: number; seats: number; count: number }> = {};
    for (const occ of occupancyResults) {
      const run = scrapeRuns.find(r => r.id === occ.scrape_run_id);
      if (!run) continue;
      const target = monitoringTargets.find(t => t.id === run.monitoring_target_id);
      if (!target) continue;
      const d = getScreeningDetails(target.screening_id);
      if (!d) continue;
      const title = d.movie!.title;
      if (!data[title]) data[title] = { total: 0, seats: 0, count: 0 };
      data[title].total += occ.total_seats_estimated;
      data[title].seats += occ.occupied_seats_estimated;
      data[title].count++;
    }
    return Object.entries(data).map(([title, d]) => ({
      title,
      avgOccupancy: Math.round((d.seats / d.total) * 100),
      totalTickets: d.seats,
      snapshots: d.count,
    })).sort((a, b) => b.totalTickets - a.totalTickets);
  }, []);

  const imaxOnly = useMemo(() => {
    const data: Record<string, number> = {};
    for (const occ of occupancyResults) {
      const run = scrapeRuns.find(r => r.id === occ.scrape_run_id);
      if (!run) continue;
      const target = monitoringTargets.find(t => t.id === run.monitoring_target_id);
      if (!target) continue;
      const scr = screenings.find(s => s.id === target.screening_id);
      if (!scr || scr.format !== 'IMAX') continue;
      const movie = movies.find(m => m.id === scr.movie_id);
      if (!movie) continue;
      data[movie.title] = (data[movie.title] || 0) + occ.occupied_seats_estimated;
    }
    return Object.entries(data).map(([title, seats]) => ({ title, seats })).sort((a, b) => b.seats - a.seats);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Movie Comparison</h1>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Rankings</h3>
        <table className="data-table">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
              <th className="p-2">#</th>
              <th className="p-2">Movie</th>
              <th className="p-2">Est. Total Tickets</th>
              <th className="p-2">Avg Occupancy</th>
              <th className="p-2">Snapshots</th>
            </tr>
          </thead>
          <tbody>
            {byMovie.map((m, i) => (
              <tr key={m.title} className="border-b border-border/30 hover:bg-accent/30">
                <td className="p-2 text-sm font-mono text-muted-foreground">{i + 1}</td>
                <td className="p-2 text-sm font-medium" style={{ color: movieColors[m.title] }}>{m.title}</td>
                <td className="p-2 text-sm font-mono">{m.totalTickets.toLocaleString()}</td>
                <td className="p-2 text-sm font-mono">{m.avgOccupancy}%</td>
                <td className="p-2 text-sm font-mono">{m.snapshots}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Est. Sales by Cinema</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCinema}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
              <XAxis dataKey="cinema" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {movies.map(m => <Bar key={m.id} dataKey={m.title} fill={movieColors[m.title]} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">IMAX Only — Est. Sales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={imaxOnly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
              <XAxis dataKey="title" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="seats" name="IMAX Est. Seats" radius={[4, 4, 0, 0]}>
                {imaxOnly.map((entry) => (
                  <rect key={entry.title} fill={movieColors[entry.title] || 'hsl(215,12%,50%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
