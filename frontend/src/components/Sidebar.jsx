import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Camera, BarChart2, Settings,
  LogOut, Brain, Shield, GraduationCap, BookOpen
} from 'lucide-react'

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/attendance', label: 'Attendance', icon: Camera },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const teacherLinks = [
  { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/attendance', label: 'Take Attendance', icon: Camera },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const studentLinks = [
  { to: '/student', label: 'My Dashboard', icon: LayoutDashboard },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const roleLinks = { admin: adminLinks, teacher: teacherLinks, student: studentLinks }
const roleIcons = { admin: Shield, teacher: BookOpen, student: GraduationCap }

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  const links = roleLinks[user.role] || studentLinks
  const RoleIcon = roleIcons[user.role] || GraduationCap

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Brain size={20} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
            <span className="gradient-text">Attend</span>
            <span style={{ color: '#f1f5f9' }}>X</span>
          </span>
        </div>
        <p style={{ fontSize: 11, color: '#64748b', marginLeft: 46 }}>AI Attendance System</p>
      </div>

      {/* User badge */}
      <div className="glass-card" style={{ padding: '12px 14px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <RoleIcon size={10} color="#8b5cf6" />
              <span style={{ fontSize: 11, color: '#8b5cf6', textTransform: 'capitalize', fontWeight: 500 }}>{user.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to !== '/attendance'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              transition: 'all 0.2s ease',
              background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: isActive ? '#3b82f6' : '#94a3b8',
              borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button className="btn-ghost" onClick={handleLogout}
        style={{ width: '100%', justifyContent: 'flex-start', marginTop: 16, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
        <LogOut size={16} />
        Logout
      </button>
    </aside>
  )
}
