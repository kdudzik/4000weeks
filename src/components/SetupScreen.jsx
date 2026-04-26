import { useState } from 'react'

export default function SetupScreen({ onComplete }) {
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')

  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(e) {
    e.preventDefault()
    if (!birthday) return
    onComplete(name.trim(), birthday)
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="animate-fade-in"
    >
      {/* Background grid decoration */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'radial-gradient(circle, #c4a882 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(196,168,130,0.06) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 440, padding: '0 24px' }}>
        {/* Title */}
        <div style={{
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 16,
        }}>
          your life in weeks
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(32px, 6vw, 52px)',
          fontWeight: 400,
          color: 'var(--accent)',
          lineHeight: 1.1,
          marginBottom: 8,
          letterSpacing: '-0.5px',
        }}>
          4,000 Weeks
        </h1>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 13,
          lineHeight: 1.7,
          marginBottom: 48,
          maxWidth: 320,
          margin: '0 auto 48px',
        }}>
          The average human life is about 4,000 weeks.<br />
          Let's map yours.
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: 20 }}>
            <label>Your name (optional)</label>
            <input
              type="text"
              placeholder="e.g. Ada"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label>Date of birth</label>
            <input
              type="date"
              value={birthday}
              max={today}
              onChange={e => setBirthday(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', fontSize: 13, padding: '12px 18px', letterSpacing: '0.1em' }}
            disabled={!birthday}
          >
            Begin mapping →
          </button>
        </form>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          marginTop: 24,
          letterSpacing: '0.05em',
        }}>
          All data stored locally in your browser.
        </p>
      </div>
    </div>
  )
}
