import { generatedBriefSchema } from '../briefs/briefSchemas'
import type { GeneratedBrief } from '../types/brief'

export function validateGeneratedBrief(jsonText: string): GeneratedBrief {
  // Broad repair is forbidden, but we can safely remove an exact outer markdown fence
  let cleanedText = jsonText.trim()
  if (cleanedText.startsWith('```json') && cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(7, -3).trim()
  } else if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(3, -3).trim()
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleanedText)
  } catch {
    throw new Error('AI produced invalid JSON')
  }

  const result = generatedBriefSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error('AI produced JSON that does not match the schema')
  }

  return result.data
}
