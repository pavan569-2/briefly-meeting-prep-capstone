import '../test-utils/setupEnv'
import { describe, it, expect, vi } from 'vitest'
import type { Response } from 'express'
import { setupSSE, sendChunk, sendComplete, sendError } from './streamParser'

function makeMockRes(): Response {
  return {
    writeHead: vi.fn(),
    write: vi.fn(),
  } as unknown as Response
}

describe('setupSSE', () => {
  it('calls writeHead(200) with the correct SSE headers', () => {
    const res = makeMockRes()
    setupSSE(res)
    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })
    expect(res.writeHead).toHaveBeenCalledTimes(1)
  })
})

describe('sendChunk', () => {
  it('writes a correctly formatted SSE chunk frame', () => {
    const res = makeMockRes()
    sendChunk(res, 'hello')
    expect(res.write).toHaveBeenCalledWith(
      'data: {"type":"chunk","text":"hello"}\n\n',
    )
    expect(res.write).toHaveBeenCalledTimes(1)
  })

  it('correctly encodes text with special characters', () => {
    const res = makeMockRes()
    sendChunk(res, 'line1\nline2')
    const call = (res.write as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    const parsed = JSON.parse(call.replace('data: ', '').trim())
    expect(parsed.type).toBe('chunk')
    expect(parsed.text).toBe('line1\nline2')
  })
})

describe('sendComplete', () => {
  it('writes a correctly formatted SSE complete frame', () => {
    const res = makeMockRes()
    sendComplete(res, 'abc-123')
    expect(res.write).toHaveBeenCalledWith(
      'data: {"type":"complete","briefId":"abc-123"}\n\n',
    )
    expect(res.write).toHaveBeenCalledTimes(1)
  })
})

describe('sendError', () => {
  it('writes a correctly formatted SSE error frame', () => {
    const res = makeMockRes()
    sendError(res, 'oops')
    expect(res.write).toHaveBeenCalledWith(
      'data: {"type":"error","message":"oops"}\n\n',
    )
    expect(res.write).toHaveBeenCalledTimes(1)
  })
})
