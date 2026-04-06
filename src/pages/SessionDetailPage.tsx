import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { monitoringTargets, screenings, movies, cinemas, scrapeRuns, occupancyResults, parserLogs, getScreeningDetails } from '@/data/mockData';

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const data = useMemo(() => {
    const screening = screenings.find(s => s.id === id);
    if (!screening) return null;
    const movie = movies.find(m => m.id === screening.movie_id);
    const cinema = cinemas.find(c => c.id === screening.cinema_id);
    const target = monitoringTargets.find(t => t.screening_id === id);
    if (!target) return { screening, movie, cinema, target: null, snapshots: [], logs: [] };
    
    const runs = scrapeRuns.filter(r => r.monitoring_target_id === target.id);
    const snapshots = runs.map(run => {
      const occ = occupancyResults.find(o => o.scrape_run_id === run.id);
      return { run, occ };
    }).filter(s => s.occ);

    const logs = parserLogs.filter(l => runs.some(r => r.id === l.scrape_run_id));

    return { screening, movie, cinema, target, snapshots, logs };
  }, [id]);

  if (!data) return <div className="p-6">Session not found</div>;
  const { screening, movie, cinema, target, snapshots, logs } = data;

  const chartData = snapshots.map(s => ({
    time: new Date(s.run!.run_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    occupied: s.occ!.occupied_seats_estimated,
    confidence: s.occ!.confidence_score,
  }));

  return (
    <div className="space-y-6">
      <Link to="/targets" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Targets
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{movie?.title}</h1>
          <p className="text-sm text-muted-foreground">{cinema?.name} · {cinema?.city} · {screening?.format}</p>
          <p className="text-xs text-muted-foreground mt-1">{screening?.session_date} at {screening?.session_time}</p>
        </div>
        {target && (
          <span className={`text-xs font-medium ${target.is_active ? 'text-success' : 'text-muted-foreground'}`}>
            {target.is_active ? '● Active' : '○ Paused'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Occupancy Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
              <XAxis dataKey="time" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="occupied" stroke="hsl(38,92%,55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Confidence Score Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
              <XAxis dataKey="time" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="confidence" stroke="hsl(142,71%,45%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Snapshot History</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="p-2">Timestamp</th>
                <th className="p-2">Occupied</th>
                <th className="p-2">Available</th>
                <th className="p-2">Total</th>
                <th className="p-2">Confidence</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.slice(-20).reverse().map(s => (
                <tr key={s.run!.id} className="border-b border-border/30 hover:bg-accent/30">
                  <td className="p-2 text-xs text-muted-foreground">{new Date(s.run!.run_timestamp).toLocaleString()}</td>
                  <td className="p-2 text-sm font-mono">{s.occ!.occupied_seats_estimated}</td>
                  <td className="p-2 text-sm font-mono">{s.occ!.available_seats_estimated}</td>
                  <td className="p-2 text-sm font-mono">{s.occ!.total_seats_estimated}</td>
                  <td className="p-2"><ConfidenceBadge score={s.occ!.confidence_score} /></td>
                  <td className="p-2 text-xs text-muted-foreground">{s.occ!.confidence_reason}</td>
                  <td className="p-2">
                    <span className={`text-xs ${s.run!.status === 'success' ? 'text-success' : s.run!.status === 'partial' ? 'text-warning' : 'text-destructive'}`}>
                      {s.run!.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Parser Logs</h3>
          <div className="space-y-1">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-2 text-xs p-2 rounded bg-accent/30">
                <span className={log.log_level === 'error' ? 'text-destructive' : 'text-warning'}>{log.log_level}</span>
                <span className="text-muted-foreground">{log.message}</span>
                {log.error_message && <span className="text-destructive">{log.error_message}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
