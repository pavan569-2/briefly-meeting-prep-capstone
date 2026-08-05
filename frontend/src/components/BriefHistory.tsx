
import { BriefHistoryItem } from './BriefHistoryItem'
import type { MeetingBriefSummary } from '../types/brief'

interface BriefHistoryProps {
  briefs: MeetingBriefSummary[]
  selectedId: string | null
  isLoading: boolean
  error: string | null
  onSelect: (id: string) => void
  onRetry: () => void
}

export function BriefHistory({ briefs, selectedId, isLoading, error, onSelect, onRetry }: BriefHistoryProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200" aria-label="Brief History">
      <h2 className="px-4 py-3 text-sm font-semibold text-gray-900 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
        History
      </h2>
      
      <div className="flex-1 overflow-y-auto" aria-live="polite">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">Loading history...</div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={onRetry}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus-visible:underline"
            >
              Retry
            </button>
          </div>
        ) : briefs.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">No meeting briefs yet.</div>
        ) : (
          <div className="flex flex-col">
            {briefs.map((brief) => (
              <BriefHistoryItem
                key={brief.id}
                brief={brief}
                isSelected={brief.id === selectedId}
                onClick={() => onSelect(brief.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
