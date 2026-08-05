import { apiClient } from './apiClient'

interface GenerateBriefPayload {
  title: string
  objective: string
  agenda: string
  context?: string | null
  attendees?: string | null
  previousNotes?: string | null
  parentBriefId?: string | null
}

export const generationApi = {
  async generateBrief(
    payload: GenerateBriefPayload,
    abortSignal: AbortSignal,
    onChunk: (text: string) => void,
  ): Promise<string> {
    const res = await apiClient('/api/briefs/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: abortSignal,
    })

    if (!res.body) {
      throw new Error('ReadableStream not supported or no body returned')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let resolvedBriefId: string | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        // Safely normalize CRLF to LF just in case
        buffer = buffer.replace(/\r\n/g, '\n')
        
        let splitIndex
        while ((splitIndex = buffer.indexOf('\n\n')) >= 0) {
          const block = buffer.slice(0, splitIndex).trim()
          buffer = buffer.slice(splitIndex + 2)

          if (!block) continue

          if (block.startsWith('data: ')) {
            const dataString = block.slice(6).trim()
            if (!dataString) continue

            try {
              const event = JSON.parse(dataString)
              
              if (event.type === 'chunk' && typeof event.text === 'string') {
                if (resolvedBriefId) continue // Ignore chunks after completion
                onChunk(event.text)
              } else if (event.type === 'complete' && typeof event.briefId === 'string') {
                // Reject duplicate completes
                if (resolvedBriefId) {
                  throw new Error('Duplicate complete event received')
                }
                
                // UUID validation regex
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                if (!uuidRegex.test(event.briefId)) {
                  throw new Error('Invalid briefId received')
                }
                
                resolvedBriefId = event.briefId
              } else if (event.type === 'error' && typeof event.message === 'string') {
                if (resolvedBriefId) continue // Ignore errors after completion
                throw new Error(event.message)
              }
            } catch (err: unknown) {
              if (err instanceof Error) {
                // If it's a parsing error from malformed event JSON, just rethrow safely
                if (err.name === 'SyntaxError') {
                  throw new Error('Malformed event data')
                }
                throw err
              }
              throw new Error('Unknown event parsing error')
            }
          }
        }
      }
    } finally {
      // Release lock and optionally cancel upstream
      reader.releaseLock()
    }

    if (!resolvedBriefId) {
      throw new Error('Stream ended without completion event')
    }

    return resolvedBriefId
  },
}
