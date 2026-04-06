import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cinemas, movies, screenings, monitoringTargets, scrapeRuns, occupancyResults, getScreeningDetails } from '@/data/mockData';
import ConfidenceBadge from '@/components/ConfidenceBadge';

export default function CinemaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const cinema = cinemas.find(c => c.id === id);

  const data = useMemo(() => {
    if (!cinema) return { sessions: [], byMovie: [] };
    const cinemaSessions = screenings.filter(s => s.cinema_id === cinema.id);
    const sessions = cinemaSessions.map(s => {
      const movie = movies.find(m => m.id === s.movie_id);
      const target = monitoringTargets.find(t => t.screening_id === s.id);
      const runs = target ? scrapeRuns.filter(r => r.monitoring_target_id === target.id) : [];
      const lastRun = runs[runs.length - 1];
      const lastOcc = lastRun ? occupancyResults.find(o => o.scrape_run_id === lastRun.id) : null;
      return { ...s, movieTitle: movie?.title || '—', lastOccupied: lastOcc?.occupied_seats_estimated, lastConfidence: lastOcc?.confidence_score, isActive: target?.is_active };
    });

    const movieSeats: Record<string, number> = {};
    for (const s of sessions) {
      if (s.lastOccupied) movieSeats[s.movieTitle] = (movieSeats[s.movieTitle] || 0) + s.lastOccupied;
    }
    const byMovie = Object.entries(movieSeats).map(([title, seats]) => ({ title, seats })).sort((a, b) => b.seats - a.seats);

    return { sessions, byMovie };
  }, [cinema, id]);

  if (!cinema) return <div className="p-6">Cinema not found</div>;

  return (
    <div className="space-y-6">
      <Link to="/cinemas" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Cinemas
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{cinema.name}</h1>
        <p className="text-sm text-muted-foreground">{cinema.chain} · {cinema.city}, {cinema.state}</p>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Performance by Movie</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.byMovie}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
            <XAxis dataKey="title" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="seats" fill="hsl(38,92%,55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Monitored Sessions ({data.sessions.length})</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="p-2">Movie</th>
                <th className="p-2">Date</th>
                <th className="p-2">Time</th>
                <th className="p-2">Format</th>
                <th className="p-2">Status</th>
                <th className="p-2">Est. Seats</th>
                <th className="p-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.slice(0, 30).map(s => (
                <tr key={s.id} className="border-b border-border/30 hover:bg-accent/30">
                  <td className="p-2 text-sm font-medium">
                    <Link to={`/session/${s.id}`} className="hover:text-primary">{s.movieTitle}</Link>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">{s.session_date}</td>
                  <td className="p-2 text-xs text-muted-foreground">{s.session_time}</td>
                  <td className="p-2 text-xs">{s.format}</td>
                  <td className="p-2">
                    <span className={`text-xs ${s.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                      {s.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="p-2 text-sm font-mono">{s.lastOccupied ?? '—'}</td>
                  <td className="p-2">{s.lastConfidence ? <ConfidenceBadge score={s.lastConfidence} /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
