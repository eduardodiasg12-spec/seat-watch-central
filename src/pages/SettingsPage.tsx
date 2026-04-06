import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [interval, setInterval] = useState('60');
  const [highThreshold, setHighThreshold] = useState('90');
  const [modThreshold, setModThreshold] = useState('70');
  const [defaultMovie, setDefaultMovie] = useState('2DIE4');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="glass-card p-5 space-y-4 max-w-lg">
        <h3 className="text-sm font-semibold">Monitoring Defaults</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Default Monitoring Interval (minutes)</Label>
            <Input type="number" value={interval} onChange={e => setInterval(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default Highlighted Movie</Label>
            <Input value={defaultMovie} onChange={e => setDefaultMovie(e.target.value)} />
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
        <p className="text-xs text-muted-foreground">Chain-specific parser settings will be available when scraping integrations are connected.</p>
        <div className="space-y-2">
          {['AMC', 'Regal', 'Cinemark'].map(chain => (
            <div key={chain} className="flex items-center justify-between p-2 rounded bg-accent/30">
              <span className="text-sm">{chain}</span>
              <span className="text-xs text-muted-foreground">Parser: seat_map_v2</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 space-y-4 max-w-lg">
        <h3 className="text-sm font-semibold">Default Export Preset</h3>
        <Select defaultValue="daily">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily Internal Report</SelectItem>
            <SelectItem value="vs_competitors">2DIE4 vs Competitors</SelectItem>
            <SelectItem value="imax">IMAX Performance</SelectItem>
            <SelectItem value="audit">Low-Confidence Audit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={() => toast.success('Settings saved')}>Save Settings</Button>
    </div>
  );
}
