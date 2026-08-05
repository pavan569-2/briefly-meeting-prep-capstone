

interface EmptyStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
      <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
