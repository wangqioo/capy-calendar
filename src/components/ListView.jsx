import dayjs from 'dayjs'

const REPEAT_LABEL = { none: '', daily: '每天', weekly: '每周', monthly: '每月' }

export default function ListView({ events, onToggle, onEdit, onDelete }) {
  const today = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')

  const overdue = []
  const todayEvents = []
  const tomorrowEvents = []
  const upcoming = []
  const undated = []

  const sorted = [...events].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    const dateCmp = a.date.localeCompare(b.date)
    if (dateCmp !== 0) return dateCmp
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })

  for (const ev of sorted) {
    if (!ev.date) { undated.push(ev); continue }
    if (ev.date < today && !ev.done) overdue.push(ev)
    else if (ev.date === today) todayEvents.push(ev)
    else if (ev.date === tomorrow) tomorrowEvents.push(ev)
    else if (ev.date > today) upcoming.push(ev)
    else todayEvents.push(ev)
  }

  const groups = [
    { label: '已过期', items: overdue, accent: '#ef4444' },
    { label: '今天', items: todayEvents, accent: '#3b82f6' },
    { label: '明天', items: tomorrowEvents, accent: '#8b5cf6' },
    { label: '即将到来', items: upcoming, accent: '#10b981' },
    { label: '无日期', items: undated, accent: '#94a3b8' },
  ].filter(g => g.items.length > 0)

  if (events.length === 0) {
    return (
      <div className="empty-state">
        <p>还没有任何日程</p>
        <p className="empty-hint">在上方输入框用自然语言添加第一条</p>
      </div>
    )
  }

  return (
    <div className="list-view">
      {groups.map(group => (
        <section key={group.label} className="event-group">
          <h2 className="group-label" style={{ borderColor: group.accent, color: group.accent }}>
            {group.label}
            <span className="group-count">{group.items.length}</span>
          </h2>
          <ul className="event-list">
            {group.items.map(ev => (
              <EventItem
                key={ev.id}
                ev={ev}
                onToggle={() => onToggle(ev.id)}
                onEdit={() => onEdit(ev)}
                onDelete={() => onDelete(ev.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function EventItem({ ev, onToggle, onEdit, onDelete }) {
  return (
    <li className={`event-item ${ev.done ? 'done' : ''} priority-${ev.priority}`}>
      <button className="check-btn" onClick={onToggle} title={ev.done ? '标记未完成' : '标记完成'}>
        {ev.done ? '✓' : '○'}
      </button>
      <div className="event-body" onClick={onEdit}>
        <div className="event-title">{ev.title}</div>
        <div className="event-meta">
          {ev.date && (
            <span className="meta-date">
              {dayjs(ev.date).format('MM/DD')}
              {ev.time && ` ${ev.time}`}
              {ev.endTime && ` - ${ev.endTime}`}
            </span>
          )}
          {ev.repeat !== 'none' && (
            <span className="meta-tag repeat">{REPEAT_LABEL[ev.repeat]}</span>
          )}
          {ev.priority === 'high' && (
            <span className="meta-tag urgent">紧急</span>
          )}
          {ev.tags && ev.tags.map(t => (
            <span key={t} className="meta-tag">{t}</span>
          ))}
        </div>
      </div>
      <div className="event-actions">
        <button className="action-btn" onClick={onEdit} title="编辑">✎</button>
        <button className="action-btn del" onClick={onDelete} title="删除">✕</button>
      </div>
    </li>
  )
}
