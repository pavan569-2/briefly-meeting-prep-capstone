import { z } from 'zod'

export const generatedBriefSchema = z.object({
  executiveSummary: z.string().trim().min(1).max(10000),
  meetingObjectives: z.string().trim().min(1).max(10000),
  progressSincePreviousMeeting: z.string().trim().min(1).max(10000),
  outstandingActionItems: z.string().trim().min(1).max(10000),
  keyDiscussionTopics: z.string().trim().min(1).max(10000),
  suggestedQuestions: z.string().trim().min(1).max(10000),
  risksAndDependencies: z.string().trim().min(1).max(10000),
  recommendedNextActions: z.string().trim().min(1).max(10000),
}).strict()

export const createMeetingBriefSchema = z.object({
  title: z.string().trim().min(1).max(200),
  objective: z.string().trim().min(1).max(3000),
  agenda: z.string().trim().min(1).max(10000),
  context: z.string().trim().max(10000).nullable().optional(),
  attendees: z.string().trim().max(3000).nullable().optional(),
  previousNotes: z.string().trim().max(20000).nullable().optional(),
  parentBriefId: z.string().uuid().nullable().optional(),
  generatedBrief: generatedBriefSchema
}).strict()

export const updateMeetingBriefSchema = createMeetingBriefSchema
  .partial()
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Update payload must contain at least one field to update' }
  )

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
})
