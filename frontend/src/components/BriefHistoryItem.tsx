
import type { MeetingBriefSummary } from '../types/brief'

interface BriefHistoryItemProps {
  brief: MeetingBriefSummary
  isSelected: boolean
  onClick: () => void
}

export function BriefHistoryItem({ brief, isSelected, onClick }: BriefHistoryItemProps) {
  const dateStr = new Date(brief.createdAt).toLocaleDateString()

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
        isSelected ? 'bg-blue-50' : 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-gray-900 line-clamp-1">{brief.title}</h3>
        {brief.parentBriefId && (
          <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
            Follow-up
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{brief.objective}</p>
      <p className="mt-2 text-xs text-gray-400">{dateStr}</p>
    </button>
  )
}
