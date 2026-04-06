import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pause, Play, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { monitoringTargets, screenings, movies, cinemas, occupancyResults, scrapeRuns, getScreeningDetails } from '@/data/mockData';

export default function MonitoringTargetsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const targets = useMemo(() => {
    return monitoringTargets.map(t => {
      const details = getScreeningDetails(t.screening_id);
      const runs = scrapeRuns.filter(r => r.monitoring_target_id === t.id);
      const lastRun = runs[runs.length - 1];
      const lastOcc = lastRun ? occupancyResults.find(o => o.scrape_run_id === lastRun.id) : null;
      return {
        ...t,
        movie: details?.movie?.title || '—',
        cinema: details?.cinema?.name || '—',
        city: details?.cinema?.city || '—',
        format: details?.screening?.format || '—',
        sessionDate: details?.screening?.session_date || '—',
        sessionTime: details?.screening?.session_time || '—',
        lastOccupied: lastOcc?.occupied_seats_estimated,
        lastConfidence: lastOcc?.confidence_score,
      };
    }).filter(t => !search || t.movie.toLowerCase().includes(search.toLowerCase()) || t.cinema.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monitoring Targets</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus size={16} className="mr-1" /> Add Target</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Monitoring Target</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Cinema Name</Label>
                <Input placeholder="AMC Empire 25" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cinema Chain</Label>
                <Input placeholder="AMC" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input placeholder="New York" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Input placeholder="NY" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <Input placeholder="US" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Auditorium Type</Label>
                <Input placeholder="IMAX Laser" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Session URL</Label>
                <Input placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Movie Name</Label>
                <Input placeholder="2DIE4" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Format</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAX">IMAX</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="3D">3D</SelectItem>
                    <SelectItem value="Dolby Atmos">Dolby Atmos</SelectItem>
                    <SelectItem value="4DX">4DX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Session Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Session Time</Label>
                <Input type="time" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Frequency (min)</Label>
                <Input type="number" defaultValue={60} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch id="primary" />
                <Label htmlFor="primary" className="text-xs">Primary tracked title</Label>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Optional notes" />
              </div>
              <div className="col-span-2">
                <Button className="w-full" onClick={() => setDialogOpen(false)}>Add Target</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Search by movie or cinema..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      <div className="glass-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
              <th className="p-3">Movie</th>
              <th className="p-3">Cinema</th>
              <th className="p-3">City</th>
              <th className="p-3">Date/Time</th>
              <th className="p-3">Format</th>
              <th className="p-3">Freq</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Run</th>
              <th className="p-3">Est. Seats</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {targets.slice(0, 50).map(t => (
              <tr key={t.id} className="border-b border-border/30 hover:bg-accent/30">
                <td className="p-3 text-sm font-medium">
                  <Link to={`/session/${t.screening_id}`} className="hover:text-primary">{t.movie}</Link>
                </td>
                <td className="p-3 text-sm">{t.cinema}</td>
                <td className="p-3 text-xs text-muted-foreground">{t.city}</td>
                <td className="p-3 text-xs text-muted-foreground">{t.sessionDate} {t.sessionTime}</td>
                <td className="p-3 text-xs">{t.format}</td>
                <td className="p-3 text-xs font-mono">{t.frequency_minutes}m</td>
                <td className="p-3">
                  <span className={`text-xs font-medium ${t.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                    {t.is_active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{t.last_run_at ? new Date(t.last_run_at).toLocaleTimeString() : '—'}</td>
                <td className="p-3 text-sm font-mono">{t.lastOccupied ?? '—'}</td>
                <td className="p-3">{t.lastConfidence ? <ConfidenceBadge score={t.lastConfidence} /> : '—'}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button className="p-1 hover:text-primary"><Edit size={14} /></button>
                    <button className="p-1 hover:text-warning">{t.is_active ? <Pause size={14} /> : <Play size={14} />}</button>
                    <button className="p-1 hover:text-destructive"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
