import { useState, useMemo } from 'react'
import { useLifeData } from './hooks/useLifeData'
import SetupScreen from './components/SetupScreen'
import WeekGrid from './components/WeekGrid'
import EventPanel from './components/EventPanel'
import { enrichEvents, currentWeekIndex } from './utils/dateUtils'

function App() {
  const {
    birthday, setBirthday,
    name, setName,
    categories, addCategory, updateCategory, deleteCategory,
    events, addEvent, updateEvent, deleteEvent,
    reset, exportData, importData,
  } = useLifeData()

  const [highlightEventId, setHighlightEventId] = useState(null)
  const [filterCatId, setFilterCatId] = useState(null)
  const [calendarMode, setCalendarMode] = useState(false)

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
        }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--accent)', letterSpacing: '-0.3px' }}>
            4,000 Weeks
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, letterSpacing: '0.15em' }}>
            YOUR LIFE IN WEEKS
          </span>
          <div style={{ flex: 1 }} />
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
        />
      </div>

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
        onReset={reset}
        onExport={exportData}
        onImport={importData}
      />
    </div>
  )
}

export default App
