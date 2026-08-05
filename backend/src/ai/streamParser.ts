import type { Response } from 'express'

export function setupSSE(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })
}

export function sendChunk(res: Response, text: string): void {
  const payload = JSON.stringify({ type: 'chunk', text })
  res.write(`data: ${payload}\n\n`)
}

export function sendComplete(res: Response, briefId: string): void {
  const payload = JSON.stringify({ type: 'complete', briefId })
  res.write(`data: ${payload}\n\n`)
}

export function sendError(res: Response, message: string): void {
  const payload = JSON.stringify({ type: 'error', message })
  res.write(`data: ${payload}\n\n`)
}
