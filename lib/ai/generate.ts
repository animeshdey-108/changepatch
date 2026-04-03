import OpenAI from 'openai'
import { buildChangelogPrompt, type CommitInput, type GenerationResult } from './prompt'

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  })
}

function getModel(): string {
  return process.env.OPENAI_MODEL ?? 'gpt-4o'
}

export async function generateChangelog(
  commits: CommitInput[]
): Promise<GenerationResult> {
  const client = getOpenAIClient()
  const prompt = buildChangelogPrompt(commits)

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 1500,
    temperature: 0.3,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from AI provider')
  }

  // strip any accidental markdown fences
  const cleaned = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  let parsed: GenerationResult
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('Failed to parse AI response:', cleaned)
    throw new Error('AI returned invalid JSON')
  }

  // validate shape
  if (!Array.isArray(parsed.entries)) {
    throw new Error('AI response missing entries array')
  }

  // sanitise entries — enforce types, trim strings
  parsed.entries = parsed.entries
    .filter((e) => e.title && e.description)
    .map((e) => ({
      type: ['feature', 'fix', 'improvement'].includes(e.type)
        ? e.type
        : 'improvement',
      title: String(e.title).trim().slice(0, 100),
      description: String(e.description).trim().slice(0, 500),
    }))

  return parsed
}