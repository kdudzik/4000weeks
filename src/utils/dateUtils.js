import {
  addWeeks,
  startOfWeek,
  endOfWeek,
  differenceInCalendarWeeks,
  parseISO,
  isAfter,
  isBefore,
  isEqual,
  format,
  getYear,
} from 'date-fns'

export const TOTAL_ROWS = 80
export const WEEKS_PER_ROW = 52

/**
 * Returns the start-of-week date for week #weekIndex (0-based) from birthday.
 */
export function weekIndexToDate(birthday, weekIndex) {
  const base = startOfWeek(parseISO(birthday), { weekStartsOn: 1 })
  return addWeeks(base, weekIndex)
}

/**
 * Returns the 0-based week index from birthday for a given date string "YYYY-MM-DD".
 */
export function dateToWeekIndex(birthday, dateStr) {
  const base = startOfWeek(parseISO(birthday), { weekStartsOn: 1 })
  const target = startOfWeek(parseISO(dateStr), { weekStartsOn: 1 })
  return differenceInCalendarWeeks(target, base, { weekStartsOn: 1 })
}

/**
 * Returns which events (color) cover a given week index.
 * Returns array of { event, category } matching events.
 */
export function getEventsForWeek(weekIndex, events, categories, nowIndex) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  return events.filter(ev => {
    if (!ev.startDate) return false
    const start = ev._startWeek
    // null _endWeek = ongoing: extends to current week
    const end = ev._endWeek ?? nowIndex ?? ev._startWeek
    return weekIndex >= start && weekIndex <= end
  }).map(ev => ({
    event: ev,
    category: catMap[ev.categoryId],
    color: ev.color || catMap[ev.categoryId]?.color || '#888',
  }))
}

/**
 * Pre-compute _startWeek and _endWeek on each event.
 */
export function enrichEvents(events, birthday) {
  return events.map(ev => ({
    ...ev,
    _startWeek: dateToWeekIndex(birthday, ev.startDate),
    _endWeek: ev.endDate
      ? dateToWeekIndex(birthday, ev.endDate)
      : ev.ongoing
        ? null  // resolved to nowIndex at render time
        : dateToWeekIndex(birthday, ev.startDate),
  }))
}

/**
 * Current week index from birthday.
 */
export function currentWeekIndex(birthday) {
  return dateToWeekIndex(birthday, format(new Date(), 'yyyy-MM-dd'))
}

/**
 * Format a week range for display.
 */
export function formatWeekRange(weekStart) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  return `${format(weekStart, 'dd MMM yyyy')} – ${format(weekEnd, 'dd MMM yyyy')}`
}

// ── Calendar mode utilities ──────────────────────────────────────────────────

/** Start of week containing Jan 1 of birth year — the calendar grid origin. */
export function getCalBase(birthday) {
  const birthYear = getYear(parseISO(birthday))
  return startOfWeek(new Date(birthYear, 0, 1), { weekStartsOn: 1 })
}

/** Weeks from calendar base to a date string. */
export function dateToCalWeekIndex(birthday, dateStr) {
  const base = getCalBase(birthday)
  const target = startOfWeek(parseISO(dateStr), { weekStartsOn: 1 })
  return differenceInCalendarWeeks(target, base, { weekStartsOn: 1 })
}

/** Date for a given calendar grid index. */
export function calWeekIndexToDate(birthday, calIndex) {
  return addWeeks(getCalBase(birthday), calIndex)
}

/** Column positions (0-based) for each month in the birth year. */
export function getMonthCols(birthday) {
  const base = getCalBase(birthday)
  const birthYear = getYear(parseISO(birthday))
  return Array.from({ length: 12 }, (_, m) => {
    const monthStart = startOfWeek(new Date(birthYear, m, 1), { weekStartsOn: 1 })
    return differenceInCalendarWeeks(monthStart, base, { weekStartsOn: 1 })
  })
}

/**
 * Blend multiple hex colors together (simple average in RGB).
 */
export function blendColors(colors) {
  if (colors.length === 0) return null
  if (colors.length === 1) return colors[0]
  const rgbs = colors.map(hexToRgb).filter(Boolean)
  if (rgbs.length === 0) return colors[0]
  const avg = {
    r: Math.round(rgbs.reduce((s, c) => s + c.r, 0) / rgbs.length),
    g: Math.round(rgbs.reduce((s, c) => s + c.g, 0) / rgbs.length),
    b: Math.round(rgbs.reduce((s, c) => s + c.b, 0) / rgbs.length),
  }
  return `rgb(${avg.r},${avg.g},${avg.b})`
}

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}
