/**
 * Halo agent chat — Claude API client.
 *
 * Calls the real Anthropic Messages API directly from the browser using
 * `dangerouslyAllowBrowser` (see PROJECT.md "Key Decisions" — v1.1 exception
 * to the no-backend constraint: a direct third-party API call, not a backend
 * this app hosts). The API key is read from `import.meta.env.VITE_ANTHROPIC_API_KEY`,
 * set via a gitignored `.env` file at build time — never committed, never
 * entered through a Settings UI.
 *
 * This module owns no localStorage — chatRepo persists history, this module
 * only talks to Anthropic.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage } from './types'

const MODEL = 'claude-opus-4-8'

const SYSTEM_PROMPT =
  'You are Halo Assistant, a friendly in-app AI assistant embedded in Halo, a project/task ' +
  'management SaaS demo. Help the user with questions about tasks, projects, and general ' +
  'productivity topics. Keep responses conversational and reasonably concise.'

/** Thrown when no API key is configured — callers render a setup hint instead of retrying. */
export class ChatNotConfiguredError extends Error {
  constructor() {
    super(
      'Agent chat has no Anthropic API key configured. Copy .env.example to .env and set VITE_ANTHROPIC_API_KEY, then restart the dev server.',
    )
    this.name = 'ChatNotConfiguredError'
  }
}

let client: Anthropic | null = null

function getClient(): Anthropic {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new ChatNotConfiguredError()
  if (!client) {
    client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  }
  return client
}

/**
 * Send the conversation history to Claude and stream the assistant's reply.
 *
 * @param history - prior turns, oldest first, NOT including the in-flight user turn's response
 * @param onDelta - called with each incremental text chunk as it streams in
 * @returns the full assistant reply text once the stream completes
 * @throws ChatNotConfiguredError if no API key is set; otherwise rethrows the
 *   Anthropic SDK's typed exception (AuthenticationError, RateLimitError,
 *   APIConnectionError, etc.) for the caller to classify.
 */
export async function streamChatReply(
  history: ChatMessage[],
  onDelta: (chunk: string) => void,
): Promise<string> {
  const anthropic = getClient()

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  })

  stream.on('text', (delta) => onDelta(delta))

  const finalMessage = await stream.finalMessage()
  const textBlock = finalMessage.content.find((b) => b.type === 'text')
  return textBlock?.text ?? ''
}

/** Human-readable message for a caught error, for display in the chat panel. */
export function describeChatError(err: unknown): string {
  if (err instanceof ChatNotConfiguredError) return err.message
  if (err instanceof Anthropic.AuthenticationError) {
    return 'The configured Anthropic API key was rejected. Check VITE_ANTHROPIC_API_KEY in your .env file.'
  }
  if (err instanceof Anthropic.RateLimitError) {
    return 'Rate limited by the Claude API. Wait a moment and try again.'
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return 'Could not reach the Claude API. Check your network connection.'
  }
  if (err instanceof Anthropic.APIError) {
    return `Claude API error (${err.status}): ${err.message}`
  }
  return 'Something went wrong sending that message. Please try again.'
}
