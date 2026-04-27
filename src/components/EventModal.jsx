import { useState } from 'react'

const defaultForm = {
  title: '',
  date: '',
  time: '',
  endTime: '',
  repeat: 'none',
  priority: 'normal',
  tags: '',
  note: '',
  done: false,
}

export default function EventModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    if (!initial) return defaultForm
    return {
      title: initial.title || '',
      date: initial.date || '',
      time: initial.time || '',
      endTime: initial.endTime || '',
      repeat: initial.repeat || 'none',
      priority: initial.priority || 'normal',
      tags: (initial.tags || []).join(', '),
      note: initial.note || '',
      done: initial.done || false,
    }
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleSave() {
    if (!form.title.trim()) return
    onSave({
      title: form.title.trim(),
      date: form.date || null,
      time: form.time || null,
      endTime: form.endTime || null,
      repeat: form.repeat,
      priority: form.priority,
      tags: form.tags ? form.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [],
      note: form.note,
      done: form.done,
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{initial && initial.id ? '编辑事项' : '新建事项'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <label className="field-label">标题 *</label>
          <input
            className="field-input"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="事项标题"
            autoFocus
          />

          <div className="field-row">
            <div className="field-col">
              <label className="field-label">日期</label>
              <input
                className="field-input"
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>
            <div className="field-col">
              <label className="field-label">开始时间</label>
              <input
                className="field-input"
                type="time"
                value={form.time}
                onChange={e => set('time', e.target.value)}
              />
            </div>
            <div className="field-col">
              <label className="field-label">结束时间</label>
              <input
                className="field-input"
                type="time"
                value={form.endTime}
                onChange={e => set('endTime', e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field-col">
              <label className="field-label">重复</label>
              <select className="field-input" value={form.repeat} onChange={e => set('repeat', e.target.value)}>
                <option value="none">不重复</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
                <option value="monthly">每月</option>
              </select>
            </div>
            <div className="field-col">
              <label className="field-label">优先级</label>
              <select className="field-input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">低</option>
                <option value="normal">普通</option>
                <option value="high">紧急</option>
              </select>
            </div>
          </div>

          <label className="field-label">标签（逗号分隔）</label>
          <input
            className="field-input"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="例如：工作, 会议"
          />

          <label className="field-label">备注</label>
          <textarea
            className="field-input field-textarea"
            value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder="可选备注"
            rows={3}
          />

          <label className="field-check">
            <input
              type="checkbox"
              checked={form.done}
              onChange={e => set('done', e.target.checked)}
            />
            <span>已完成</span>
          </label>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={handleSave} disabled={!form.title.trim()}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
