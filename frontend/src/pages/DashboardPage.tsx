import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AppHeader } from '../components/AppHeader'
import { BriefHistory } from '../components/BriefHistory'
import { BriefViewer } from '../components/BriefViewer'
import { MeetingForm, MeetingFormValues } from '../components/MeetingForm'
import { StreamingBriefPreview } from '../components/StreamingBriefPreview'
import { EmptyState } from '../components/EmptyState'
import { ErrorBanner } from '../components/ErrorBanner'
import { briefsApi } from '../api/briefsApi'
import { generationApi } from '../api/generationApi'
import { SessionExpiredError } from '../api/apiClient'
import type { MeetingBrief, MeetingBriefSummary } from '../types/brief'

type DashboardView = 'history' | 'form' | 'viewer'

const emptyForm: MeetingFormValues = {
  title: '',
  objective: '',
  agenda: '',
  context: '',
  attendees: '',
  previousNotes: '',
}

export function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string>('')

  // State 1: Orchestration
  const [view, setView] = useState<DashboardView>('history')

  // State 2: History
  const [historyList, setHistoryList] = useState<MeetingBriefSummary[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // State 3: Detail
  const [selectedBrief, setSelectedBrief] = useState<MeetingBrief | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // State 4: Form & Generation
  const [formValues, setFormValues] = useState<MeetingFormValues>(emptyForm)
  const [parentBriefId, setParentBriefId] = useState<string | null>(null)
  const [parentBriefTitle, setParentBriefTitle] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationPreview, setGenerationPreview] = useState('')
  const [generationError, setGenerationError] = useState<string | null>(null)

  // State 5: Deletion
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Refs for AbortControllers
  const historyAbortRef = useRef<AbortController | null>(null)
  const detailAbortRef = useRef<AbortController | null>(null)
  const generateAbortRef = useRef<AbortController | null>(null)
  const isSigningOutRef = useRef(false)

  // --- Helpers ---

  const handleAuthError = async (err: unknown) => {
    if (err instanceof SessionExpiredError && !isSigningOutRef.current) {
      isSigningOutRef.current = true
      abortAll()
      await supabase.auth.signOut()
    }
  }

  const abortAll = () => {
    historyAbortRef.current?.abort()
    detailAbortRef.current?.abort()
    generateAbortRef.current?.abort()
  }

  // --- Fetching ---

  const fetchHistory = async () => {
    if (historyAbortRef.current) historyAbortRef.current.abort()
    historyAbortRef.current = new AbortController()

    try {
      setHistoryLoading(true)
      setHistoryError(null)
      const list = await briefsApi.getBriefs(historyAbortRef.current.signal)
      setHistoryList(list)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Failed to load history'
      setHistoryError(msg)
      handleAuthError(err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchDetail = async (id: string, selectAfter: boolean = true) => {
    if (detailAbortRef.current) detailAbortRef.current.abort()
    detailAbortRef.current = new AbortController()

    try {
      setDetailLoading(true)
      setDetailError(null)
      const brief = await briefsApi.getBriefById(id, detailAbortRef.current.signal)
      if (selectAfter) {
        setSelectedBrief(brief)
        setView('viewer')
      }
      return brief
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return null
      const msg = err instanceof Error ? err.message : 'Failed to load brief detail'
      setDetailError(msg)
      handleAuthError(err)
      return null
    } finally {
      setDetailLoading(false)
    }
  }

  // --- Initial Mount ---

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email || '')
      }
    })

    fetchHistory()

    return () => {
      abortAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Actions ---

  const handleNewMeeting = () => {
    setView('form')
    setFormValues(emptyForm)
    setParentBriefId(null)
    setParentBriefTitle(null)
    setGenerationError(null)
    setGenerationPreview('')
    setSelectedBrief(null)
  }

  const handleSelectHistoryItem = (id: string) => {
    if (isGenerating) return // Block selection while generating

    // Abort pending detail requests
    if (detailAbortRef.current) detailAbortRef.current.abort()

    setDetailError(null)
    setDetailLoading(true)
    setSelectedBrief(null)
    setView('viewer') // Switch view immediately for mobile

    fetchDetail(id)
  }

  const handleStartFollowUp = () => {
    if (!selectedBrief || isGenerating) return

    setParentBriefId(selectedBrief.id)
    setParentBriefTitle(selectedBrief.title)

    setFormValues({
      title: `Follow-up: ${selectedBrief.title}`,
      attendees: selectedBrief.attendees || '',
      context: selectedBrief.context || '',
      objective: '',
      agenda: '',
      previousNotes: '',
    })

    setGenerationError(null)
    setGenerationPreview('')
    setView('form')
  }

  const handleCancelFollowUp = () => {
    setParentBriefId(null)
    setParentBriefTitle(null)
  }

  const handleDelete = async () => {
    if (!selectedBrief || isDeleting || isGenerating) return

    try {
      setIsDeleting(true)
      setDeleteError(null)

      const idToDelete = selectedBrief.id
      await briefsApi.deleteBrief(idToDelete)

      // On Success
      await fetchHistory()
      setSelectedBrief(prev => {
        if (prev && prev.id === idToDelete) {
          setView(window.innerWidth < 768 ? 'history' : 'form')
          return null
        }
        return prev
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete brief'
      setDeleteError(msg)
      handleAuthError(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGenerate = async () => {
    if (isGenerating) return

    if (generateAbortRef.current) generateAbortRef.current.abort()
    generateAbortRef.current = new AbortController()

    setIsGenerating(true)
    setGenerationError(null)
    setGenerationPreview('')

    const payload = {
      title: formValues.title.trim(),
      objective: formValues.objective.trim(),
      agenda: formValues.agenda.trim(),
      context: formValues.context.trim() || null,
      attendees: formValues.attendees.trim() || null,
      previousNotes: formValues.previousNotes.trim() || null,
      parentBriefId,
    }

    try {
      const briefId = await generationApi.generateBrief(
        payload,
        generateAbortRef.current.signal,
        (textChunk) => {
          setGenerationPreview(prev => prev + textChunk)
        }
      )

      // Post-Generation Flow
      const fetchPromise = fetchDetail(briefId, true)
      const historyPromise = fetchHistory()

      const brief = await fetchPromise
      await historyPromise

      if (brief) {
        // Success: Clear form fully
        setFormValues(emptyForm)
        setParentBriefId(null)
        setParentBriefTitle(null)
        setGenerationPreview('')
      } else {
        // Fetch failed but creation succeeded
        // Switch view to 'viewer' so the retryable detailError is displayed
        setView('viewer')
      }

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Brief generation failed.'
      setGenerationError(msg)
      handleAuthError(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSignOut = async () => {
    if (isSigningOutRef.current) return
    isSigningOutRef.current = true
    abortAll()
    await supabase.auth.signOut()
  }

  // --- Rendering ---

  // Determine what to show in the main area based on view state
  const renderMainArea = () => {
    if (view === 'viewer') {
      if (detailLoading) {
        return <EmptyState title="Loading Brief" message="Fetching meeting details..." />
      }
      if (detailError) {
        return (
          <div className="p-8">
            <ErrorBanner message={detailError} onRetry={() => selectedBrief ? fetchDetail(selectedBrief.id) : undefined} />
          </div>
        )
      }
      if (selectedBrief) {
        return (
          <BriefViewer
            brief={selectedBrief}
            onStartFollowUp={handleStartFollowUp}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            deleteError={deleteError}
            disabled={isGenerating}
          />
        )
      }
      return <EmptyState title="No Brief Selected" message="Select a brief from the history to view details." />
    }

    if (view === 'form') {
      return (
        <div className="flex flex-col lg:flex-row h-full gap-4">
          <div className="flex-1 min-w-0 min-h-0">
            <MeetingForm
              values={formValues}
              onChange={setFormValues}
              onSubmit={handleGenerate}
              parentBriefTitle={parentBriefTitle}
              onCancelFollowUp={handleCancelFollowUp}
              disabled={isGenerating}
            />
          </div>
          {/* Show streaming preview alongside if generating or if there is a generation error with partial text */}
          {(isGenerating || generationError || generationPreview) && (
            <div className="flex-1 min-w-0 min-h-0">
              <StreamingBriefPreview text={generationPreview} error={generationError} />
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <AppHeader
        userEmail={userEmail}
        onNewMeeting={handleNewMeeting}
        onSignOut={handleSignOut}
        disabled={isGenerating}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar / Mobile toggled sidebar */}
        <aside
          className={`w-full md:w-80 shrink-0 ${view === 'history' ? 'block' : 'hidden md:block'}`}
        >
          <BriefHistory
            briefs={historyList}
            selectedId={selectedBrief?.id || null}
            isLoading={historyLoading}
            error={historyError}
            onSelect={handleSelectHistoryItem}
            onRetry={fetchHistory}
          />
        </aside>

        {/* Main Workspace */}
        <main
          className={`flex-1 p-4 overflow-hidden flex flex-col ${view !== 'history' ? 'flex' : 'hidden md:flex'}`}
        >
          {/* Mobile 'Back to List' button */}
          <div className="md:hidden mb-4 shrink-0">
            {view !== 'history' && (
              <button
                onClick={() => setView('history')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                &larr; Back to History
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0">
            {view === 'history' && (
              <div className="hidden md:block h-full">
                <EmptyState
                  title="Welcome to Briefly"
                  message="Select a brief from the sidebar or prepare a new meeting."
                  actionLabel="Prepare New Meeting"
                  onAction={handleNewMeeting}
                />
              </div>
            )}

            {renderMainArea()}
          </div>
        </main>
      </div>
    </div>
  )
}
