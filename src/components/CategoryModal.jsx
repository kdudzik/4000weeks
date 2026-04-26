import { useState, useEffect } from 'react'

const PRESET_COLORS = [
  '#f472b6', '#fb7185', '#fb923c', '#fbbf24',
  '#a3e635', '#34d399', '#22d3ee', '#60a5fa',
  '#818cf8', '#a78bfa', '#e879f9', '#94a3b8',
]

export default function CategoryModal({ category, onSave, onDelete, onClose }) {
  const isNew = !category
  const [label, setLabel] = useState(category?.label || '')
  const [color, setColor] = useState(category?.color || PRESET_COLORS[0])
  const [icon, setIcon] = useState(category?.icon || '')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    if (!label.trim()) return
    onSave({
      ...category,
      id: category?.id || crypto.randomUUID(),
      label: label.trim(),
      color,
      icon: icon.trim() || null,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 360 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 400, color: 'var(--text-primary)' }}>
            {isNew ? 'New category' : 'Edit category'}
          </h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 18 }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Name</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} autoFocus required placeholder="e.g. Side project" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Icon (emoji)</label>
            <input type="text" value={icon} onChange={e => setIcon(e.target.value)} placeholder="e.g. 🎸" maxLength={4} style={{ maxWidth: 80 }} />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 24, height: 24, borderRadius: 4, background: c, border: 'none', padding: 0, cursor: 'pointer',
                    outline: color === c ? '2px solid white' : '2px solid transparent',
                    outlineOffset: 2,
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!isNew && onDelete ? (
              <button
                type="button"
                onClick={() => { onDelete(category.id); onClose() }}
                style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef444440', borderRadius: 6, padding: '7px 14px', fontSize: 12 }}
              >
                Delete
              </button>
            ) : <div />}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={!label.trim()}>
                {isNew ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
