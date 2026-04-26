import { useMemo, useState, useCallback, useRef } from 'react'
import { format, getYear, parseISO } from 'date-fns'
import {
  weekIndexToDate,
  enrichEvents,
  getEventsForWeek,
  currentWeekIndex,
  formatWeekRange,
  TOTAL_ROWS,
  WEEKS_PER_ROW,
  dateToCalWeekIndex,
  calWeekIndexToDate,
  getMonthCols,
} from '../utils/dateUtils'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function WeekGrid({ birthday, events, categories, highlightEventId, filterCatId, filterEventColors, calendarMode, onCellSelect, density = 'dense' }) {
  const CELL_SIZE = density === 'dense' ? 10 : 13
  const CELL_GAP = density === 'dense' ? 2 : 3
  const CELL_STEP = CELL_SIZE + CELL_GAP
  const LABEL_W = 32
  const HEADER_H = 24
  const AXIS_FONT = density === 'dense' ? 9 : 11
  const [tooltip, setTooltip] = useState(null)
  const [dragStart, setDragStart] = useState(null)
  const [dragEnd, setDragEnd] = useState(null)
  const isDragging = dragStart !== null
  const containerRef = useRef(null)

  const enriched = useMemo(() => enrichEvents(events, birthday), [events, birthday])
  const catMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c])),
    [categories]
  )
  const nowIndex = useMemo(() => currentWeekIndex(birthday), [birthday])
  const totalCells = TOTAL_ROWS * WEEKS_PER_ROW

  // Calendar mode derived values
  const birthYear = useMemo(() => getYear(parseISO(birthday)), [birthday])
  const nowCalIndex = useMemo(() => dateToCalWeekIndex(birthday, format(new Date(), 'yyyy-MM-dd')), [birthday])
  const birthCalIndex = useMemo(() => dateToCalWeekIndex(birthday, birthday), [birthday])
  const monthCols = useMemo(() => getMonthCols(birthday), [birthday])

  // Enrich events with calendar indices
  const calEnriched = useMemo(() => enriched.map(ev => ({
    ...ev,
    _calStartWeek: dateToCalWeekIndex(birthday, ev.startDate),
    _calEndWeek: ev.endDate
      ? dateToCalWeekIndex(birthday, ev.endDate)
      : ev.ongoing ? nowCalIndex : dateToCalWeekIndex(birthday, ev.startDate),
  })), [enriched, birthday, nowCalIndex])

  function getEventsForCalWeek(calIndex) {
    return calEnriched.filter(ev =>
      calIndex >= ev._calStartWeek && calIndex <= ev._calEndWeek
    ).map(ev => ({
      event: ev,
      category: catMap[ev.categoryId],
      color: ev.color || catMap[ev.categoryId]?.color || '#888',
    }))
  }

  // Build cell data
  const cells = useMemo(() => {
    const result = []
    for (let i = 0; i < totalCells; i++) {
      const row = Math.floor(i / WEEKS_PER_ROW)
      const col = i % WEEKS_PER_ROW

      let matched, isPast, isToday, isPreBirth, cellDate

      if (calendarMode) {
        const calIndex = i
        isPreBirth = calIndex < birthCalIndex
        isPast = calIndex < nowCalIndex && !isPreBirth
        isToday = calIndex === nowCalIndex
        matched = isPreBirth ? [] : getEventsForCalWeek(calIndex)
        cellDate = calWeekIndexToDate(birthday, calIndex)
      } else {
        matched = getEventsForWeek(i, enriched, categories, nowIndex)
        isPast = i < nowIndex
        isToday = i === nowIndex
        isPreBirth = false
        cellDate = null
      }

      let displayMatched = matched
      if (highlightEventId) {
        displayMatched = matched.filter(m => m.event.id === highlightEventId)
      } else if (filterCatId) {
        displayMatched = matched.filter(m => m.event.categoryId === filterCatId)
      }

      const sorted = [...displayMatched].sort((a, b) => {
        const durA = calendarMode
          ? (a.event._calEndWeek - a.event._calStartWeek)
          : ((a.event._endWeek ?? nowIndex) - a.event._startWeek)
        const durB = calendarMode
          ? (b.event._calEndWeek - b.event._calStartWeek)
          : ((b.event._endWeek ?? nowIndex) - b.event._startWeek)
        return durA - durB
      })
      const colors = sorted.map(m =>
        filterEventColors && !m.event.color ? (filterEventColors[m.event.id] ?? m.color) : m.color
      )
      const color = colors.length > 0 ? colors[0] : null

      result.push({ index: i, row, col, color, eventInfos: matched, filteredEventIds: filterCatId ? new Set(displayMatched.map(m => m.event.id)) : null, isPast, isToday, isPreBirth, cellDate })
    }
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enriched, calEnriched, categories, totalCells, highlightEventId, filterCatId, filterEventColors, nowIndex, nowCalIndex, birthCalIndex, calendarMode])

  const handleMouseEnter = useCallback((e, cell) => {
    const { index, row, isPast, isToday, isPreBirth, cellDate, eventInfos, filteredEventIds } = cell
    if (isDragging) {
      setDragEnd(index)
      return
    }
    if (calendarMode) {
      setTooltip({
        x: e.clientX, y: e.clientY,
        label: `${birthYear + row}`,
        weekStart: cellDate,
        eventInfos,
        filteredEventIds,
        isPreBirth,
      })
    } else {
      setTooltip({
        x: e.clientX, y: e.clientY,
        label: `Age ${row} · Week ${index % WEEKS_PER_ROW + 1}`,
        weekStart: weekIndexToDate(birthday, index),
        eventInfos,
        filteredEventIds,
        isPreBirth: false,
      })
    }
  }, [birthday, calendarMode, birthYear, isDragging])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging && tooltip) setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)
  }, [isDragging, tooltip])

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) setTooltip(null)
  }, [isDragging])

  const handleCellMouseDown = useCallback((e, cell) => {
    if (cell.isPreBirth) return
    e.preventDefault()
    setTooltip(null)
    setDragStart(cell.index)
    setDragEnd(cell.index)
  }, [])

  // Finalize drag on mouseup anywhere on the SVG
  const handleSvgMouseUp = useCallback(() => {
    if (dragStart === null) return
    const lo = Math.min(dragStart, dragEnd ?? dragStart)
    const hi = Math.max(dragStart, dragEnd ?? dragStart)
    setDragStart(null)
    setDragEnd(null)
    if (!onCellSelect) return
    let startDate, endDate
    if (calendarMode) {
      startDate = calWeekIndexToDate(birthday, lo)
      endDate = lo === hi ? null : calWeekIndexToDate(birthday, hi)
    } else {
      startDate = weekIndexToDate(birthday, lo)
      endDate = lo === hi ? null : weekIndexToDate(birthday, hi)
    }
    const fmt = d => format(d, 'yyyy-MM-dd')
    onCellSelect(fmt(startDate), endDate ? fmt(endDate) : null)
  }, [dragStart, dragEnd, calendarMode, birthday, onCellSelect])

  const gridW = WEEKS_PER_ROW * CELL_STEP - CELL_GAP
  const gridH = TOTAL_ROWS * CELL_STEP - CELL_GAP

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'auto', background: 'var(--bg-primary)', position: 'relative' }}
      onMouseMove={handleMouseMove}
    >
      <div style={{ width: LABEL_W + gridW, padding: '20px 0 24px', margin: '0 auto' }}>

        {/* Column header */}
        <div style={{
          height: HEADER_H, marginBottom: 6,
          position: 'sticky', top: 0,
          background: 'var(--bg-primary)', zIndex: 2,
        }}>
          {calendarMode
            ? monthCols.map((col, m) => col < WEEKS_PER_ROW && (
              <div key={m} style={{
                position: 'absolute',
                left: LABEL_W + col * CELL_STEP,
                bottom: 0,
                fontSize: AXIS_FONT, color: 'var(--text-muted)', letterSpacing: '0.05em', whiteSpace: 'nowrap',
              }}>
                {MONTH_NAMES[m]}
              </div>
            ))
            : [0, 10, 20, 30, 40, 50].map(week => (
              <div key={week} style={{
                position: 'absolute',
                left: LABEL_W + week * CELL_STEP,
                bottom: 0,
                fontSize: AXIS_FONT, color: 'var(--text-muted)', letterSpacing: '0.05em', whiteSpace: 'nowrap',
              }}>
                week {week}
              </div>
            ))
          }
        </div>

        {/* Main grid */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {/* Row labels */}
          <div style={{ width: LABEL_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-primary)' }}>
            {Array.from({ length: TOTAL_ROWS }, (_, row) => {
              const label = calendarMode ? birthYear + row : row
              const show = row % 5 === 0
              return (
                <div key={row} style={{
                  height: CELL_STEP,
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 8, fontSize: AXIS_FONT, letterSpacing: '0.05em',
                  color: show ? 'var(--text-muted)' : 'transparent',
                }}>
                  {label}
                </div>
              )
            })}
          </div>

          {/* SVG cells */}
          <svg
            width={gridW} height={gridH}
            style={{ overflow: 'visible', display: 'block', userSelect: 'none' }}
            onMouseUp={handleSvgMouseUp}
          >
            {(() => {
              const dragLo = dragStart !== null ? Math.min(dragStart, dragEnd ?? dragStart) : -1
              const dragHi = dragStart !== null ? Math.max(dragStart, dragEnd ?? dragStart) : -1
              return cells.map((cell) => {
              const { index, row, col, color, isPast, isToday, isPreBirth } = cell
              const x = col * CELL_STEP
              const y = row * CELL_STEP

              const inDrag = dragStart !== null && index >= dragLo && index <= dragHi && !isPreBirth

              let fill
              if (isPreBirth) fill = 'var(--bg-secondary)'
              else if (inDrag) fill = 'var(--accent)'
              else if (isToday) fill = 'var(--week-today)'
              else if (color) fill = color
              else if (isPast) fill = 'var(--week-past-empty)'
              else fill = 'var(--week-future)'

              const opacity = isPreBirth ? 0.3 : inDrag ? 0.7 : color ? (isPast || isToday ? 1 : 0.35) : 1

              return (
                <rect
                  key={index}
                  x={x} y={y}
                  width={CELL_SIZE} height={CELL_SIZE}
                  rx={2}
                  fill={fill}
                  opacity={opacity}
                  style={{ cursor: isPreBirth ? 'default' : isDragging ? 'crosshair' : 'pointer' }}
                  onMouseEnter={e => handleMouseEnter(e, cell)}
                  onMouseLeave={handleMouseLeave}
                  onMouseDown={e => handleCellMouseDown(e, cell)}
                />
              )
            })
            })()}

            {/* Today marker */}
            {(() => {
              const todayIdx = calendarMode ? nowCalIndex : nowIndex
              if (todayIdx >= totalCells) return null
              const r = Math.floor(todayIdx / WEEKS_PER_ROW)
              const c = todayIdx % WEEKS_PER_ROW
              return (
                <rect
                  x={c * CELL_STEP - 1} y={r * CELL_STEP - 1}
                  width={CELL_SIZE + 2} height={CELL_SIZE + 2}
                  rx={3} fill="none"
                  stroke="var(--accent)" strokeWidth={1} opacity={0.6}
                />
              )
            })()}
          </svg>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="tooltip" style={{
          left: Math.min(tooltip.x + 14, window.innerWidth - 240),
          top: tooltip.y - 10,
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
            {tooltip.label}
          </div>
          {tooltip.isPreBirth
            ? <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>before birth</div>
            : <>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: tooltip.eventInfos.length ? 8 : 0 }}>
                {formatWeekRange(tooltip.weekStart)}
              </div>
              {tooltip.filteredEventIds
                ? (() => {
                    const primary = tooltip.eventInfos.filter(({ event }) => tooltip.filteredEventIds.has(event.id))
                    const context = tooltip.eventInfos.filter(({ event }) => !tooltip.filteredEventIds.has(event.id))
                    return <>
                      {primary.map(({ event, category, color }) => (
                        <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                            {category?.icon} {event.label}
                          </span>
                        </div>
                      ))}
                      {context.map(({ event, category }) => (
                        <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {category?.icon} {event.label}
                          </span>
                        </div>
                      ))}
                    </>
                  })()
                : tooltip.eventInfos.map(({ event, category, color }) => (
                    <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                        {category?.icon} {event.label}
                      </span>
                    </div>
                  ))
              }
            </>
          }
        </div>
      )}
    </div>
  )
}
