/**
 * Shared frontend types for meeting briefs.
 *
 * Keep in sync with backend/src/types/brief.ts.
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
