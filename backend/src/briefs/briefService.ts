import { supabaseAdmin } from '../lib/supabaseAdmin'
import type {
  DatabaseMeetingBrief,
  MeetingBrief,
  MeetingBriefSummary,
  GeneratedBrief,
} from '../types/brief'
import { generatedBriefSchema } from './briefSchemas'

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

function parseGeneratedBrief(data: unknown): GeneratedBrief {
  const result = generatedBriefSchema.safeParse(data)
  if (!result.success) {
    throw new ValidationError('Invalid generated_brief in database')
  }
  return result.data
}

function mapToBrief(row: DatabaseMeetingBrief): MeetingBrief {
  return {
    id: row.id,
    userId: row.user_id,
    parentBriefId: row.parent_brief_id,
    title: row.title,
    objective: row.objective,
    agenda: row.agenda,
    context: row.context,
    attendees: row.attendees,
    previousNotes: row.previous_notes,
    generatedBrief: parseGeneratedBrief(row.generated_brief),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapToSummary(row: DatabaseMeetingBrief): MeetingBriefSummary {
  return {
    id: row.id,
    parentBriefId: row.parent_brief_id,
    title: row.title,
    objective: row.objective,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function validateParentBrief(parentBriefId: string, userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('meeting_briefs')
    .select('id')
    .eq('id', parentBriefId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error // Let the controller catch it as a 500
  }
  
  if (!data) {
    // We treat invalid/missing parent as a validation error (400)
    // without disclosing whether it exists for another user
    throw new ValidationError('Invalid parent brief')
  }
}

export const briefService = {
  async getBriefs(userId: string): Promise<MeetingBriefSummary[]> {
    const { data, error } = await supabaseAdmin
      .from('meeting_briefs')
      .select('id, parent_brief_id, title, objective, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data as DatabaseMeetingBrief[]).map(mapToSummary)
  },

  async getBriefById(id: string, userId: string): Promise<MeetingBrief> {
    const { data, error } = await supabaseAdmin
      .from('meeting_briefs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new NotFoundError()

    return mapToBrief(data as DatabaseMeetingBrief)
  },

  async createBrief(
    userId: string,
    payload: {
      title: string
      objective: string
      agenda: string
      context?: string | null
      attendees?: string | null
      previousNotes?: string | null
      parentBriefId?: string | null
      generatedBrief: GeneratedBrief
    },
  ): Promise<MeetingBrief> {
    if (payload.parentBriefId) {
      await validateParentBrief(payload.parentBriefId, userId)
    }

    const { data, error } = await supabaseAdmin
      .from('meeting_briefs')
      .insert({
        user_id: userId,
        title: payload.title,
        objective: payload.objective,
        agenda: payload.agenda,
        context: payload.context,
        attendees: payload.attendees,
        previous_notes: payload.previousNotes,
        parent_brief_id: payload.parentBriefId,
        generated_brief: payload.generatedBrief,
      })
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Insert failed to return row')

    return mapToBrief(data as DatabaseMeetingBrief)
  },

  async updateBrief(
    id: string,
    userId: string,
    updates: {
      title?: string
      objective?: string
      agenda?: string
      context?: string | null
      attendees?: string | null
      previousNotes?: string | null
      parentBriefId?: string | null
      generatedBrief?: GeneratedBrief
    },
  ): Promise<MeetingBrief> {
    if (updates.parentBriefId) {
      if (updates.parentBriefId === id) {
        throw new ValidationError('A brief cannot be its own parent')
      }
      await validateParentBrief(updates.parentBriefId, userId)
    }

    // Convert camelCase to snake_case for DB
    const dbUpdates: Partial<DatabaseMeetingBrief> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.objective !== undefined) dbUpdates.objective = updates.objective
    if (updates.agenda !== undefined) dbUpdates.agenda = updates.agenda
    if (updates.context !== undefined) dbUpdates.context = updates.context
    if (updates.attendees !== undefined) dbUpdates.attendees = updates.attendees
    if (updates.previousNotes !== undefined) dbUpdates.previous_notes = updates.previousNotes
    if (updates.parentBriefId !== undefined) dbUpdates.parent_brief_id = updates.parentBriefId
    if (updates.generatedBrief !== undefined) dbUpdates.generated_brief = updates.generatedBrief

    const { data, error } = await supabaseAdmin
      .from('meeting_briefs')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle()

    if (error) throw error
    if (!data) throw new NotFoundError()

    return mapToBrief(data as DatabaseMeetingBrief)
  },

  async deleteBrief(id: string, userId: string): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('meeting_briefs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) throw new NotFoundError()
  },
}
