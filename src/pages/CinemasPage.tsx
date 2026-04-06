import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCinemas } from '@/services/supabaseQueries';

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCinemas().then(d => { setCinemas(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cinemas</h1>
      {cinemas.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          No cinemas yet. Run a <Link to="/discovery" className="text-primary hover:underline">Network Discovery</Link> to find cinemas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cinemas.map(c => (
            <Link key={c.id} to={`/cinemas/${c.id}`} className="glass-card p-4 hover:border-primary/30 transition-colors">
              <h3 className="font-semibold text-sm">{c.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{(c as any).cinema_chains?.name || '—'} · {c.city}, {c.state}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
