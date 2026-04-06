import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { fetchScreeningById, fetchScrapeRunsForTarget } from '@/services/supabaseQueries';
import { supabase } from '@/integrations/supabase/client';

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [screening, setScreening] = useState<any>(null);
  const [target, setTarget] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const scr = await fetchScreeningById(id);
        setScreening(scr);

        const { data: targets } = await supabase.from('monitoring_targets').select('*').eq('screening_id', id).limit(1);
        const t = targets?.[0];
        setTarget(t);

        if (t) {
          const runsData = await fetchScrapeRunsForTarget(t.id);
          setRuns(runsData || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!screening) return <div className="p-6">Session not found</div>;

  const chartData = runs
    .filter(r => r.status === 'success' && r.occupancy_results?.length > 0)
    .reverse()
    .map(r => ({
      time: new Date(r.run_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      occupied: r.occupancy_results[0].occupied_seats_estimated,
      confidence: Number(r.occupancy_results[0].confidence_score),
    }));

  const hasData = runs.length > 0;

  return (
    <div className="space-y-6">
      <Link to="/targets" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Back to Targets
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{screening.movies?.title}</h1>
          <p className="text-sm text-muted-foreground">
            {(screening.cinemas as any)?.cinema_chains?.name} · {screening.cinemas?.name} · {screening.cinemas?.city} · {screening.format}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{screening.screening_date} at {screening.screening_time}</p>
          {screening.booking_url && (
            <a href={screening.booking_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{screening.booking_url}</a>
          )}
        </div>
        <div className="text-right">
          {target ? (
            <span className={`text-xs font-medium ${target.is_active ? 'text-green-400' : 'text-muted-foreground'}`}>
              {target.is_active ? '● Active' : '○ Paused'}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No monitoring target</span>
          )}
        </div>
      </div>

      {!hasData && (
        <div className="glass-card p-6 text-center space-y-2">
          <Send size={24} className="mx-auto text-muted-foreground" />
          <p className="text-sm font-medium">No real monitoring data yet</p>
          <p className="text-xs text-muted-foreground">
            {target
              ? 'This session has a monitoring target but no scrape results have been ingested yet. Send results via the scrape-ingest endpoint.'
              : 'Create a monitoring target for this session first, then connect a collector to send occupancy data.'}
          </p>
        </div>
      )}

      {chartData.length > 0 && (
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
      )}

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3">Snapshot History ({runs.length} runs)</h3>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scrape runs recorded for this session.</p>
        ) : (
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
                {runs.slice(0, 50).map(r => {
                  const occ = r.occupancy_results?.[0];
                  return (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-accent/30">
                      <td className="p-2 text-xs text-muted-foreground">{new Date(r.run_timestamp).toLocaleString()}</td>
                      <td className="p-2 text-sm font-mono">{occ?.occupied_seats_estimated ?? '—'}</td>
                      <td className="p-2 text-sm font-mono">{occ?.available_seats_estimated ?? '—'}</td>
                      <td className="p-2 text-sm font-mono">{occ?.total_seats_estimated ?? '—'}</td>
                      <td className="p-2">{occ ? <ConfidenceBadge score={Number(occ.confidence_score)} /> : '—'}</td>
                      <td className="p-2 text-xs text-muted-foreground">{occ?.confidence_reason || '—'}</td>
                      <td className="p-2">
                        <span className={`text-xs ${r.status === 'success' ? 'text-green-400' : r.status === 'partial' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {runs.some(r => r.parser_logs?.length > 0) && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3">Parser Logs</h3>
          <div className="space-y-1">
            {runs.flatMap(r => (r.parser_logs || []).map((log: any) => (
              <div key={log.id} className="flex items-start gap-2 text-xs p-2 rounded bg-accent/30">
                <span className={log.log_level === 'error' ? 'text-red-400' : 'text-yellow-400'}>{log.log_level}</span>
                <span className="text-muted-foreground">{log.message}</span>
                {log.error_message && <span className="text-red-400">{log.error_message}</span>}
              </div>
            )))}
          </div>
        </div>
      )}
    </div>
  );
}
