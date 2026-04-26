import { useMemo, useState, useCallback, useRef } from 'react'
import { format, addDays } from 'date-fns'
import {
  weekIndexToDate,
  enrichEvents,
  getEventsForWeek,
  currentWeekIndex,
  formatWeekRange,
  blendColors,
  TOTAL_ROWS,
  WEEKS_PER_ROW,
} from '../utils/dateUtils'

const CELL_SIZE = 10
const CELL_GAP = 2
const CELL_STEP = CELL_SIZE + CELL_GAP
const LABEL_W = 32
const HEADER_H = 24

export default function WeekGrid({ birthday, events, categories, highlightEventId }) {
  const [tooltip, setTooltip] = useState(null)
  const containerRef = useRef(null)

  const enriched = useMemo(() => enrichEvents(events, birthday), [events, birthday])
  const catMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c])),
    [categories]
  )
  const nowIndex = useMemo(() => currentWeekIndex(birthday), [birthday])
  const totalCells = TOTAL_ROWS * WEEKS_PER_ROW

  // Build cell data: array of { weekIndex, color, eventInfos }
  const cells = useMemo(() => {
    const result = []
    for (let i = 0; i < totalCells; i++) {
      const matched = getEventsForWeek(i, enriched, categories)

      // If highlightEventId, dim non-matching events
      let displayMatched = matched
      if (highlightEventId) {
        displayMatched = matched.filter(m => m.event.id === highlightEventId)
      }

      const colors = displayMatched.map(m => m.color)
      const color = colors.length > 0 ? blendColors(colors) : null
      result.push({ weekIndex: i, color, eventInfos: matched })
    }
    return result
  }, [enriched, categories, totalCells, highlightEventId])

  const handleMouseEnter = useCallback((e, weekIndex, eventInfos) => {
    const weekStart = weekIndexToDate(birthday, weekIndex)
    const row = Math.floor(weekIndex / WEEKS_PER_ROW)
    const age = row
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      weekIndex,
      weekStart,
      age,
      eventInfos,
    })
  }, [birthday])

  const handleMouseMove = useCallback((e) => {
    if (tooltip) {
      setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
    }
  }, [tooltip])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  const gridW = WEEKS_PER_ROW * CELL_STEP - CELL_GAP
  const gridH = TOTAL_ROWS * CELL_STEP - CELL_GAP

  // Year labels: every 5 years
  const yearLabels = []
  for (let row = 0; row < TOTAL_ROWS; row += 5) {
    yearLabels.push(row)
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Inner wrapper — centered via auto margins */}
      <div style={{ width: LABEL_W + gridW, padding: '20px 0 24px', margin: '0 auto' }}>

      {/* Grid header: decade marks */}
      <div style={{
        display: 'flex',
        marginBottom: 6,
        height: HEADER_H,
        alignItems: 'flex-end',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-primary)',
        zIndex: 2,
      }}>
        {[0, 10, 20, 30, 40, 50].map(decade => (
          <div
            key={decade}
            style={{
              position: 'absolute',
              left: LABEL_W + decade * CELL_STEP,
              fontSize: 9,
              color: 'var(--text-muted)',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
            }}
          >
            week {decade}
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* Age labels */}
        <div style={{ width: LABEL_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-primary)' }}>
          {Array.from({ length: TOTAL_ROWS }, (_, row) => (
            <div
              key={row}
              style={{
                height: CELL_STEP,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 8,
                fontSize: 9,
                color: row % 5 === 0 ? 'var(--text-muted)' : 'transparent',
                letterSpacing: '0.05em',
              }}
            >
              {row}
            </div>
          ))}
        </div>

        {/* Week cells SVG for performance */}
        <svg
          width={gridW}
          height={gridH}
          style={{ overflow: 'visible', display: 'block' }}
        >
          {cells.map(({ weekIndex, color, eventInfos }) => {
            const row = Math.floor(weekIndex / WEEKS_PER_ROW)
            const col = weekIndex % WEEKS_PER_ROW
            const x = col * CELL_STEP
            const y = row * CELL_STEP
            const isPast = weekIndex < nowIndex
            const isToday = weekIndex === nowIndex
            const isFuture = weekIndex > nowIndex

            let fill
            if (isToday) fill = 'var(--week-today)'
            else if (color) fill = color
            else if (isPast) fill = 'var(--week-past-empty)'
            else fill = 'var(--week-future)'

            const opacity = color ? (isPast || isToday ? 1 : 0.35) : 1
            const glowRadius = color && (isPast || isToday) ? 2 : 0

            return (
              <rect
                key={weekIndex}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                fill={fill}
                opacity={opacity}
                style={{ cursor: eventInfos.length ? 'crosshair' : 'default' }}
                onMouseEnter={e => handleMouseEnter(e, weekIndex, eventInfos)}
                onMouseLeave={handleMouseLeave}
              >
                {glowRadius > 0 && (
                  <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
                )}
              </rect>
            )
          })}

          {/* Today marker */}
          {nowIndex < totalCells && (() => {
            const row = Math.floor(nowIndex / WEEKS_PER_ROW)
            const col = nowIndex % WEEKS_PER_ROW
            return (
              <rect
                x={col * CELL_STEP - 1}
                y={row * CELL_STEP - 1}
                width={CELL_SIZE + 2}
                height={CELL_SIZE + 2}
                rx={3}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={1}
                opacity={0.6}
              />
            )
          })()}
        </svg>
      </div>
      </div>{/* end inner wrapper */}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="tooltip"
          style={{
            left: Math.min(tooltip.x + 14, window.innerWidth - 240),
            top: tooltip.y - 10,
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
            Age {tooltip.age} · Week {tooltip.weekIndex % WEEKS_PER_ROW + 1}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: tooltip.eventInfos.length ? 8 : 0 }}>
            {formatWeekRange(tooltip.weekStart)}
          </div>
          {tooltip.eventInfos.map(({ event, category, color }) => (
            <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                {category?.icon} {event.label}
              </span>
            </div>
          ))}
          {!tooltip.eventInfos.length && tooltip.weekIndex > currentWeekIndex(birthday) && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>future</div>
          )}
        </div>
      )}
    </div>
  )
}
