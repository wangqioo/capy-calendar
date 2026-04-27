const STORAGE_KEY = 'capy_ai_settings'

export const PROVIDER_PRESETS = [
  {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini'],
    keyPlaceholder: 'sk-...',
  },
  {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5'],
    keyPlaceholder: 'sk-ant-...',
  },
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    keyPlaceholder: 'sk-...',
  },
  {
    name: '阿里云百炼 (Qwen)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen3.5-plus', 'qwen3.5-max', 'qwen-max-latest', 'qwen-coder-plus-latest'],
    keyPlaceholder: 'sk-...',
  },
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-4-scout-17b-16e-instruct', 'qwen-qwq-32b'],
    keyPlaceholder: 'gsk_...',
  },
  {
    name: '智谱 (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4.5-flash', 'glm-5', 'glm-4.7-flash'],
    keyPlaceholder: '智谱 API Key',
  },
  {
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    models: ['MiniMax-M2.5', 'MiniMax-Text-01'],
    keyPlaceholder: 'MiniMax API Key',
  },
  {
    name: 'Ollama (本地)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['qwen3:8b', 'qwen3:14b', 'deepseek-r1:8b'],
    keyPlaceholder: 'ollama',
  },
]

const DEFAULT_SETTINGS = {
  baseUrl: 'https://ai-gateway.happycapy.ai/api/v1',
  model: 'anthropic/claude-haiku-4.5',
  apiKey: '',
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function isAnthropicEndpoint(baseUrl = '') {
  return baseUrl.includes('anthropic.com')
}
