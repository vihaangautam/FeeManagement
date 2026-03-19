import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, IndianRupee, AlertCircle, TrendingUp, Plus, Clock } from 'lucide-react';
import StatCard from '../components/StatCard';
import { fetchDashboard } from '../api';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Welcome back! Here's your overview.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/fees')}>
          <Plus size={18} />
          <span className="hidden sm:inline">Log Fee</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={s.total_students} color="indigo" delay={0} />
        <StatCard icon={TrendingUp} label="Collected" value={`₹${s.collected_this_month.toLocaleString()}`} color="success" delay={100} />
        <StatCard icon={AlertCircle} label="Pending" value={`₹${s.pending_this_month.toLocaleString()}`} color="danger" delay={200} />
        <StatCard icon={IndianRupee} label="Expected" value={`₹${s.expected_this_month.toLocaleString()}`} color="accent" delay={300} />
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-secondary w-full justify-center" onClick={() => navigate('/batches')}>
              <Users size={18} /> Manage Batches
            </button>
            <button className="btn btn-secondary w-full justify-center" onClick={() => navigate('/fees')}>
              <IndianRupee size={18} /> Record Payment
            </button>
            <button className="btn btn-secondary w-full justify-center col-span-2" onClick={() => navigate('/reports')}>
              <TrendingUp size={18} /> View Reports
            </button>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock size={18} className="text-text-secondary" />
            Recent Payments
          </h2>
          {s.recent_payments.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">No payments recorded yet</p>
          ) : (
            <div className="space-y-3">
              {s.recent_payments.map((p, i) => (
                <div key={p.id || i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-sm">{p.student_name}</p>
                    <p className="text-xs text-text-muted">
                      {p.batch_name} · {MONTH_NAMES[p.fee_month - 1]} {p.fee_year}
                    </p>
                  </div>
                  <span className="font-semibold text-accent">₹{p.amount_paid}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
