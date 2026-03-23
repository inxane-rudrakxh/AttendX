import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Loader from '../components/Loader'
import api from '../utils/api'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { TrendingUp, Users, BarChart2 } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

const baseChartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  }
}

export default function AnalyticsPage() {
  const [trends, setTrends] = useState([])
  const [classwise, setClasswise] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [t, c, s] = await Promise.all([
          api.get(`/analytics/trends?days=${period}`),
          api.get('/analytics/class-wise'),
          api.get('/analytics/summary'),
        ])
        setTrends(t.data)
        setClasswise(c.data)
        setSummary(s.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [period])

  if (loading) return <div style={{ display: 'flex' }}><Sidebar /><main className="main-content"><Loader fullScreen={false} /></main></div>

  const trendData = {
    labels: trends.map(t => t.date.slice(5)),
    datasets: [
      { label: 'Present', data: trends.map(t => t.present), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 2 },
      { label: 'Absent', data: trends.map(t => t.absent), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.07)', fill: true, tension: 0.4, pointRadius: 2 },
    ],
  }

  const classwiseData = {
    labels: classwise.map(c => c.class_name),
    datasets: [{
      label: 'Attendance %',
      data: classwise.map(c => c.attendance_percentage),
      backgroundColor: classwise.map((_, i) => ['rgba(59,130,246,0.7)', 'rgba(139,92,246,0.7)', 'rgba(6,182,212,0.7)', 'rgba(16,185,129,0.7)'][i % 4]),
      borderRadius: 6,
    }],
  }

  const riskData = {
    labels: ['At Risk (<75%)', 'Safe (≥75%)'],
    datasets: [{
      data: [summary?.risk_students_count ?? 0, (summary?.total_students ?? 0) - (summary?.risk_students_count ?? 0)],
      backgroundColor: ['rgba(239,68,68,0.8)', 'rgba(16,185,129,0.8)'],
      borderColor: ['#0a0f1e'], borderWidth: 2,
    }],
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
              <span className="gradient-text">Analytics</span> Overview
            </h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>Attendance trends, class performance, and risk analysis</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 14, 30, 60].map(d => (
              <button key={d} onClick={() => setPeriod(d)}
                className={period === d ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '8px 14px', fontSize: 12 }}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Students', val: summary?.total_students ?? 0, icon: Users, color: '#3b82f6' },
            { label: 'Overall Attendance', val: `${summary?.overall_attendance_percentage ?? 0}%`, icon: TrendingUp, color: '#10b981' },
            { label: 'At-Risk Students', val: summary?.risk_students_count ?? 0, icon: BarChart2, color: '#f59e0b' },
          ].map(k => (
            <div key={k.label} className="glass-card glass-card-hover fade-in-up" style={{ padding: 20 }}>
              <k.icon size={20} color={k.color} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 26, fontWeight: 800 }}>{k.val}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="glass-card fade-in-up" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{period}-Day Attendance Trend</h3>
            <div style={{ height: 260 }}>
              <Line data={trendData} options={baseChartOpts} />
            </div>
          </div>
          <div className="glass-card fade-in-up" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Risk Distribution</h3>
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={riskData} options={{ plugins: { legend: { labels: { color: '#94a3b8' } } }, cutout: '65%' }} />
            </div>
          </div>
        </div>

        <div className="glass-card fade-in-up" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Class-Wise Attendance %</h3>
          <div style={{ height: 220 }}>
            <Bar data={classwiseData} options={{ ...baseChartOpts, scales: { ...baseChartOpts.scales, y: { ...baseChartOpts.scales.y, max: 100 } } }} />
          </div>
        </div>

        {/* Percentage trend table */}
        <div className="glass-card fade-in-up" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Daily Breakdown</h3>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>{['Date', 'Present', 'Absent', 'Total', 'Rate'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[...trends].reverse().slice(0, 20).map(t => (
                  <tr key={t.date}>
                    <td>{t.date}</td>
                    <td><span className="badge badge-green">{t.present}</span></td>
                    <td><span className="badge badge-red">{t.absent}</span></td>
                    <td style={{ color: '#94a3b8' }}>{t.total}</td>
                    <td>
                      <span className={`badge ${t.percentage >= 75 ? 'badge-green' : t.percentage >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                        {t.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
