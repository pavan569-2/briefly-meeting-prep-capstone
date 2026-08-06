import '../test-utils/setupEnv'
import { describe, it, expect } from 'vitest'
import { validateGeneratedBrief } from './responseValidator'

const VALID_OBJECT = {
  executiveSummary: 'Summary text',
  meetingObjectives: 'Objectives text',
  progressSincePreviousMeeting: 'Progress text',
  outstandingActionItems: 'Action items text',
  keyDiscussionTopics: 'Topics text',
  suggestedQuestions: 'Questions text',
  risksAndDependencies: 'Risks text',
  recommendedNextActions: 'Next actions text',
}

describe('validateGeneratedBrief', () => {
  it('returns a parsed GeneratedBrief when given valid JSON with all 8 fields', () => {
    const json = JSON.stringify(VALID_OBJECT)
    const result = validateGeneratedBrief(json)
    expect(result).toEqual(VALID_OBJECT)
  })

  it('strips a ```json ... ``` fence and parses the inner JSON', () => {
    const json = `\`\`\`json\n${JSON.stringify(VALID_OBJECT)}\n\`\`\``
    const result = validateGeneratedBrief(json)
    expect(result).toEqual(VALID_OBJECT)
  })

  it('strips a plain ``` ... ``` fence and parses the inner JSON', () => {
    const json = `\`\`\`\n${JSON.stringify(VALID_OBJECT)}\n\`\`\``
    const result = validateGeneratedBrief(json)
    expect(result).toEqual(VALID_OBJECT)
  })

  it('throws "AI produced invalid JSON" when given malformed JSON', () => {
    expect(() => validateGeneratedBrief('not-json')).toThrow('AI produced invalid JSON')
  })

  it('throws "AI produced invalid JSON" when given content that cannot be parsed after fence strip', () => {
    const bt = '`'
    const fencedInvalid = `${bt}${bt}${bt}\nnot-json\n${bt}${bt}${bt}`
    expect(() => validateGeneratedBrief(fencedInvalid)).toThrow(
      'AI produced invalid JSON',
    )
  })

  it('throws schema error when a required field is missing', () => {
    const { executiveSummary: _omit, ...withoutSummary } = VALID_OBJECT
    const json = JSON.stringify(withoutSummary)
    expect(() => validateGeneratedBrief(json)).toThrow(
      'AI produced JSON that does not match the schema',
    )
  })

  it('throws schema error when an extra unknown field is present (strict mode)', () => {
    const withExtra = { ...VALID_OBJECT, unexpectedField: 'extra' }
    const json = JSON.stringify(withExtra)
    expect(() => validateGeneratedBrief(json)).toThrow(
      'AI produced JSON that does not match the schema',
    )
  })

  it('throws schema error when a field is an empty string (min 1)', () => {
    const withEmpty = { ...VALID_OBJECT, executiveSummary: '' }
    const json = JSON.stringify(withEmpty)
    expect(() => validateGeneratedBrief(json)).toThrow(
      'AI produced JSON that does not match the schema',
    )
  })
})
