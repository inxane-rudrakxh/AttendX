import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Loader from '../components/Loader'
import api from '../utils/api'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function StudentDashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get student profile to get student_id
        const profileRes = await api.get('/users/me')
        const studentsRes = await api.get('/students/')
        const myStudent = studentsRes.data.find(s => s.user_id === user.id)
        if (!myStudent) return

        const [analyticsRes, historyRes] = await Promise.all([
          api.get(`/analytics/student/${myStudent.id}`),
          api.get(`/attendance/student/${myStudent.id}`),
        ])
        setAnalytics(analyticsRes.data)
        setHistory(historyRes.data.slice(0, 30))
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [user.id])

  if (loading) return <Loader />

  const pct = analytics?.attendance_percentage ?? 0
  const atRisk = analytics?.at_risk ?? false

  const donutData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{
      data: [analytics?.present_count ?? 0, analytics?.absent_count ?? 0, analytics?.late_count ?? 0],
      backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(239,68,68,0.8)', 'rgba(245,158,11,0.8)'],
      borderColor: ['#0d1428'],
      borderWidth: 2,
    }],
  }

  const statusIcon = (status) => {
    if (status === 'present') return <CheckCircle size={14} color="#10b981" />
    if (status === 'absent') return <XCircle size={14} color="#ef4444" />
    return <Clock size={14} color="#f59e0b" />
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            My <span className="gradient-text">Attendance</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {user?.name} · {analytics?.roll_number} · {analytics?.class_name}
          </p>
        </div>

        {/* Risk alert */}
        {atRisk && (
          <div className="fade-in-up" style={{ padding: '14px 20px', borderRadius: 12, marginBottom: 24,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} color="#ef4444" />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#ef4444' }}>⚠️ Low Attendance Warning</p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Your attendance ({pct}%) is below the required 75% threshold.</p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Attendance summary */}
          <div className="glass-card fade-in-up" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Attendance Summary</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ position: 'relative', width: 160, height: 160 }}>
                <Doughnut data={donutData} options={{ plugins: { legend: { display: false } }, cutout: '72%' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: pct >= 75 ? '#10b981' : '#ef4444' }}>{pct}%</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>attendance</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Present', count: analytics?.present_count, color: '#10b981' },
                  { label: 'Absent', count: analytics?.absent_count, color: '#ef4444' },
                  { label: 'Late', count: analytics?.late_count, color: '#f59e0b' },
                  { label: 'Total Classes', count: analytics?.total_classes, color: '#3b82f6' },
                ].map(i => (
                  <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{i.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: i.color }}>{i.count ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Required: 75%</span>
                <span style={{ fontSize: 12, color: pct >= 75 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{pct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 75 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #ef4444, #f87171)' }} />
              </div>
            </div>
          </div>

          {/* Recent history */}
          <div className="glass-card fade-in-up" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Recent History</h3>
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 13 }}>No attendance records yet.</p>
              ) : history.map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {statusIcon(h.status)}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{h.date}</p>
                      <p style={{ fontSize: 11, color: '#64748b' }}>{h.time?.slice(0, 5)}</p>
                    </div>
                  </div>
                  <span className={`badge ${h.status === 'present' ? 'badge-green' : h.status === 'late' ? 'badge-yellow' : 'badge-red'}`}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
