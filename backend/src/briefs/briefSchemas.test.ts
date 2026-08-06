import '../test-utils/setupEnv'
import { describe, it, expect } from 'vitest'
import {
  generatedBriefSchema,
  createMeetingBriefSchema,
  updateMeetingBriefSchema,
  uuidParamSchema,
} from './briefSchemas'

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

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const VALID_CREATE_PAYLOAD = {
  title: 'Sprint Planning',
  objective: 'Plan the sprint',
  agenda: 'Backlog review, estimation',
  generatedBrief: VALID_GENERATED_BRIEF,
}

describe('generatedBriefSchema', () => {
  it('parses valid data and returns the typed object', () => {
    const result = generatedBriefSchema.parse(VALID_GENERATED_BRIEF)
    expect(result).toEqual(VALID_GENERATED_BRIEF)
  })

  it('throws when a required field is missing', () => {
    const { executiveSummary: _omit, ...without } = VALID_GENERATED_BRIEF
    expect(() => generatedBriefSchema.parse(without)).toThrow()
  })

  it('throws when an extra field is present (strict mode)', () => {
    expect(() =>
      generatedBriefSchema.parse({ ...VALID_GENERATED_BRIEF, unexpected: 'extra' }),
    ).toThrow()
  })

  it('throws when a field is an empty string (min 1 constraint)', () => {
    expect(() =>
      generatedBriefSchema.parse({ ...VALID_GENERATED_BRIEF, executiveSummary: '' }),
    ).toThrow()
  })
})

describe('createMeetingBriefSchema', () => {
  it('parses a valid payload with required fields only', () => {
    const result = createMeetingBriefSchema.parse(VALID_CREATE_PAYLOAD)
    expect(result).toMatchObject({
      title: 'Sprint Planning',
      objective: 'Plan the sprint',
      agenda: 'Backlog review, estimation',
    })
  })

  it('accepts optional fields when provided', () => {
    const result = createMeetingBriefSchema.parse({
      ...VALID_CREATE_PAYLOAD,
      context: 'Some context',
      attendees: 'Alice, Bob',
      previousNotes: 'Prior notes',
      parentBriefId: VALID_UUID,
    })
    expect(result.context).toBe('Some context')
    expect(result.parentBriefId).toBe(VALID_UUID)
  })

  it('throws when title is empty', () => {
    expect(() =>
      createMeetingBriefSchema.parse({ ...VALID_CREATE_PAYLOAD, title: '' }),
    ).toThrow()
  })

  it('throws when title is missing', () => {
    const { title: _omit, ...without } = VALID_CREATE_PAYLOAD
    expect(() => createMeetingBriefSchema.parse(without)).toThrow()
  })

  it('throws when objective is missing', () => {
    const { objective: _omit, ...without } = VALID_CREATE_PAYLOAD
    expect(() => createMeetingBriefSchema.parse(without)).toThrow()
  })

  it('throws when parentBriefId is not a valid UUID', () => {
    expect(() =>
      createMeetingBriefSchema.parse({ ...VALID_CREATE_PAYLOAD, parentBriefId: 'not-a-uuid' }),
    ).toThrow()
  })

  it('accepts null for nullable optional fields', () => {
    const result = createMeetingBriefSchema.parse({
      ...VALID_CREATE_PAYLOAD,
      context: null,
      attendees: null,
      parentBriefId: null,
    })
    expect(result.context).toBeNull()
    expect(result.parentBriefId).toBeNull()
  })
})

describe('updateMeetingBriefSchema', () => {
  it('throws when the payload is an empty object (refine: at least one field required)', () => {
    expect(() => updateMeetingBriefSchema.parse({})).toThrow(
      'Update payload must contain at least one field to update',
    )
  })

  it('parses a partial payload with just a title update', () => {
    const result = updateMeetingBriefSchema.parse({ title: 'Updated Title' })
    expect(result).toMatchObject({ title: 'Updated Title' })
  })

  it('parses a partial payload with multiple fields', () => {
    const result = updateMeetingBriefSchema.parse({
      title: 'New Title',
      objective: 'New Objective',
    })
    expect(result.title).toBe('New Title')
    expect(result.objective).toBe('New Objective')
  })

  it('throws when an extra unknown field is included (strict mode)', () => {
    expect(() =>
      updateMeetingBriefSchema.parse({ title: 'ok', unknownField: 'x' }),
    ).toThrow()
  })
})

describe('uuidParamSchema', () => {
  it('parses a valid UUID string', () => {
    const result = uuidParamSchema.parse({ id: VALID_UUID })
    expect(result).toEqual({ id: VALID_UUID })
  })

  it('throws when the id is not a valid UUID', () => {
    expect(() => uuidParamSchema.parse({ id: 'not-a-uuid' })).toThrow()
  })

  it('throws when the id is missing', () => {
    expect(() => uuidParamSchema.parse({})).toThrow()
  })

  it('throws when the id is an empty string', () => {
    expect(() => uuidParamSchema.parse({ id: '' })).toThrow()
  })
})
