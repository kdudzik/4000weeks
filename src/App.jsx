import { useState } from 'react'
import { useLifeData } from './hooks/useLifeData'
import SetupScreen from './components/SetupScreen'
import WeekGrid from './components/WeekGrid'
import EventPanel from './components/EventPanel'

function App() {
  const {
    birthday, setBirthday,
    name, setName,
    categories, addCategory, updateCategory, deleteCategory,
    events, addEvent, updateEvent, deleteEvent,
    reset, exportData, importData,
  } = useLifeData()

  const [highlightEventId, setHighlightEventId] = useState(null)

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
