import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, IndianRupee, FileSpreadsheet, LogOut, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/batches', label: 'Batches', icon: Users },
  { to: '/fees', label: 'Log Fees', icon: IndianRupee },
  { to: '/reports', label: 'Reports', icon: FileSpreadsheet },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-bg-secondary border-r border-border fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-indigo flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">TuitionTracker</h1>
            <p className="text-xs text-text-muted uppercase tracking-wider">Fee Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-light text-accent'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer — User + Logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-accent text-xs font-bold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-text-muted">v2.0 Beta</p>
          </div>
          <button
            className="p-1.5 rounded-lg hover:bg-danger-light text-text-muted hover:text-danger transition-colors"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
