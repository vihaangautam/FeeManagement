export default function StatCard({ icon: Icon, label, value, color = 'accent', delay = 0 }) {
  const colorMap = {
    accent: 'text-accent bg-accent-light',
    indigo: 'text-indigo bg-indigo-light',
    danger: 'text-danger bg-danger-light',
    warning: 'text-warning bg-warning-light',
    success: 'text-success bg-success-light',
  };

  return (
    <div
      className="glass-card p-5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm text-text-secondary font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
