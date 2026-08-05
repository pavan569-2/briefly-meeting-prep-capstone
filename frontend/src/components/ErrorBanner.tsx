

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="p-4 rounded-md bg-red-50 border border-red-200 mb-6" role="alert">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-red-800">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none focus-visible:underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
