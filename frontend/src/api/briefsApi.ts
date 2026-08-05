import { apiClient } from './apiClient'
import type { MeetingBrief, MeetingBriefSummary } from '../types/brief'

export const briefsApi = {
  async getBriefs(signal?: AbortSignal): Promise<MeetingBriefSummary[]> {
    const res = await apiClient('/api/briefs', {
      method: 'GET',
      signal,
    })
    const data = await res.json()
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected an array')
    }
    return data.map(validateMeetingBriefSummary)
  },

  async getBriefById(id: string, signal?: AbortSignal): Promise<MeetingBrief> {
    const res = await apiClient(`/api/briefs/${id}`, {
      method: 'GET',
      signal,
    })
    const data = await res.json()
    return validateMeetingBrief(data)
  },

  async deleteBrief(id: string, signal?: AbortSignal): Promise<void> {
    const res = await apiClient(`/api/briefs/${id}`, {
      method: 'DELETE',
      signal,
    })
    if (res.status !== 204) {
      throw new Error('Delete failed: expected exactly 204 No Content')
    }
  },
}

function isUUID(str: unknown): boolean {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

function validateMeetingBriefSummary(data: unknown): MeetingBriefSummary {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid response format: expected an object')
  }
  const obj = data as Record<string, unknown>
  if (!isUUID(obj.id)) throw new Error('Invalid or missing id')
  if (obj.parentBriefId !== null && !isUUID(obj.parentBriefId)) throw new Error('Invalid parentBriefId')
  if (typeof obj.title !== 'string') throw new Error('Invalid title')
  if (typeof obj.objective !== 'string') throw new Error('Invalid objective')
  if (typeof obj.createdAt !== 'string') throw new Error('Invalid createdAt')
  if (typeof obj.updatedAt !== 'string') throw new Error('Invalid updatedAt')

  return {
    id: obj.id as string,
    parentBriefId: obj.parentBriefId as string | null,
    title: obj.title as string,
    objective: obj.objective as string,
    createdAt: obj.createdAt as string,
    updatedAt: obj.updatedAt as string,
  }
}

function validateGeneratedBrief(data: unknown): MeetingBrief['generatedBrief'] {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid generatedBrief object')
  }
  const obj = data as Record<string, unknown>
  const requiredStrings = [
    'executiveSummary', 'meetingObjectives', 'progressSincePreviousMeeting',
    'outstandingActionItems', 'keyDiscussionTopics', 'suggestedQuestions',
    'risksAndDependencies', 'recommendedNextActions'
  ]
  for (const field of requiredStrings) {
    if (typeof obj[field] !== 'string') {
      throw new Error(`Invalid or missing generatedBrief field: ${field}`)
    }
  }
  return obj as unknown as MeetingBrief['generatedBrief']
}

function validateMeetingBrief(data: unknown): MeetingBrief {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid response format: expected an object')
  }
  const obj = data as Record<string, unknown>
  if (!isUUID(obj.id)) throw new Error('Invalid or missing id')
  if (!isUUID(obj.userId)) throw new Error('Invalid or missing userId')
  if (obj.parentBriefId !== null && !isUUID(obj.parentBriefId)) throw new Error('Invalid parentBriefId')
  if (typeof obj.title !== 'string') throw new Error('Invalid title')
  if (typeof obj.objective !== 'string') throw new Error('Invalid objective')
  if (typeof obj.agenda !== 'string') throw new Error('Invalid agenda')
  if (typeof obj.context !== 'string' && obj.context !== null) throw new Error('Invalid context')
  if (typeof obj.attendees !== 'string' && obj.attendees !== null) throw new Error('Invalid attendees')
  if (typeof obj.previousNotes !== 'string' && obj.previousNotes !== null) throw new Error('Invalid previousNotes')
  if (typeof obj.createdAt !== 'string') throw new Error('Invalid createdAt')
  if (typeof obj.updatedAt !== 'string') throw new Error('Invalid updatedAt')

  const generatedBrief = validateGeneratedBrief(obj.generatedBrief)

  return {
    id: obj.id as string,
    userId: obj.userId as string,
    parentBriefId: obj.parentBriefId as string | null,
    title: obj.title as string,
    objective: obj.objective as string,
    agenda: obj.agenda as string,
    context: obj.context as string | null,
    attendees: obj.attendees as string | null,
    previousNotes: obj.previousNotes as string | null,
    generatedBrief,
    createdAt: obj.createdAt as string,
    updatedAt: obj.updatedAt as string,
  }
}
