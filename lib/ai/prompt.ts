export interface CommitInput {
  sha: string
  message: string
  timestamp: string
  author_name: string
}

export interface ChangelogEntry {
  type: 'feature' | 'fix' | 'improvement'
  title: string
  description: string
}

export interface GenerationResult {
  entries: ChangelogEntry[]
  reasoning: string
}

export function buildChangelogPrompt(commits: CommitInput[]): string {
  const commitList = commits
    .map((c, i) => `${i + 1}. [${c.sha.slice(0, 7)}] ${c.message} (${c.author_name}, ${c.timestamp})`)
    .join('\n')

  return `You are writing a user-facing changelog for a SaaS product.

You will receive a list of git commits. Your job is to produce a structured changelog.

STEP 1 — REASONING (think before you write):
First, go through each commit and decide:
- INCLUDE: user-facing features, bug fixes, improvements users would notice
- EXCLUDE: dependency updates, CI/CD changes, formatting, tests, internal refactors, merge commits, "wip", "fix typo", "cleanup"

List your include/exclude decisions briefly.

STEP 2 — GENERATE:
For the included commits, write changelog entries in plain English that a non-technical user can understand.

RULES:
- Use active voice and present tense ("You can now...", "Fixed an issue where...")
- Group related commits into one entry if they form a single feature
- Each entry needs: type (feature/fix/improvement), a short title (max 8 words), and a description (1-2 sentences)
- CRITICAL: Describe ONLY what the commit messages explicitly demonstrate. Do NOT invent, infer, or extrapolate features. If a commit is ambiguous, OMIT it rather than guess. When in doubt, leave it out.
- If ALL commits should be excluded, return an empty entries array — do not invent entries to fill space

OUTPUT FORMAT — respond with valid JSON only, no markdown, no backticks:
{
  "reasoning": "brief explanation of what you included and excluded",
  "entries": [
    {
      "type": "feature" | "fix" | "improvement",
      "title": "short title here",
      "description": "one to two sentence description here"
    }
  ]
}

COMMITS TO PROCESS:
${commitList}`
}