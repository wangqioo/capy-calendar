import { useState } from 'react'
import dayjs from 'dayjs'
import { parseEventFromText } from '../aiParse'

export default function InputBar({ onAdd }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    setLoading(true)
    try {
      const parsed = await parseEventFromText(text.trim(), dayjs().format('YYYY-MM-DD'))
      onAdd({
        title: parsed.title || text.trim(),
        date: parsed.date || null,
        time: parsed.time || null,
        endTime: parsed.endTime || null,
        repeat: parsed.repeat || 'none',
        priority: parsed.priority || 'normal',
        tags: parsed.tags || [],
        note: parsed.note || '',
        done: false,
      })
      setText('')
    } catch (err) {
      // Fallback: add as plain title without AI parsing
      onAdd({
        title: text.trim(),
        date: null,
        time: null,
        endTime: null,
        repeat: 'none',
        priority: 'normal',
        tags: [],
        note: '',
        done: false,
      })
      setText('')
      setError('AI 解析失败，已作为普通事项添加')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="input-bar-wrap">
      <form className="input-bar" onSubmit={handleSubmit}>
        <input
          className="input-text"
          type="text"
          placeholder='用自然语言描述，例如："下周五下午3点开会" 或 "提醒我明天交作业"'
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading}
        />
        <button className="input-btn" type="submit" disabled={loading || !text.trim()}>
          {loading ? '解析中…' : 'AI 添加'}
        </button>
      </form>
      {error && <p className="input-error">{error}</p>}
    </div>
  )
}
