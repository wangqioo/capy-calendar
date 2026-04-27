import { useState } from 'react'
import { loadSettings, saveSettings, PRESET_MODELS } from '../settings'

export default function SettingsModal({ onClose }) {
  const [form, setForm] = useState(loadSettings)
  const [saved, setSaved] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setSaved(false)
  }

  function handleSave() {
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const isCustomModel = !PRESET_MODELS.find(p => p.value === form.model)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>AI 设置</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <label className="field-label">模型</label>
          <select
            className="field-input"
            value={isCustomModel ? '__custom__' : form.model}
            onChange={e => {
              if (e.target.value !== '__custom__') set('model', e.target.value)
            }}
          >
            {PRESET_MODELS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
            <option value="__custom__">自定义…</option>
          </select>

          {isCustomModel && (
            <>
              <label className="field-label">自定义模型 ID</label>
              <input
                className="field-input"
                value={form.model}
                onChange={e => set('model', e.target.value)}
                placeholder="例如：openai/gpt-4o"
              />
            </>
          )}

          <label className="field-label">API 端点</label>
          <input
            className="field-input"
            value={form.apiUrl}
            onChange={e => set('apiUrl', e.target.value)}
            placeholder="https://..."
          />
          <p className="settings-hint">兼容 OpenAI Chat Completions 格式的端点均可使用</p>

          <label className="field-label">API Key（可选）</label>
          <input
            className="field-input"
            type="password"
            value={form.apiKey}
            onChange={e => set('apiKey', e.target.value)}
            placeholder="留空则使用内置 Key"
          />
          <p className="settings-hint">如使用外部端点（如 OpenRouter、OpenAI），在此填入你的 Key</p>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>关闭</button>
          <button className="btn-primary" onClick={handleSave}>
            {saved ? '已保存 ✓' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
