import * as chrono from 'chrono-node'
import dayjs from 'dayjs'

// ── Chinese → English date/time normalization ──────────────────────────────

const WEEKDAY_MAP = { '一': 'Monday', '二': 'Tuesday', '三': 'Wednesday', '四': 'Thursday', '五': 'Friday', '六': 'Saturday', '日': 'Sunday', '天': 'Sunday' }
const NUM_ZH = { '两': 2, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12, '二十': 20, '三十': 30 }

const ZH_HOUR = '(?:\\d{1,2}|十[一二]?|两|[一二三四五六七八九])'
const EXPLICIT_TIME_PATTERN = new RegExp(`(?:上午|早上|早|早晨|下午|晚上|傍晚|夜里|夜晚|夜|凌晨|中午)?${ZH_HOUR}(?:点|时|:)(?:\\d{1,2}分?|半)?`, 'g')
const TIME_RANGE_PATTERN = new RegExp(`(上午|早上|早|早晨|下午|晚上|傍晚|夜里|夜晚|夜|凌晨|中午)?\\s*(${ZH_HOUR}|\\d{1,2}:\\d{2})\\s*(点半|点\\d{1,2}分?|点|时|:\\d{2})?\\s*(?:-|—|～|~|到|至)\\s*(${ZH_HOUR}|\\d{1,2}:\\d{2})\\s*(点半|点\\d{1,2}分?|点|时|:\\d{2})`, 'g')

function parseHour(str) {
  if (!str) return 0
  const n = parseInt(str)
  if (!isNaN(n)) return n
  return NUM_ZH[str] ?? 0
}

function parseTimeValue(value, suffix = '', period = '') {
  if (!value) return null

  let minute = 0
  let hour

  if (value.includes(':')) {
    const [h, m] = value.split(':')
    hour = parseInt(h, 10)
    minute = parseInt(m, 10)
  } else {
    hour = parseHour(value)
    if (suffix === '点半') {
      minute = 30
    } else if (suffix.startsWith('点') && suffix.endsWith('分')) {
      minute = parseInt(suffix.slice(1, -1), 10)
    } else if (suffix.startsWith(':')) {
      minute = parseInt(suffix.slice(1), 10)
    } else if (suffix.startsWith('点') && suffix.length > 1) {
      minute = parseInt(suffix.slice(1), 10)
    }
  }

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null

  if (period && /下午|晚上|傍晚|夜里|夜晚|夜|中午/.test(period) && hour < 12) hour += 12
  if (period && /凌晨/.test(period) && hour === 12) hour = 0

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function extractTimeRange(text) {
  const result = TIME_RANGE_PATTERN.exec(text)
  TIME_RANGE_PATTERN.lastIndex = 0
  if (!result) return null

  const [, period, startValue, startSuffix = '', endValue, endSuffix = ''] = result
  const normalizedStartSuffix = startSuffix || (endSuffix.startsWith(':') ? endSuffix : '点')
  const normalizedPeriod = period || ''

  const start = parseTimeValue(startValue, normalizedStartSuffix, normalizedPeriod)
  const end = parseTimeValue(endValue, endSuffix, normalizedPeriod)

  if (!start || !end) return null
  return { start, end }
}

const AI_SIGNALS = [
  /帮我安排/, /找个.*时间/, /合适的/, /方便的/, /什么时候/, /能不能/, /大概/, /左右/, /之前完成/, /尽快/, /尽早/,
]

export function needsAI(text) {
  return AI_SIGNALS.some(r => r.test(text))
}

function translateToEnglish(text) {
  let t = text

  t = t.replace(/大后天/g, 'in 3 days')
  t = t.replace(/后天/g, 'in 2 days')
  t = t.replace(/今天|今日/g, 'today')
  t = t.replace(/明天|明日/g, 'tomorrow')
  t = t.replace(/昨天|昨日/g, 'yesterday')

  t = t.replace(/下下周([一二三四五六日天])/g, (_, d) => `${WEEKDAY_MAP[d]} in 2 weeks`)
  t = t.replace(/下周([一二三四五六日天])/g, (_, d) => `next ${WEEKDAY_MAP[d]}`)
  t = t.replace(/(?:本周|这周)([一二三四五六日天])/g, (_, d) => `this ${WEEKDAY_MAP[d]}`)
  t = t.replace(/周([一二三四五六日天])/g, (_, d) => `this ${WEEKDAY_MAP[d]}`)
  t = t.replace(/星期([一二三四五六日天])/g, (_, d) => `this ${WEEKDAY_MAP[d]}`)

  t = t.replace(/下个月(\d{1,2})号/g, (_, d) => `${d}th next month`)
  t = t.replace(/(?:本月|这个月|这月)(\d{1,2})号/g, (_, d) => `${d}th this month`)
  t = t.replace(/(\d{1,2})号/g, (_, d) => `${d}th`)

  t = t.replace(/(\d{1,2})月(\d{1,2})日/g, (_, m, d) => `${m}/${d}`)
  t = t.replace(/(\d{1,2})月(\d{1,2})号/g, (_, m, d) => `${m}/${d}`)

  t = t.replace(new RegExp(`(?:上午|早上|早|早晨)(${ZH_HOUR})(?:点|时|:)(\\d{2})?`, 'g'), (_, h, m) => `${parseHour(h)}:${m || '00'} am`)
  t = t.replace(new RegExp(`(?:下午|晚上|傍晚|夜里|夜晚|夜)(${ZH_HOUR})(?:点|时|:)(\\d{2})?`, 'g'), (_, h, m) => {
    const hour = parseHour(h)
    return `${hour < 12 ? hour + 12 : hour}:${m || '00'}`
  })
  t = t.replace(new RegExp(`凌晨(${ZH_HOUR})(?:点|时|:)(\\d{2})?`, 'g'), (_, h, m) => `${parseHour(h)}:${m || '00'} am`)
  t = t.replace(new RegExp(`中午(${ZH_HOUR})(?:点|时)?`, 'g'), (_, h) => `${parseHour(h)}:00 pm`)

  t = t.replace(new RegExp(`(${ZH_HOUR})点半`, 'g'), (_, h) => `${parseHour(h)}:30`)
  t = t.replace(new RegExp(`(${ZH_HOUR})点(\\d{2})分`, 'g'), (_, h, m) => `${parseHour(h)}:${m}`)
  t = t.replace(new RegExp(`(${ZH_HOUR})点(\\d{1,2})`, 'g'), (_, h, m) => `${parseHour(h)}:${m}`)
  t = t.replace(new RegExp(`(${ZH_HOUR})点`, 'g'), (_, h) => `${parseHour(h)}:00`)
  t = t.replace(new RegExp(`(${ZH_HOUR})时`, 'g'), (_, h) => `${parseHour(h)}:00`)

  return t
}

function detectRepeat(text) {
  if (/每天|每日/.test(text)) return 'daily'
  if (/每周|每星期/.test(text)) return 'weekly'
  if (/每月|每个月/.test(text)) return 'monthly'
  return 'none'
}

function detectPriority(text) {
  if (/紧急|重要|高优|urgent|important/i.test(text)) return 'high'
  if (/不急|低优/.test(text)) return 'low'
  return 'normal'
}

const DATE_TIME_PATTERNS = [
  /大后天|后天|明天|今天|昨天|明日|今日/g,
  /下下周[一二三四五六日天]|下周[一二三四五六日天]|本周[一二三四五六日天]|这周[一二三四五六日天]|周[一二三四五六日天]|星期[一二三四五六日天]/g,
  /下个月|本月|这个月/g,
  /\d{1,2}月\d{1,2}[日号]/g,
  /\d{1,2}号/g,
  /(?:上午|早上|早晨|下午|晚上|傍晚|夜里|凌晨|中午)?(?:\d{1,2}|十[一二]?|两|[一二三四五六七八九])(?:点|时|:)?(?:\d{1,2}分?|半)?\s*(?:-|—|～|~|到|至)\s*(?:\d{1,2}|十[一二]?|两|[一二三四五六七八九])(?:点|时|:)(?:\d{1,2}分?|半)?/g,
  /(?:上午|早上|早晨|下午|晚上|傍晚|夜里|凌晨|中午)(?:\d{1,2}|十[一二]?|两|[一二三四五六七八九])(?:点|时)(?:\d{1,2}分?|半)?/g,
  /(?:\d{1,2}|十[一二]?|两|[一二三四五六七八九])点(?:\d{1,2}分?|半)?/g,
  /每天|每日|每周|每星期|每月|每个月/g,
  /紧急|重要|高优|不急|低优/g,
  /提醒我|提醒|记得|别忘了/g,
]

function extractTitle(text) {
  let t = text
  for (const p of DATE_TIME_PATTERNS) t = t.replace(p, ' ')
  return t.replace(/\s{2,}/g, ' ').trim() || text.trim()
}

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

export function localParse(text, todayStr) {
  const refDate = dayjs(todayStr).toDate()
  const translated = translateToEnglish(text)
  const parsed = chrono.parse(translated, refDate, { forwardDate: true })
  const timeRange = extractTimeRange(text)
  const hasExplicitTime = EXPLICIT_TIME_PATTERN.test(text) || Boolean(timeRange)

  let date = null
  let time = timeRange?.start || null
  let endTime = timeRange?.end || null
  let confidence = timeRange ? 0.4 : 0

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

    if (!time) {
      if (start.isCertain('hour')) {
        time = dayjs(d).format('HH:mm')
        confidence += 0.3
      } else if (start.knownValues.hour !== undefined) {
        time = dayjs(d).format('HH:mm')
        confidence += 0.1
      }
    }

    if (!endTime && p.end) {
      endTime = dayjs(p.end.date()).format('HH:mm')
    }
  }

  if (!date && hasExplicitTime) date = todayStr

  const hasDateKeyword = /今天|明天|后天|周[一二三四五六日天]|星期|号|月/.test(text)
  const hasTimeKeyword = /点|时|上午|下午|晚上|早上|到|至|-|—|~|～/.test(text)
  if (confidence === 0 && (hasDateKeyword || hasTimeKeyword)) confidence = 0.2

  const repeat = detectRepeat(text)
  const priority = detectPriority(text)
  const title = extractTitle(text)
  const tags = inferTags(text)

  return {
    result: { title, date, time, endTime, repeat, priority, tags, note: '' },
    confidence,
    hasExplicitTime,
  }
}
