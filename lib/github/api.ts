import { Octokit } from 'octokit'

export function getOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken })
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: string
  private: boolean
  default_branch: string
  updated_at: string
}

export async function getUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const octokit = getOctokit(accessToken)

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 100,
    type: 'all',
  })

  return data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    owner: repo.owner.login,
    private: repo.private,
    default_branch: repo.default_branch,
    updated_at: repo.updated_at ?? new Date().toISOString(),
  }))
}

export async function registerWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  webhookUrl: string,
  secret: string
): Promise<number> {
  const octokit = getOctokit(accessToken)

  const { data } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: webhookUrl,
      content_type: 'json',
      secret,
      insecure_ssl: '0',
    },
    events: ['push'],
    active: true,
  })

  return data.id
}

export async function deleteWebhook(
  accessToken: string,
  owner: string,
  repo: string,
  webhookId: number
): Promise<void> {
  const octokit = getOctokit(accessToken)

  await octokit.rest.repos.deleteWebhook({
    owner,
    repo,
    hook_id: webhookId,
  })
}

export async function getRepoCommits(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
  since?: string
): Promise<Array<{ sha: string; message: string; timestamp: string; author_name: string }>> {
  const octokit = getOctokit(accessToken)

  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: 20,
    ...(since ? { since } : {}),
  })

  return data.map((commit) => ({
    sha: commit.sha,
    // strip author email — GDPR, never store it
    message: commit.commit.message.split('\n')[0].trim(),
    timestamp: commit.commit.author?.date ?? new Date().toISOString(),
    author_name: commit.commit.author?.name ?? 'Unknown',
  }))
}