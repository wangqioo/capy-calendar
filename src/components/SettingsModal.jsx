import { useState } from 'react'
import { loadSettings, saveSettings, PROVIDER_PRESETS } from '../settings'

export default function SettingsModal({ onClose }) {
  const [local, setLocal] = useState(() => {
    const s = loadSettings()
    return { ...s, _savedKeys: {} }
  })
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  function applyPreset(preset) {
    setLocal(prev => {
      const savedKeys = { ...(prev._savedKeys || {}), [prev.baseUrl]: prev.apiKey }
      const restoredKey = savedKeys[preset.baseUrl] || ''
      return {
        ...prev,
        baseUrl: preset.baseUrl,
        model: preset.models[0],
        apiKey: restoredKey,
        _savedKeys: savedKeys,
      }
    })
    setSaved(false)
  }

  function set(field, value) {
    setLocal(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function handleSave() {
    const { _savedKeys, ...toSave } = local
    saveSettings(toSave)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const currentPreset = PROVIDER_PRESETS.find(p => p.baseUrl === local.baseUrl)
  const modelChips = currentPreset?.models || []

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>AI 模型设置</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="settings-desc">
            支持任何 OpenAI 兼容接口，以及 Anthropic 原生 API。API Key 仅存储在浏览器本地。
          </p>

          <div className="settings-section-label">选择提供商</div>
          <div className="provider-grid">
            {PROVIDER_PRESETS.map(p => (
              <button
                key={p.name}
                className={`provider-btn ${local.baseUrl === p.baseUrl ? 'active' : ''}`}
                onClick={() => applyPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>

          <label className="field-label">API Base URL</label>
          <input
            className="field-input"
            value={local.baseUrl || ''}
            onChange={e => set('baseUrl', e.target.value)}
            placeholder="https://api.openai.com/v1"
          />

          <label className="field-label">API Key</label>
          <div className="field-row">
            <input
              className="field-input"
              type={showKey ? 'text' : 'password'}
              value={local.apiKey || ''}
              onChange={e => set('apiKey', e.target.value)}
              placeholder={currentPreset?.keyPlaceholder || '留空使用内置 Key'}
            />
            <button className="key-toggle-btn" onClick={() => setShowKey(v => !v)}>
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>

          <label className="field-label">模型</label>
          <input
            className="field-input"
            value={local.model || ''}
            onChange={e => set('model', e.target.value)}
            placeholder="gpt-4.1 / claude-sonnet-4-6 / deepseek-chat"
          />
          {modelChips.length > 0 && (
            <div className="model-chips">
              {modelChips.map(m => (
                <span
                  key={m}
                  className={`model-chip ${local.model === m ? 'active' : ''}`}
                  onClick={() => set('model', m)}
                >
                  {m}
                </span>
              ))}
            </div>
          )}
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
