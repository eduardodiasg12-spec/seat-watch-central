import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { fetchCinemaById, fetchScreenings } from '@/services/supabaseQueries';
import { supabase } from '@/integrations/supabase/client';

export default function CinemaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cinema, setCinema] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const c = await fetchCinemaById(id);
        setCinema(c);
        const scrs = await fetchScreenings({ cinema_id: id });
        // Enrich with latest occupancy
        const enriched = await Promise.all((scrs || []).map(async (s: any) => {
          const { data: target } = await supabase.from('monitoring_targets').select('id, is_active, last_run_at').eq('screening_id', s.id).limit(1).maybeSingle();
          let lastOcc = null;
          if (target) {
            const { data: run } = await supabase.from('scrape_runs')
              .select('occupancy_results(occupied_seats_estimated, confidence_score)')
              .eq('monitoring_target_id', target.id)
              .eq('status', 'success')
              .order('run_timestamp', { ascending: false })
              .limit(1)
              .maybeSingle();
            lastOcc = run?.occupancy_results?.[0];
          }
          return { ...s, isActive: target?.is_active, lastOccupied: lastOcc?.occupied_seats_estimated, lastConfidence: lastOcc?.confidence_score };
        }));
        setSessions(enriched);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  const byMovie = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions) {
      if (s.lastOccupied) {
        const title = s.movies?.title || '—';
        map[title] = (map[title] || 0) + s.lastOccupied;
      }
    }
    return Object.entries(map).map(([title, seats]) => ({ title, seats })).sort((a, b) => b.seats - a.seats);
  }, [sessions]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!cinema) return <div className="p-6">Cinema not found</div>;

  return (
    <div className="space-y-6">
      <Link to="/cinemas" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Cinemas
      </Link>
      <div>
        <h1 className="text-2xl font-bold">{cinema.name}</h1>
        <p className="text-sm text-muted-foreground">{(cinema as any).cinema_chains?.name || '—'} · {cinema.city}, {cinema.state}</p>
      </div>

      {byMovie.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Performance by Movie</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byMovie}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
              <XAxis dataKey="title" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="seats" fill="hsl(38,92%,55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Monitored Sessions ({sessions.length})</h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions found for this cinema.</p>
        ) : (
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
                {sessions.slice(0, 30).map(s => (
                  <tr key={s.id} className="border-b border-border/30 hover:bg-accent/30">
                    <td className="p-2 text-sm font-medium">
                      <Link to={`/session/${s.id}`} className="hover:text-primary">{s.movies?.title || '—'}</Link>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{s.screening_date}</td>
                    <td className="p-2 text-xs text-muted-foreground">{s.screening_time}</td>
                    <td className="p-2 text-xs">{s.format}</td>
                    <td className="p-2">
                      <span className={`text-xs ${s.isActive ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {s.isActive === undefined ? '—' : s.isActive ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="p-2 text-sm font-mono">{s.lastOccupied ?? '—'}</td>
                    <td className="p-2">{s.lastConfidence ? <ConfidenceBadge score={Number(s.lastConfidence)} /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
