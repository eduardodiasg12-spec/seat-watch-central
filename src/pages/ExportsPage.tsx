import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { exportData, downloadBlob, ExportFilters } from '@/services/exportService';

const presets = [
  { id: 'daily', name: 'Daily Internal Report', description: 'All snapshots, last 24h, high confidence only', filters: { dataType: 'snapshots' as const, highConfidenceOnly: true } },
  { id: 'vs_competitors', name: '2DIE4 vs Competitors', description: 'Comparison data across all cinemas', filters: { dataType: 'comparison' as const } },
  { id: 'imax', name: 'IMAX Performance Report', description: 'IMAX-only sessions with occupancy data', filters: { dataType: 'snapshots' as const, imaxOnly: true } },
  { id: 'audit', name: 'Low-Confidence Audit Report', description: 'All snapshots (filter for low confidence manually)', filters: { dataType: 'snapshots' as const } },
];

export default function ExportsPage() {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [imaxOnly, setImaxOnly] = useState(false);
  const [highConfOnly, setHighConfOnly] = useState(false);
  const [dataType, setDataType] = useState<'snapshots' | 'sessions' | 'comparison'>('snapshots');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  async function handleExport(filters?: Partial<ExportFilters>, presetName?: string) {
    setExporting(true);
    try {
      const f: ExportFilters = {
        dataType: filters?.dataType || dataType,
        imaxOnly: filters?.imaxOnly ?? imaxOnly,
        highConfidenceOnly: filters?.highConfidenceOnly ?? highConfOnly,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };
      const blob = await exportData(f, format);
      if (blob.size <= 2) {
        toast.warning('No real data available for this export. Ingest scrape results first.');
        return;
      }
      const name = `${presetName || 'export'}_${new Date().toISOString().slice(0, 10)}.${format}`;
      downloadBlob(blob, name);
      toast.success(`Export downloaded: ${name}`);
    } catch (e: any) {
      toast.error(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Exports</h1>

      <div className="glass-card p-5 space-y-4 max-w-xl">
        <h3 className="text-sm font-semibold">Custom Export</h3>
        <p className="text-xs text-muted-foreground">Exports contain only real persisted data from the database. If no data matches your filters, the export will be empty.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Format</Label>
            <Select value={format} onValueChange={v => setFormat(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data Type</Label>
            <Select value={dataType} onValueChange={v => setDataType(v as any)}>
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
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date To</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
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
        <Button onClick={() => handleExport()} className="w-full" disabled={exporting}>
          <Download size={14} className="mr-1" /> {exporting ? 'Exporting...' : 'Export'}
        </Button>
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
              <Button size="sm" variant="outline" onClick={() => handleExport(p.filters, p.name)} disabled={exporting}>
                <Download size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
