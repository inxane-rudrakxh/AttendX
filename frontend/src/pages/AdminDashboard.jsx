import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import api from '../utils/api'
import { Line, Bar } from 'react-chartjs-2'
import { AlertTriangle, Users, UserCheck, TrendingUp, ShieldAlert, Camera } from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const chartOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } }, tooltip: { backgroundColor: '#1a2035' } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  }
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState([])
  const [intruders, setIntruders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, trendRes, intRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/trends?days=14'),
          api.get('/intruder/logs'),
        ])
        setSummary(sumRes.data)
        setTrends(trendRes.data)
        setIntruders(intRes.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return <Loader />

  const trendLabels = trends.map(t => t.date.slice(5))
  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Present', data: trends.map(t => t.present),
        borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true, tension: 0.4, pointRadius: 3,
      },
      {
        label: 'Absent', data: trends.map(t => t.absent),
        borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.07)',
        fill: true, tension: 0.4, pointRadius: 3,
      },
    ],
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Welcome back, {user?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard title="Total Students" value={summary?.total_students ?? 0} icon={Users} color="#3b82f6" delay={0.1} />
          <StatCard title="Present Today" value={summary?.present_today ?? 0} icon={UserCheck} color="#10b981" delay={0.2} />
          <StatCard title="Absent Today" value={summary?.absent_today ?? 0} icon={AlertTriangle} color="#ef4444" delay={0.3} />
          <StatCard title="Overall Attendance" value={`${summary?.overall_attendance_percentage ?? 0}%`} icon={TrendingUp} color="#8b5cf6" delay={0.4} />
          <StatCard title="At-Risk Students" value={summary?.risk_students_count ?? 0} subtitle="Below 75%" icon={ShieldAlert} color="#f59e0b" delay={0.5} />
          <StatCard title="Intruder Alerts" value={intruders.length} subtitle="Unknown faces" icon={Camera} color="#ef4444" delay={0.6} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Trend chart */}
          <div className="glass-card fade-in-up" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>14-Day Attendance Trend</h3>
            <div style={{ height: 240 }}>
              <Line data={trendData} options={chartOptions} />
            </div>
          </div>

          {/* Risk students */}
          <div className="glass-card fade-in-up" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={16} color="#f59e0b" /> At-Risk Students
            </h3>
            {(summary?.risk_students ?? []).length === 0 ? (
              <p style={{ color: '#64748b', fontSize: 13 }}>No students below 75% attendance 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                {summary.risk_students.map(s => (
                  <div key={s.student_id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.15)'
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</p>
                      <p style={{ fontSize: 11, color: '#64748b' }}>{s.roll_number} · {s.class_name}</p>
                    </div>
                    <span className="badge badge-yellow">{s.attendance_percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Intruder alerts */}
        {intruders.length > 0 && (
          <div className="glass-card fade-in-up" style={{ padding: 24, borderColor: 'rgba(239,68,68,0.2)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} color="#ef4444" /> Recent Intruder Detections
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {intruders.slice(0, 6).map(i => (
                <div key={i.id} className="glass-card" style={{ padding: 10, textAlign: 'center' }}>
                  <div style={{ width: '100%', height: 90, background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={24} color="#ef4444" />
                  </div>
                  <p style={{ fontSize: 11, color: '#64748b' }}>{new Date(i.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
