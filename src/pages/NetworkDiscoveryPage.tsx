import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { getAvailableChains } from '@/services/chainRegistry';
import { runDiscovery, DiscoveredSession } from '@/services/discoveryService';
import { fetchChains, upsertChain, createDiscoveryRun, updateDiscoveryRun, bulkCreateFromDiscovery } from '@/services/supabaseQueries';

export default function NetworkDiscoveryPage() {
  const [chains, setChains] = useState<any[]>([]);
  const [selectedChain, setSelectedChain] = useState('');
  const [movieTitle, setMovieTitle] = useState('2DIE4');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiscoveredSession[]>([]);
  const [discoveryRunId, setDiscoveryRunId] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [monitorPrimary, setMonitorPrimary] = useState(true);
  const [monitorCompetitors, setMonitorCompetitors] = useState(true);
  const [imaxOnly, setImaxOnly] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadChains();
  }, []);

  async function loadChains() {
    const dbChains = await fetchChains();
    setChains(dbChains || []);
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
  }

  async function handleDiscover() {
    const chain = chains.find(c => c.id === selectedChain);
    if (!chain) { toast.error('Select a chain'); return; }
    if (!movieTitle) { toast.error('Enter a movie title'); return; }

    setRunning(true);
    setResults([]);
    setApprovedIds(new Set());

    try {
      const run = await createDiscoveryRun({
        chain_id: chain.id,
        query_movie_title: movieTitle,
        status: 'running',
      });
      setDiscoveryRunId(run.id);

      const discovered = await runDiscovery(chain.slug, movieTitle);
      setResults(discovered);

      await updateDiscoveryRun(run.id, {
        status: 'completed',
        cinemas_found: new Set(discovered.map(d => d.cinemaName)).size,
        screenings_found: discovered.length,
      });
      toast.success(`Found ${discovered.length} sessions across ${new Set(discovered.map(d => d.cinemaName)).size} cinemas`);
    } catch (e: any) {
      toast.error(e.message);
      if (discoveryRunId) {
        await updateDiscoveryRun(discoveryRunId, { status: 'failed', notes: e.message });
      }
    } finally {
      setRunning(false);
    }
  }

  function toggleApproval(id: string) {
    setApprovedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function approveAll() {
    const filtered = getFilteredResults();
    setApprovedIds(new Set(filtered.map(r => r.id)));
  }

  function getFilteredResults() {
    return results.filter(r => {
      if (imaxOnly && r.format !== 'IMAX') return false;
      if (!monitorPrimary && r.isPrimaryTitle) return false;
      if (!monitorCompetitors && !r.isPrimaryTitle) return false;
      return true;
    });
  }

  async function handleCreateTargets() {
    const chain = chains.find(c => c.id === selectedChain);
    if (!chain) return;
    const approved = results.filter(r => approvedIds.has(r.id));
    if (approved.length === 0) { toast.error('No sessions approved'); return; }

    setCreating(true);
    try {
      const items = approved.map(r => ({
        chain_id: chain.id,
        cinema: { name: r.cinemaName, city: r.city, state: r.state, country: r.country },
        movie: { title: r.movieTitle, is_primary_title: r.isPrimaryTitle },
        screening: {
          screening_date: r.screeningDate,
          screening_time: r.screeningTime,
          format: r.format,
          booking_url: r.bookingUrl,
        },
        monitor: true,
      }));
      await bulkCreateFromDiscovery(items);
      toast.success(`Created ${approved.length} monitoring targets`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  const filtered = getFilteredResults();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Network Discovery</h1>

      <div className="glass-card p-5 max-w-2xl space-y-4">
        <h3 className="text-sm font-semibold">Discover Sessions by Chain</h3>
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="primary" checked={monitorPrimary} onCheckedChange={setMonitorPrimary} />
            <Label htmlFor="primary" className="text-xs">Include primary movie</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="competitors" checked={monitorCompetitors} onCheckedChange={setMonitorCompetitors} />
            <Label htmlFor="competitors" className="text-xs">Include competitors</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="imax" checked={imaxOnly} onCheckedChange={setImaxOnly} />
            <Label htmlFor="imax" className="text-xs">IMAX only</Label>
          </div>
        </div>
        <Button onClick={handleDiscover} disabled={running || !selectedChain} className="w-full">
          {running ? <><Loader2 size={16} className="mr-2 animate-spin" /> Discovering...</> : <><Search size={16} className="mr-2" /> Run Discovery</>}
        </Button>
      </div>

      {filtered.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Discovery Results ({filtered.length} sessions)</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={approveAll}>Approve All ({filtered.length})</Button>
              <Button size="sm" onClick={handleCreateTargets} disabled={creating || approvedIds.size === 0}>
                {creating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <ArrowRight size={14} className="mr-1" />}
                Create {approvedIds.size} Targets
              </Button>
            </div>
          </div>

          <div className="glass-card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="p-3">✓</th>
                  <th className="p-3">Cinema</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Movie</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Match</th>
                  <th className="p-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className={`border-b border-border/30 hover:bg-accent/30 cursor-pointer ${approvedIds.has(r.id) ? 'bg-accent/20' : ''}`} onClick={() => toggleApproval(r.id)}>
                    <td className="p-3">
                      {approvedIds.has(r.id) ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-muted-foreground" />}
                    </td>
                    <td className="p-3 text-sm">{r.cinemaName}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.city}, {r.state}</td>
                    <td className="p-3 text-sm font-medium" style={{ color: r.isPrimaryTitle ? 'hsl(38,92%,55%)' : undefined }}>
                      {r.movieTitle}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{r.screeningDate}</td>
                    <td className="p-3 text-xs text-muted-foreground">{r.screeningTime}</td>
                    <td className="p-3 text-xs">{r.format}</td>
                    <td className="p-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${r.matchType === 'exact' ? 'bg-green-400/20 text-green-400' : 'bg-blue-400/20 text-blue-400'}`}>
                        {r.matchType}
                      </span>
                    </td>
                    <td className="p-3"><ConfidenceBadge score={r.discoveryConfidence} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
