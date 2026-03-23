import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { User, Lock, Save, Info } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match')
    }
    setLoading(true)
    try {
      const payload = {}
      if (form.name !== user.name) payload.name = form.name
      if (form.email !== user.email) payload.email = form.email
      if (form.password) payload.password = form.password

      if (Object.keys(payload).length === 0) {
        toast('No changes to save', { icon: 'ℹ️' })
        return
      }
      await api.put('/users/me', payload)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            <span className="gradient-text">Settings</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Manage your profile and preferences</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
          {/* Profile form */}
          <div className="glass-card fade-in-up" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={16} color="#3b82f6" /> Profile Information
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
              </div>
              <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={14} /> Change Password
              </h4>
              <div>
                <label className="form-label">New Password</label>
                <input className="form-input" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current" />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input className="form-input" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter new password" />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', height: 44 }}>
                {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
              </button>
            </form>
          </div>

          {/* Account info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-card fade-in-up" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Info size={16} color="#8b5cf6" /> Account Details
              </h3>
              {[
                { label: 'Account Name', val: user?.name },
                { label: 'Email', val: user?.email },
                { label: 'Role', val: user?.role },
                { label: 'User ID', val: `#${user?.id}` },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{val}</span>
                </div>
              ))}
            </div>

            <div className="glass-card fade-in-up" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>About AttendX</h3>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                AttendX is an AI-powered smart attendance system using face recognition, ML-based risk prediction, and real-time analytics.
              </p>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['FastAPI', 'React', 'DeepFace', 'Chart.js', 'SQLite'].map(tag => (
                  <span key={tag} className="badge badge-blue">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
