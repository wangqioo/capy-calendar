/**
 * Browser Notifications API wrapper.
 * Schedules a notification for a given event.
 * Note: only fires while the browser tab is open (no Service Worker).
 */

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

export function getPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

const scheduledTimers = new Map()  // eventId → timerId

export function scheduleNotification(event) {
  if (!event.date || !event.time) return
  if (getPermission() !== 'granted') return

  const fireAt = new Date(`${event.date}T${event.time}:00`)
  const now = new Date()
  const delay = fireAt - now

  if (delay <= 0) return  // already past

  // Cancel existing timer for this event
  cancelNotification(event.id)

  const timerId = setTimeout(() => {
    new Notification(event.title, {
      body: event.note || `${event.date} ${event.time}`,
      icon: '/favicon.svg',
      tag: event.id,
    })
    scheduledTimers.delete(event.id)
  }, delay)

  scheduledTimers.set(event.id, timerId)
}

export function cancelNotification(eventId) {
  if (scheduledTimers.has(eventId)) {
    clearTimeout(scheduledTimers.get(eventId))
    scheduledTimers.delete(eventId)
  }
}

export function rescheduleAll(events) {
  // Cancel all existing
  for (const timerId of scheduledTimers.values()) clearTimeout(timerId)
  scheduledTimers.clear()
  // Reschedule undone future events with a time
  for (const ev of events) {
    if (!ev.done) scheduleNotification(ev)
  }
}
