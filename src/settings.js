const KEY = 'capy_ai_settings'

export const PRESET_MODELS = [
  { label: 'Claude Haiku 4.5 (快速)', value: 'anthropic/claude-haiku-4.5' },
  { label: 'Claude Sonnet 4.6 (均衡)', value: 'anthropic/claude-sonnet-4-6' },
  { label: 'GPT-4.1', value: 'openai/gpt-4.1' },
  { label: 'Gemini Flash', value: 'google/gemini-3.1-flash-preview' },
  { label: 'Gemini Pro', value: 'google/gemini-3.1-pro-preview' },
  { label: 'Grok 3', value: 'x-ai/grok-3' },
]

const defaults = {
  model: 'anthropic/claude-haiku-4.5',
  apiUrl: 'https://ai-gateway.happycapy.ai/api/v1/chat/completions',
  apiKey: '',
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
  } catch {
    return { ...defaults }
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
}
