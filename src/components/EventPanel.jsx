import { useState, useMemo, useRef, useEffect } from 'react'
import AddEventModal from './AddEventModal'
import CategoryModal from './CategoryModal'

export default function EventPanel({
  events, categories,
  onAddEvent, onUpdateEvent, onDeleteEvent,
  onAddCategory, onUpdateCategory, onDeleteCategory,
  onHighlight, highlightEventId,
  filterCatId, onFilterCat, filterEventColors,
  birthday, name,
  onUpdateBirthday, onUpdateName,
  onReset, onExport, onImport,
  density = 'dense',
}) {
  const zoom = density === 'dense' ? 1 : 1.18
  const [tab, setTab] = useState('events') // 'events' | 'categories'
  const [importError, setImportError] = useState(null)
  const fileInputRef = useRef(null)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftBirthday, setDraftBirthday] = useState('')

  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    if (!confirmDeleteId) return
    const handler = (e) => { if (e.key === 'Escape') setConfirmDeleteId(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [confirmDeleteId])

  const [collapsed, setCollapsed] = useState(false)

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories])

  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('4kw_sort_order') || 'asc')

  const toggleSortOrder = () => {
    const next = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(next)
    localStorage.setItem('4kw_sort_order', next)
  }

  const filteredEvents = useMemo(() => {
    let evs = [...events]
    if (filterCatId) evs = evs.filter(e => e.categoryId === filterCatId)
    return evs.sort((a, b) => sortOrder === 'asc'
      ? a.startDate.localeCompare(b.startDate)
      : b.startDate.localeCompare(a.startDate)
    )
  }, [events, filterCatId, sortOrder])

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
        zoom,
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
      width: 375, flexShrink: 0,
      zoom,
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
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingProfile ? (
              <form onSubmit={e => {
                e.preventDefault()
                if (draftBirthday) onUpdateBirthday(draftBirthday)
                onUpdateName(draftName)
                setEditingProfile(false)
              }} onKeyDown={e => { if (e.key === 'Escape') setEditingProfile(false) }} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input
                  autoFocus
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                    borderRadius: 4, padding: '3px 6px', fontSize: 13,
                    color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace", width: '100%',
                  }}
                />
                <input
                  type="date"
                  value={draftBirthday}
                  onChange={e => setDraftBirthday(e.target.value)}
                  required
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                    borderRadius: 4, padding: '3px 6px', fontSize: 11,
                    color: 'var(--text-primary)', width: '100%',
                  }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="submit" style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
                  }}>save</button>
                  <button type="button" onClick={() => setEditingProfile(false)} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', cursor: 'pointer',
                  }}>cancel</button>
                </div>
              </form>
            ) : (
              <div
                onClick={() => { setDraftName(name || ''); setDraftBirthday(birthday || ''); setEditingProfile(true) }}
                style={{ cursor: 'pointer' }}
                title="Edit name & birthdate"
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: 'var(--text-primary)', fontWeight: 400 }}>
                  {name || 'Your life'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  b. {birthday}
                </div>
              </div>
            )}
          </div>
          <button
            className="btn-icon"
            onClick={() => setCollapsed(true)}
            style={{ fontSize: 16, color: 'var(--text-muted)', alignSelf: 'flex-start' }}
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
              onClick={() => onFilterCat(null)}
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 4,
                background: !filterCatId ? 'var(--accent)' : 'var(--bg-secondary)',
                color: !filterCatId ? '#1a1210' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              all
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onFilterCat(filterCatId === cat.id ? null : cat.id)}
                style={{
                  fontSize: 10, padding: '3px 8px', borderRadius: 4,
                  background: filterCatId === cat.id ? cat.color : 'var(--bg-secondary)',
                  color: filterCatId === cat.id ? '#1a1210' : 'var(--text-secondary)',
                  border: `1px solid ${filterCatId === cat.id ? 'transparent' : 'var(--border)'}`,
                  opacity: events.some(e => e.categoryId === cat.id) ? 1 : 0.35,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 2, background: filterCatId === cat.id ? '#1a1210' : cat.color, flexShrink: 0, display: 'inline-block' }} />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort toggle */}
          <div style={{ padding: '4px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={toggleSortOrder}
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                background: 'transparent', color: 'var(--text-muted)',
                letterSpacing: '0.05em',
              }}
            >
              {sortOrder === 'asc' ? '↑ oldest first' : '↓ newest first'}
            </button>
          </div>

          {/* Event list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {filteredEvents.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '40px 20px', lineHeight: 1.8 }}>
                No events yet.<br />
                <span style={{ fontSize: 10 }}>Click + below, or click and drag on the grid.</span>
              </div>
            )}
            {filteredEvents.map(ev => {
              const cat = catMap[ev.categoryId]
              const color = (filterEventColors && !ev.color && filterEventColors[ev.id]) || ev.color || cat?.color || '#888'
              const isHighlighted = highlightEventId === ev.id
              return (
                <div
                  key={ev.id}
                  onClick={() => handleEditEvent(ev)}
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
                      {cat?.icon} {cat?.label} · {ev.startDate}{ev.ongoing ? ' → now' : ev.endDate ? ` → ${ev.endDate}` : ''}
                    </div>
                    {ev.note && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.note}
                      </div>
                    )}
                  </div>
                  <button className="btn-icon" onClick={e => { e.stopPropagation(); setConfirmDeleteId(ev.id) }} style={{ fontSize: 18, padding: '2px 6px', color: '#ef444460', flexShrink: 0 }}>×</button>
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
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.03em' }}>
              or click · drag on the grid
            </div>
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
          <div style={{ padding: '8px 14px 4px', fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Each category is a visual layer — create separate ones for parallel tracks.
          </div>
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
          defaultCategoryId={!editingEvent && filterCatId ? filterCatId : null}
          onAdd={handleAddOrUpdate}
          onClose={() => { setShowAddEvent(false); setEditingEvent(null) }}
        />
      )}

      {confirmDeleteId && (() => {
        const ev = events.find(e => e.id === confirmDeleteId)
        return (
          <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
            <div className="modal animate-fade-in" style={{ width: 320 }} onClick={e => e.stopPropagation()}>
              <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-primary)' }}>
                Delete <strong>{ev?.label}</strong>?
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                <button
                  className="btn-primary"
                  style={{ background: '#ef4444', borderColor: '#ef4444' }}
                  onClick={() => { onDeleteEvent(confirmDeleteId); setConfirmDeleteId(null) }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      })()}

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
