

interface StreamingBriefPreviewProps {
  text: string
  error: string | null
}

export function StreamingBriefPreview({ text, error }: StreamingBriefPreviewProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          {error ? 'Generation Failed' : 'Generating Brief...'}
        </h3>
        {!error && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <p className="text-xs text-red-600 mt-1">This partial output was not saved.</p>
        </div>
      )}

      <div 
        className="p-6 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-gray-700 leading-relaxed"
        aria-live="polite"
        aria-busy={!error}
      >
        {text || 'Initializing...'}
      </div>
    </div>
  )
}
