import { useState } from 'react'

const HEX_COLORS = [
  '#f472b6', '#fb7185', '#fb923c', '#fbbf24',
  '#a3e635', '#34d399', '#22d3ee', '#60a5fa',
  '#818cf8', '#a78bfa', '#e879f9', '#94a3b8',
]

export default function AddEventModal({ categories, onAdd, onClose, editEvent }) {
  const initial = editEvent || {}
  const [label, setLabel] = useState(initial.label || '')
  const [categoryId, setCategoryId] = useState(initial.categoryId || categories[0]?.id || '')
  const [color, setColor] = useState(initial.color || null)
  const [startDate, setStartDate] = useState(initial.startDate || '')
  const [endDate, setEndDate] = useState(initial.endDate || '')
  const [note, setNote] = useState(initial.note || '')
  const [isRange, setIsRange] = useState(!!initial.endDate)

  const selectedCat = categories.find(c => c.id === categoryId)
  const displayColor = color || selectedCat?.color || '#888'

  function handleSubmit(e) {
    e.preventDefault()
    if (!label.trim() || !startDate) return
    onAdd({
      label: label.trim(),
      categoryId,
      color: color,
      startDate,
      endDate: isRange ? endDate || null : null,
      note: note.trim() || null,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            fontWeight: 400,
            color: 'var(--text-primary)',
          }}>
            {editEvent ? 'Edit event' : 'Add event'}
          </h2>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Label */}
          <div style={{ marginBottom: 16 }}>
            <label>Event label</label>
            <input
              type="text"
              placeholder="e.g. University of Warsaw"
              value={label}
              onChange={e => setLabel(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <label>Category</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Color override */}
          <div style={{ marginBottom: 20 }}>
            <label>Color override (optional)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {HEX_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(color === c ? null : c)}
                  style={{
                    width: 20, height: 20, borderRadius: 4,
                    background: c, border: 'none', padding: 0, cursor: 'pointer',
                    outline: color === c ? `2px solid white` : `2px solid transparent`,
                    outlineOffset: 2,
                    opacity: color && color !== c ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}
                />
              ))}
              {color && (
                <button
                  type="button"
                  onClick={() => setColor(null)}
                  style={{
                    fontSize: 10, color: 'var(--text-muted)', background: 'transparent',
                    border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px',
                  }}
                >
                  clear
                </button>
              )}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: displayColor }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {color ? 'custom color' : `using ${selectedCat?.label || 'category'} color`}
              </span>
            </div>
          </div>

          {/* Date(s) */}
          <div style={{ marginBottom: 12 }}>
            <label>Date range or single week?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsRange(false)}
                style={{
                  flex: 1, padding: '7px 12px', borderRadius: 6, fontSize: 12,
                  background: !isRange ? 'var(--bg-hover)' : 'transparent',
                  border: `1px solid ${!isRange ? 'var(--accent)' : 'var(--border)'}`,
                  color: !isRange ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                Single week
              </button>
              <button
                type="button"
                onClick={() => setIsRange(true)}
                style={{
                  flex: 1, padding: '7px 12px', borderRadius: 6, fontSize: 12,
                  background: isRange ? 'var(--bg-hover)' : 'transparent',
                  border: `1px solid ${isRange ? 'var(--accent)' : 'var(--border)'}`,
                  color: isRange ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                Date range
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isRange ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label>{isRange ? 'Start date' : 'Date'}</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            {isRange && (
              <div>
                <label>End date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Note */}
          <div style={{ marginBottom: 28 }}>
            <label>Note (optional)</label>
            <textarea
              rows={2}
              placeholder="Any details…"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ resize: 'vertical', minHeight: 60 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!label.trim() || !startDate}>
              {editEvent ? 'Save changes' : 'Add to map'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
