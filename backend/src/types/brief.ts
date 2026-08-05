/**
 * Shared backend types for meeting briefs.
 *
 * Keep in sync with frontend/src/types/brief.ts.
 */

export interface GeneratedBrief {
  executiveSummary: string
  meetingObjectives: string
  progressSincePreviousMeeting: string
  outstandingActionItems: string
  keyDiscussionTopics: string
  suggestedQuestions: string
  risksAndDependencies: string
  recommendedNextActions: string
}

export interface MeetingBrief {
  id: string
  userId: string
  parentBriefId: string | null
  title: string
  objective: string
  agenda: string
  context: string | null
  attendees: string | null
  previousNotes: string | null
  generatedBrief: GeneratedBrief
  createdAt: string
  updatedAt: string
}

export interface MeetingBriefSummary {
  id: string
  parentBriefId: string | null
  title: string
  objective: string
  createdAt: string
  updatedAt: string
}

/**
 * Representation of the database row (snake_case).
 */
export interface DatabaseMeetingBrief {
  id: string
  user_id: string
  parent_brief_id: string | null
  title: string
  objective: string
  agenda: string
  context: string | null
  attendees: string | null
  previous_notes: string | null
  generated_brief: unknown // validated at runtime
  created_at: string
  updated_at: string
}
