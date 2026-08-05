

interface AppHeaderProps {
  userEmail: string
  onNewMeeting: () => void
  onSignOut: () => void
  disabled?: boolean
}

export function AppHeader({ userEmail, onNewMeeting, onSignOut, disabled }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Briefly</h1>
        <p className="text-sm text-gray-500">AI Meeting Prep Assistant</p>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:inline">{userEmail}</span>
        <button
          onClick={onNewMeeting}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          New Meeting
        </button>
        <button
          onClick={onSignOut}
          disabled={disabled}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
