import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const presets = [
  { id: 'daily', name: 'Daily Internal Report', description: 'All sessions, last 24h, high confidence only' },
  { id: 'vs_competitors', name: '2DIE4 vs Competitors', description: 'Comparison data across all cinemas' },
  { id: 'imax', name: 'IMAX Performance Report', description: 'IMAX-only sessions with occupancy trends' },
  { id: 'audit', name: 'Low-Confidence Audit Report', description: 'Snapshots with confidence < 70' },
];

export default function ExportsPage() {
  const [format, setFormat] = useState('csv');
  const [imaxOnly, setImaxOnly] = useState(false);
  const [highConfOnly, setHighConfOnly] = useState(false);

  const handleExport = (presetName?: string) => {
    toast.success(`Export started: ${presetName || 'Custom export'} (${format.toUpperCase()})`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Exports</h1>

      <div className="glass-card p-5 space-y-4 max-w-xl">
        <h3 className="text-sm font-semibold">Custom Export</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data Type</Label>
            <Select defaultValue="snapshots">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="snapshots">Snapshot-level</SelectItem>
                <SelectItem value="sessions">Session summary</SelectItem>
                <SelectItem value="comparison">Movie comparison</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date From</Label>
            <Input type="date" defaultValue="2025-04-01" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date To</Label>
            <Input type="date" defaultValue="2025-04-05" />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Switch id="imax" checked={imaxOnly} onCheckedChange={setImaxOnly} />
            <Label htmlFor="imax" className="text-xs">IMAX only</Label>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <Switch id="highConf" checked={highConfOnly} onCheckedChange={setHighConfOnly} />
            <Label htmlFor="highConf" className="text-xs">High confidence only</Label>
          </div>
        </div>
        <Button onClick={() => handleExport()} className="w-full"><Download size={14} className="mr-1" /> Export</Button>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Export Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {presets.map(p => (
            <div key={p.id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">{p.name}</h4>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleExport(p.name)}>
                <Download size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
