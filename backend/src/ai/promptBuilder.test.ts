import '../test-utils/setupEnv'
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserPrompt } from './promptBuilder'
import type { MeetingBrief } from '../types/brief'

const VALID_GENERATED_BRIEF = {
  executiveSummary: 'Summary',
  meetingObjectives: 'Objectives',
  progressSincePreviousMeeting: 'Progress',
  outstandingActionItems: 'Actions',
  keyDiscussionTopics: 'Topics',
  suggestedQuestions: 'Questions',
  risksAndDependencies: 'Risks',
  recommendedNextActions: 'Next',
}

const BASE_PAYLOAD = {
  title: 'Q3 Planning',
  objective: 'Plan the Q3 roadmap',
  agenda: '1. Review priorities\n2. Assign owners',
}

const PARENT_BRIEF: MeetingBrief = {
  id: 'parent-id-123',
  userId: 'user-123',
  parentBriefId: null,
  title: 'Q2 Review',
  objective: 'Review Q2 outcomes',
  agenda: 'Q2 agenda',
  context: null,
  attendees: null,
  previousNotes: null,
  generatedBrief: VALID_GENERATED_BRIEF,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('buildSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const result = buildSystemPrompt()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes all 8 JSON schema field names', () => {
    const result = buildSystemPrompt()
    expect(result).toContain('executiveSummary')
    expect(result).toContain('meetingObjectives')
    expect(result).toContain('progressSincePreviousMeeting')
    expect(result).toContain('outstandingActionItems')
    expect(result).toContain('keyDiscussionTopics')
    expect(result).toContain('suggestedQuestions')
    expect(result).toContain('risksAndDependencies')
    expect(result).toContain('recommendedNextActions')
  })

  it('contains prompt-injection defence instruction', () => {
    const result = buildSystemPrompt()
    expect(result).toContain('UNTRUSTED USER DATA')
  })
})

describe('buildUserPrompt', () => {
  it('includes required XML tags for title, objective, and agenda', () => {
    const result = buildUserPrompt(BASE_PAYLOAD, null)
    expect(result).toContain('<meeting_title>')
    expect(result).toContain('Q3 Planning')
    expect(result).toContain('<meeting_objective>')
    expect(result).toContain('Plan the Q3 roadmap')
    expect(result).toContain('<meeting_agenda>')
    expect(result).toContain('1. Review priorities')
  })

  it('omits optional XML tags when fields are absent', () => {
    const result = buildUserPrompt(BASE_PAYLOAD, null)
    expect(result).not.toContain('<meeting_context>')
    expect(result).not.toContain('<meeting_attendees>')
    expect(result).not.toContain('<previous_notes>')
  })

  it('omits optional XML tags when fields are null', () => {
    const result = buildUserPrompt(
      { ...BASE_PAYLOAD, context: null, attendees: null, previousNotes: null },
      null,
    )
    expect(result).not.toContain('<meeting_context>')
    expect(result).not.toContain('<meeting_attendees>')
    expect(result).not.toContain('<previous_notes>')
  })

  it('includes optional XML tags when fields are populated', () => {
    const result = buildUserPrompt(
      {
        ...BASE_PAYLOAD,
        context: 'Background info',
        attendees: 'Alice, Bob',
        previousNotes: 'Some notes',
      },
      null,
    )
    expect(result).toContain('<meeting_context>')
    expect(result).toContain('Background info')
    expect(result).toContain('<meeting_attendees>')
    expect(result).toContain('Alice, Bob')
    expect(result).toContain('<previous_notes>')
    expect(result).toContain('Some notes')
  })

  it('includes parent XML tags when parentBrief is provided', () => {
    const result = buildUserPrompt(BASE_PAYLOAD, PARENT_BRIEF)
    expect(result).toContain('<parent_meeting_title>')
    expect(result).toContain('Q2 Review')
    expect(result).toContain('<parent_meeting_objective>')
    expect(result).toContain('Review Q2 outcomes')
    expect(result).toContain('<parent_generated_brief>')
  })

  it('omits parent section when parentBrief is null', () => {
    const result = buildUserPrompt(BASE_PAYLOAD, null)
    expect(result).not.toContain('<parent_meeting_title>')
    expect(result).not.toContain('<parent_generated_brief>')
  })

  it('serialises parentBrief.generatedBrief as valid JSON', () => {
    const result = buildUserPrompt(BASE_PAYLOAD, PARENT_BRIEF)
    const startTag = '<parent_generated_brief>\n'
    const endTag = '\n</parent_generated_brief>'
    const start = result.indexOf(startTag) + startTag.length
    const end = result.indexOf(endTag)
    expect(start).toBeGreaterThan(0)
    expect(end).toBeGreaterThan(start)
    const jsonSubstring = result.slice(start, end)
    expect(() => JSON.parse(jsonSubstring)).not.toThrow()
    const parsed = JSON.parse(jsonSubstring)
    expect(parsed.executiveSummary).toBe('Summary')
  })
})
