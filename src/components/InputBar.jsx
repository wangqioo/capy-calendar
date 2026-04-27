import { useState } from 'react'
import { parseEvent } from '../parse'

const SOURCE_LABEL = {
  local: { text: '本地解析', color: '#10b981' },
  ai:    { text: 'AI 解析',  color: '#6366f1' },
  fallback: { text: '本地兜底', color: '#f59e0b' },
}

export default function InputBar({ onAdd }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastSource, setLastSource] = useState(null)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    setLastSource(null)
    setLoading(true)
    try {
      const { event, source } = await parseEvent(text.trim())
      onAdd({ ...event, done: false })
      setLastSource(source)
      setText('')
    } catch (err) {
      setError('解析失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const src = lastSource ? SOURCE_LABEL[lastSource] : null

  return (
    <div className="input-bar-wrap">
      <form className="input-bar" onSubmit={handleSubmit}>
        <input
          className="input-text"
          type="text"
          placeholder='用自然语言描述，例如："下周五下午3点开会" 或 "提醒我明天交作业"'
          value={text}
          onChange={e => { setText(e.target.value); setLastSource(null) }}
          disabled={loading}
        />
        <button className="input-btn" type="submit" disabled={loading || !text.trim()}>
          {loading ? '解析中…' : '添加'}
        </button>
      </form>
      <div className="input-status">
        {src && (
          <span className="parse-source" style={{ color: src.color }}>
            ● {src.text}
          </span>
        )}
        {error && <span className="input-error">{error}</span>}
      </div>
    </div>
  )
}
