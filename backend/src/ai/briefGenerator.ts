import { anthropic } from '../lib/anthropicClient'
import { env } from '../config/env'
import { sendChunk } from './streamParser'
import type { Response } from 'express'

export async function generateBriefStream(
  systemPrompt: string,
  userMessage: string,
  res: Response,
  abortSignal: AbortSignal,
): Promise<string> {
  const stream = await anthropic.messages.create(
    {
      model: env.ANTHROPIC_MODEL,
      max_tokens: 4000,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      stream: true,
    },
    { signal: abortSignal },
  )

  let fullResponse = ''

  for await (const chunk of stream) {
    // If the client aborted, the stream will throw an AbortError.
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      const text = chunk.delta.text
      fullResponse += text
      sendChunk(res, text)
    }
  }

  return fullResponse
}
