import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchMovieComparison } from '@/services/supabaseQueries';

const movieColors: Record<string, string> = {
  '2DIE4': 'hsl(38,92%,55%)',
  'Thunderstrike': 'hsl(210,92%,55%)',
  'The Last Frontier': 'hsl(142,71%,45%)',
  'Neon Shadows': 'hsl(280,65%,60%)',
  'Crimson Tide II': 'hsl(0,72%,51%)',
};

export default function MovieComparisonPage() {
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovieComparison().then(d => { setRawData(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { byCinema, byMovie, imaxOnly, movieTitles } = useMemo(() => {
    const cinemaData: Record<string, Record<string, number>> = {};
    const movieData: Record<string, { total: number; seats: number; count: number }> = {};
    const imaxData: Record<string, number> = {};
    const titles = new Set<string>();

    for (const run of rawData) {
      const occ = (run as any).occupancy_results?.[0];
      const scr = (run as any).monitoring_targets?.screenings;
      if (!occ || !scr) continue;

      const movieTitle = scr.movies?.title;
      const cinemaName = scr.cinemas?.name;
      const format = scr.format;
      if (!movieTitle) continue;
      titles.add(movieTitle);

      if (cinemaName) {
        if (!cinemaData[cinemaName]) cinemaData[cinemaName] = {};
        cinemaData[cinemaName][movieTitle] = (cinemaData[cinemaName][movieTitle] || 0) + (occ.occupied_seats_estimated || 0);
      }

      if (!movieData[movieTitle]) movieData[movieTitle] = { total: 0, seats: 0, count: 0 };
      movieData[movieTitle].total += occ.total_seats_estimated || 0;
      movieData[movieTitle].seats += occ.occupied_seats_estimated || 0;
      movieData[movieTitle].count++;

      if (format === 'IMAX') {
        imaxData[movieTitle] = (imaxData[movieTitle] || 0) + (occ.occupied_seats_estimated || 0);
      }
    }

    const byCinema = Object.entries(cinemaData).slice(0, 8).map(([cinema, md]) => ({
      cinema: cinema.length > 15 ? cinema.slice(0, 15) + '…' : cinema, ...md,
    }));

    const byMovie = Object.entries(movieData).map(([title, d]) => ({
      title,
      avgOccupancy: d.total > 0 ? Math.round((d.seats / d.total) * 100) : 0,
      totalTickets: d.seats,
      snapshots: d.count,
    })).sort((a, b) => b.totalTickets - a.totalTickets);

    const imaxOnly = Object.entries(imaxData).map(([title, seats]) => ({ title, seats })).sort((a, b) => b.seats - a.seats);

    return { byCinema, byMovie, imaxOnly, movieTitles: Array.from(titles) };
  }, [rawData]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Movie Comparison</h1>

      {byMovie.length === 0 ? (
        <div className="glass-card p-8 text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">No comparison data available</p>
          <p className="text-xs text-muted-foreground">
            Movie comparisons require real scrape run data with occupancy results. 
            <Link to="/discovery" className="text-primary hover:underline ml-1">Run a discovery</Link> and 
            <Link to="/targets" className="text-primary hover:underline ml-1">create monitoring targets</Link> first, 
            then ingest scrape results via the scrape-ingest endpoint.
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold mb-3">Rankings</h3>
            <table className="data-table">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="p-2">#</th>
                  <th className="p-2">Movie</th>
                  <th className="p-2">Est. Total Tickets</th>
                  <th className="p-2">Avg Occupancy</th>
                  <th className="p-2">Snapshots</th>
                </tr>
              </thead>
              <tbody>
                {byMovie.map((m, i) => (
                  <tr key={m.title} className="border-b border-border/30 hover:bg-accent/30">
                    <td className="p-2 text-sm font-mono text-muted-foreground">{i + 1}</td>
                    <td className="p-2 text-sm font-medium" style={{ color: movieColors[m.title] }}>{m.title}</td>
                    <td className="p-2 text-sm font-mono">{m.totalTickets.toLocaleString()}</td>
                    <td className="p-2 text-sm font-mono">{m.avgOccupancy}%</td>
                    <td className="p-2 text-sm font-mono">{m.snapshots}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">Est. Sales by Cinema</h3>
              {byCinema.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byCinema}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
                    <XAxis dataKey="cinema" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {movieTitles.map(title => <Bar key={title} dataKey={title} fill={movieColors[title] || 'hsl(215,50%,50%)'} />)}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No cinema-level data available.</p>
              )}
            </div>

            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold mb-3">IMAX Only — Est. Sales</h3>
              {imaxOnly.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={imaxOnly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,14%,18%)" />
                    <XAxis dataKey="title" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'hsl(224,18%,11%)', border: '1px solid hsl(224,14%,18%)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="seats" name="IMAX Est. Seats" fill="hsl(38,92%,55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No IMAX data available.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
