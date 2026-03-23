export default function Loader({ fullScreen = true, text = 'Loading...' }) {
  const containerStyle = fullScreen ? {
    position: 'fixed', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(10,15,30,0.8)', zIndex: 9999,
  } : {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px', flexDirection: 'column', gap: 12,
  }

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #3b82f6',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 12px',
        }} />
        <p style={{ fontSize: 14, color: '#94a3b8' }}>{text}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
