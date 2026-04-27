import { useState, useEffect } from 'react'

const STORAGE_KEY = 'capy_events'

export function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

export function useEvents() {
  const [events, setEvents] = useState(loadEvents)

  useEffect(() => {
    saveEvents(events)
  }, [events])

  function addEvent(ev) {
    setEvents(prev => [...prev, { ...ev, id: Date.now().toString() }])
  }

  function updateEvent(id, patch) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  function toggleDone(id) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e))
  }

  return { events, addEvent, updateEvent, deleteEvent, toggleDone }
}
