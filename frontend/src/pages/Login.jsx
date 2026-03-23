import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brain, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    const demos = {
      admin: { email: 'admin@attendx.com', password: 'admin123' },
      teacher: { email: 'teacher@attendx.com', password: 'teacher123' },
      student: { email: 'alice@attendx.com', password: 'student123' },
    }
    setEmail(demos[role].email)
    setPassword(demos[role].password)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 0 40px rgba(59,130,246,0.3)'
          }}>
            <Brain size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 6 }}>
            <span className="gradient-text">Attend</span>
            <span style={{ color: '#f1f5f9' }}>X</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>AI-Powered Smart Attendance System</p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 28 }}>Enter your credentials to continue</p>

          {/* Demo buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['admin', 'teacher', 'student'].map(role => (
              <button key={role} onClick={() => fillDemo(role)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontSize: 12,
                  cursor: 'pointer', textTransform: 'capitalize', fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(59,130,246,0.1)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.04)'}
              >
                {role}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginBottom: 20 }}>
            ↑ Quick-fill demo credentials
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="form-input" type="email" placeholder="you@attendx.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{ paddingLeft: 40 }} required />
              </div>
            </div>
            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ paddingLeft: 40, paddingRight: 44 }} required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center', height: 46, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : <><LogIn size={16} /> Sign In</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
