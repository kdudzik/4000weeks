import { useState, useMemo, useEffect } from 'react'
import { useLifeData } from './hooks/useLifeData'
import SetupScreen from './components/SetupScreen'
import WeekGrid from './components/WeekGrid'
import EventPanel from './components/EventPanel'
import AddEventModal from './components/AddEventModal'
import { enrichEvents, currentWeekIndex } from './utils/dateUtils'
import { DEMO_DATA } from './data/demoData'

function App() {
  const {
    birthday, setBirthday,
    name, setName,
    categories, addCategory, updateCategory, deleteCategory,
    events, addEvent, updateEvent, deleteEvent,
    reset, exportData, importData,
  } = useLifeData()

  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('4kw_theme')
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('4kw_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const [fontSize, setFontSize] = useState(() => localStorage.getItem('4kw_font_size') || 'dense')

  const toggleFontSize = (size) => {
    setFontSize(size)
    localStorage.setItem('4kw_font_size', size)
  }

  const [isDemo, setIsDemo] = useState(() => localStorage.getItem('4kw_is_demo') === '1')

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

  const handleClearDemo = () => {
    reset()
    setIsDemo(false)
    localStorage.removeItem('4kw_is_demo')
  }

  const handleImport = (json) => {
    importData(json)
    setIsDemo(false)
    localStorage.removeItem('4kw_is_demo')
  }

  if (!birthday) {
    return (
      <SetupScreen
        onComplete={(n, bd) => {
          setName(n)
          setBirthday(bd)
          setIsDemo(false)
          localStorage.removeItem('4kw_is_demo')
        }}
        onImport={handleImport}
        onDemo={() => { importData(JSON.stringify(DEMO_DATA)); setIsDemo(true); localStorage.setItem('4kw_is_demo', '1') }}
      />
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Demo banner */}
      {isDemo && (
        <div style={{
          background: 'var(--accent)', color: 'var(--accent-text)',
          padding: '7px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          fontSize: 11, letterSpacing: '0.04em', flexShrink: 0,
        }}>
          <span>You're viewing demo data — Alex Rivera, 37.</span>
          <button
            onClick={handleClearDemo}
            style={{
              background: 'var(--accent-text)', color: 'var(--accent)',
              border: 'none', borderRadius: 4,
              padding: '3px 10px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer', fontWeight: 500, letterSpacing: '0.04em',
            }}
          >
            Start with my own data →
          </button>
        </div>
      )}
      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
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
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              padding: '4px', border: 'none', cursor: 'pointer',
              borderRadius: 4, background: 'transparent',
              color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 24, height: 24,
            }}
          >
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
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
        onReset={handleClearDemo}
        onExport={exportData}
        onImport={handleImport}
        density={fontSize}
      />
      </div>
    </div>
  )
}

export default App
