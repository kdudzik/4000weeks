import { useState, useEffect, useCallback } from 'react'

const DEFAULT_CATEGORIES = [
  { id: 'home',         label: 'Home',          color: '#34d399', icon: '🏠' },
  { id: 'school',       label: 'School',        color: '#60a5fa', icon: '📚' },
  { id: 'university',   label: 'University',    color: '#818cf8', icon: '🎓' },
  { id: 'job',          label: 'Job',           color: '#fbbf24', icon: '💼' },
  { id: 'relationship', label: 'Relationship',  color: '#f472b6', icon: '❤️' },
  { id: 'travel',       label: 'Travel',        color: '#a78bfa', icon: '✈️' },
  { id: 'health',       label: 'Health',        color: '#fb923c', icon: '🏥' },
  { id: 'birth',        label: 'Birth',         color: '#a3e635', icon: '🌱' },
  { id: 'death',        label: 'Death',         color: '#94a3b8', icon: '🕯️' },
  { id: 'pets',         label: 'Pet',           color: '#22d3ee', icon: '🐾' },
  { id: 'other',        label: 'Other',         color: '#e879f9', icon: '💠'  },
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

  const setCategories = useCallback((cats) => {
    setCategoriesState(cats)
    save('4kw_categories', cats)
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
