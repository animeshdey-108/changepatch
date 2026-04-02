export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'starter' | 'growth' | 'agency'
          plan_status: 'active' | 'paused' | 'cancelled'
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          generations_used_this_month: number
          generations_reset_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'starter' | 'growth' | 'agency'
          plan_status?: 'active' | 'paused' | 'cancelled'
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          generations_used_this_month?: number
          generations_reset_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'starter' | 'growth' | 'agency'
          plan_status?: 'active' | 'paused' | 'cancelled'
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          generations_used_this_month?: number
          generations_reset_at?: string
          updated_at?: string
        }
      }
      repos: {
        Row: {
          id: string
          user_id: string
          github_repo_id: number
          github_repo_name: string
          github_full_name: string
          github_owner: string
          provider: 'github' | 'gitlab'
          webhook_id: number | null
          webhook_secret: string
          is_active: boolean
          default_branch: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          github_repo_id: number
          github_repo_name: string
          github_full_name: string
          github_owner: string
          provider?: 'github' | 'gitlab'
          webhook_id?: number | null
          webhook_secret: string
          is_active?: boolean
          default_branch?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          github_repo_name?: string
          github_full_name?: string
          webhook_id?: number | null
          webhook_secret?: string
          is_active?: boolean
          default_branch?: string
          updated_at?: string
        }
      }
      commit_sets: {
        Row: {
          id: string
          repo_id: string
          commits: Json
          branch: string
          pushed_at: string
          commit_count: number
          created_at: string
        }
        Insert: {
          id?: string
          repo_id: string
          commits: Json
          branch: string
          pushed_at?: string
          commit_count?: number
          created_at?: string
        }
        Update: {
          commits?: Json
          commit_count?: number
        }
      }
      pending_generations: {
        Row: {
          id: string
          commit_set_id: string
          repo_id: string
          status: 'queued' | 'processing' | 'done' | 'failed'
          retry_count: number
          max_retries: number
          last_error: string | null
          provider: 'openai' | 'anthropic'
          created_at: string
          updated_at: string
          next_retry_at: string
        }
        Insert: {
          id?: string
          commit_set_id: string
          repo_id: string
          status?: 'queued' | 'processing' | 'done' | 'failed'
          retry_count?: number
          max_retries?: number
          last_error?: string | null
          provider?: 'openai' | 'anthropic'
          created_at?: string
          updated_at?: string
          next_retry_at?: string
        }
        Update: {
          status?: 'queued' | 'processing' | 'done' | 'failed'
          retry_count?: number
          last_error?: string | null
          provider?: 'openai' | 'anthropic'
          next_retry_at?: string
          updated_at?: string
        }
      }
      generated_entries: {
        Row: {
          id: string
          commit_set_id: string
          repo_id: string
          ai_draft: Json
          status: 'draft' | 'published' | 'discarded'
          provider: string
          prompt_version: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          commit_set_id: string
          repo_id: string
          ai_draft: Json
          status?: 'draft' | 'published' | 'discarded'
          provider?: string
          prompt_version?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          ai_draft?: Json
          status?: 'draft' | 'published' | 'discarded'
          updated_at?: string
        }
      }
      published_entries: {
        Row: {
          id: string
          repo_id: string
          generated_entry_id: string | null
          title: string
          description: string
          entry_type: 'feature' | 'fix' | 'improvement'
          version_tag: string | null
          is_published: boolean
          published_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          repo_id: string
          generated_entry_id?: string | null
          title: string
          description: string
          entry_type?: 'feature' | 'fix' | 'improvement'
          version_tag?: string | null
          is_published?: boolean
          published_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          entry_type?: 'feature' | 'fix' | 'improvement'
          version_tag?: string | null
          is_published?: boolean
          updated_at?: string
        }
      }
      edit_diffs: {
        Row: {
          id: string
          generated_entry_id: string
          published_entry_id: string | null
          original_draft: Json
          published_version: Json
          words_added: number
          words_removed: number
          entries_removed: number
          approved_unchanged: boolean
          review_duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          generated_entry_id: string
          published_entry_id?: string | null
          original_draft: Json
          published_version: Json
          words_added?: number
          words_removed?: number
          entries_removed?: number
          approved_unchanged?: boolean
          review_duration_ms?: number | null
          created_at?: string
        }
        Update: {
          published_entry_id?: string | null
        }
      }
      changelog_pages: {
        Row: {
          id: string
          repo_id: string
          slug: string
          custom_domain: string | null
          title: string
          description: string | null
          is_public: boolean
          branding: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          repo_id: string
          slug: string
          custom_domain?: string | null
          title?: string
          description?: string | null
          is_public?: boolean
          branding?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          slug?: string
          custom_domain?: string | null
          title?: string
          description?: string | null
          is_public?: boolean
          branding?: Json
          updated_at?: string
        }
      }
      subscribers: {
        Row: {
          id: string
          page_id: string
          email: string
          confirmed_at: string | null
          unsubscribed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          page_id: string
          email: string
          confirmed_at?: string | null
          unsubscribed_at?: string | null
          created_at?: string
        }
        Update: {
          confirmed_at?: string | null
          unsubscribed_at?: string | null
        }
      }
      email_digests: {
        Row: {
          id: string
          page_id: string
          entry_ids: string[]
          recipient_count: number
          subject: string
          status: 'sent' | 'failed' | 'partial'
          sent_at: string
        }
        Insert: {
          id?: string
          page_id: string
          entry_ids?: string[]
          recipient_count?: number
          subject: string
          status?: 'sent' | 'failed' | 'partial'
          sent_at?: string
        }
        Update: {
          status?: 'sent' | 'failed' | 'partial'
          recipient_count?: number
        }
      }
    }
  }
}