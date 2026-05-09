import { useMemo, useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { format } from 'date-fns'
import {
  weekIndexToDate,
  enrichEvents,
  getEventsForWeek,
  currentWeekIndex,
  formatWeekRange,
  getTotalRows,
  WEEKS_PER_ROW,
  dateToCalWeekIndex,
  calWeekIndexToDate,
  getMonthCols,
  blendColors,
} from '../utils/dateUtils'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const WeekGrid = forwardRef(function WeekGrid({ birthday, events, categories, highlightEventId, filterCatId, filterEventColors, calendarMode, overlapMode = 3, showTooltip: showTooltipProp, hideTooltip: hideTooltipProp, onCellSelect, density = 'dense', svgRef }, ref) {
  const CELL_SIZE = density === 'dense' ? 10 : 15
  const CELL_GAP = density === 'dense' ? 1 : 2
  const CELL_STEP = CELL_SIZE + CELL_GAP
  const LABEL_W = 32
  const HEADER_H = 24
  const AXIS_FONT = density === 'dense' ? 9 : 11
  const totalRows = useMemo(() => getTotalRows(birthday), [birthday])
  const tooltipRef = useRef(null) // kept for internal fallback only
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
  const totalCells = totalRows * WEEKS_PER_ROW

  // Calendar mode derived values
  const birthYear = useMemo(() => { const [y] = birthday.split('-'); return Number(y) }, [birthday])
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
      const allColors = sorted.map(m =>
        filterEventColors && !m.event.color ? (filterEventColors[m.event.id] ?? m.color) : m.color
      )
      const visibleColors = overlapMode === 1
        ? allColors.slice(0, 1)
        : overlapMode === 2
          ? [...sorted.slice(0, 2)].sort((a, b) => (a.event.startDate ?? '').localeCompare(b.event.startDate ?? '')).map(m =>
              filterEventColors && !m.event.color ? (filterEventColors[m.event.id] ?? m.color) : m.color
            )
          : allColors
      const color = visibleColors.length > 0 ? blendColors(visibleColors) : null
      const multiColors = overlapMode !== 4 && visibleColors.length >= 2 ? visibleColors : null

      result.push({ index: i, row, col, color, multiColors, eventInfos: matched, filteredEventIds: filterCatId ? new Set(displayMatched.map(m => m.event.id)) : null, isPast, isToday, isPreBirth, cellDate })
    }
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enriched, calEnriched, categories, totalCells, highlightEventId, filterCatId, filterEventColors, nowIndex, nowCalIndex, birthCalIndex, calendarMode, overlapMode])

  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

  const showTooltipInternal = useCallback((x, y, html) => {
    const el = tooltipRef.current
    if (!el) return
    el.innerHTML = html
    el.style.display = 'block'
    el.style.left = Math.min(x + 14, window.innerWidth - 240) + 'px'
    el.style.top = (y - 10) + 'px'
  }, [])
  const hideTooltipInternal = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.style.display = 'none'
  }, [])
  const showTooltip = showTooltipProp ?? showTooltipInternal
  const hideTooltip = hideTooltipProp ?? hideTooltipInternal

  const handleMouseEnter = useCallback((e, cell) => {
    const { index, row, isPreBirth, cellDate, eventInfos, filteredEventIds } = cell
    if (isDragging) { setDragEnd(index); return }

    const ageLabel = `Age ${esc(row)} · Week ${esc(index % WEEKS_PER_ROW + 1)}`
    const weekStart = calendarMode ? cellDate : weekIndexToDate(birthday, index)
    const range = esc(formatWeekRange(weekStart))

    let html = `<div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">${ageLabel}</div>`
    if (isPreBirth) {
      html += `<div style="font-size:10px;color:var(--text-muted);font-style:italic">before birth</div>`
    } else {
      html += `<div style="font-size:11px;color:var(--text-secondary);margin-bottom:${eventInfos.length ? 8 : 0}px">${range}</div>`
      const primary = filteredEventIds ? eventInfos.filter(m => filteredEventIds.has(m.event.id)) : eventInfos
      const context = filteredEventIds ? eventInfos.filter(m => !filteredEventIds.has(m.event.id)) : []
      for (const { event, category, color } of primary) {
        const displayColor = filterEventColors && !event.color ? (filterEventColors[event.id] ?? color) : color
        html += `<div style="display:flex;align-items:center;gap:6px;margin-top:4px">
          <div style="width:8px;height:8px;border-radius:2px;background:${esc(displayColor)};flex-shrink:0"></div>
          <span style="font-size:11px;color:var(--text-primary)">${esc(category?.icon ?? '')} ${esc(event.label)}</span>
        </div>`
      }
      for (const { event, category } of context) {
        html += `<div style="display:flex;align-items:center;gap:6px;margin-top:4px">
          <span style="font-size:11px;color:var(--text-secondary)">${esc(category?.icon ?? '')} ${esc(event.label)}</span>
        </div>`
      }
    }
    showTooltip(e.clientX, e.clientY, html)
  }, [birthday, calendarMode, isDragging, showTooltip, filterEventColors])

  const handleMouseMove = useCallback((e) => {
    const el = tooltipRef.current
    if (!isDragging && el?.style.display !== 'none') {
      el.style.left = Math.min(e.clientX + 14, window.innerWidth - 240) + 'px'
      el.style.top = (e.clientY - 10) + 'px'
    }
  }, [isDragging])

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) hideTooltip()
  }, [isDragging, hideTooltip])

  const handleCellMouseDown = useCallback((e, cell) => {
    if (cell.isPreBirth) return
    e.preventDefault()
    hideTooltip()
    setDragStart(cell.index)
    setDragEnd(cell.index)
  }, [hideTooltip])

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
  const gridH = totalRows * CELL_STEP - CELL_GAP

  useImperativeHandle(ref, () => ({
    buildExportSvg() {
      const innerSvg = svgRef?.current
      if (!innerSvg) return null
      const cssVars = getComputedStyle(document.documentElement)
      const resolveVar = s => s.replace(/var\(--([^)]+)\)/g, (_, v) => cssVars.getPropertyValue(`--${v}`).trim() || '#888')
      const bg = cssVars.getPropertyValue('--bg-primary').trim() || '#fff'
      const textMuted = cssVars.getPropertyValue('--text-muted').trim() || '#888'
      const PAD = 16
      const totalW = LABEL_W + gridW + PAD
      const totalH = HEADER_H + gridH + PAD
      const fontFamily = 'monospace'

      // Column header labels
      const colLabels = calendarMode
        ? monthCols.map((col, m) => col < WEEKS_PER_ROW
            ? `<text x="${LABEL_W + col * CELL_STEP}" y="${HEADER_H - 4}" font-size="${AXIS_FONT}" fill="${textMuted}" font-family="${fontFamily}">${MONTH_NAMES[m]}</text>`
            : '').join('')
        : [0,10,20,30,40,50].map(w =>
            `<text x="${LABEL_W + w * CELL_STEP}" y="${HEADER_H - 4}" font-size="${AXIS_FONT}" fill="${textMuted}" font-family="${fontFamily}">week ${w}</text>`
          ).join('')

      // Row labels (every 5th)
      const rowLabels = Array.from({ length: totalRows }, (_, row) => {
        if (row % 5 !== 0) return ''
        const label = calendarMode ? birthYear + row : row
        const y = HEADER_H + row * CELL_STEP + CELL_SIZE - 1
        return `<text x="${LABEL_W - 4}" y="${y}" font-size="${AXIS_FONT}" fill="${textMuted}" font-family="${fontFamily}" text-anchor="end">${label}</text>`
      }).join('')

      let innerContent = resolveVar(innerSvg.innerHTML)

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="${bg}"/>
  ${colLabels}
  ${rowLabels}
  <g transform="translate(${LABEL_W},${HEADER_H})">${innerContent}</g>
</svg>`
    }
  }), [svgRef, calendarMode, birthYear, monthCols, totalRows, gridW, gridH, CELL_SIZE, CELL_STEP, LABEL_W, HEADER_H, AXIS_FONT])

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'auto', position: 'relative', willChange: 'transform' }}
      onMouseMove={handleMouseMove}
    >
      <div style={{ width: LABEL_W + gridW, padding: '20px 0 24px', margin: '0 auto', background: 'var(--bg-primary)' }}>

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
            {Array.from({ length: totalRows }, (_, row) => {
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
            ref={svgRef}
            width={gridW} height={gridH}
            style={{ overflow: 'visible', display: 'block', userSelect: 'none' }}
            onMouseUp={handleSvgMouseUp}
          >
            {(() => {
              const dragLo = dragStart !== null ? Math.min(dragStart, dragEnd ?? dragStart) : -1
              const dragHi = dragStart !== null ? Math.max(dragStart, dragEnd ?? dragStart) : -1
              return cells.map((cell) => {
              const { index, row, col, color, multiColors, isPast, isToday, isPreBirth } = cell
              const x = col * CELL_STEP
              const y = row * CELL_STEP

              const inDrag = dragStart !== null && index >= dragLo && index <= dragHi && !isPreBirth

              const opacity = isPreBirth ? 0.3 : inDrag ? 0.7 : isToday ? 1 : color ? (isPast ? 1 : 0.35) : 1
              const cursor = { cursor: isPreBirth ? 'default' : isDragging ? 'crosshair' : 'pointer' }
              const handlers = { onMouseEnter: e => handleMouseEnter(e, cell), onMouseLeave: handleMouseLeave, onMouseDown: e => handleCellMouseDown(e, cell) }

              if (!inDrag && !isPreBirth && !isToday && multiColors) {
                if (overlapMode === 2) {
                  return (
                    <g key={index} opacity={opacity} style={cursor} {...handlers}>
                      <polygon points={`${x},${y} ${x + CELL_SIZE},${y} ${x},${y + CELL_SIZE}`} fill={multiColors[0]} />
                      <polygon points={`${x + CELL_SIZE},${y} ${x + CELL_SIZE},${y + CELL_SIZE} ${x},${y + CELL_SIZE}`} fill={multiColors[1]} />
                    </g>
                  )
                }
                const cx = x + CELL_SIZE / 2, cy = y + CELL_SIZE / 2, h = CELL_SIZE / 2
                const N = multiColors.length
                const sliceAngle = (2 * Math.PI) / N
                const startBase = -Math.PI / 2
                function edgePt(a) {
                  const c = Math.cos(a), s = Math.sin(a)
                  const t = h / Math.max(Math.abs(c), Math.abs(s))
                  return `${cx + c * t},${cy + s * t}`
                }
                const CORNERS = [-Math.PI / 4, Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4]
                return (
                  <g key={index} opacity={opacity} style={cursor} {...handlers}>
                    {multiColors.map((c, i) => {
                      const sa = startBase + i * sliceAngle
                      const ea = sa + sliceAngle
                      const pts = [`${cx},${cy}`, edgePt(sa)]
                      for (let ca of CORNERS) {
                        while (ca <= sa) ca += 2 * Math.PI
                        if (ca < ea) pts.push(edgePt(ca))
                      }
                      pts.push(edgePt(ea))
                      return <polygon key={i} points={pts.join(' ')} fill={c} />
                    })}
                  </g>
                )
              }

              let fill
              if (isPreBirth) fill = 'var(--bg-secondary)'
              else if (inDrag) fill = 'var(--accent)'
              else if (isToday) fill = '#000000'
              else if (color) fill = color
              else if (isPast) fill = 'var(--week-past-empty)'
              else fill = 'var(--week-future)'

              return (
                <rect
                  key={index}
                  x={x} y={y}
                  width={CELL_SIZE} height={CELL_SIZE}
                  rx={0}
                  fill={fill}
                  opacity={opacity}
                  stroke={isToday ? 'var(--text-muted)' : 'none'}
                  strokeWidth={isToday ? 1.5 : 0}
                  style={cursor}
                  {...handlers}
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
                  rx={0} fill="none"
                  stroke="var(--accent)" strokeWidth={1} opacity={0.6}
                />
              )
            })()}
          </svg>
        </div>
      {/* Footer */}
      <div style={{
        width: LABEL_W + gridW, margin: '16px auto 0',
        padding: '12px 0 24px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: AXIS_FONT, color: 'var(--text-muted)', letterSpacing: '0.05em',
      }}>
        <span>All data stays in your browser. You own it — export and import anytime.</span>
        <span style={{ whiteSpace: 'nowrap', marginLeft: 24 }}>
          <a href="https://kdg.one" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            developed by KDG
          </a>
          {' · '}
          <a href="https://github.com/kdudzik/4000weeks" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            GitHub
          </a>
          {' · inspired by '}
          <a href="https://www.oliverburkeman.com/fourthousandweeks" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            O. Burkeman
          </a>
        </span>
      </div>
      </div>

      {/* Fallback tooltip — only used when showTooltip prop is not provided */}
      {!showTooltipProp && <div ref={tooltipRef} className="tooltip" style={{ display: 'none', pointerEvents: 'none' }} />}
    </div>
  )
})

export default WeekGrid
