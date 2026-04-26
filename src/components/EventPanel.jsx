import { useState, useMemo, useRef } from 'react'
import AddEventModal from './AddEventModal'
import CategoryModal from './CategoryModal'

export default function EventPanel({
  events, categories,
  onAddEvent, onUpdateEvent, onDeleteEvent,
  onAddCategory, onUpdateCategory, onDeleteCategory,
  onHighlight, highlightEventId,
  birthday, name,
  onReset, onExport, onImport,
}) {
  const [tab, setTab] = useState('events') // 'events' | 'categories'
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [filterCat, setFilterCat] = useState(null)
  const [collapsed, setCollapsed] = useState(false)

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const filteredEvents = useMemo(() => {
    let evs = [...events]
    if (filterCat) evs = evs.filter(e => e.categoryId === filterCat)
    return evs.sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [events, filterCat])

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        onImport(ev.target.result)
        setImportError(null)
      } catch {
        setImportError('Invalid file — could not import.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleEditEvent(ev) {
    setEditingEvent(ev)
    setShowAddEvent(true)
  }

  function handleAddOrUpdate(data) {
    if (editingEvent) {
      onUpdateEvent(editingEvent.id, data)
    } else {
      onAddEvent(data)
    }
    setEditingEvent(null)
  }

  if (collapsed) {
    return (
      <div style={{
        width: 36, flexShrink: 0,
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 16, gap: 16,
      }}>
        <button
          className="btn-icon"
          onClick={() => setCollapsed(false)}
          title="Expand panel"
          style={{ fontSize: 16, writing: 'vertical-rl', color: 'var(--text-secondary)' }}
        >
          ‹
        </button>
      </div>
    )
  }

  return (
    <div style={{
      width: 300, flexShrink: 0,
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}
      className="animate-slide-in"
    >
      {/* Header */}
      <div style={{
        padding: '16px 16px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'var(--text-primary)', fontWeight: 400 }}>
              {name || 'Your life'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              b. {birthday}
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={() => setCollapsed(true)}
            style={{ fontSize: 16, color: 'var(--text-muted)' }}
          >
            ›
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: -1 }}>
          {['events', 'categories'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '7px 0', fontSize: 11, background: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                borderRadius: 0, cursor: 'pointer',
              }}
            >
              {t} {t === 'events' ? `(${events.length})` : `(${categories.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Events tab */}
      {tab === 'events' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filter by category */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterCat(null)}
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 4,
                background: !filterCat ? 'var(--accent)' : 'var(--bg-secondary)',
                color: !filterCat ? '#1a1210' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              all
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
                style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 4,
                  background: filterCat === cat.id ? cat.color : 'var(--bg-secondary)',
                  color: filterCat === cat.id ? '#1a1210' : 'var(--text-secondary)',
                  border: `1px solid ${filterCat === cat.id ? 'transparent' : 'var(--border)'}`,
                  opacity: events.some(e => e.categoryId === cat.id) ? 1 : 0.35,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 2, background: filterCat === cat.id ? '#1a1210' : cat.color, flexShrink: 0, display: 'inline-block' }} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Event list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {filteredEvents.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '40px 20px' }}>
                No events yet.<br />
                <span style={{ fontSize: 10 }}>Click + to add one.</span>
              </div>
            )}
            {filteredEvents.map(ev => {
              const cat = catMap[ev.categoryId]
              const color = ev.color || cat?.color || '#888'
              const isHighlighted = highlightEventId === ev.id
              return (
                <div
                  key={ev.id}
                  onMouseEnter={() => onHighlight(ev.id)}
                  onMouseLeave={() => onHighlight(null)}
                  style={{
                    padding: '8px 14px',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    cursor: 'pointer',
                    background: isHighlighted ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: `2px solid ${isHighlighted ? color : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, marginTop: 3, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ev.label}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {cat?.icon} {cat?.label} · {ev.startDate}{ev.endDate ? ` → ${ev.endDate}` : ''}
                    </div>
                    {ev.note && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.note}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="btn-icon" onClick={e => { e.stopPropagation(); handleEditEvent(ev) }} style={{ fontSize: 12 }}>✎</button>
                    <button className="btn-icon" onClick={e => { e.stopPropagation(); onDeleteEvent(ev.id) }} style={{ fontSize: 14, color: '#ef444460' }}>×</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Events tab footer */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setEditingEvent(null); setShowAddEvent(true) }}
            >
              + Add event
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button className="btn-ghost" style={{ fontSize: 11 }} onClick={onExport}>↓ Export</button>
              <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => fileInputRef.current?.click()}>↑ Import</button>
            </div>
            <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImportFile} />
            {importError && <div style={{ fontSize: 11, color: '#ef4444', textAlign: 'center' }}>{importError}</div>}
          </div>
        </div>
      )}

      {/* Categories tab */}
      {tab === 'categories' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {categories.map(cat => (
              <div
                key={cat.id}
                style={{
                  padding: '8px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer',
                }}
                onClick={() => { setEditingCat(cat); setShowCatModal(true) }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1 }}>{cat.icon} {cat.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {events.filter(e => e.categoryId === cat.id).length} events
                </span>
                <button className="btn-icon" style={{ fontSize: 12 }}>✎</button>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn-primary" style={{ width: '100%' }}
              onClick={() => { setEditingCat(null); setShowCatModal(true) }}>
              + New category
            </button>
            <button
              className="btn-ghost"
              style={{ width: '100%', fontSize: 11, color: '#ef444460', borderColor: '#ef444420' }}
              onClick={() => { if (window.confirm('Reset all data?')) onReset() }}
            >
              Reset all data
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddEvent && (
        <AddEventModal
          categories={categories}
          editEvent={editingEvent}
          onAdd={handleAddOrUpdate}
          onClose={() => { setShowAddEvent(false); setEditingEvent(null) }}
        />
      )}

      {showCatModal && (
        <CategoryModal
          category={editingCat}
          onSave={(data) => {
            if (editingCat) onUpdateCategory(data.id, data)
            else onAddCategory(data)
          }}
          onDelete={onDeleteCategory}
          onClose={() => { setShowCatModal(false); setEditingCat(null) }}
        />
      )}
    </div>
  )
}
