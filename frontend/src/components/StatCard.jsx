export default function StatCard({ title, value, subtitle, icon: Icon, color = '#3b82f6', delay = 0 }) {
  return (
    <div className="glass-card glass-card-hover fade-in-up"
      style={{ padding: 24, animationDelay: `${delay}s`, opacity: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}20`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 2 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</div>}
    </div>
  )
}
