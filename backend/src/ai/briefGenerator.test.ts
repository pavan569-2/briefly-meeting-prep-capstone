import '../test-utils/setupEnv'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Response } from 'express'

// Must be mocked before importing the module under test
vi.mock('../lib/anthropicClient', () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}))

vi.mock('./streamParser', () => ({
  setupSSE: vi.fn(),
  sendChunk: vi.fn(),
  sendComplete: vi.fn(),
  sendError: vi.fn(),
}))

import { generateBriefStream } from './briefGenerator'
import { anthropic } from '../lib/anthropicClient'
import { sendChunk } from './streamParser'

// Helper: builds an async iterable from an array of mock Anthropic stream chunks
async function* makeStream(chunks: object[]) {
  for (const chunk of chunks) {
    yield chunk
  }
}

function makeTextDelta(text: string) {
  return {
    type: 'content_block_delta',
    delta: { type: 'text_delta', text },
  }
}

function makeNonTextEvent(type: string) {
  return { type }
}

function makeMockRes(): Response {
  return { write: vi.fn() } as unknown as Response
}

describe('generateBriefStream', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls anthropic.messages.create with correct arguments', async () => {
    const stream = makeStream([makeTextDelta('hi')])
    vi.mocked(anthropic.messages.create).mockResolvedValue(stream as never)

    const res = makeMockRes()
    const signal = new AbortController().signal

    await generateBriefStream('sys-prompt', 'user-msg', res, signal)

    expect(anthropic.messages.create).toHaveBeenCalledTimes(1)
    expect(anthropic.messages.create).toHaveBeenCalledWith(
      {
        model: 'claude-test-model',
        max_tokens: 4000,
        system: 'sys-prompt',
        messages: [{ role: 'user', content: 'user-msg' }],
        stream: true,
      },
      { signal },
    )
  })

  it('accumulates text deltas from multiple chunks into the full response string', async () => {
    const stream = makeStream([makeTextDelta('hello'), makeTextDelta(' world')])
    vi.mocked(anthropic.messages.create).mockResolvedValue(stream as never)

    const res = makeMockRes()
    const result = await generateBriefStream('s', 'u', res, new AbortController().signal)

    expect(result).toBe('hello world')
  })

  it('calls sendChunk once per text delta with correct arguments', async () => {
    const stream = makeStream([makeTextDelta('foo'), makeTextDelta('bar')])
    vi.mocked(anthropic.messages.create).mockResolvedValue(stream as never)

    const res = makeMockRes()
    await generateBriefStream('s', 'u', res, new AbortController().signal)

    expect(sendChunk).toHaveBeenCalledTimes(2)
    expect(sendChunk).toHaveBeenNthCalledWith(1, res, 'foo')
    expect(sendChunk).toHaveBeenNthCalledWith(2, res, 'bar')
  })

  it('ignores non content_block_delta event types', async () => {
    const stream = makeStream([
      makeNonTextEvent('message_start'),
      makeNonTextEvent('ping'),
      makeTextDelta('actual'),
      makeNonTextEvent('content_block_start'),
      makeNonTextEvent('message_stop'),
    ])
    vi.mocked(anthropic.messages.create).mockResolvedValue(stream as never)

    const res = makeMockRes()
    const result = await generateBriefStream('s', 'u', res, new AbortController().signal)

    expect(result).toBe('actual')
    expect(sendChunk).toHaveBeenCalledTimes(1)
  })

  it('ignores content_block_delta events where delta.type is not text_delta', async () => {
    const stream = makeStream([
      { type: 'content_block_delta', delta: { type: 'input_json_delta', partial_json: '{}' } },
      makeTextDelta('real-text'),
    ])
    vi.mocked(anthropic.messages.create).mockResolvedValue(stream as never)

    const res = makeMockRes()
    const result = await generateBriefStream('s', 'u', res, new AbortController().signal)

    expect(result).toBe('real-text')
    expect(sendChunk).toHaveBeenCalledTimes(1)
  })

  it('returns the full accumulated response string', async () => {
    const stream = makeStream([
      makeTextDelta('{"key":'),
      makeTextDelta('"value"}'),
    ])
    vi.mocked(anthropic.messages.create).mockResolvedValue(stream as never)

    const res = makeMockRes()
    const result = await generateBriefStream('s', 'u', res, new AbortController().signal)

    expect(result).toBe('{"key":"value"}')
  })

  it('propagates errors thrown by anthropic.messages.create', async () => {
    vi.mocked(anthropic.messages.create).mockRejectedValue(new Error('SDK error'))

    const res = makeMockRes()
    await expect(
      generateBriefStream('s', 'u', res, new AbortController().signal),
    ).rejects.toThrow('SDK error')
  })

  it('propagates errors thrown during stream iteration', async () => {
    async function* failingStream() {
      yield makeTextDelta('partial')
      throw new Error('stream interrupted')
    }
    vi.mocked(anthropic.messages.create).mockResolvedValue(failingStream() as never)

    const res = makeMockRes()
    await expect(
      generateBriefStream('s', 'u', res, new AbortController().signal),
    ).rejects.toThrow('stream interrupted')
  })

  it('propagates an AbortError when the stream throws due to abort signal', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    async function* abortedStream() {
      yield { type: 'ping' } // required to be a valid generator
      throw abortError
    }
    vi.mocked(anthropic.messages.create).mockResolvedValue(abortedStream() as never)

    const res = makeMockRes()
    const controller = new AbortController()
    controller.abort()

    await expect(
      generateBriefStream('s', 'u', res, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
