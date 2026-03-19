import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, IndianRupee, FileSpreadsheet } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/batches', label: 'Batches', icon: Users },
  { to: '/fees', label: 'Fees', icon: IndianRupee },
  { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border-t border-border z-40">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'text-accent'
                  : 'text-text-muted'
              }`
            }
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
