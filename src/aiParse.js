import { loadSettings, isAnthropicEndpoint } from './settings'

const BUILTIN_API_URL = 'https://ai-gateway.happycapy.ai/api/v1/chat/completions'
const BUILTIN_API_KEY = import.meta.env.VITE_AI_KEY
const BUILTIN_MODEL = 'anthropic/claude-haiku-4.5'

const SYSTEM_PROMPT = (todayStr) => `你是一个日程解析助手。今天是 ${todayStr}。
用户会输入一段自然语言描述的事件或提醒，你需要将其解析为结构化 JSON。

返回格式（严格 JSON，不加任何解释）：
{
  "title": "事件标题",
  "date": "YYYY-MM-DD 或 null",
  "time": "HH:mm 或 null",
  "endTime": "HH:mm 或 null",
  "repeat": "none|daily|weekly|monthly",
  "priority": "low|normal|high",
  "tags": [],
  "note": ""
}

规则：
- 如果没有明确日期，date 设为 null
- 如果没有明确时间，time 设为 null
- repeat 默认 none
- priority 默认 normal，包含"重要""紧急"等词时设为 high
- tags 从内容中推断，如 ["工作","会议"]
- title 要简洁，去掉时间日期词汇`

export async function parseEventFromText(text, todayStr) {
  const s = loadSettings()
  const useBuiltin = !s.apiKey && !s.baseUrl.includes('anthropic.com') && !s.baseUrl.includes('openai.com')
    && !s.baseUrl.includes('deepseek') && !s.baseUrl.includes('groq')
    && !s.baseUrl.includes('bigmodel') && !s.baseUrl.includes('minimax')
    && !s.baseUrl.includes('dashscope') && !s.baseUrl.includes('localhost')

  const apiKey = s.apiKey || BUILTIN_API_KEY
  const model = s.model || BUILTIN_MODEL
  const systemContent = SYSTEM_PROMPT(todayStr)
  const messages = [
    { role: 'user', content: text },
  ]

  let resp

  if (isAnthropicEndpoint(s.baseUrl)) {
    // Anthropic native API format
    const url = s.baseUrl.replace(/\/$/, '') + '/v1/messages'
    resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        system: systemContent,
        messages,
      }),
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Anthropic API 错误 ${resp.status}: ${err}`)
    }
    const data = await resp.json()
    const content = data.content?.[0]?.text?.trim()
    if (!content) throw new Error('Anthropic 返回内容为空')
    return extractJson(content)
  } else {
    // OpenAI-compatible format (OpenAI, DeepSeek, Qwen, Groq, GLM, Ollama, internal gateway...)
    const baseUrl = useBuiltin ? 'https://ai-gateway.happycapy.ai/api/v1' : s.baseUrl
    const url = baseUrl.endsWith('/') ? baseUrl + 'chat/completions' : baseUrl + '/chat/completions'
    resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: text },
        ],
      }),
    })
    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`API 错误 ${resp.status}: ${err}`)
    }
    const data = await resp.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) throw new Error('返回内容为空')
    return extractJson(content)
  }
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('无法解析 JSON')
  return JSON.parse(match[0])
}
