import * as chrono from 'chrono-node'
import dayjs from 'dayjs'

// ── Chinese → English date/time normalization ──────────────────────────────

const WEEKDAY_MAP = { '一': 'Monday', '二': 'Tuesday', '三': 'Wednesday', '四': 'Thursday', '五': 'Friday', '六': 'Saturday', '日': 'Sunday', '天': 'Sunday' }
const NUM_ZH = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12, '二十': 20, '三十': 30 }

function zhNumToInt(str) {
  if (!str) return null
  const n = parseInt(str)
  if (!isNaN(n)) return n
  return NUM_ZH[str] ?? null
}

// Detect signals that need AI (vague, relational, contextual language)
const AI_SIGNALS = [
  /帮我安排/, /找个.*时间/, /合适的/, /方便的/, /什么时候/, /能不能/, /大概/, /左右/, /之前完成/, /尽快/, /尽早/,
]

export function needsAI(text) {
  return AI_SIGNALS.some(r => r.test(text))
}

// ── Translate Chinese time expressions to English for chrono ──────────────

function translateToEnglish(text) {
  let t = text

  // 后天 / 大后天
  t = t.replace(/大后天/g, 'in 3 days')
  t = t.replace(/后天/g, 'in 2 days')
  // 今天 / 明天 / 昨天
  t = t.replace(/今天|今日/g, 'today')
  t = t.replace(/明天|明日/g, 'tomorrow')
  t = t.replace(/昨天|昨日/g, 'yesterday')

  // 下下周X / 下周X / 本周X / 这周X
  t = t.replace(/下下周([一二三四五六日天])/g, (_, d) => `${WEEKDAY_MAP[d]} in 2 weeks`)
  t = t.replace(/下周([一二三四五六日天])/g, (_, d) => `next ${WEEKDAY_MAP[d]}`)
  t = t.replace(/(?:本周|这周)([一二三四五六日天])/g, (_, d) => `this ${WEEKDAY_MAP[d]}`)
  t = t.replace(/周([一二三四五六日天])/g, (_, d) => `this ${WEEKDAY_MAP[d]}`)
  t = t.replace(/星期([一二三四五六日天])/g, (_, d) => `this ${WEEKDAY_MAP[d]}`)

  // 下个月X号 / 这个月X号
  t = t.replace(/下个月(\d{1,2})号/g, (_, d) => `${d}th next month`)
  t = t.replace(/(?:本月|这个月|这月)(\d{1,2})号/g, (_, d) => `${d}th this month`)
  t = t.replace(/(\d{1,2})号/g, (_, d) => `${d}th`)

  // Month references: X月Y日
  t = t.replace(/(\d{1,2})月(\d{1,2})日/g, (_, m, d) => `${m}/${d}`)
  t = t.replace(/(\d{1,2})月(\d{1,2})号/g, (_, m, d) => `${m}/${d}`)

  // Time: 上午/早上/早/凌晨 → am, 下午/晚上/傍晚/夜 → pm
  t = t.replace(/(?:上午|早上|早|早晨)(\d{1,2})(?:点|时|:)(\d{2})?/g, (_, h, m) => `${h}:${m || '00'} am`)
  t = t.replace(/(?:下午|晚上|傍晚|夜里|夜晚|夜)(\d{1,2})(?:点|时|:)(\d{2})?/g, (_, h, m) => {
    const hour = parseInt(h)
    return `${hour < 12 ? hour + 12 : hour}:${m || '00'}`
  })
  t = t.replace(/凌晨(\d{1,2})(?:点|时|:)(\d{2})?/g, (_, h, m) => `${h}:${m || '00'} am`)
  t = t.replace(/中午(\d{1,2})(?:点|时)?/g, (_, h) => `${h}:00 pm`)

  // Generic time: X点X分 / X点半
  t = t.replace(/(\d{1,2})点半/g, (_, h) => `${h}:30`)
  t = t.replace(/(\d{1,2})点(\d{2})分/g, (_, h, m) => `${h}:${m}`)
  t = t.replace(/(\d{1,2})点(\d{1,2})/g, (_, h, m) => `${h}:${m}`)
  t = t.replace(/(\d{1,2})点/g, (_, h) => `${h}:00`)
  t = t.replace(/(\d{1,2})时/g, (_, h) => `${h}:00`)

  return t
}

// ── Detect repeat pattern ──────────────────────────────────────────────────

function detectRepeat(text) {
  if (/每天|每日/.test(text)) return 'daily'
  if (/每周|每星期/.test(text)) return 'weekly'
  if (/每月|每个月/.test(text)) return 'monthly'
  return 'none'
}

// ── Detect priority ────────────────────────────────────────────────────────

function detectPriority(text) {
  if (/紧急|重要|高优|urgent|important/i.test(text)) return 'high'
  if (/不急|低优/.test(text)) return 'low'
  return 'normal'
}

// ── Strip date/time keywords to get title ─────────────────────────────────

const DATE_TIME_PATTERNS = [
  /大后天|后天|明天|今天|昨天|明日|今日/g,
  /下下周[一二三四五六日天]|下周[一二三四五六日天]|本周[一二三四五六日天]|这周[一二三四五六日天]|周[一二三四五六日天]|星期[一二三四五六日天]/g,
  /下个月|本月|这个月/g,
  /\d{1,2}月\d{1,2}[日号]/g,
  /\d{1,2}号/g,
  /(?:上午|早上|早晨|下午|晚上|傍晚|夜里|凌晨|中午)\d{1,2}(?:点|时)(?:\d{1,2}分|半)?/g,
  /\d{1,2}点(?:\d{1,2}分|半)?/g,
  /每天|每日|每周|每星期|每月|每个月/g,
  /紧急|重要|高优|不急|低优/g,
  /提醒我|提醒|记得|别忘了/g,
]

function extractTitle(text) {
  let t = text
  for (const p of DATE_TIME_PATTERNS) t = t.replace(p, ' ')
  return t.replace(/\s{2,}/g, ' ').trim() || text.trim()
}

// ── Infer tags from title ──────────────────────────────────────────────────

const TAG_RULES = [
  { pattern: /会议|开会|meeting/i, tag: '会议' },
  { pattern: /面试|interview/i, tag: '面试' },
  { pattern: /报告|汇报|report/i, tag: '报告' },
  { pattern: /作业|homework|作业/i, tag: '学习' },
  { pattern: /体检|看病|医院|doctor/i, tag: '健康' },
  { pattern: /生日|birthday/i, tag: '生日' },
  { pattern: /旅行|旅游|trip/i, tag: '旅行' },
  { pattern: /吃饭|餐|dinner|lunch/i, tag: '饮食' },
  { pattern: /运动|健身|gym|跑步/i, tag: '运动' },
]

function inferTags(text) {
  return TAG_RULES.filter(r => r.pattern.test(text)).map(r => r.tag)
}

// ── Main local parse function ──────────────────────────────────────────────

/**
 * Try to parse text locally.
 * Returns { result, confidence } where confidence in [0, 1].
 * confidence < 0.5 means caller should fallback to AI.
 */
export function localParse(text, todayStr) {
  const refDate = dayjs(todayStr).toDate()
  const translated = translateToEnglish(text)

  const parsed = chrono.parse(translated, refDate, { forwardDate: true })

  let date = null
  let time = null
  let endTime = null
  let confidence = 0

  if (parsed.length > 0) {
    const p = parsed[0]
    const start = p.start
    const d = p.start.date()

    if (start.isCertain('day') || start.isCertain('weekday')) {
      date = dayjs(d).format('YYYY-MM-DD')
      confidence += 0.5
    } else if (start.isCertain('month')) {
      date = dayjs(d).format('YYYY-MM-DD')
      confidence += 0.3
    }

    if (start.isCertain('hour')) {
      time = dayjs(d).format('HH:mm')
      confidence += 0.3
    } else if (start.knownValues.hour !== undefined) {
      time = dayjs(d).format('HH:mm')
      confidence += 0.1
    }

    if (p.end) {
      endTime = dayjs(p.end.date()).format('HH:mm')
    }
  }

  // If text has date/time keywords but chrono found nothing — still give partial confidence
  const hasDateKeyword = /今天|明天|后天|周[一二三四五六日天]|星期|号|月/.test(text)
  const hasTimeKeyword = /点|时|上午|下午|晚上|早上/.test(text)
  if (confidence === 0 && (hasDateKeyword || hasTimeKeyword)) confidence = 0.2

  const repeat = detectRepeat(text)
  const priority = detectPriority(text)
  const title = extractTitle(text)
  const tags = inferTags(text)

  return {
    result: { title, date, time, endTime, repeat, priority, tags, note: '' },
    confidence,
  }
}
