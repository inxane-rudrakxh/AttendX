import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import Loader from '../components/Loader'
import api from '../utils/api'
import Webcam from 'react-webcam'
import toast from 'react-hot-toast'
import { Camera, Users, UserCheck, Download, CheckCircle, XCircle, Play, Square } from 'lucide-react'

export default function TeacherDashboard() {
  const [summary, setSummary] = useState(null)
  const [logs, setLogs] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [capturing, setCapturing] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const webcamRef = useRef(null)
  const scanInterval = useRef(null)

  useEffect(() => {
    fetchData()
    return () => clearInterval(scanInterval.current)
  }, [])

  const fetchData = async () => {
    try {
      const [sumRes, logRes, stuRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/attendance/?start_date=' + new Date().toISOString().slice(0, 10)),
        api.get('/students/'),
      ])
      setSummary(sumRes.data)
      setLogs(logRes.data)
      setStudents(stuRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const startScanning = () => {
    setScanning(true)
    setCapturing(true)
    scanInterval.current = setInterval(captureAndRecognize, 3000)
  }

  const stopScanning = () => {
    setScanning(false)
    setCapturing(false)
    clearInterval(scanInterval.current)
  }

  const captureAndRecognize = useCallback(async () => {
    if (!webcamRef.current) return
    const screenshot = webcamRef.current.getScreenshot()
    if (!screenshot) return
    try {
      const res = await api.post('/attendance/mark-face', { image: screenshot })
      setLastResult(res.data)
      if (res.data.recognized && !res.data.already_marked) {
        toast.success(`✅ ${res.data.student_name} marked present!`)
        fetchData()
      }
    } catch (e) { console.error(e) }
  }, [])

  const exportCSV = async () => {
    const res = await api.get('/attendance/export-csv', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a'); a.href = url; a.download = 'attendance_report.csv'; a.click()
    toast.success('CSV downloaded!')
  }

  if (loading) return <Loader />

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Teacher <span className="gradient-text">Dashboard</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard title="Total Students" value={summary?.total_students ?? 0} icon={Users} color="#3b82f6" delay={0.1} />
          <StatCard title="Present Today" value={summary?.present_today ?? 0} icon={UserCheck} color="#10b981" delay={0.2} />
          <StatCard title="Attendance %" value={`${summary?.overall_attendance_percentage ?? 0}%`} icon={Camera} color="#8b5cf6" delay={0.3} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Camera panel */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Face Recognition Scanner</h3>
              <button onClick={exportCSV} className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, background: '#000', position: 'relative' }}>
              {capturing ? (
                <Webcam ref={webcamRef} screenshotFormat="image/jpeg" style={{ width: '100%', display: 'block', maxHeight: 280 }}
                  videoConstraints={{ width: 640, height: 480, facingMode: 'user' }} />
              ) : (
                <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <Camera size={48} color="#334155" />
                  <p style={{ color: '#64748b', fontSize: 13 }}>Camera is off</p>
                </div>
              )}
              {scanning && (
                <div style={{ position: 'absolute', inset: 0, border: '2px solid #3b82f6', borderRadius: 12, pointerEvents: 'none',
                  animation: 'pulse-ring 2s infinite' }} />
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {!scanning ? (
                <button className="btn-primary" onClick={startScanning} style={{ flex: 1, justifyContent: 'center' }}>
                  <Play size={16} /> Start Scanning
                </button>
              ) : (
                <button className="btn-danger" onClick={stopScanning} style={{ flex: 1, justifyContent: 'center' }}>
                  <Square size={16} /> Stop Scanning
                </button>
              )}
            </div>

            {lastResult && (
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10,
                background: lastResult.recognized ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${lastResult.recognized ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {lastResult.recognized
                    ? <CheckCircle size={16} color="#10b981" />
                    : <XCircle size={16} color="#ef4444" />}
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{lastResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Today's attendance */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Today's Attendance Log</h3>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {logs.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: 13 }}>No attendance records for today yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Name', 'Roll', 'Time', 'Status'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', fontSize: 11, textAlign: 'left', color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id}>
                        <td style={{ padding: '10px', fontSize: 13 }}>{l.student_name}</td>
                        <td style={{ padding: '10px', fontSize: 12, color: '#64748b' }}>{l.roll_number}</td>
                        <td style={{ padding: '10px', fontSize: 12, color: '#64748b' }}>{l.time?.slice(0, 5)}</td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge ${l.status === 'present' ? 'badge-green' : 'badge-red'}`}>{l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
