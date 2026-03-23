import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../utils/api'
import Webcam from 'react-webcam'
import toast from 'react-hot-toast'
import { Camera, Play, Square, UserPlus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function AttendancePage() {
  const [students, setStudents] = useState([])
  const [scanning, setScanning] = useState(false)
  const [cameraOn, setCameraOn] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [registerMode, setRegisterMode] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const webcamRef = useRef(null)
  const scanInterval = useRef(null)

  useEffect(() => {
    api.get('/students/').then(r => setStudents(r.data)).catch(console.error)
    return () => clearInterval(scanInterval.current)
  }, [])

  const startCamera = () => setCameraOn(true)
  const stopCamera = () => { setCameraOn(false); stopScanning() }

  const startScanning = () => {
    setScanning(true)
    scanInterval.current = setInterval(captureAndRecognize, 2500)
    toast.success('Auto-scanning started')
  }

  const stopScanning = () => {
    setScanning(false)
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
      }
    } catch (e) { console.error(e) }
  }, [])

  const captureOnce = async () => {
    if (!webcamRef.current) return
    const screenshot = webcamRef.current.getScreenshot()
    if (!screenshot) return
    try {
      const res = await api.post('/attendance/mark-face', { image: screenshot })
      setLastResult(res.data)
      if (res.data.recognized) {
        toast.success(res.data.message)
      } else {
        toast.error('Face not recognized – logged as intruder')
      }
    } catch (e) { toast.error('Recognition failed') }
  }

  const registerFace = async () => {
    if (!webcamRef.current || !selectedStudent) return
    const screenshot = webcamRef.current.getScreenshot()
    if (!screenshot) return
    try {
      await api.post(`/students/${selectedStudent}/register-face-base64`, { image: screenshot })
      toast.success('Face registered successfully!')
      setRegisterMode(false)
    } catch (e) { toast.error('Failed to register face') }
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            <span className="gradient-text">Attendance</span> Camera
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Use face recognition to mark attendance automatically
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
          {/* Camera view */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {!cameraOn ? (
                <button className="btn-primary" onClick={startCamera}><Camera size={16} /> Start Camera</button>
              ) : (
                <>
                  <button className="btn-danger" onClick={stopCamera}><Square size={16} /> Stop Camera</button>
                  {!scanning ? (
                    <button className="btn-primary" onClick={startScanning} style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                      <Play size={16} /> Auto-Scan
                    </button>
                  ) : (
                    <button className="btn-ghost" onClick={stopScanning}><Square size={16} /> Stop Auto-Scan</button>
                  )}
                  <button className="btn-ghost" onClick={captureOnce}><Camera size={16} /> Capture Once</button>
                </>
              )}
            </div>

            <div style={{ borderRadius: 14, overflow: 'hidden', background: '#050a14', position: 'relative', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cameraOn ? (
                <>
                  <Webcam ref={webcamRef} screenshotFormat="image/jpeg"
                    style={{ width: '100%', display: 'block' }}
                    videoConstraints={{ width: 640, height: 480, facingMode: 'user' }} />
                  {scanning && (
                    <>
                      <div style={{ position: 'absolute', inset: 0, border: '2px solid #3b82f6', borderRadius: 14, pointerEvents: 'none', animation: 'pulse-ring 2s infinite' }} />
                      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.2)', padding: '6px 12px', borderRadius: 20 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-ring 1s infinite' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>SCANNING</span>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Camera size={56} color="#1e2d4a" />
                  <p style={{ color: '#475569', marginTop: 12, fontSize: 14 }}>Camera is off. Click "Start Camera" to begin.</p>
                </div>
              )}
            </div>

            {/* Result */}
            {lastResult && (
              <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12,
                background: lastResult.recognized ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${lastResult.recognized ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {lastResult.recognized ? <CheckCircle size={20} color="#10b981" /> : <XCircle size={20} color="#ef4444" />}
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{lastResult.message}</p>
                    {lastResult.student_name && <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {lastResult.roll_number} · {lastResult.class_name}
                    </p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Register face panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={16} color="#3b82f6" /> Register Student Face
              </h3>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                Capture a student's face to enable face recognition attendance.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <select className="form-input" value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
                  <option value="">Select student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                  ))}
                </select>
                <button className="btn-primary" onClick={() => { startCamera(); setRegisterMode(true) }}
                  disabled={!selectedStudent} style={{ justifyContent: 'center', opacity: selectedStudent ? 1 : 0.5 }}>
                  <Camera size={16} /> Open Camera
                </button>
                {registerMode && cameraOn && selectedStudent && (
                  <button className="btn-primary" onClick={registerFace}
                    style={{ background: 'linear-gradient(135deg,#10b981,#059669)', justifyContent: 'center' }}>
                    <CheckCircle size={16} /> Capture & Register
                  </button>
                )}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} color="#f59e0b" /> Instructions
              </h3>
              <ol style={{ color: '#94a3b8', fontSize: 13, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Start the camera using the button above.</li>
                <li>Use <strong>Auto-Scan</strong> to continuously scan faces every 2.5 seconds.</li>
                <li>Use <strong>Capture Once</strong> to recognize a single frame.</li>
                <li>Recognized students are automatically marked as <em>present</em>.</li>
                <li>Unknown faces are logged as intruder alerts.</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
