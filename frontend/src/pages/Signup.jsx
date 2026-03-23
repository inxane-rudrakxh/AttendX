import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Brain, User, Mail, Lock, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', roll_number: '', class_name: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created successfully!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
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
          <p style={{ color: '#64748b', fontSize: 14 }}>Create your account</p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="form-input" name="name" placeholder="Your full name"
                  value={form.name} onChange={handleChange} style={{ paddingLeft: 40 }} required />
              </div>
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="form-input" name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} style={{ paddingLeft: 40 }} required />
              </div>
            </div>
            <div>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="form-input" name="password" type="password" placeholder="••••••••"
                  value={form.password} onChange={handleChange} style={{ paddingLeft: 40 }} required />
              </div>
            </div>
            <div>
              <label className="form-label">Role</label>
              <div style={{ position: 'relative' }}>
                <UserCheck size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <select className="form-input" name="role" value={form.role} onChange={handleChange}
                  style={{ paddingLeft: 40, cursor: 'pointer' }}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {form.role === 'student' && (
              <>
                <div>
                  <label className="form-label">Roll Number</label>
                  <input className="form-input" name="roll_number" placeholder="e.g. CS2024001"
                    value={form.roll_number} onChange={handleChange} required />
                </div>
                <div>
                  <label className="form-label">Class / Section</label>
                  <input className="form-input" name="class_name" placeholder="e.g. Computer Science - A"
                    value={form.class_name} onChange={handleChange} required />
                </div>
              </>
            )}
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center', height: 46, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
