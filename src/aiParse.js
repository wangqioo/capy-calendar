import { loadSettings } from './settings'

const DEFAULT_API_URL = 'https://ai-gateway.happycapy.ai/api/v1/chat/completions'
const DEFAULT_API_KEY = import.meta.env.VITE_AI_KEY

export async function parseEventFromText(text, todayStr) {
  const s = loadSettings()
  const apiUrl = s.apiUrl || DEFAULT_API_URL
  const apiKey = s.apiKey || DEFAULT_API_KEY
  const model = s.model || 'anthropic/claude-haiku-4.5'

  const systemPrompt = `你是一个日程解析助手。今天是 ${todayStr}。
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

  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      max_tokens: 300,
    }),
  })

  if (!resp.ok) throw new Error(`AI 解析失败 (${resp.status})`)
  const data = await resp.json()
  const content = data.choices[0].message.content.trim()

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('无法解析返回结果')

  return JSON.parse(jsonMatch[0])
}
