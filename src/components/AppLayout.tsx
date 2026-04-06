import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Film, Building2, Download, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/targets', icon: Target, label: 'Monitoring Targets' },
  { to: '/movies', icon: Film, label: 'Movies' },
  { to: '/cinemas', icon: Building2, label: 'Cinemas' },
  { to: '/exports', icon: Download, label: 'Exports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}>
        <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
          {!collapsed && <span className="text-lg font-bold text-primary tracking-tight">2DIE4</span>}
          {!collapsed && <span className="text-xs text-muted-foreground">Ticket Tracker</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-muted-foreground hover:text-foreground">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="flex-1 py-2 space-y-0.5">
          {navItems.map(item => {
            const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-primary font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        {!collapsed && (
          <div className="px-4 py-3 border-t border-sidebar-border text-xs text-muted-foreground">
            Internal Tool v1.0
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
