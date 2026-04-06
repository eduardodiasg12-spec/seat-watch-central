import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
}

export default function KPICard({ label, value, subtitle, icon: Icon, trend, variant = 'default' }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && <Icon size={14} className="text-muted-foreground" />}
      </div>
      <div className={cn(
        "text-2xl font-bold",
        variant === 'primary' && 'text-primary',
        variant === 'success' && 'text-success',
        variant === 'warning' && 'text-warning',
        variant === 'destructive' && 'text-destructive',
      )}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="flex items-center gap-2">
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        {trend !== undefined && (
          <span className={cn("text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
