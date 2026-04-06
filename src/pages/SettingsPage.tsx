import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { fetchToolSettings, updateToolSettings, fetchChains } from '@/services/supabaseQueries';
import { getAvailableChains } from '@/services/chainRegistry';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [chains, setChains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [primaryMovie, setPrimaryMovie] = useState('2DIE4');
  const [interval, setInterval] = useState('60');
  const [highThreshold, setHighThreshold] = useState('90');
  const [modThreshold, setModThreshold] = useState('70');
  const [defaultChain, setDefaultChain] = useState('');

  useEffect(() => {
    async function load() {
      const [s, c] = await Promise.all([fetchToolSettings(), fetchChains()]);
      if (s) {
        setSettings(s);
        setPrimaryMovie(s.primary_movie_title);
        setInterval(String(s.default_monitoring_interval_minutes));
        setHighThreshold(String(s.high_confidence_threshold));
        setModThreshold(String(s.medium_confidence_threshold));
        setDefaultChain(s.default_chain_id || '');
      }
      setChains(c || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateToolSettings({
        primary_movie_title: primaryMovie,
        default_monitoring_interval_minutes: parseInt(interval) || 60,
        high_confidence_threshold: parseInt(highThreshold) || 90,
        medium_confidence_threshold: parseInt(modThreshold) || 70,
        default_chain_id: defaultChain || null,
      });
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const chainConfigs = getAvailableChains();

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="glass-card p-5 space-y-4 max-w-lg">
        <h3 className="text-sm font-semibold">Monitoring Defaults</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Primary Tracked Movie</Label>
            <Input value={primaryMovie} onChange={e => setPrimaryMovie(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default Monitoring Interval (minutes)</Label>
            <Input type="number" value={interval} onChange={e => setInterval(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default Chain</Label>
            <Select value={defaultChain} onValueChange={setDefaultChain}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                {chains.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4 max-w-lg">
        <h3 className="text-sm font-semibold">Confidence Thresholds</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">High Confidence Min</Label>
            <Input type="number" value={highThreshold} onChange={e => setHighThreshold(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Moderate Confidence Min</Label>
            <Input type="number" value={modThreshold} onChange={e => setModThreshold(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4 max-w-lg">
        <h3 className="text-sm font-semibold">Parser Configuration</h3>
        <p className="text-xs text-muted-foreground">Chain-specific parser settings for the discovery and scraping layer.</p>
        <div className="space-y-2">
          {chainConfigs.map(config => (
            <div key={config.slug} className="flex items-center justify-between p-2 rounded bg-accent/30">
              <div>
                <span className="text-sm font-medium">{config.chainName}</span>
                <span className="text-xs text-muted-foreground ml-2">Strategy: {config.discoveryStrategy}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${config.parserEnabled ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                {config.parserEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
    </div>
  );
}
