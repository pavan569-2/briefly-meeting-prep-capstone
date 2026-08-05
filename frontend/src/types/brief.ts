/**
 * Shared frontend types for meeting briefs.
 *
 * Keep in sync with backend/src/types/brief.ts.
 * Do NOT reference any server-side or service-role credentials here.
 */

export type BriefStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface GeneratedBrief {
  id: string
  meetingBriefId: string
  /** Markdown-formatted brief content produced by the AI. */
  content: string
  createdAt: string
}

export interface MeetingBrief {
  id: string
  userId: string
  title: string
  /** ISO 8601 date-time string. */
  meetingDate: string
  attendees: string[]
  /** Free-text context provided by the user to guide brief generation. */
  context: string
  status: BriefStatus
  generatedBrief: GeneratedBrief | null
  createdAt: string
  updatedAt: string
}
