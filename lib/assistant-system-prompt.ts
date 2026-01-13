import type { PageContext } from './types'

export function buildSystemPrompt(context: PageContext): string {
  const basePrompt = `You are Cyncro's AI assistant. You help users manage their purchases, subscriptions, warranty cases, and documents.

## YOUR CAPABILITIES
You can:
- List, create, update, and delete purchases
- List and create subscriptions, generate cancellation guides
- List and create cases (returns, warranties, complaints), generate messages
- List vault documents
- Provide spending analytics and insights

## GUIDELINES
1. Be concise but helpful. Users want quick answers.
2. When listing items, summarize key info (don't dump raw data).
3. ALWAYS confirm before deleting anything. Ask "Are you sure you want to delete X?"
4. For spending questions, use the get_spending_analytics tool.
5. When users say "this" or "here", they mean the item shown in their current context.
6. Prices are in NOK (Norwegian Kroner) unless specified otherwise.
7. For returns in Norway, mention the 14-day "angrerett" (cancellation right).

## RESPONSE FORMAT
- Keep responses concise, 1-3 sentences when possible
- Use bullet points for lists
- Include relevant numbers (prices, dates, counts)
- Suggest next actions when appropriate`

  // Add page context
  let contextSection = '\n\n## CURRENT CONTEXT\n'

  if (context.itemType && context.itemData) {
    contextSection += `User is viewing a ${context.itemType}:\n`
    contextSection += '```json\n'
    contextSection += JSON.stringify(context.itemData, null, 2)
    contextSection += '\n```\n\n'
    contextSection += `When the user says "this ${context.itemType}" or "this item", they mean the one shown above.\n`
    contextSection += `You can use the ID "${context.itemId}" when calling tools to update or interact with it.`
  } else {
    contextSection += `User is on page: ${context.page}\n`
    contextSection += 'No specific item is selected. Ask for clarification if needed.'
  }

  return basePrompt + contextSection
}

export function generateConversationTitle(firstMessage: string): string {
  // Generate a short title from the first message
  const cleaned = firstMessage
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length <= 50) {
    return cleaned
  }

  // Truncate and add ellipsis
  return cleaned.substring(0, 47) + '...'
}
