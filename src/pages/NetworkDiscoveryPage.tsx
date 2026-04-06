import { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { getAvailableChains, getChainConfig } from '@/services/chainRegistry';
import { fetchChains, upsertChain, fetchDiscoveryRuns } from '@/services/supabaseQueries';

export default function NetworkDiscoveryPage() {
  const [chains, setChains] = useState<any[]>([]);
  const [selectedChain, setSelectedChain] = useState('');
  const [movieTitle, setMovieTitle] = useState('2DIE4');
  const [discoveryHistory, setDiscoveryHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const dbChains = await fetchChains();
      // Ensure registry chains exist in DB
      const available = getAvailableChains();
      for (const config of available) {
        const exists = (dbChains || []).find((c: any) => c.slug === config.slug);
        if (!exists) {
          await upsertChain({
            name: config.chainName,
            slug: config.slug,
            base_url: config.baseUrl,
            parser_key: config.slug,
            discovery_strategy: config.discoveryStrategy,
          });
        }
      }
      const refreshed = await fetchChains();
      setChains(refreshed || []);

      const history = await fetchDiscoveryRuns();
      setDiscoveryHistory(history || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function getChainStatus(chainId: string) {
    const chain = chains.find(c => c.id === chainId);
    if (!chain) return null;
    const config = getChainConfig(chain.slug);
    return config;
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Network Discovery</h1>

      <div className="glass-card p-5 max-w-2xl space-y-4">
        <h3 className="text-sm font-semibold">Discover Sessions by Chain</h3>
        <p className="text-xs text-muted-foreground">
          Discovery requires an external Playwright-based collector. Select a chain below to see its configuration status.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Cinema Chain</Label>
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger><SelectValue placeholder="Select chain" /></SelectTrigger>
              <SelectContent>
                {chains.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Target Movie</Label>
            <Input value={movieTitle} onChange={e => setMovieTitle(e.target.value)} placeholder="2DIE4" />
          </div>
        </div>

        {selectedChain && (() => {
          const chain = chains.find(c => c.id === selectedChain);
          const config = chain ? getChainConfig(chain.slug) : null;
          return (
            <div className="p-4 rounded-lg bg-accent/30 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-yellow-400" />
                <span className="text-sm font-medium">
                  {config ? `${config.chainName} — Discovery not yet connected` : 'Chain not registered'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Real discovery for this chain requires a Playwright-based collector sending results to the <code className="text-primary">scrape-ingest</code> edge function.
                {config && (
                  <>
                    {' '}Base URL: <code className="text-primary">{config.baseUrl}</code>.
                    {' '}Strategy: <code className="text-primary">{config.discoveryStrategy}</code>.
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                To populate data manually, use the <a href="/targets" className="text-primary hover:underline">Monitoring Targets</a> page to add sessions directly.
              </p>
            </div>
          );
        })()}
      </div>

      <div className="glass-card p-5 space-y-4 max-w-2xl">
        <h3 className="text-sm font-semibold">Chain Parser Status</h3>
        <div className="space-y-2">
          {getAvailableChains().map(config => (
            <div key={config.slug} className="flex items-center justify-between p-3 rounded bg-accent/30">
              <div>
                <span className="text-sm font-medium">{config.chainName}</span>
                <span className="text-xs text-muted-foreground ml-2">Strategy: {config.discoveryStrategy}</span>
                <span className="text-xs text-muted-foreground ml-2">Base: {config.baseUrl}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400">
                Collector not connected
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Discovery Run History</h3>
        {discoveryHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No discovery runs recorded yet. Discovery runs will appear here when an external collector sends results.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="p-2">Time</th>
                  <th className="p-2">Chain</th>
                  <th className="p-2">Movie</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Cinemas Found</th>
                  <th className="p-2">Sessions Found</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {discoveryHistory.map(run => (
                  <tr key={run.id} className="border-b border-border/30 hover:bg-accent/30">
                    <td className="p-2 text-xs text-muted-foreground">{new Date(run.run_timestamp).toLocaleString()}</td>
                    <td className="p-2 text-sm">{(run as any).cinema_chains?.name || '—'}</td>
                    <td className="p-2 text-sm">{run.query_movie_title}</td>
                    <td className="p-2">
                      <span className={`text-xs font-medium ${run.status === 'completed' ? 'text-green-400' : run.status === 'running' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="p-2 text-sm font-mono">{run.cinemas_found ?? 0}</td>
                    <td className="p-2 text-sm font-mono">{run.screenings_found ?? 0}</td>
                    <td className="p-2 text-xs text-muted-foreground">{run.notes || '—'}</td>
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
