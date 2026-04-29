import { useState, useRef } from 'react'
import { parseEvent } from '../parse'

const SOURCE_LABEL = {
  local: { text: '本地解析', color: '#10b981' },
  ai:    { text: 'AI 解析',  color: '#6366f1' },
  fallback: { text: '本地兜底', color: '#f59e0b' },
}

const SR = window.SpeechRecognition || window.webkitSpeechRecognition

export default function InputBar({ onAdd }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastSource, setLastSource] = useState(null)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  async function submitText(input) {
    if (!input.trim()) return
    setError('')
    setLastSource(null)
    setLoading(true)
    try {
      const { event, source } = await parseEvent(input.trim())
      onAdd({ ...event, done: false })
      setLastSource(source)
      setText('')
    } catch {
      setError('解析失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await submitText(text)
  }

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop()
      setListening(false)
      return
    }
    if (!SR) {
      setError('浏览器不支持语音识别，请使用 Chrome 或 Edge')
      return
    }
    const rec = new SR()
    rec.lang = 'zh-CN'
    rec.continuous = false
    rec.interimResults = false
    recRef.current = rec

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setText(transcript)
      setListening(false)
      submitText(transcript)
    }
    rec.onerror = () => {
      setError('语音识别出错，请重试')
      setListening(false)
    }
    rec.onend = () => setListening(false)

    rec.start()
    setListening(true)
    setError('')
  }

  const src = lastSource ? SOURCE_LABEL[lastSource] : null

  return (
    <div className="input-bar-wrap">
      <form className="input-bar" onSubmit={handleSubmit}>
        <input
          className="input-text"
          type="text"
          placeholder='用自然语言描述，例如："下午七点锻炼" 或 "提醒我明天交作业"'
          value={text}
          onChange={e => { setText(e.target.value); setLastSource(null) }}
          disabled={loading}
        />
        <button
          type="button"
          className={`btn-mic ${listening ? 'listening' : ''}`}
          onClick={toggleVoice}
          disabled={loading}
          title={listening ? '点击停止' : '语音输入'}
        >
          {listening ? '⏹' : '🎤'}
        </button>
        <button className="input-btn" type="submit" disabled={loading || !text.trim()}>
          {loading ? '解析中…' : '添加'}
        </button>
      </form>
      <div className="input-status">
        {listening && <span className="parse-source" style={{ color: '#ef4444' }}>● 正在聆听…</span>}
        {!listening && src && (
          <span className="parse-source" style={{ color: src.color }}>
            ● {src.text}
          </span>
        )}
        {error && <span className="input-error">{error}</span>}
      </div>
    </div>
  )
}
