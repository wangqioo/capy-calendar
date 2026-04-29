import dayjs from 'dayjs'
import { localParse, needsAI } from './localParse'
import { parseEventFromText } from './aiParse'

const LOCAL_THRESHOLD = 0.5  // confidence >= this → skip AI

/**
 * Hybrid parser.
 * Returns { event, source: 'local' | 'ai' | 'fallback' }
 */
export async function parseEvent(text) {
  const todayStr = dayjs().format('YYYY-MM-DD')

  // 1. Try local rule-based parsing
  const { result: local, confidence, hasExplicitTime } = localParse(text, todayStr)

  // 2. Decide whether AI is needed
  const forceAI = needsAI(text)
  const useLocal = !forceAI && confidence >= LOCAL_THRESHOLD

  if (useLocal) {
    return { event: local, source: 'local' }
  }

  // 3. Fallback to AI
  try {
    const aiResult = await parseEventFromText(text, todayStr)
    return {
      event: {
        title: aiResult.title || local.title || text.trim(),
        date: aiResult.date || local.date || (hasExplicitTime ? todayStr : null),
        time: aiResult.time || local.time || null,
        endTime: aiResult.endTime || local.endTime || null,
        repeat: aiResult.repeat || local.repeat || 'none',
        priority: aiResult.priority || local.priority || 'normal',
        tags: aiResult.tags?.length ? aiResult.tags : local.tags,
        note: aiResult.note || '',
      },
      source: 'ai',
    }
  } catch {
    // 4. AI failed — use whatever local found
    return { event: local, source: 'fallback' }
  }
}
