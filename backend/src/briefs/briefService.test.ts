import '../test-utils/setupEnv'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ────────────────────────────────────────────────────────────
// Mutable result that individual tests override before each assertion.
// The mock maybeSingle() always reads from this object at call-time.
let mockResult: { data: unknown; error: unknown } = { data: null, error: null }

vi.mock('../lib/supabaseAdmin', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    // order() terminates the getBriefs query — must resolve with mockResult
    order: vi.fn().mockImplementation(() => Promise.resolve(mockResult)),
    // maybeSingle() terminates all other queries
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(mockResult)),
  }
  return {
    supabaseAdmin: {
      auth: { getUser: vi.fn() },
      from: vi.fn().mockReturnValue(chain),
    },
  }
})


import { briefService, NotFoundError, ValidationError } from './briefService'

// ── Fixtures ─────────────────────────────────────────────────────────────────

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

const DB_ROW = {
  id: 'brief-id-1',
  user_id: 'user-123',
  parent_brief_id: null,
  title: 'Sprint Review',
  objective: 'Review Q3 sprint',
  agenda: 'Demos, retro',
  context: null,
  attendees: null,
  previous_notes: null,
  generated_brief: VALID_GENERATED_BRIEF,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const DB_SUMMARY_ROW = {
  id: 'brief-id-1',
  parent_brief_id: null,
  title: 'Sprint Review',
  objective: 'Review Q3 sprint',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockResult = { data: null, error: null }
})

// ── Error classes ─────────────────────────────────────────────────────────────

describe('NotFoundError', () => {
  it('has name "NotFoundError" and extends Error', () => {
    const err = new NotFoundError()
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('NotFoundError')
    expect(err.message).toBe('Not found')
  })

  it('accepts a custom message', () => {
    const err = new NotFoundError('custom msg')
    expect(err.message).toBe('custom msg')
  })
})

describe('ValidationError', () => {
  it('has name "ValidationError" and extends Error', () => {
    const err = new ValidationError('bad input')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('ValidationError')
    expect(err.message).toBe('bad input')
  })
})

// ── briefService.getBriefs ───────────────────────────────────────────────────

describe('briefService.getBriefs', () => {
  it('returns a mapped summary array when the DB returns rows', async () => {
    mockResult = { data: [DB_SUMMARY_ROW, { ...DB_SUMMARY_ROW, id: 'brief-id-2' }], error: null }
    const result = await briefService.getBriefs('user-123')
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      id: 'brief-id-1',
      title: 'Sprint Review',
      objective: 'Review Q3 sprint',
    })
  })

  it('returns an empty array when the DB returns an empty array', async () => {
    mockResult = { data: [], error: null }
    const result = await briefService.getBriefs('user-123')
    expect(result).toEqual([])
  })

  it('propagates a DB error', async () => {
    mockResult = { data: null, error: new Error('DB connection failed') }
    await expect(briefService.getBriefs('user-123')).rejects.toThrow('DB connection failed')
  })
})

// ── briefService.getBriefById ────────────────────────────────────────────────

describe('briefService.getBriefById', () => {
  it('returns a full mapped MeetingBrief when the DB returns a row', async () => {
    mockResult = { data: DB_ROW, error: null }
    const result = await briefService.getBriefById('brief-id-1', 'user-123')
    expect(result).toMatchObject({
      id: 'brief-id-1',
      userId: 'user-123',
      title: 'Sprint Review',
      generatedBrief: VALID_GENERATED_BRIEF,
    })
    expect(result.parentBriefId).toBeNull()
  })

  it('throws NotFoundError when data is null (row not found or wrong owner)', async () => {
    mockResult = { data: null, error: null }
    await expect(briefService.getBriefById('brief-id-1', 'user-123')).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it('propagates a DB error', async () => {
    mockResult = { data: null, error: new Error('query failed') }
    await expect(briefService.getBriefById('brief-id-1', 'user-123')).rejects.toThrow(
      'query failed',
    )
  })
})

// ── briefService.createBrief ─────────────────────────────────────────────────

describe('briefService.createBrief', () => {
  const CREATE_PAYLOAD = {
    title: 'New Meeting',
    objective: 'Obj',
    agenda: 'Agenda',
    generatedBrief: VALID_GENERATED_BRIEF,
  }

  it('inserts and returns the mapped brief when no parent is specified', async () => {
    mockResult = { data: DB_ROW, error: null }
    const result = await briefService.createBrief('user-123', CREATE_PAYLOAD)
    expect(result).toMatchObject({ id: 'brief-id-1', title: 'Sprint Review' })
  })

  it('validates the parent brief first then inserts when parentBriefId is provided', async () => {
    const { supabaseAdmin } = await import('../lib/supabaseAdmin')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain = (supabaseAdmin.from as any)('meeting_briefs')
    const maybeSingleMock = chain.maybeSingle as ReturnType<typeof vi.fn>

    maybeSingleMock
      .mockResolvedValueOnce({ data: { id: 'parent-id' }, error: null })
      .mockResolvedValueOnce({ data: DB_ROW, error: null })

    const callsBefore = maybeSingleMock.mock.calls.length

    const result = await briefService.createBrief('user-123', {
      ...CREATE_PAYLOAD,
      parentBriefId: 'parent-id',
    })
    expect(result).toMatchObject({ id: 'brief-id-1' })
    // maybeSingle was called twice: once for parent validation, once for insert
    expect(maybeSingleMock.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it('throws ValidationError when the parent brief query returns null', async () => {
    // Parent validation gets null → ValidationError
    mockResult = { data: null, error: null }
    await expect(
      briefService.createBrief('user-123', { ...CREATE_PAYLOAD, parentBriefId: 'missing-parent-id' }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('throws when the insert returns null data', async () => {
    // No parent; insert returns null
    mockResult = { data: null, error: null }
    await expect(briefService.createBrief('user-123', CREATE_PAYLOAD)).rejects.toThrow(
      'Insert failed to return row',
    )
  })
})

// ── briefService.updateBrief ─────────────────────────────────────────────────

describe('briefService.updateBrief', () => {
  it('throws ValidationError when parentBriefId equals the brief id (self-reference)', async () => {
    await expect(
      briefService.updateBrief('brief-id-1', 'user-123', { parentBriefId: 'brief-id-1' }),
    ).rejects.toBeInstanceOf(ValidationError)
  })

  it('updates and returns the mapped brief when update succeeds', async () => {
    mockResult = { data: { ...DB_ROW, title: 'Updated Title' }, error: null }
    const result = await briefService.updateBrief('brief-id-1', 'user-123', {
      title: 'Updated Title',
    })
    expect(result).toMatchObject({ id: 'brief-id-1', title: 'Updated Title' })
  })

  it('throws NotFoundError when the update returns null (not found or wrong owner)', async () => {
    mockResult = { data: null, error: null }
    await expect(
      briefService.updateBrief('brief-id-1', 'user-123', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  it('propagates a DB error during update', async () => {
    mockResult = { data: null, error: new Error('update failed') }
    await expect(
      briefService.updateBrief('brief-id-1', 'user-123', { title: 'x' }),
    ).rejects.toThrow('update failed')
  })
})

// ── briefService.deleteBrief ─────────────────────────────────────────────────

describe('briefService.deleteBrief', () => {
  it('resolves void when the delete succeeds', async () => {
    mockResult = { data: { id: 'brief-id-1' }, error: null }
    await expect(briefService.deleteBrief('brief-id-1', 'user-123')).resolves.toBeUndefined()
  })

  it('throws NotFoundError when data is null (not found or wrong owner)', async () => {
    mockResult = { data: null, error: null }
    await expect(briefService.deleteBrief('brief-id-1', 'user-123')).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it('propagates a DB error', async () => {
    mockResult = { data: null, error: new Error('delete failed') }
    await expect(briefService.deleteBrief('brief-id-1', 'user-123')).rejects.toThrow(
      'delete failed',
    )
  })
})
