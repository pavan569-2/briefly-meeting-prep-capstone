import React from 'react'
import { CopyButton } from './CopyButton'
import type { MeetingBrief } from '../types/brief'

interface BriefViewerProps {
  brief: MeetingBrief
  onStartFollowUp: () => void
  onDelete: () => void
  isDeleting: boolean
  deleteError: string | null
  disabled: boolean
}

export function BriefViewer({ 
  brief, 
  onStartFollowUp, 
  onDelete, 
  isDeleting, 
  deleteError,
  disabled
}: BriefViewerProps) {
  const { generatedBrief } = brief
  
  const sections = [
    { title: 'Executive Summary', content: generatedBrief.executiveSummary },
    { title: 'Meeting Objectives', content: generatedBrief.meetingObjectives },
    { title: 'Progress Since Previous Meeting', content: generatedBrief.progressSincePreviousMeeting },
    { title: 'Outstanding Action Items', content: generatedBrief.outstandingActionItems },
    { title: 'Key Discussion Topics', content: generatedBrief.keyDiscussionTopics },
    { title: 'Suggested Questions', content: generatedBrief.suggestedQuestions },
    { title: 'Risks & Dependencies', content: generatedBrief.risksAndDependencies },
    { title: 'Recommended Next Actions', content: generatedBrief.recommendedNextActions },
  ]

  const formatFullBriefText = () => {
    const parts = [`Meeting: ${brief.title}\n`]
    sections.forEach(s => {
      parts.push(`${s.title}\n${s.content}`)
    })
    return parts.join('\n\n')
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 break-words">{brief.title}</h2>
            <div className="mt-2 text-sm text-gray-500 space-y-1">
              <p>Created: {new Date(brief.createdAt).toLocaleString()}</p>
              {brief.parentBriefId && (
                <p className="text-indigo-600 font-medium">Follow-up Meeting</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <CopyButton content={formatFullBriefText()} label="Copy Full Brief" />
            <button
              onClick={onStartFollowUp}
              disabled={disabled}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Start Follow-up
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={disabled}
                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Sure?</span>
                <button
                  onClick={onDelete}
                  disabled={isDeleting || disabled}
                  className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting || disabled}
                  className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>
        {deleteError && (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">{deleteError}</p>
        )}
      </div>

      <div className="p-6 overflow-y-auto space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="group">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton content={`${section.title}\n\n${section.content}`} label="Copy Section" />
              </div>
            </div>
            <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
              {section.content || 'N/A'}
            </p>
          </div>
        ))}

        {/* Meeting Metadata Section */}
        <div className="pt-8 mt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Original Input Context</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-gray-900">Objective</h4>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{brief.objective}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-900">Agenda</h4>
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{brief.agenda}</p>
            </div>
            {brief.attendees && (
              <div>
                <h4 className="text-xs font-medium text-gray-900">Attendees</h4>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{brief.attendees}</p>
              </div>
            )}
            {brief.context && (
              <div>
                <h4 className="text-xs font-medium text-gray-900">Context</h4>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{brief.context}</p>
              </div>
            )}
            {brief.previousNotes && (
              <div>
                <h4 className="text-xs font-medium text-gray-900">Previous Notes</h4>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{brief.previousNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
