import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pause, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import ConfidenceBadge from '@/components/ConfidenceBadge';
import { fetchMonitoringTargets, createMonitoringTarget, updateMonitoringTarget, deleteMonitoringTarget, fetchLatestOccupancyForTarget, fetchCinemas, fetchMovies } from '@/services/supabaseQueries';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function MonitoringTargetsPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [formCinema, setFormCinema] = useState('');
  const [formMovie, setFormMovie] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formFormat, setFormFormat] = useState('Standard');
  const [formUrl, setFormUrl] = useState('');
  const [formFreq, setFormFreq] = useState('60');

  useEffect(() => { loadTargets(); }, []);

  async function loadTargets() {
    setLoading(true);
    try {
      const data = await fetchMonitoringTargets();
      setTargets(data || []);
      const [c, m] = await Promise.all([fetchCinemas(), fetchMovies()]);
      setCinemas(c || []);
      setMovies(m || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formCinema || !formMovie || !formDate || !formTime) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      // Create screening first
      const { data: screening, error: scrErr } = await supabase.from('screenings').insert({
        cinema_id: formCinema,
        movie_id: formMovie,
        screening_date: formDate,
        screening_time: formTime,
        format: formFormat,
        booking_url: formUrl || null,
      }).select('id').single();
      if (scrErr) throw scrErr;

      await createMonitoringTarget({
        screening_id: screening.id,
        target_url: formUrl || undefined,
        monitoring_frequency_minutes: parseInt(formFreq) || 60,
      });
      toast.success('Monitoring target created');
      setDialogOpen(false);
      loadTargets();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    await updateMonitoringTarget(id, { is_active: !currentActive });
    toast.success(currentActive ? 'Target paused' : 'Target resumed');
    loadTargets();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this monitoring target?')) return;
    await deleteMonitoringTarget(id);
    toast.success('Target deleted');
    loadTargets();
  }

  const filtered = targets.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    const movie = t.screenings?.movies?.title || '';
    const cinema = t.screenings?.cinemas?.name || '';
    return movie.toLowerCase().includes(s) || cinema.toLowerCase().includes(s);
  });

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
                <Label className="text-xs">Cinema</Label>
                <Select value={formCinema} onValueChange={setFormCinema}>
                  <SelectTrigger><SelectValue placeholder="Select cinema" /></SelectTrigger>
                  <SelectContent>
                    {cinemas.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.city})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Movie</Label>
                <Select value={formMovie} onValueChange={setFormMovie}>
                  <SelectTrigger><SelectValue placeholder="Select movie" /></SelectTrigger>
                  <SelectContent>
                    {movies.map(m => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Session Date</Label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Session Time</Label>
                <Input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Format</Label>
                <Select value={formFormat} onValueChange={setFormFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['IMAX', 'Standard', '3D', 'Dolby Atmos', '4DX', 'RPX'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Frequency (min)</Label>
                <Input type="number" value={formFreq} onChange={e => setFormFreq(e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Session URL</Label>
                <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <Button className="w-full" onClick={handleCreate}>Create Target</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Search by movie or cinema..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      {loading ? (
        <div className="glass-card p-8 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          No monitoring targets. <Link to="/discovery" className="text-primary hover:underline">Run a discovery</Link> or add one manually.
        </div>
      ) : (
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
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(t => (
                <tr key={t.id} className="border-b border-border/30 hover:bg-accent/30">
                  <td className="p-3 text-sm font-medium">
                    <Link to={`/session/${t.screening_id}`} className="hover:text-primary">
                      {t.screenings?.movies?.title || '—'}
                    </Link>
                  </td>
                  <td className="p-3 text-sm">{t.screenings?.cinemas?.name || '—'}</td>
                  <td className="p-3 text-xs text-muted-foreground">{t.screenings?.cinemas?.city || '—'}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {t.screenings?.screening_date} {t.screenings?.screening_time}
                  </td>
                  <td className="p-3 text-xs">{t.screenings?.format || '—'}</td>
                  <td className="p-3 text-xs font-mono">{t.monitoring_frequency_minutes}m</td>
                  <td className="p-3">
                    <span className={`text-xs font-medium ${t.is_active ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {t.is_active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {t.last_run_at ? new Date(t.last_run_at).toLocaleString() : '—'}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleToggle(t.id, t.is_active)} className="p-1 hover:text-primary">
                        {t.is_active ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
