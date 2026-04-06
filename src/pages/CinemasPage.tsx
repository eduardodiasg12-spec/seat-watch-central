import { Link } from 'react-router-dom';
import { cinemas } from '@/data/mockData';

export default function CinemasPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cinemas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {cinemas.map(c => (
          <Link key={c.id} to={`/cinemas/${c.id}`} className="glass-card p-4 hover:border-primary/30 transition-colors">
            <h3 className="font-semibold text-sm">{c.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{c.chain} · {c.city}, {c.state}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
