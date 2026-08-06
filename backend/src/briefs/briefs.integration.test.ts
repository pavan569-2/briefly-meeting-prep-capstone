import '../test-utils/setupEnv'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// ── Mocks (hoisted, must come before production imports) ─────────────────────

vi.mock('../lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      getUser: vi.fn(),
    },
  },
}))

vi.mock('./briefService', () => ({
  briefService: {
    getBriefs: vi.fn(),
    getBriefById: vi.fn(),
    createBrief: vi.fn(),
    updateBrief: vi.fn(),
    deleteBrief: vi.fn(),
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(msg = 'Not found') {
      super(msg)
      this.name = 'NotFoundError'
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(msg: string) {
      super(msg)
      this.name = 'ValidationError'
    }
  },
}))

import app from '../app'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { briefService, NotFoundError, ValidationError } from './briefService'

// ── Helpers ───────────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const NON_UUID = 'not-a-uuid'
const AUTHED_USER = { id: 'user-123', email: 'test@test.com' }

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

const MOCK_BRIEF = {
  id: VALID_UUID,
  userId: 'user-123',
  parentBriefId: null,
  title: 'Sprint Review',
  objective: 'Review Q3',
  agenda: 'Demos, retro',
  context: null,
  attendees: null,
  previousNotes: null,
  generatedBrief: VALID_GENERATED_BRIEF,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const MOCK_SUMMARY = {
  id: VALID_UUID,
  parentBriefId: null,
  title: 'Sprint Review',
  objective: 'Review Q3',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const VALID_CREATE_BODY = {
  title: 'New Meeting',
  objective: 'Objective text',
  agenda: 'Agenda text',
  generatedBrief: VALID_GENERATED_BRIEF,
}

function mockAuthed() {
  vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
    data: { user: { ...AUTHED_USER } },
    error: null,
  } as never)
}

function mockUnauthed() {
  vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
    data: { user: null },
    error: new Error('invalid token'),
  } as never)
}

// ── Reset ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks()
})

// ── Group 1: GET /api/health ──────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns 200 with status ok and a timestamp', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok' })
    expect(typeof res.body.timestamp).toBe('string')
    // Auth and service never called for public route
    expect(supabaseAdmin.auth.getUser).not.toHaveBeenCalled()
  })
})

// ── Group 2: GET /api/auth/me ─────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns 401 with Unauthorized when no Authorization header is sent', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
    expect(supabaseAdmin.auth.getUser).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header does not start with "Bearer "', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Token sometoken')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
    expect(supabaseAdmin.auth.getUser).not.toHaveBeenCalled()
  })

  it('returns 401 when Bearer token is empty', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
    expect(supabaseAdmin.auth.getUser).not.toHaveBeenCalled()
  })

  it('returns 401 when getUser returns null user', async () => {
    mockUnauthed()
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
    expect(supabaseAdmin.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('returns 200 with id and email when token is valid', async () => {
    mockAuthed()
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: 'user-123', email: 'test@test.com' })
    expect(supabaseAdmin.auth.getUser).toHaveBeenCalledTimes(1)
  })
})

// ── Group 3: GET /api/briefs ──────────────────────────────────────────────────

describe('GET /api/briefs', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthed()
    const res = await request(app)
      .get('/api/briefs')
      .set('Authorization', 'Bearer badtoken')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
    expect(briefService.getBriefs).not.toHaveBeenCalled()
  })

  it('returns 200 with an empty array when service returns no briefs', async () => {
    mockAuthed()
    vi.mocked(briefService.getBriefs).mockResolvedValue([])
    const res = await request(app)
      .get('/api/briefs')
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
    expect(briefService.getBriefs).toHaveBeenCalledWith('user-123')
  })

  it('returns 200 with summary array when service returns briefs', async () => {
    mockAuthed()
    vi.mocked(briefService.getBriefs).mockResolvedValue([
      MOCK_SUMMARY,
      { ...MOCK_SUMMARY, id: 'b2b2b2b2-e5f6-7890-abcd-ef1234567890', title: 'Second Brief' },
    ])
    const res = await request(app)
      .get('/api/briefs')
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0]).toMatchObject({ id: VALID_UUID, title: 'Sprint Review', objective: 'Review Q3' })
    expect(res.body[0]).toHaveProperty('createdAt')
    expect(res.body[0]).toHaveProperty('updatedAt')
    expect(briefService.getBriefs).toHaveBeenCalledWith('user-123')
  })

  it('returns 500 with sanitised message when service throws (internal error not exposed)', async () => {
    mockAuthed()
    vi.mocked(briefService.getBriefs).mockRejectedValue(new Error('DB connection string'))
    const res = await request(app)
      .get('/api/briefs')
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    // Raw DB error message must not appear in the response body
    expect(JSON.stringify(res.body)).not.toContain('DB connection string')
    expect(briefService.getBriefs).toHaveBeenCalledWith('user-123')
  })
})

// ── Group 4: GET /api/briefs/:id ──────────────────────────────────────────────

describe('GET /api/briefs/:id', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthed()
    const res = await request(app)
      .get(`/api/briefs/${VALID_UUID}`)
      .set('Authorization', 'Bearer badtoken')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
    expect(briefService.getBriefById).not.toHaveBeenCalled()
  })

  it('returns 400 with UUID error when param is not a UUID', async () => {
    mockAuthed()
    const res = await request(app)
      .get(`/api/briefs/${NON_UUID}`)
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid UUID format' })
    expect(briefService.getBriefById).not.toHaveBeenCalled()
  })

  it('returns 404 with not found message when service throws NotFoundError', async () => {
    mockAuthed()
    vi.mocked(briefService.getBriefById).mockRejectedValue(new NotFoundError())
    const res = await request(app)
      .get(`/api/briefs/${VALID_UUID}`)
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Not found' })
    expect(briefService.getBriefById).toHaveBeenCalledWith(VALID_UUID, 'user-123')
  })

  it('returns 200 with full brief when service succeeds', async () => {
    mockAuthed()
    vi.mocked(briefService.getBriefById).mockResolvedValue(MOCK_BRIEF)
    const res = await request(app)
      .get(`/api/briefs/${VALID_UUID}`)
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: VALID_UUID,
      userId: 'user-123',
      title: 'Sprint Review',
      generatedBrief: expect.objectContaining({ executiveSummary: 'Summary' }),
    })
    expect(briefService.getBriefById).toHaveBeenCalledWith(VALID_UUID, 'user-123')
  })
})

// ── Group 5: DELETE /api/briefs/:id ──────────────────────────────────────────

describe('DELETE /api/briefs/:id', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthed()
    const res = await request(app)
      .delete(`/api/briefs/${VALID_UUID}`)
      .set('Authorization', 'Bearer badtoken')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
    expect(briefService.deleteBrief).not.toHaveBeenCalled()
  })

  it('returns 400 with UUID error when param is not a UUID', async () => {
    mockAuthed()
    const res = await request(app)
      .delete(`/api/briefs/${NON_UUID}`)
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid UUID format' })
    expect(briefService.deleteBrief).not.toHaveBeenCalled()
  })

  it('returns 404 when service throws NotFoundError', async () => {
    mockAuthed()
    vi.mocked(briefService.deleteBrief).mockRejectedValue(new NotFoundError())
    const res = await request(app)
      .delete(`/api/briefs/${VALID_UUID}`)
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Not found' })
    expect(briefService.deleteBrief).toHaveBeenCalledWith(VALID_UUID, 'user-123')
  })

  it('returns 204 with empty body when delete succeeds', async () => {
    mockAuthed()
    vi.mocked(briefService.deleteBrief).mockResolvedValue(undefined)
    const res = await request(app)
      .delete(`/api/briefs/${VALID_UUID}`)
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(204)
    expect(res.body).toEqual({})
    expect(briefService.deleteBrief).toHaveBeenCalledWith(VALID_UUID, 'user-123')
  })

  it('returns 500 with sanitised message when service throws unexpectedly', async () => {
    mockAuthed()
    vi.mocked(briefService.deleteBrief).mockRejectedValue(new Error('constraint violation'))
    const res = await request(app)
      .delete(`/api/briefs/${VALID_UUID}`)
      .set('Authorization', 'Bearer validtoken')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(JSON.stringify(res.body)).not.toContain('constraint violation')
  })
})

// ── Group 6: POST /api/briefs ─────────────────────────────────────────────────

describe('POST /api/briefs', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthed()
    const res = await request(app)
      .post('/api/briefs')
      .set('Authorization', 'Bearer badtoken')
      .send(VALID_CREATE_BODY)
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'Unauthorized' })
    expect(briefService.createBrief).not.toHaveBeenCalled()
  })

  it('returns 400 Validation error when body is empty', async () => {
    mockAuthed()
    const res = await request(app)
      .post('/api/briefs')
      .set('Authorization', 'Bearer validtoken')
      .send({})
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      error: 'Validation error',
      details: expect.any(Array),
    })
    expect(briefService.createBrief).not.toHaveBeenCalled()
  })

  it('returns 400 Validation error when generatedBrief is missing', async () => {
    mockAuthed()
    const { generatedBrief: _omit, ...withoutGenerated } = VALID_CREATE_BODY
    const res = await request(app)
      .post('/api/briefs')
      .set('Authorization', 'Bearer validtoken')
      .send(withoutGenerated)
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      error: 'Validation error',
      details: expect.any(Array),
    })
    expect(briefService.createBrief).not.toHaveBeenCalled()
  })

  it('returns 400 Validation error when parentBriefId is not a valid UUID', async () => {
    mockAuthed()
    const res = await request(app)
      .post('/api/briefs')
      .set('Authorization', 'Bearer validtoken')
      .send({ ...VALID_CREATE_BODY, parentBriefId: 'not-a-uuid' })
    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({
      error: 'Validation error',
      details: expect.any(Array),
    })
    expect(briefService.createBrief).not.toHaveBeenCalled()
  })

  it('returns 201 with the created brief when service succeeds', async () => {
    mockAuthed()
    vi.mocked(briefService.createBrief).mockResolvedValue(MOCK_BRIEF)
    const res = await request(app)
      .post('/api/briefs')
      .set('Authorization', 'Bearer validtoken')
      .send(VALID_CREATE_BODY)
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      id: VALID_UUID,
      title: 'Sprint Review',
      generatedBrief: expect.objectContaining({ executiveSummary: 'Summary' }),
    })
    expect(briefService.createBrief).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ title: 'New Meeting', objective: 'Objective text' }),
    )
  })

  it('returns 400 with the ValidationError message when service throws ValidationError', async () => {
    mockAuthed()
    vi.mocked(briefService.createBrief).mockRejectedValue(
      new ValidationError('Invalid parent brief'),
    )
    const res = await request(app)
      .post('/api/briefs')
      .set('Authorization', 'Bearer validtoken')
      .send(VALID_CREATE_BODY)
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: 'Invalid parent brief' })
    expect(briefService.createBrief).toHaveBeenCalledTimes(1)
  })

  it('returns 500 with sanitised message when service throws unexpectedly', async () => {
    mockAuthed()
    vi.mocked(briefService.createBrief).mockRejectedValue(new Error('foreign key constraint'))
    const res = await request(app)
      .post('/api/briefs')
      .set('Authorization', 'Bearer validtoken')
      .send(VALID_CREATE_BODY)
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
    expect(JSON.stringify(res.body)).not.toContain('foreign key constraint')
  })
})
