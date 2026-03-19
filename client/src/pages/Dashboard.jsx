import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, IndianRupee, AlertCircle, TrendingUp, Plus, ChevronRight, FileSpreadsheet, LogOut } from 'lucide-react';
import { fetchDashboard } from '../api';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name) {
  return name?.charAt(0)?.toUpperCase() || '?';
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const s = stats || { total_students: 0, total_batches: 0, collected_this_month: 0, pending_this_month: 0, expected_this_month: 0, recent_payments: [] };
  const now = new Date();
  const monthLabel = MONTH_NAMES[now.getMonth()];

  const statCards = [
    {
      label: 'Total Students',
      value: s.total_students,
      icon: <Users size={22} />,
      iconBg: 'bg-indigo-light text-indigo',
    },
    {
      label: `Collected (${monthLabel})`,
      value: `₹${s.collected_this_month.toLocaleString()}`,
      icon: <TrendingUp size={22} />,
      iconBg: 'bg-success-light text-success',
    },
    {
      label: `Pending (${monthLabel})`,
      value: `₹${s.pending_this_month.toLocaleString()}`,
      icon: <AlertCircle size={22} />,
      iconBg: 'bg-danger-light text-danger',
    },
    {
      label: `Expected (${monthLabel})`,
      value: `₹${s.expected_this_month.toLocaleString()}`,
      icon: <IndianRupee size={22} />,
      iconBg: 'bg-accent-light text-accent',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-text-secondary text-[11px] sm:text-sm mt-1">Here's what's happening with your classes today.</p>
        </div>
        <button className="btn btn-primary py-2 px-3.5 text-xs sm:py-2.5 sm:px-5 sm:text-sm shrink-0" onClick={() => navigate('/fees')}>
          <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
          Log Fee
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="glass-card p-4 sm:p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs text-text-secondary font-medium tracking-tight pr-1 leading-tight">{card.label}</span>
              <div className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${card.iconBg}`}>
                <div className="scale-75 sm:scale-100">{card.icon}</div>
              </div>
            </div>
            <p className="text-[20px] sm:text-2xl md:text-3xl font-bold tracking-tight mt-1 truncate">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Payments + Quick Actions */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Recent Payments */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">Recent Payments</h2>
            <button className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 transition-colors" onClick={() => navigate('/fees')}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          {s.recent_payments.length === 0 ? (
            <p className="text-text-muted text-sm py-8 text-center">No payments recorded yet</p>
          ) : (
            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {s.recent_payments.map((p, i) => (
                <div key={p.id || i} className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-bg-tertiary/40 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${getAvatarColor(p.student_name)}`}>
                    {getInitial(p.student_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{p.student_name}</p>
                    <p className="text-xs text-text-muted truncate">
                      {p.batch_name} · {MONTH_NAMES[p.fee_month - 1]} {p.fee_year}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">₹{p.amount_paid}</p>
                    <span className="badge badge-paid text-[10px]">Paid</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="font-semibold text-lg mb-5">Quick Actions</h2>
          <div className="space-y-3">
            <button
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-bg-tertiary/50 border border-border hover:border-border-light hover:bg-bg-tertiary transition-all group"
              onClick={() => navigate('/batches')}
            >
              <Users size={18} className="text-text-secondary" />
              <span className="flex-1 text-left text-sm font-medium">Manage Batches</span>
              <ChevronRight size={16} className="text-text-muted group-hover:text-text-secondary transition-colors" />
            </button>
            <button
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-bg-tertiary/50 border border-border hover:border-border-light hover:bg-bg-tertiary transition-all group"
              onClick={() => navigate('/fees')}
            >
              <IndianRupee size={18} className="text-text-secondary" />
              <span className="flex-1 text-left text-sm font-medium">Record Payment</span>
              <ChevronRight size={16} className="text-text-muted group-hover:text-text-secondary transition-colors" />
            </button>
            <button
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-bg-tertiary/50 border border-border hover:border-border-light hover:bg-bg-tertiary transition-all group"
              onClick={() => navigate('/reports')}
            >
              <FileSpreadsheet size={18} className="text-text-secondary" />
              <span className="flex-1 text-left text-sm font-medium">View Reports</span>
              <ChevronRight size={16} className="text-text-muted group-hover:text-text-secondary transition-colors" />
            </button>
            <button
              className="w-full lg:hidden flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20 hover:border-danger/40 hover:bg-danger/20 transition-all group mt-2"
              onClick={logout}
            >
              <LogOut size={18} className="text-danger" />
              <span className="flex-1 text-left text-sm font-medium text-danger">Logout</span>
              <ChevronRight size={16} className="text-danger/50 group-hover:text-danger transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
