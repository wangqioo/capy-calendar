import { useState } from 'react'
import dayjs from 'dayjs'

export default function CalendarView({ events, selectedDate, onSelectDate, onEdit, onNewFromDate }) {
  const [viewMonth, setViewMonth] = useState(dayjs().startOf('month'))

  const today = dayjs().format('YYYY-MM-DD')
  const startOfMonth = viewMonth.startOf('month')
  const startDay = startOfMonth.day() // 0=Sun
  const daysInMonth = viewMonth.daysInMonth()

  const cells = []
  const leadingBlanks = (startDay + 6) % 7 // Mon=0
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(viewMonth.date(d))

  const byDate = {}
  for (const ev of events) {
    if (!ev.date) continue
    if (!byDate[ev.date]) byDate[ev.date] = []
    byDate[ev.date].push(ev)
  }

  const selected = selectedDate.format('YYYY-MM-DD')
  const dayNames = ['一', '二', '三', '四', '五', '六', '日']
  const selectedEvents = byDate[selected] || []

  return (
    <div className="calendar-view">
      <div className="cal-header">
        <button className="cal-nav" onClick={() => setViewMonth(m => m.subtract(1, 'month'))}>‹</button>
        <span className="cal-title">{viewMonth.format('YYYY年 M月')}</span>
        <button className="cal-nav" onClick={() => setViewMonth(m => m.add(1, 'month'))}>›</button>
        <button className="cal-today-btn" onClick={() => { setViewMonth(dayjs().startOf('month')); onSelectDate(dayjs()) }}>
          今天
        </button>
      </div>

      <div className="cal-grid">
        {dayNames.map(d => (
          <div key={d} className="cal-dayname">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} className="cal-cell blank" />
          const dateStr = day.format('YYYY-MM-DD')
          const evs = byDate[dateStr] || []
          const isToday = dateStr === today
          const isSelected = dateStr === selected
          return (
            <div
              key={dateStr}
              className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectDate(day)}
            >
              <span className="cal-date-num">{day.date()}</span>
              <div className="cal-dots">
                {evs.slice(0, 3).map(ev => (
                  <span
                    key={ev.id}
                    className={`cal-dot ${ev.priority === 'high' ? 'dot-high' : ev.done ? 'dot-done' : ''}`}
                  />
                ))}
                {evs.length > 3 && <span className="cal-more">+{evs.length - 3}</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="cal-day-detail">
        <div className="cal-detail-header">
          <span>{selectedDate.format('M月D日 dddd')}</span>
          <button className="btn-new-small" onClick={() => onNewFromDate(selectedDate)}>+ 添加</button>
        </div>
        {selectedEvents.length === 0 ? (
          <p className="cal-empty">当天没有日程，点击"+ 添加"创建</p>
        ) : (
          <ul className="cal-event-list">
            {selectedEvents
              .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
              .map(ev => (
                <li
                  key={ev.id}
                  className={`cal-event-item ${ev.done ? 'done' : ''} priority-${ev.priority}`}
                  onClick={() => onEdit(ev)}
                >
                  <span className="cal-ev-time">{ev.time ? `${ev.time}${ev.endTime ? `-${ev.endTime}` : ''}` : '--:--'}</span>
                  <span className="cal-ev-title">{ev.title}</span>
                  {ev.priority === 'high' && <span className="dot-high-tag">!</span>}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
