import React from 'react'

export interface MeetingFormValues {
  title: string
  objective: string
  agenda: string
  context: string
  attendees: string
  previousNotes: string
}

interface MeetingFormProps {
  values: MeetingFormValues
  onChange: (values: MeetingFormValues) => void
  onSubmit: () => void
  onCancelFollowUp?: () => void
  parentBriefTitle: string | null
  disabled: boolean
}

export function MeetingForm({ 
  values, 
  onChange, 
  onSubmit, 
  onCancelFollowUp,
  parentBriefTitle,
  disabled 
}: MeetingFormProps) {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    onChange({ ...values, [name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  const handleKeyDown = (_e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Normal enter behaves natively. 
    // We do NOT prevent default, nor do we submit on Enter.
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {parentBriefTitle ? 'Prepare Follow-up Meeting' : 'Prepare New Meeting'}
        </h2>
        {parentBriefTitle && onCancelFollowUp && (
          <button
            type="button"
            onClick={onCancelFollowUp}
            disabled={disabled}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 focus:outline-none focus-visible:underline"
          >
            Cancel Follow-up
          </button>
        )}
      </div>

      <div className="p-6 overflow-y-auto space-y-6 flex-1">
        {parentBriefTitle && (
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md">
            <p className="text-sm text-indigo-800">
              <span className="font-semibold">Linked Parent:</span> {parentBriefTitle}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Meeting Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            maxLength={200}
            value={values.title}
            onChange={handleChange}
            disabled={disabled}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="e.g. Q3 Roadmap Planning"
          />
        </div>

        <div>
          <label htmlFor="objective" className="block text-sm font-medium text-gray-700">
            Objective <span className="text-red-500">*</span>
          </label>
          <textarea
            id="objective"
            name="objective"
            required
            maxLength={3000}
            rows={3}
            value={values.objective}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="What is the main goal of this meeting?"
          />
          <p className="mt-1 text-xs text-gray-500 text-right" aria-live="polite">
            {values.objective.length} / 3000
          </p>
        </div>

        <div>
          <label htmlFor="agenda" className="block text-sm font-medium text-gray-700">
            Agenda <span className="text-red-500">*</span>
          </label>
          <textarea
            id="agenda"
            name="agenda"
            required
            maxLength={10000}
            rows={4}
            value={values.agenda}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Provide the topics or agenda items."
          />
          <p className="mt-1 text-xs text-gray-500 text-right" aria-live="polite">
            {values.agenda.length} / 10000
          </p>
        </div>

        <div>
          <label htmlFor="attendees" className="block text-sm font-medium text-gray-700">
            Attendees (Optional)
          </label>
          <input
            type="text"
            id="attendees"
            name="attendees"
            maxLength={3000}
            value={values.attendees}
            onChange={handleChange}
            disabled={disabled}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="e.g. John Doe, Jane Smith"
          />
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700">
            Additional Context (Optional)
          </label>
          <textarea
            id="context"
            name="context"
            maxLength={10000}
            rows={3}
            value={values.context}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Any background information needed?"
          />
        </div>

        <div>
          <label htmlFor="previousNotes" className="block text-sm font-medium text-gray-700">
            Previous Notes (Optional)
          </label>
          <textarea
            id="previousNotes"
            name="previousNotes"
            maxLength={20000}
            rows={3}
            value={values.previousNotes}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
            placeholder="Any rough notes or items carried over?"
          />
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          type="submit"
          disabled={disabled || !values.title.trim() || !values.objective.trim() || !values.agenda.trim()}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? 'Generating...' : 'Generate Brief'}
        </button>
      </div>
    </form>
  )
}
