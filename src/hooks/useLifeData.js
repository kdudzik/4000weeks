import { useState, useCallback } from 'react'

export const DEFAULT_CATEGORY_COLORS = {
  relationship: '#ef4444', // red        0°  — love/passion
  home:         '#a8a29e', // warm gray  —    neutral background presence
  job:          '#eab308', // yellow    50°  — work/money
  birth:        '#84cc16', // lime      85°  — new life/spring
  health:       '#22c55e', // green    142°  — vitality
  travel:       '#06b6d4', // cyan     190°  — open skies
  school:       '#3b82f6', // blue     215°  — learning
  university:   '#8b5cf6', // violet   262°  — academia
  other:        '#d946ef', // fuchsia  295°  — misc
  pets:         '#f472b6', // pink     330°  — playful
  death:        '#475569', // dark slate —     quiet/neutral
}

const DEFAULT_CATEGORIES = [
  { id: 'home',         label: 'Home',          color: DEFAULT_CATEGORY_COLORS.home,         icon: '🏠' },
  { id: 'school',       label: 'School',        color: DEFAULT_CATEGORY_COLORS.school,       icon: '📚' },
  { id: 'university',   label: 'University',    color: DEFAULT_CATEGORY_COLORS.university,   icon: '🎓' },
  { id: 'job',          label: 'Job',           color: DEFAULT_CATEGORY_COLORS.job,          icon: '💼' },
  { id: 'relationship', label: 'Relationship',  color: DEFAULT_CATEGORY_COLORS.relationship, icon: '❤️' },
  { id: 'travel',       label: 'Travel',        color: DEFAULT_CATEGORY_COLORS.travel,       icon: '✈️' },
  { id: 'health',       label: 'Health',        color: DEFAULT_CATEGORY_COLORS.health,       icon: '🏥' },
  { id: 'birth',        label: 'Birth',         color: DEFAULT_CATEGORY_COLORS.birth,        icon: '🌱' },
  { id: 'death',        label: 'Death',         color: DEFAULT_CATEGORY_COLORS.death,        icon: '🕯️' },
  { id: 'pets',         label: 'Pet',           color: DEFAULT_CATEGORY_COLORS.pets,         icon: '🐾' },
  { id: 'other',        label: 'Other',         color: DEFAULT_CATEGORY_COLORS.other,        icon: '💠' },
]

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function useLifeData() {
  const [birthday, setBirthdayState] = useState(() => load('4kw_birthday', null))
  const [name, setNameState] = useState(() => load('4kw_name', ''))
  const [categories, setCategoriesState] = useState(() => {
    const stored = load('4kw_categories', null)
    // Merge: add any presets not already present by id
    if (!stored) return DEFAULT_CATEGORIES
    const storedIds = new Set(stored.map(c => c.id))
    const missing = DEFAULT_CATEGORIES.filter(p => !storedIds.has(p.id))
    if (missing.length === 0) return stored
    const merged = [...stored, ...missing]
    save('4kw_categories', merged)
    return merged
  })
  const [events, setEventsState] = useState(() => load('4kw_events', []))

  const setBirthday = useCallback((date) => {
    setBirthdayState(date)
    save('4kw_birthday', date)
  }, [])

  const setName = useCallback((n) => {
    setNameState(n)
    save('4kw_name', n)
  }, [])

  const addCategory = useCallback((cat) => {
    setCategoriesState(prev => {
      const next = [...prev, cat]
      save('4kw_categories', next)
      return next
    })
  }, [])

  const updateCategory = useCallback((id, updates) => {
    setCategoriesState(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c)
      save('4kw_categories', next)
      return next
    })
  }, [])

  const deleteCategory = useCallback((id) => {
    setCategoriesState(prev => {
      const next = prev.filter(c => c.id !== id)
      save('4kw_categories', next)
      return next
    })
    // Remove events in this category
    setEventsState(prev => {
      const next = prev.filter(e => e.categoryId !== id)
      save('4kw_events', next)
      return next
    })
  }, [])

  const addEvent = useCallback((ev) => {
    const withId = { ...ev, id: crypto.randomUUID() }
    setEventsState(prev => {
      const next = [...prev, withId]
      save('4kw_events', next)
      return next
    })
    return withId
  }, [])

  const updateEvent = useCallback((id, updates) => {
    setEventsState(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e)
      save('4kw_events', next)
      return next
    })
  }, [])

  const deleteEvent = useCallback((id) => {
    setEventsState(prev => {
      const next = prev.filter(e => e.id !== id)
      save('4kw_events', next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem('4kw_birthday')
    localStorage.removeItem('4kw_name')
    localStorage.removeItem('4kw_events')
    localStorage.removeItem('4kw_categories')
    setBirthdayState(null)
    setNameState('')
    setEventsState([])
    setCategoriesState(DEFAULT_CATEGORIES)
  }, [])

  const exportData = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      birthday: load('4kw_birthday', null),
      name: load('4kw_name', ''),
      categories: load('4kw_categories', []),
      events: load('4kw_events', []),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const slug = (data.name || 'export').toLowerCase().replace(/\s+/g, '-')
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
    a.download = `4000weeks-${slug}-${ts}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const importData = useCallback((json) => {
    const data = JSON.parse(json)
    if (!data.birthday || !Array.isArray(data.events) || !Array.isArray(data.categories)) {
      throw new Error('Invalid file format')
    }
    save('4kw_birthday', data.birthday)
    save('4kw_name', data.name || '')
    const storedIds = new Set(data.categories.map(c => c.id))
    const missing = DEFAULT_CATEGORIES.filter(p => !storedIds.has(p.id))
    const mergedCats = missing.length ? [...data.categories, ...missing] : data.categories
    save('4kw_categories', mergedCats)
    save('4kw_events', data.events)
    setBirthdayState(data.birthday)
    setNameState(data.name || '')
    setCategoriesState(mergedCats)
    setEventsState(data.events)
  }, [])

  return {
    birthday, setBirthday,
    name, setName,
    categories, addCategory, updateCategory, deleteCategory,
    events, addEvent, updateEvent, deleteEvent,
    reset, exportData, importData,
  }
}
