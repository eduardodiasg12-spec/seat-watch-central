import { getConfidenceCategory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ConfidenceBadge({ score }: { score: number }) {
  const cat = getConfidenceCategory(score);
  return (
    <Badge variant="outline" className={cn(
      "text-xs font-mono",
      cat.color === 'success' && 'border-success/50 text-success',
      cat.color === 'warning' && 'border-warning/50 text-warning',
      cat.color === 'destructive' && 'border-destructive/50 text-destructive',
    )}>
      {score} — {cat.label}
    </Badge>
  );
}
