import { useState, useMemo } from 'react'
import { useLifeData } from './hooks/useLifeData'
import SetupScreen from './components/SetupScreen'
import WeekGrid from './components/WeekGrid'
import EventPanel from './components/EventPanel'
import AddEventModal from './components/AddEventModal'
import { enrichEvents, currentWeekIndex } from './utils/dateUtils'

function App() {
  const {
    birthday, setBirthday,
    name, setName,
    categories, addCategory, updateCategory, deleteCategory,
    events, addEvent, updateEvent, deleteEvent,
    reset, exportData, importData,
  } = useLifeData()

  const [fontSize, setFontSize] = useState(() => localStorage.getItem('4kw_font_size') || 'dense')

  const toggleFontSize = (size) => {
    setFontSize(size)
    localStorage.setItem('4kw_font_size', size)
  }

  const [highlightEventId, setHighlightEventId] = useState(null)
  const [filterCatId, setFilterCatId] = useState(null)
  const [calendarMode, setCalendarMode] = useState(false)
  const [quickAddDefaults, setQuickAddDefaults] = useState(null)

  const filterEventColors = useMemo(() => {
    if (!filterCatId || !birthday) return null
    const enriched = enrichEvents(events, birthday)
    const nowIndex = currentWeekIndex(birthday)
    const inCat = enriched.filter(e => e.categoryId === filterCatId)
    const n = inCat.length
    return Object.fromEntries(inCat.map((e, i) => {
      const hue = Math.round((i * 360 / Math.max(n, 1) + 15) % 360)
      return [e.id, `hsl(${hue}, 65%, 58%)`]
    }))
  }, [filterCatId, events, birthday])

  if (!birthday) {
    return (
      <SetupScreen
        onComplete={(n, bd) => {
          setName(n)
          setBirthday(bd)
        }}
        onImport={importData}
      />
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Grid area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          padding: '10px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'var(--bg-primary)',
          flexShrink: 0,
          zoom: fontSize === 'dense' ? 1 : 1.18,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 19, fontWeight: 600, fontStyle: 'italic', color: 'var(--accent)', letterSpacing: '-0.5px' }}>
            4,000 Weeks
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.15em' }}>
            YOUR LIFE IN WEEKS
          </span>
          <div style={{ flex: 1 }} />
          {/* Font size toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[['dense', 10], ['comfortable', 16]].map(([size, px]) => (
              <button
                key={size}
                onClick={() => toggleFontSize(size)}
                title={size}
                style={{
                  fontSize: px, padding: '2px 6px', border: 'none', cursor: 'pointer',
                  borderRadius: 4,
                  background: fontSize === size ? 'var(--bg-hover)' : 'transparent',
                  color: fontSize === size ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600, lineHeight: 1,
                }}
              >
                A
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 6, padding: 2, gap: 2 }}>
            {[['life', false], ['calendar', true]].map(([lbl, val]) => (
              <button
                key={lbl}
                onClick={() => setCalendarMode(val)}
                style={{
                  fontSize: 10, padding: '3px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: calendarMode === val ? 'var(--bg-hover)' : 'transparent',
                  color: calendarMode === val ? 'var(--text-primary)' : 'var(--text-muted)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
          {/* Legend inline */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--week-past-empty)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>past</span>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--week-today)', marginLeft: 8 }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>now</span>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--week-future)', marginLeft: 8, border: '1px solid var(--border)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>future</span>
          </div>
        </div>

        <WeekGrid
          birthday={birthday}
          events={events}
          categories={categories}
          highlightEventId={highlightEventId}
          filterCatId={filterCatId}
          filterEventColors={filterEventColors}
          calendarMode={calendarMode}
          onCellSelect={(startDate, endDate) => setQuickAddDefaults({ startDate, endDate })}
          density={fontSize}
        />
      </div>

      {quickAddDefaults && (
        <AddEventModal
          categories={categories}
          defaultStartDate={quickAddDefaults.startDate}
          defaultEndDate={quickAddDefaults.endDate}
          defaultCategoryId={filterCatId || undefined}
          onAdd={ev => { addEvent(ev); setQuickAddDefaults(null) }}
          onClose={() => setQuickAddDefaults(null)}
        />
      )}

      <EventPanel
        events={events}
        categories={categories}
        onAddEvent={addEvent}
        onUpdateEvent={updateEvent}
        onDeleteEvent={deleteEvent}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onHighlight={setHighlightEventId}
        filterCatId={filterCatId}
        onFilterCat={setFilterCatId}
        filterEventColors={filterEventColors}
        highlightEventId={highlightEventId}
        birthday={birthday}
        name={name}
        onUpdateBirthday={setBirthday}
        onUpdateName={setName}
        onReset={reset}
        onExport={exportData}
        onImport={importData}
        density={fontSize}
      />
    </div>
  )
}

export default App
