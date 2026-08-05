import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env'

/**
 * Anthropic SDK client.
 * Only used server-side. The API key is never sent to the frontend.
 */
export const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
})
