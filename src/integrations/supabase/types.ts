export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string | null
          source: string
          status: string
          team_name: string
          updated_at: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          source?: string
          status?: string
          team_name: string
          updated_at?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          source?: string
          status?: string
          team_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendees: Json | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: string | null
          scrim_id: string | null
          start_time: string
          tenant_id: string
          timezone: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          scrim_id?: string | null
          start_time: string
          tenant_id: string
          timezone?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          scrim_id?: string | null
          start_time?: string
          tenant_id?: string
          timezone?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
        ]
      }
      champion_pools: {
        Row: {
          champion_name: string
          comfort_level: number
          created_at: string
          games_played: number
          id: string
          last_played: string | null
          notes: string | null
          player_id: string
          priority: number
          role: Database["public"]["Enums"]["champion_role"]
          updated_at: string
          win_rate: number | null
        }
        Insert: {
          champion_name: string
          comfort_level?: number
          created_at?: string
          games_played?: number
          id?: string
          last_played?: string | null
          notes?: string | null
          player_id: string
          priority?: number
          role: Database["public"]["Enums"]["champion_role"]
          updated_at?: string
          win_rate?: number | null
        }
        Update: {
          champion_name?: string
          comfort_level?: number
          created_at?: string
          games_played?: number
          id?: string
          last_played?: string | null
          notes?: string | null
          player_id?: string
          priority?: number
          role?: Database["public"]["Enums"]["champion_role"]
          updated_at?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "champion_pools_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_feedback: {
        Row: {
          coach_id: string
          content: string
          created_at: string
          feedback_type: string
          id: string
          is_during_game: boolean
          player_id: string | null
          player_name: string | null
          priority: string
          scrim_game_id: string
          tags: Json
          timestamp_seconds: number | null
          title: string | null
          updated_at: string
        }
        Insert: {
          coach_id: string
          content: string
          created_at?: string
          feedback_type?: string
          id?: string
          is_during_game?: boolean
          player_id?: string | null
          player_name?: string | null
          priority?: string
          scrim_game_id: string
          tags?: Json
          timestamp_seconds?: number | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          coach_id?: string
          content?: string
          created_at?: string
          feedback_type?: string
          id?: string
          is_during_game?: boolean
          player_id?: string | null
          player_name?: string | null
          priority?: string
          scrim_game_id?: string
          tags?: Json
          timestamp_seconds?: number | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_feedback_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_feedback_scrim_game_id_fkey"
            columns: ["scrim_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_action_events: {
        Row: {
          action_id: string
          actor_id: string
          created_at: string
          event_type: string
          id: number
          next_status: string | null
          note: string | null
          previous_status: string | null
          tenant_id: string
        }
        Insert: {
          action_id: string
          actor_id: string
          created_at?: string
          event_type: string
          id?: never
          next_status?: string | null
          note?: string | null
          previous_status?: string | null
          tenant_id: string
        }
        Update: {
          action_id?: string
          actor_id?: string
          created_at?: string
          event_type?: string
          id?: never
          next_status?: string | null
          note?: string | null
          previous_status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_action_events_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "coaching_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_action_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_actions: {
        Row: {
          acknowledged_at: string | null
          archived_at: string | null
          assignee_player_id: string | null
          assignee_user_id: string | null
          completed_at: string | null
          completed_by: string | null
          completion_evidence: string | null
          category: string
          carried_from_action_id: string | null
          checkpoint_scrim_ids: string[]
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          feedback_id: string | null
          follow_up_scrim_id: string | null
          id: string
          owner_user_id: string
          participant_player_ids: string[]
          pattern_label: string | null
          player_check_in: string | null
          player_check_in_note: string | null
          player_checked_in_at: string | null
          priority: string
          ready_for_review_at: string | null
          review_evidence: string | null
          review_next_action: string | null
          review_observation: string | null
          review_outcome: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scope_type: string
          scrim_game_id: string | null
          scrim_id: string | null
          source_note: string | null
          source_timestamp_seconds: number | null
          source_type: string
          status: string
          tenant_id: string
          title: string
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          archived_at?: string | null
          assignee_player_id?: string | null
          assignee_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_evidence?: string | null
          category?: string
          carried_from_action_id?: string | null
          checkpoint_scrim_ids?: string[]
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          feedback_id?: string | null
          follow_up_scrim_id?: string | null
          id?: string
          owner_user_id: string
          participant_player_ids?: string[]
          pattern_label?: string | null
          player_check_in?: string | null
          player_check_in_note?: string | null
          player_checked_in_at?: string | null
          priority?: string
          ready_for_review_at?: string | null
          review_evidence?: string | null
          review_next_action?: string | null
          review_observation?: string | null
          review_outcome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_type?: string
          scrim_game_id?: string | null
          scrim_id?: string | null
          source_note?: string | null
          source_timestamp_seconds?: number | null
          source_type?: string
          status?: string
          tenant_id: string
          title: string
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          archived_at?: string | null
          assignee_player_id?: string | null
          assignee_user_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          completion_evidence?: string | null
          category?: string
          carried_from_action_id?: string | null
          checkpoint_scrim_ids?: string[]
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          feedback_id?: string | null
          follow_up_scrim_id?: string | null
          id?: string
          owner_user_id?: string
          participant_player_ids?: string[]
          pattern_label?: string | null
          player_check_in?: string | null
          player_check_in_note?: string | null
          player_checked_in_at?: string | null
          priority?: string
          ready_for_review_at?: string | null
          review_evidence?: string | null
          review_next_action?: string | null
          review_observation?: string | null
          review_outcome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_type?: string
          scrim_game_id?: string | null
          scrim_id?: string | null
          source_note?: string | null
          source_timestamp_seconds?: number | null
          source_type?: string
          status?: string
          tenant_id?: string
          title?: string
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_actions_assignee_player_id_fkey"
            columns: ["assignee_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_actions_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "coach_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_actions_follow_up_scrim_id_fkey"
            columns: ["follow_up_scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_actions_scrim_game_id_fkey"
            columns: ["scrim_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_actions_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_action_templates: {
        Row: {
          archived_at: string | null
          category: string
          created_at: string
          created_by: string
          id: string
          review_prompt: string | null
          scope_type: string
          suggested_duration_days: number | null
          success_evidence: string | null
          tenant_id: string
          title: string
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category: string
          created_at?: string
          created_by: string
          id?: string
          review_prompt?: string | null
          scope_type?: string
          suggested_duration_days?: number | null
          success_evidence?: string | null
          tenant_id: string
          title: string
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          review_prompt?: string | null
          scope_type?: string
          suggested_duration_days?: number | null
          success_evidence?: string | null
          tenant_id?: string
          title?: string
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_action_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_capture_events: {
        Row: {
          capture_session_id: string
          created_at: string
          event_id: string
          event_type: string | null
          id: string
          occurred_at: string | null
          payload: Json
          sequence: number
        }
        Insert: {
          capture_session_id: string
          created_at?: string
          event_id: string
          event_type?: string | null
          id?: string
          occurred_at?: string | null
          payload: Json
          sequence: number
        }
        Update: {
          capture_session_id?: string
          created_at?: string
          event_id?: string
          event_type?: string | null
          id?: string
          occurred_at?: string | null
          payload?: Json
          sequence?: number
        }
        Relationships: [
          {
            foreignKeyName: "collector_capture_events_capture_session_id_fkey"
            columns: ["capture_session_id"]
            isOneToOne: false
            referencedRelation: "collector_capture_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_capture_sessions: {
        Row: {
          client_session_id: string
          completed_at: string | null
          created_at: string
          device_id: string
          game_id: string | null
          id: string
          last_seen_at: string
          last_sequence: number
          local_game_id: string
          schema_version: number
          scrim_id: string
          started_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_session_id: string
          completed_at?: string | null
          created_at?: string
          device_id: string
          game_id?: string | null
          id?: string
          last_seen_at?: string
          last_sequence?: number
          local_game_id: string
          schema_version?: number
          scrim_id: string
          started_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_session_id?: string
          completed_at?: string | null
          created_at?: string
          device_id?: string
          game_id?: string | null
          id?: string
          last_seen_at?: string
          last_sequence?: number
          local_game_id?: string
          schema_version?: number
          scrim_id?: string
          started_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collector_capture_sessions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "collector_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_capture_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_capture_sessions_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_capture_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_devices: {
        Row: {
          app_version: string | null
          created_at: string
          created_by: string
          credential_hash: string
          id: string
          label: string
          last_seen_at: string | null
          revoked_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          created_by: string
          credential_hash: string
          id?: string
          label: string
          last_seen_at?: string | null
          revoked_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          created_by?: string
          credential_hash?: string
          id?: string
          label?: string
          last_seen_at?: string | null
          revoked_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collector_devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collector_pairing_codes: {
        Row: {
          code_hash: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          redeemed_at: string | null
          redeemed_by_device_id: string | null
          revoked_at: string | null
          tenant_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          redeemed_at?: string | null
          redeemed_by_device_id?: string | null
          revoked_at?: string | null
          tenant_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by_device_id?: string | null
          revoked_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collector_pairing_codes_redeemed_by_device_id_fkey"
            columns: ["redeemed_by_device_id"]
            isOneToOne: false
            referencedRelation: "collector_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collector_pairing_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_demo_request: boolean | null
          message: string
          name: string
          subject: string
          team: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_demo_request?: boolean | null
          message: string
          name: string
          subject: string
          team?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_demo_request?: boolean | null
          message?: string
          name?: string
          subject?: string
          team?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_channel_subscriptions: {
        Row: {
          channel_id: string
          channel_name: string | null
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          installation_id: string
          tenant_id: string
        }
        Insert: {
          channel_id: string
          channel_name?: string | null
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          installation_id: string
          tenant_id: string
        }
        Update: {
          channel_id?: string
          channel_name?: string | null
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          installation_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_channel_subscriptions_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "discord_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discord_channel_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_installations: {
        Row: {
          guild_id: string
          guild_name: string | null
          id: string
          installed_at: string
          installed_by: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          guild_id: string
          guild_name?: string | null
          id?: string
          installed_at?: string
          installed_by: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          guild_id?: string
          guild_name?: string | null
          id?: string
          installed_at?: string
          installed_by?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_installations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_oauth_states: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          state_hash: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          state_hash: string
          tenant_id: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          state_hash?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_oauth_states_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_audit_events: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          material_changes: Json
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          material_changes?: Json
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          material_changes?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_plan_restrictions: {
        Row: {
          brief_id: string
          champion_name: string
          created_at: string
          created_by: string
          id: string
          reason: string
          source_game_number: number | null
          tenant_id: string
        }
        Insert: {
          brief_id: string
          champion_name: string
          created_at?: string
          created_by: string
          id?: string
          reason?: string
          source_game_number?: number | null
          tenant_id: string
        }
        Update: {
          brief_id?: string
          champion_name?: string
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          source_game_number?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_plan_restrictions_brief_tenant_fkey"
            columns: ["brief_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "preparation_briefs"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "draft_plan_restrictions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_playbooks: {
        Row: {
          archived_at: string | null
          archived_from_status: string | null
          composition_identity: string | null
          contingency_notes: string
          created_at: string
          created_by: string
          description: string
          execution_goals: Json
          flex_picks: Json
          id: string
          parent_playbook_id: string | null
          patch_label: string | null
          preferred_side: string
          priorities: Json
          published_at: string | null
          published_by: string | null
          revision: number
          role_assignments: Json
          snapshot: Json | null
          status: string
          tags: Json
          tenant_id: string
          title: string
          updated_at: string
          vulnerabilities: Json
        }
        Insert: {
          archived_at?: string | null
          archived_from_status?: string | null
          composition_identity?: string | null
          contingency_notes?: string
          created_at?: string
          created_by: string
          description?: string
          execution_goals?: Json
          flex_picks?: Json
          id?: string
          parent_playbook_id?: string | null
          patch_label?: string | null
          preferred_side?: string
          priorities?: Json
          published_at?: string | null
          published_by?: string | null
          revision?: number
          role_assignments?: Json
          snapshot?: Json | null
          status?: string
          tags?: Json
          tenant_id: string
          title: string
          updated_at?: string
          vulnerabilities?: Json
        }
        Update: {
          archived_at?: string | null
          archived_from_status?: string | null
          composition_identity?: string | null
          contingency_notes?: string
          created_at?: string
          created_by?: string
          description?: string
          execution_goals?: Json
          flex_picks?: Json
          id?: string
          parent_playbook_id?: string | null
          patch_label?: string | null
          preferred_side?: string
          priorities?: Json
          published_at?: string | null
          published_by?: string | null
          revision?: number
          role_assignments?: Json
          snapshot?: Json | null
          status?: string
          tags?: Json
          tenant_id?: string
          title?: string
          updated_at?: string
          vulnerabilities?: Json
        }
        Relationships: [
          {
            foreignKeyName: "draft_playbooks_parent_playbook_id_fkey"
            columns: ["parent_playbook_id"]
            isOneToOne: false
            referencedRelation: "draft_playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_playbooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_scenario_actions: {
        Row: {
          action_type: string
          assigned_role: string | null
          champion_name: string
          created_at: string
          id: string
          phase: string
          rationale: string
          scenario_id: string
          sequence_number: number
          team_side: string
          tenant_id: string
        }
        Insert: {
          action_type: string
          assigned_role?: string | null
          champion_name: string
          created_at?: string
          id?: string
          phase: string
          rationale?: string
          scenario_id: string
          sequence_number: number
          team_side: string
          tenant_id: string
        }
        Update: {
          action_type?: string
          assigned_role?: string | null
          champion_name?: string
          created_at?: string
          id?: string
          phase?: string
          rationale?: string
          scenario_id?: string
          sequence_number?: number
          team_side?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_scenario_actions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "draft_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_scenario_actions_scenario_tenant_fkey"
            columns: ["scenario_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "draft_scenarios"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "draft_scenario_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_scenarios: {
        Row: {
          branch_sequence: number | null
          brief_id: string | null
          contingency_notes: string
          created_at: string
          created_by: string
          id: string
          name: string
          parent_scenario_id: string | null
          playbook_id: string | null
          rationale: string
          side: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          branch_sequence?: number | null
          brief_id?: string | null
          contingency_notes?: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          parent_scenario_id?: string | null
          playbook_id?: string | null
          rationale?: string
          side: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          branch_sequence?: number | null
          brief_id?: string | null
          contingency_notes?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          parent_scenario_id?: string | null
          playbook_id?: string | null
          rationale?: string
          side?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_scenarios_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "preparation_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_scenarios_brief_tenant_fkey"
            columns: ["brief_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "preparation_briefs"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "draft_scenarios_parent_scenario_id_fkey"
            columns: ["parent_scenario_id"]
            isOneToOne: false
            referencedRelation: "draft_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_scenarios_parent_tenant_fkey"
            columns: ["parent_scenario_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "draft_scenarios"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "draft_scenarios_playbook_tenant_fkey"
            columns: ["playbook_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "draft_playbooks"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "draft_scenarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      external_draft_tools: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          created_at: string
          id: string
          is_active: boolean
          last_sync: string | null
          tenant_id: string
          tool_name: string
          tool_type: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync?: string | null
          tenant_id: string
          tool_name: string
          tool_type: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync?: string | null
          tenant_id?: string
          tool_name?: string
          tool_type?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      game_drafts: {
        Row: {
          completed_at: string | null
          created_at: string
          draft_data: Json
          draft_mode: Database["public"]["Enums"]["draft_mode"]
          draft_url: string | null
          id: string
          our_team_side: Database["public"]["Enums"]["draft_team_side"] | null
          scrim_game_id: string
          session_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          draft_data?: Json
          draft_mode?: Database["public"]["Enums"]["draft_mode"]
          draft_url?: string | null
          id?: string
          our_team_side?: Database["public"]["Enums"]["draft_team_side"] | null
          scrim_game_id: string
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          draft_data?: Json
          draft_mode?: Database["public"]["Enums"]["draft_mode"]
          draft_url?: string | null
          id?: string
          our_team_side?: Database["public"]["Enums"]["draft_team_side"] | null
          scrim_game_id?: string
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_drafts_scrim_game_id_fkey"
            columns: ["scrim_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_delivery_attempts: {
        Row: {
          attempted_at: string
          error_message: string | null
          event_id: string
          id: string
          outcome: string
          provider: string
          provider_reference: string | null
          tenant_id: string
        }
        Insert: {
          attempted_at?: string
          error_message?: string | null
          event_id: string
          id?: string
          outcome: string
          provider: string
          provider_reference?: string | null
          tenant_id: string
        }
        Update: {
          attempted_at?: string
          error_message?: string | null
          event_id?: string
          id?: string
          outcome?: string
          provider?: string
          provider_reference?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_delivery_attempts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "integration_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_delivery_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          aggregate_id: string | null
          aggregate_type: string
          attempt_count: number
          available_at: string
          claimed_at: string | null
          created_at: string
          dedupe_key: string
          delivered_at: string | null
          event_type: string
          id: string
          last_error: string | null
          payload: Json
          status: string
          tenant_id: string
        }
        Insert: {
          aggregate_id?: string | null
          aggregate_type: string
          attempt_count?: number
          available_at?: string
          claimed_at?: string | null
          created_at?: string
          dedupe_key: string
          delivered_at?: string | null
          event_type: string
          id?: string
          last_error?: string | null
          payload?: Json
          status?: string
          tenant_id: string
        }
        Update: {
          aggregate_id?: string | null
          aggregate_type?: string
          attempt_count?: number
          available_at?: string
          claimed_at?: string | null
          created_at?: string
          dedupe_key?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          last_error?: string | null
          payload?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      live_game_data: {
        Row: {
          blue_team_gold: number | null
          blue_team_kills: number | null
          data_source: string | null
          game_events: Json | null
          game_time_seconds: number
          id: string
          objectives_state: Json | null
          participants_state: Json | null
          red_team_gold: number | null
          red_team_kills: number | null
          scrim_game_id: string
          timestamp: string
        }
        Insert: {
          blue_team_gold?: number | null
          blue_team_kills?: number | null
          data_source?: string | null
          game_events?: Json | null
          game_time_seconds: number
          id?: string
          objectives_state?: Json | null
          participants_state?: Json | null
          red_team_gold?: number | null
          red_team_kills?: number | null
          scrim_game_id: string
          timestamp?: string
        }
        Update: {
          blue_team_gold?: number | null
          blue_team_kills?: number | null
          data_source?: string | null
          game_events?: Json | null
          game_time_seconds?: number
          id?: string
          objectives_state?: Json | null
          participants_state?: Json | null
          red_team_gold?: number | null
          red_team_kills?: number | null
          scrim_game_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_game_data_scrim_game_id_fkey"
            columns: ["scrim_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_list_signups: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      matchup_matrix_data: {
        Row: {
          created_at: string
          created_by: string
          id: string
          last_matchup: string | null
          matchup_context: string | null
          notes: string | null
          opponent_performance: Json | null
          opponent_player_id: string
          our_performance: Json | null
          our_player_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          last_matchup?: string | null
          matchup_context?: string | null
          notes?: string | null
          opponent_performance?: Json | null
          opponent_player_id: string
          our_performance?: Json | null
          our_player_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          last_matchup?: string | null
          matchup_context?: string | null
          notes?: string | null
          opponent_performance?: Json | null
          opponent_player_id?: string
          our_performance?: Json | null
          our_player_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matchup_matrix_data_opponent_player_id_fkey"
            columns: ["opponent_player_id"]
            isOneToOne: false
            referencedRelation: "opponent_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matchup_matrix_data_our_player_id_fkey"
            columns: ["our_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          attempts: number
          available_at: string
          channel: string
          created_at: string
          dedupe_key: string
          delivered_at: string | null
          id: string
          last_error: string | null
          locked_at: string | null
          notification_id: string | null
          payload: Json
          recipient_email: string | null
          recipient_user_id: string | null
          status: string
          template_key: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          channel: string
          created_at?: string
          dedupe_key: string
          delivered_at?: string | null
          id?: string
          last_error?: string | null
          locked_at?: string | null
          notification_id?: string | null
          payload?: Json
          recipient_email?: string | null
          recipient_user_id?: string | null
          status?: string
          template_key: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          channel?: string
          created_at?: string
          dedupe_key?: string
          delivered_at?: string | null
          id?: string
          last_error?: string | null
          locked_at?: string | null
          notification_id?: string | null
          payload?: Json
          recipient_email?: string | null
          recipient_user_id?: string | null
          status?: string
          template_key?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "workspace_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          coaching_enabled: boolean
          email_enabled: boolean
          in_app_enabled: boolean
          integration_enabled: boolean
          reminder_24h: boolean
          reminder_2h: boolean
          schedule_enabled: boolean
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coaching_enabled?: boolean
          email_enabled?: boolean
          in_app_enabled?: boolean
          integration_enabled?: boolean
          reminder_24h?: boolean
          reminder_2h?: boolean
          schedule_enabled?: boolean
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coaching_enabled?: boolean
          email_enabled?: boolean
          in_app_enabled?: boolean
          integration_enabled?: boolean
          reminder_24h?: boolean
          reminder_2h?: boolean
          schedule_enabled?: boolean
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reminders: {
        Row: {
          coaching_action_id: string | null
          created_at: string
          id: string
          reminder_kind: string
          scheduled_for: string
          scrim_id: string | null
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          coaching_action_id?: string | null
          created_at?: string
          id?: string
          reminder_kind: string
          scheduled_for: string
          scrim_id?: string | null
          status?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          coaching_action_id?: string | null
          created_at?: string
          id?: string
          reminder_kind?: string
          scheduled_for?: string
          scrim_id?: string | null
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reminders_coaching_action_id_fkey"
            columns: ["coaching_action_id"]
            isOneToOne: false
            referencedRelation: "coaching_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reminders_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_audit_events: {
        Row: {
          action: string
          created_at: string
          detail: Json
          id: number
          operator_id: string
          target_id: string | null
          target_type: string
          tenant_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json
          id?: never
          operator_id: string
          target_id?: string | null
          target_type: string
          tenant_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json
          id?: never
          operator_id?: string
          target_id?: string | null
          target_type?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      opponent_champion_pools: {
        Row: {
          champion_name: string
          confidence_level: number | null
          created_at: string
          games_played: number | null
          id: string
          last_played: string | null
          notes: string | null
          opponent_player_id: string
          pool_type: string
          updated_at: string
          win_rate: number | null
        }
        Insert: {
          champion_name: string
          confidence_level?: number | null
          created_at?: string
          games_played?: number | null
          id?: string
          last_played?: string | null
          notes?: string | null
          opponent_player_id: string
          pool_type: string
          updated_at?: string
          win_rate?: number | null
        }
        Update: {
          champion_name?: string
          confidence_level?: number | null
          created_at?: string
          games_played?: number | null
          id?: string
          last_played?: string | null
          notes?: string | null
          opponent_player_id?: string
          pool_type?: string
          updated_at?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opponent_champion_pools_opponent_player_id_fkey"
            columns: ["opponent_player_id"]
            isOneToOne: false
            referencedRelation: "opponent_players"
            referencedColumns: ["id"]
          },
        ]
      }
      opponent_drafts: {
        Row: {
          created_at: string
          created_by: string
          draft_data: Json
          game_duration: number | null
          id: string
          match_date: string
          notes: string | null
          opponent_name: string
          opponent_team_id: string
          our_side: string | null
          patch_version: string | null
          result: string | null
          tournament_context: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          draft_data?: Json
          game_duration?: number | null
          id?: string
          match_date: string
          notes?: string | null
          opponent_name: string
          opponent_team_id: string
          our_side?: string | null
          patch_version?: string | null
          result?: string | null
          tournament_context?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          draft_data?: Json
          game_duration?: number | null
          id?: string
          match_date?: string
          notes?: string | null
          opponent_name?: string
          opponent_team_id?: string
          our_side?: string | null
          patch_version?: string | null
          result?: string | null
          tournament_context?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opponent_drafts_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      opponent_external_draft_games: {
        Row: {
          blue_bans: Json
          blue_picks: Json
          blue_team: string
          created_at: string
          fetched_at: string
          id: string
          opponent_team_id: string
          patch: string | null
          played_at: string | null
          provider: string
          provider_game_id: string
          provider_match_id: string | null
          provider_page: string | null
          provider_tournament: string | null
          raw_source: Json
          red_bans: Json
          red_picks: Json
          red_team: string
          source_revision: string | null
          source_url: string
          tenant_id: string
          updated_at: string
          winner_side: string | null
        }
        Insert: {
          blue_bans?: Json
          blue_picks?: Json
          blue_team: string
          created_at?: string
          fetched_at?: string
          id?: string
          opponent_team_id: string
          patch?: string | null
          played_at?: string | null
          provider?: string
          provider_game_id: string
          provider_match_id?: string | null
          provider_page?: string | null
          provider_tournament?: string | null
          raw_source?: Json
          red_bans?: Json
          red_picks?: Json
          red_team: string
          source_revision?: string | null
          source_url: string
          tenant_id: string
          updated_at?: string
          winner_side?: string | null
        }
        Update: {
          blue_bans?: Json
          blue_picks?: Json
          blue_team?: string
          created_at?: string
          fetched_at?: string
          id?: string
          opponent_team_id?: string
          patch?: string | null
          played_at?: string | null
          provider?: string
          provider_game_id?: string
          provider_match_id?: string | null
          provider_page?: string | null
          provider_tournament?: string | null
          raw_source?: Json
          red_bans?: Json
          red_picks?: Json
          red_team?: string
          source_revision?: string | null
          source_url?: string
          tenant_id?: string
          updated_at?: string
          winner_side?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opponent_external_draft_games_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opponent_external_drafts_team_tenant_fkey"
            columns: ["opponent_team_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      opponent_performance_trends: {
        Row: {
          created_at: string
          id: string
          metric_type: string
          metric_value: number
          opponent_team_id: string
          recorded_at: string
          sample_size: number | null
          time_period: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_type: string
          metric_value: number
          opponent_team_id: string
          recorded_at?: string
          sample_size?: number | null
          time_period: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_type?: string
          metric_value?: number
          opponent_team_id?: string
          recorded_at?: string
          sample_size?: number | null
          time_period?: string
        }
        Relationships: [
          {
            foreignKeyName: "opponent_performance_trends_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      opponent_players: {
        Row: {
          created_at: string
          external_links: Json | null
          id: string
          is_active: boolean | null
          notes: string | null
          opponent_team_id: string
          region: string | null
          riot_id: string | null
          role: string | null
          summoner_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_links?: Json | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          opponent_team_id: string
          region?: string | null
          riot_id?: string | null
          role?: string | null
          summoner_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_links?: Json | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          opponent_team_id?: string
          region?: string | null
          riot_id?: string | null
          role?: string | null
          summoner_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opponent_players_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      opponent_playstyle_tags: {
        Row: {
          confidence_level: number | null
          created_at: string
          created_by: string
          id: string
          notes: string | null
          opponent_player_id: string | null
          opponent_team_id: string | null
          tag_name: string
          tag_type: string
          updated_at: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          opponent_player_id?: string | null
          opponent_team_id?: string | null
          tag_name: string
          tag_type: string
          updated_at?: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          opponent_player_id?: string | null
          opponent_team_id?: string | null
          tag_name?: string
          tag_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      opponent_soloq_daily_snapshots: {
        Row: {
          captured_at: string
          division: string
          id: string
          league_points: number
          losses: number
          opponent_player_id: string
          opponent_team_id: string
          queue_type: string
          snapshot_date: string
          tenant_id: string
          tier: string
          wins: number
        }
        Insert: {
          captured_at?: string
          division: string
          id?: string
          league_points: number
          losses: number
          opponent_player_id: string
          opponent_team_id: string
          queue_type?: string
          snapshot_date?: string
          tenant_id: string
          tier: string
          wins: number
        }
        Update: {
          captured_at?: string
          division?: string
          id?: string
          league_points?: number
          losses?: number
          opponent_player_id?: string
          opponent_team_id?: string
          queue_type?: string
          snapshot_date?: string
          tenant_id?: string
          tier?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "opponent_soloq_daily_snapshot_opponent_player_id_opponent__fkey"
            columns: ["opponent_player_id", "opponent_team_id"]
            isOneToOne: false
            referencedRelation: "opponent_players"
            referencedColumns: ["id", "opponent_team_id"]
          },
          {
            foreignKeyName: "opponent_soloq_daily_snapshots_opponent_team_id_tenant_id_fkey"
            columns: ["opponent_team_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      opponent_soloq_recent_matches: {
        Row: {
          assists: number
          champion_id: number
          champion_name: string
          cs: number
          damage_to_champions: number | null
          deaths: number
          game_duration_seconds: number
          game_version: string | null
          gold_earned: number | null
          id: string
          kills: number
          match_id: string
          opponent_player_id: string
          opponent_team_id: string
          played_at: string
          queue_id: number
          synced_at: string
          team_position: string | null
          tenant_id: string
          vision_score: number | null
          win: boolean
        }
        Insert: {
          assists: number
          champion_id: number
          champion_name: string
          cs: number
          damage_to_champions?: number | null
          deaths: number
          game_duration_seconds: number
          game_version?: string | null
          gold_earned?: number | null
          id?: string
          kills: number
          match_id: string
          opponent_player_id: string
          opponent_team_id: string
          played_at: string
          queue_id: number
          synced_at?: string
          team_position?: string | null
          tenant_id: string
          vision_score?: number | null
          win: boolean
        }
        Update: {
          assists?: number
          champion_id?: number
          champion_name?: string
          cs?: number
          damage_to_champions?: number | null
          deaths?: number
          game_duration_seconds?: number
          game_version?: string | null
          gold_earned?: number | null
          id?: string
          kills?: number
          match_id?: string
          opponent_player_id?: string
          opponent_team_id?: string
          played_at?: string
          queue_id?: number
          synced_at?: string
          team_position?: string | null
          tenant_id?: string
          vision_score?: number | null
          win?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "opponent_soloq_recent_matches_opponent_player_id_opponent__fkey"
            columns: ["opponent_player_id", "opponent_team_id"]
            isOneToOne: false
            referencedRelation: "opponent_players"
            referencedColumns: ["id", "opponent_team_id"]
          },
          {
            foreignKeyName: "opponent_soloq_recent_matches_opponent_team_id_tenant_id_fkey"
            columns: ["opponent_team_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      opponent_soloq_sync_state: {
        Row: {
          error_code: string | null
          error_message: string | null
          last_attempt_at: string | null
          last_success_at: string | null
          next_allowed_at: string | null
          opponent_player_id: string
          opponent_team_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          error_code?: string | null
          error_message?: string | null
          last_attempt_at?: string | null
          last_success_at?: string | null
          next_allowed_at?: string | null
          opponent_player_id: string
          opponent_team_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          error_code?: string | null
          error_message?: string | null
          last_attempt_at?: string | null
          last_success_at?: string | null
          next_allowed_at?: string | null
          opponent_player_id?: string
          opponent_team_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opponent_soloq_sync_state_opponent_player_id_opponent_team_fkey"
            columns: ["opponent_player_id", "opponent_team_id"]
            isOneToOne: false
            referencedRelation: "opponent_players"
            referencedColumns: ["id", "opponent_team_id"]
          },
          {
            foreignKeyName: "opponent_soloq_sync_state_opponent_team_id_tenant_id_fkey"
            columns: ["opponent_team_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      opponent_teams: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          description: string | null
          fandom_links: Json | null
          id: string
          leaguepedia_last_synced_at: string | null
          leaguepedia_name: string | null
          leaguepedia_sync_error: string | null
          leaguepedia_sync_locked_until: string | null
          logo_url: string | null
          name: string
          region: string | null
          social_links: Json | null
          strategic_notes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          fandom_links?: Json | null
          id?: string
          leaguepedia_last_synced_at?: string | null
          leaguepedia_name?: string | null
          leaguepedia_sync_error?: string | null
          leaguepedia_sync_locked_until?: string | null
          logo_url?: string | null
          name: string
          region?: string | null
          social_links?: Json | null
          strategic_notes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          fandom_links?: Json | null
          id?: string
          leaguepedia_last_synced_at?: string | null
          leaguepedia_name?: string | null
          leaguepedia_sync_error?: string | null
          leaguepedia_sync_locked_until?: string | null
          logo_url?: string | null
          name?: string
          region?: string | null
          social_links?: Json | null
          strategic_notes?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pilot_onboarding_items: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          id: string
          item_key: string
          label: string
          note: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          item_key: string
          label: string
          note?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          id?: string
          item_key?: string
          label?: string
          note?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_onboarding_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_operators: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string | null
          is_active: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          is_active?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      player_availability: {
        Row: {
          created_at: string
          created_by: string
          end_time: string
          id: string
          is_available: boolean
          notes: string | null
          player_id: string
          recurrence_rule: string | null
          start_time: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_time: string
          id?: string
          is_available?: boolean
          notes?: string | null
          player_id: string
          recurrence_rule?: string | null
          start_time: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_time?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          player_id?: string
          recurrence_rule?: string | null
          start_time?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_availability_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_availability_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      player_rank_history: {
        Row: {
          created_at: string
          id: string
          league_points: number
          losses: number
          player_id: string
          queue_type: string
          rank_division: string
          recorded_at: string
          summoner_id: string | null
          tenant_id: string
          tier: string
          wins: number
        }
        Insert: {
          created_at?: string
          id?: string
          league_points?: number
          losses?: number
          player_id: string
          queue_type?: string
          rank_division: string
          recorded_at?: string
          summoner_id?: string | null
          tenant_id: string
          tier: string
          wins?: number
        }
        Update: {
          created_at?: string
          id?: string
          league_points?: number
          losses?: number
          player_id?: string
          queue_type?: string
          rank_division?: string
          recorded_at?: string
          summoner_id?: string | null
          tenant_id?: string
          tier?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_rank_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_rank_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      player_soloq_matches: {
        Row: {
          champion_id: number
          champion_name: string
          created_at: string
          game_creation: string
          game_duration: number
          game_mode: string
          game_type: string
          id: string
          lane: string | null
          match_id: string
          player_id: string
          puuid: string
          queue_id: number
          role: string | null
          tenant_id: string
          updated_at: string
          win: boolean
        }
        Insert: {
          champion_id: number
          champion_name: string
          created_at?: string
          game_creation: string
          game_duration: number
          game_mode: string
          game_type: string
          id?: string
          lane?: string | null
          match_id: string
          player_id: string
          puuid: string
          queue_id: number
          role?: string | null
          tenant_id: string
          updated_at?: string
          win: boolean
        }
        Update: {
          champion_id?: number
          champion_name?: string
          created_at?: string
          game_creation?: string
          game_duration?: number
          game_mode?: string
          game_type?: string
          id?: string
          lane?: string | null
          match_id?: string
          player_id?: string
          puuid?: string
          queue_id?: number
          role?: string | null
          tenant_id?: string
          updated_at?: string
          win?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "player_soloq_matches_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_soloq_matches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      player_soloq_stats: {
        Row: {
          assists: number
          champion_level: number
          created_at: string
          deaths: number
          first_blood_kill: boolean | null
          first_tower_kill: boolean | null
          gold_earned: number
          id: string
          items: Json | null
          kills: number
          match_id: string
          neutral_minions_killed: number
          runes: Json | null
          summoner_spells: Json | null
          team_objectives: Json | null
          total_damage_dealt: number
          total_damage_dealt_to_champions: number
          total_damage_taken: number
          total_heal: number
          total_minions_killed: number
          updated_at: string
          vision_score: number
        }
        Insert: {
          assists?: number
          champion_level?: number
          created_at?: string
          deaths?: number
          first_blood_kill?: boolean | null
          first_tower_kill?: boolean | null
          gold_earned?: number
          id?: string
          items?: Json | null
          kills?: number
          match_id: string
          neutral_minions_killed?: number
          runes?: Json | null
          summoner_spells?: Json | null
          team_objectives?: Json | null
          total_damage_dealt?: number
          total_damage_dealt_to_champions?: number
          total_damage_taken?: number
          total_heal?: number
          total_minions_killed?: number
          updated_at?: string
          vision_score?: number
        }
        Update: {
          assists?: number
          champion_level?: number
          created_at?: string
          deaths?: number
          first_blood_kill?: boolean | null
          first_tower_kill?: boolean | null
          gold_earned?: number
          id?: string
          items?: Json | null
          kills?: number
          match_id?: string
          neutral_minions_killed?: number
          runes?: Json | null
          summoner_spells?: Json | null
          team_objectives?: Json | null
          total_damage_dealt?: number
          total_damage_dealt_to_champions?: number
          total_damage_taken?: number
          total_heal?: number
          total_minions_killed?: number
          updated_at?: string
          vision_score?: number
        }
        Relationships: []
      }
      players: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          created_by: string
          discord_username: string | null
          id: string
          is_active: boolean | null
          join_date: string | null
          last_soloq_sync: string | null
          linked_user_id: string | null
          lp: number | null
          main_champions: Json | null
          membership_state: string
          notes: string | null
          puuid: string | null
          rank: string | null
          region: string | null
          riot_id: string | null
          riot_tag_line: string | null
          role: string | null
          summoner_id: string | null
          summoner_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by: string
          discord_username?: string | null
          id?: string
          is_active?: boolean | null
          join_date?: string | null
          last_soloq_sync?: string | null
          linked_user_id?: string | null
          lp?: number | null
          main_champions?: Json | null
          membership_state?: string
          notes?: string | null
          puuid?: string | null
          rank?: string | null
          region?: string | null
          riot_id?: string | null
          riot_tag_line?: string | null
          role?: string | null
          summoner_id?: string | null
          summoner_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          discord_username?: string | null
          id?: string
          is_active?: boolean | null
          join_date?: string | null
          last_soloq_sync?: string | null
          linked_user_id?: string | null
          lp?: number | null
          main_champions?: Json | null
          membership_state?: string
          notes?: string | null
          puuid?: string | null
          rank?: string | null
          region?: string | null
          riot_id?: string | null
          riot_tag_line?: string | null
          role?: string | null
          summoner_id?: string | null
          summoner_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      preparation_brief_evidence: {
        Row: {
          brief_id: string
          created_at: string
          evidence_id: string
          tenant_id: string
        }
        Insert: {
          brief_id: string
          created_at?: string
          evidence_id: string
          tenant_id: string
        }
        Update: {
          brief_id?: string
          created_at?: string
          evidence_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preparation_brief_evidence_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "preparation_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preparation_brief_evidence_brief_tenant_fkey"
            columns: ["brief_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "preparation_briefs"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "preparation_brief_evidence_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "scouting_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preparation_brief_evidence_evidence_tenant_fkey"
            columns: ["evidence_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "scouting_evidence"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "preparation_brief_evidence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      preparation_brief_external_drafts: {
        Row: {
          brief_id: string
          created_at: string
          display_order: number
          external_draft_game_id: string
          tenant_id: string
        }
        Insert: {
          brief_id: string
          created_at?: string
          display_order?: number
          external_draft_game_id: string
          tenant_id: string
        }
        Update: {
          brief_id?: string
          created_at?: string
          display_order?: number
          external_draft_game_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preparation_brief_external_drafts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preparation_external_drafts_brief_tenant_fkey"
            columns: ["brief_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "preparation_briefs"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "preparation_external_drafts_game_tenant_fkey"
            columns: ["external_draft_game_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "opponent_external_draft_games"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      preparation_briefs: {
        Row: {
          archived_at: string | null
          archived_from_status: string | null
          created_at: string
          created_by: string
          draft_format: string
          executive_summary: string
          id: string
          opponent_team_id: string
          parent_brief_id: string | null
          patch_label: string | null
          preferred_side: string
          priorities: Json
          published_at: string | null
          published_by: string | null
          revision: number
          scheduled_for: string | null
          scrim_id: string | null
          series_game_number: number
          snapshot: Json | null
          source_playbook_id: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_from_status?: string | null
          created_at?: string
          created_by: string
          draft_format?: string
          executive_summary?: string
          id?: string
          opponent_team_id: string
          parent_brief_id?: string | null
          patch_label?: string | null
          preferred_side?: string
          priorities?: Json
          published_at?: string | null
          published_by?: string | null
          revision?: number
          scheduled_for?: string | null
          scrim_id?: string | null
          series_game_number?: number
          snapshot?: Json | null
          source_playbook_id?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_from_status?: string | null
          created_at?: string
          created_by?: string
          draft_format?: string
          executive_summary?: string
          id?: string
          opponent_team_id?: string
          parent_brief_id?: string | null
          patch_label?: string | null
          preferred_side?: string
          priorities?: Json
          published_at?: string | null
          published_by?: string | null
          revision?: number
          scheduled_for?: string | null
          scrim_id?: string | null
          series_game_number?: number
          snapshot?: Json | null
          source_playbook_id?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preparation_briefs_opponent_tenant_fkey"
            columns: ["opponent_team_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "preparation_briefs_parent_brief_id_fkey"
            columns: ["parent_brief_id"]
            isOneToOne: false
            referencedRelation: "preparation_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preparation_briefs_parent_tenant_fkey"
            columns: ["parent_brief_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "preparation_briefs"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "preparation_briefs_scrim_tenant_fkey"
            columns: ["scrim_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "preparation_briefs_source_playbook_tenant_fkey"
            columns: ["source_playbook_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "draft_playbooks"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "preparation_briefs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scouting_evidence: {
        Row: {
          confidence: number
          created_at: string
          created_by: string
          evidence_type: string
          game_time_seconds: number | null
          id: string
          lifecycle_state: string
          observation: string
          observed_at: string
          opponent_team_id: string
          sample_context: string | null
          scrim_game_id: string | null
          scrim_id: string | null
          source_kind: string
          superseded_at: string | null
          superseded_by: string | null
          superseded_by_evidence_id: string | null
          superseded_reason: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          created_by: string
          evidence_type: string
          game_time_seconds?: number | null
          id?: string
          lifecycle_state?: string
          observation: string
          observed_at?: string
          opponent_team_id: string
          sample_context?: string | null
          scrim_game_id?: string | null
          scrim_id?: string | null
          source_kind: string
          superseded_at?: string | null
          superseded_by?: string | null
          superseded_by_evidence_id?: string | null
          superseded_reason?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          created_by?: string
          evidence_type?: string
          game_time_seconds?: number | null
          id?: string
          lifecycle_state?: string
          observation?: string
          observed_at?: string
          opponent_team_id?: string
          sample_context?: string | null
          scrim_game_id?: string | null
          scrim_id?: string | null
          source_kind?: string
          superseded_at?: string | null
          superseded_by?: string | null
          superseded_by_evidence_id?: string | null
          superseded_reason?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scouting_evidence_game_fkey"
            columns: ["scrim_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouting_evidence_opponent_tenant_fkey"
            columns: ["opponent_team_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "scouting_evidence_scrim_fkey"
            columns: ["scrim_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "scouting_evidence_superseded_by_tenant_fkey"
            columns: ["superseded_by_evidence_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "scouting_evidence"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "scouting_evidence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scouting_tendencies: {
        Row: {
          category: string
          confidence: number
          created_at: string
          created_by: string
          id: string
          opponent_team_id: string
          status: string
          summary: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          confidence?: number
          created_at?: string
          created_by: string
          id?: string
          opponent_team_id: string
          status?: string
          summary: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          confidence?: number
          created_at?: string
          created_by?: string
          id?: string
          opponent_team_id?: string
          status?: string
          summary?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scouting_tendencies_opponent_tenant_fkey"
            columns: ["opponent_team_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "scouting_tendencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scouting_tendency_evidence: {
        Row: {
          created_at: string
          evidence_id: string
          tenant_id: string
          tendency_id: string
        }
        Insert: {
          created_at?: string
          evidence_id: string
          tenant_id: string
          tendency_id: string
        }
        Update: {
          created_at?: string
          evidence_id?: string
          tenant_id?: string
          tendency_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scouting_tendency_evidence_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "scouting_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouting_tendency_evidence_evidence_tenant_fkey"
            columns: ["evidence_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "scouting_evidence"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "scouting_tendency_evidence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouting_tendency_evidence_tendency_id_fkey"
            columns: ["tendency_id"]
            isOneToOne: false
            referencedRelation: "scouting_tendencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scouting_tendency_evidence_tendency_tenant_fkey"
            columns: ["tendency_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "scouting_tendencies"
            referencedColumns: ["id", "tenant_id"]
          },
        ]
      }
      scouting_timeline_events: {
        Row: {
          created_at: string
          created_by: string
          event_description: string | null
          event_title: string
          event_type: string | null
          frequency: string | null
          game_time_minutes: number | null
          id: string
          opponent_team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_description?: string | null
          event_title: string
          event_type?: string | null
          frequency?: string | null
          game_time_minutes?: number | null
          id?: string
          opponent_team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_description?: string | null
          event_title?: string
          event_type?: string | null
          frequency?: string | null
          game_time_minutes?: number | null
          id?: string
          opponent_team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scouting_timeline_events_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_game_events: {
        Row: {
          actor_name: string | null
          created_at: string
          event_id: string
          event_type: string
          id: string
          map_object: string | null
          objective_type: string | null
          occurred_seconds: number | null
          scrim_game_id: string
          sequence: number
          team: string
          tenant_id: string
          victim_name: string | null
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          map_object?: string | null
          objective_type?: string | null
          occurred_seconds?: number | null
          scrim_game_id: string
          sequence?: number
          team?: string
          tenant_id: string
          victim_name?: string | null
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          map_object?: string | null
          objective_type?: string | null
          occurred_seconds?: number | null
          scrim_game_id?: string
          sequence?: number
          team?: string
          tenant_id?: string
          victim_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scrim_game_events_scrim_game_id_fkey"
            columns: ["scrim_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_game_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_game_evidence: {
        Row: {
          capabilities: string[]
          captured_at: string
          created_at: string
          id: string
          metadata: Json
          payload_version: string
          provider: string
          provider_record_id: string | null
          scrim_game_id: string
          tenant_id: string
        }
        Insert: {
          capabilities?: string[]
          captured_at: string
          created_at?: string
          id?: string
          metadata?: Json
          payload_version?: string
          provider: string
          provider_record_id?: string | null
          scrim_game_id: string
          tenant_id: string
        }
        Update: {
          capabilities?: string[]
          captured_at?: string
          created_at?: string
          id?: string
          metadata?: Json
          payload_version?: string
          provider?: string
          provider_record_id?: string | null
          scrim_game_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_game_evidence_scrim_game_id_fkey"
            columns: ["scrim_game_id"]
            isOneToOne: true
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_game_evidence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_game_reconciliations: {
        Row: {
          accepted_game_id: string | null
          created_at: string
          first_game_id: string
          id: string
          match_reasons: string[]
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          second_game_id: string
          status: string
          tenant_id: string
        }
        Insert: {
          accepted_game_id?: string | null
          created_at?: string
          first_game_id: string
          id?: string
          match_reasons?: string[]
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          second_game_id: string
          status?: string
          tenant_id: string
        }
        Update: {
          accepted_game_id?: string | null
          created_at?: string
          first_game_id?: string
          id?: string
          match_reasons?: string[]
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          second_game_id?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_game_reconciliations_accepted_game_id_fkey"
            columns: ["accepted_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_game_reconciliations_first_game_id_fkey"
            columns: ["first_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_game_reconciliations_second_game_id_fkey"
            columns: ["second_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_game_reconciliations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_games: {
        Row: {
          auto_created: boolean | null
          bans: Json | null
          coaching_notes: string | null
          created_at: string
          desktop_session_id: string | null
          draft_mode: Database["public"]["Enums"]["draft_mode"] | null
          draft_url: string | null
          duration_seconds: number | null
          early_game_rating: number | null
          enemy_team_gold: number | null
          enemy_team_kills: number | null
          external_game_data: Json | null
          external_game_id: string | null
          game_end_time: string | null
          game_classification: string | null
          game_number: number
          game_start_time: string | null
          grid_series_number: number | null
          id: string
          late_game_rating: number | null
          match_history_url: string | null
          mid_game_rating: number | null
          notes: string | null
          objectives: Json | null
          our_team_gold: number | null
          our_team_kills: number | null
          performance_rating: number | null
          performance_summary: string | null
          replay_url: string | null
          quality_flags: string[]
          result: string | null
          roster_coverage: number
          scrim_id: string
          side: string | null
          status: string
          updated_at: string
        }
        Insert: {
          auto_created?: boolean | null
          bans?: Json | null
          coaching_notes?: string | null
          created_at?: string
          desktop_session_id?: string | null
          draft_mode?: Database["public"]["Enums"]["draft_mode"] | null
          draft_url?: string | null
          duration_seconds?: number | null
          early_game_rating?: number | null
          enemy_team_gold?: number | null
          enemy_team_kills?: number | null
          external_game_data?: Json | null
          external_game_id?: string | null
          game_end_time?: string | null
          game_classification?: string | null
          game_number: number
          game_start_time?: string | null
          grid_series_number?: number | null
          id?: string
          late_game_rating?: number | null
          match_history_url?: string | null
          mid_game_rating?: number | null
          notes?: string | null
          objectives?: Json | null
          our_team_gold?: number | null
          our_team_kills?: number | null
          performance_rating?: number | null
          performance_summary?: string | null
          replay_url?: string | null
          quality_flags?: string[]
          result?: string | null
          roster_coverage?: number
          scrim_id: string
          side?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          auto_created?: boolean | null
          bans?: Json | null
          coaching_notes?: string | null
          created_at?: string
          desktop_session_id?: string | null
          draft_mode?: Database["public"]["Enums"]["draft_mode"] | null
          draft_url?: string | null
          duration_seconds?: number | null
          early_game_rating?: number | null
          enemy_team_gold?: number | null
          enemy_team_kills?: number | null
          external_game_data?: Json | null
          external_game_id?: string | null
          game_end_time?: string | null
          game_classification?: string | null
          game_number?: number
          game_start_time?: string | null
          grid_series_number?: number | null
          id?: string
          late_game_rating?: number | null
          match_history_url?: string | null
          mid_game_rating?: number | null
          notes?: string | null
          objectives?: Json | null
          our_team_gold?: number | null
          our_team_kills?: number | null
          performance_rating?: number | null
          performance_summary?: string | null
          replay_url?: string | null
          quality_flags?: string[]
          result?: string | null
          roster_coverage?: number
          scrim_id?: string
          side?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_games_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_monitoring_sessions: {
        Row: {
          created_at: string
          data_source: string
          desktop_session_id: string | null
          expected_end_at: string | null
          external_match_id: string | null
          id: string
          last_activity_at: string | null
          scrim_id: string
          session_status: string
          started_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_source?: string
          desktop_session_id?: string | null
          expected_end_at?: string | null
          external_match_id?: string | null
          id?: string
          last_activity_at?: string | null
          scrim_id: string
          session_status?: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_source?: string
          desktop_session_id?: string | null
          expected_end_at?: string | null
          external_match_id?: string | null
          id?: string
          last_activity_at?: string | null
          scrim_id?: string
          session_status?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrim_monitoring_sessions_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
        ]
      }
      scrim_participants: {
        Row: {
          advanced_stats: Json
          assists: number | null
          champion_name: string | null
          created_at: string
          cs: number | null
          damage_dealt: number | null
          damage_taken: number | null
          deaths: number | null
          gold: number | null
          id: string
          identity_source: string | null
          identity_status: string
          is_bot: boolean
          is_our_team: boolean
          items: Json | null
          kills: number | null
          level: number | null
          player_id: string | null
          region: string | null
          riot_id: string | null
          riot_tag_line: string | null
          role: string | null
          runes: Json | null
          scrim_game_id: string
          summoner_name: string
          summoner_spells: Json | null
          tenant_id: string
          updated_at: string
          vision_score: number | null
        }
        Insert: {
          advanced_stats?: Json
          assists?: number | null
          champion_name?: string | null
          created_at?: string
          cs?: number | null
          damage_dealt?: number | null
          damage_taken?: number | null
          deaths?: number | null
          gold?: number | null
          id?: string
          identity_source?: string | null
          identity_status?: string
          is_bot?: boolean
          is_our_team?: boolean
          items?: Json | null
          kills?: number | null
          level?: number | null
          player_id?: string | null
          region?: string | null
          riot_id?: string | null
          riot_tag_line?: string | null
          role?: string | null
          runes?: Json | null
          scrim_game_id: string
          summoner_name: string
          summoner_spells?: Json | null
          tenant_id: string
          updated_at?: string
          vision_score?: number | null
        }
        Update: {
          advanced_stats?: Json
          assists?: number | null
          champion_name?: string | null
          created_at?: string
          cs?: number | null
          damage_dealt?: number | null
          damage_taken?: number | null
          deaths?: number | null
          gold?: number | null
          id?: string
          identity_source?: string | null
          identity_status?: string
          is_bot?: boolean
          is_our_team?: boolean
          items?: Json | null
          kills?: number | null
          level?: number | null
          player_id?: string | null
          region?: string | null
          riot_id?: string | null
          riot_tag_line?: string | null
          role?: string | null
          runes?: Json | null
          scrim_game_id?: string
          summoner_name?: string
          summoner_spells?: Json | null
          tenant_id?: string
          updated_at?: string
          vision_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scrim_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_participants_player_tenant_fkey"
            columns: ["player_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "scrim_participants_scrim_game_id_fkey"
            columns: ["scrim_game_id"]
            isOneToOne: false
            referencedRelation: "scrim_games"
            referencedColumns: ["id"]
          },
        ]
      }
      scrims: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          auto_monitoring_enabled: boolean | null
          created_at: string
          created_by: string
          data_source: string | null
          duration_minutes: number | null
          ends_at: string | null
          external_match_data: Json | null
          format: string | null
          games: Json | null
          grid_match_id: string | null
          id: string
          match_date: string
          monitoring_end_time: string | null
          monitoring_start_time: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          our_score: number | null
          replay_file_url: string | null
          result: string | null
          result_override_reason: string | null
          result_source: string
          review_completed_at: string | null
          review_completed_by: string | null
          review_status: string
          scheduled_time: string | null
          starts_at: string
          status: string | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          vod_links: Json | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          auto_monitoring_enabled?: boolean | null
          created_at?: string
          created_by: string
          data_source?: string | null
          duration_minutes?: number | null
          ends_at?: string | null
          external_match_data?: Json | null
          format?: string | null
          games?: Json | null
          grid_match_id?: string | null
          id?: string
          match_date: string
          monitoring_end_time?: string | null
          monitoring_start_time?: string | null
          notes?: string | null
          opponent_name: string
          opponent_score?: number | null
          opponent_team_id?: string | null
          our_score?: number | null
          replay_file_url?: string | null
          result?: string | null
          result_override_reason?: string | null
          result_source?: string
          review_completed_at?: string | null
          review_completed_by?: string | null
          review_status?: string
          scheduled_time?: string | null
          starts_at: string
          status?: string | null
          tenant_id: string
          timezone?: string | null
          updated_at?: string
          vod_links?: Json | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          auto_monitoring_enabled?: boolean | null
          created_at?: string
          created_by?: string
          data_source?: string | null
          duration_minutes?: number | null
          ends_at?: string | null
          external_match_data?: Json | null
          format?: string | null
          games?: Json | null
          grid_match_id?: string | null
          id?: string
          match_date?: string
          monitoring_end_time?: string | null
          monitoring_start_time?: string | null
          notes?: string | null
          opponent_name?: string
          opponent_score?: number | null
          opponent_team_id?: string | null
          our_score?: number | null
          replay_file_url?: string | null
          result?: string | null
          result_override_reason?: string | null
          result_source?: string
          review_completed_at?: string | null
          review_completed_by?: string | null
          review_status?: string
          scheduled_time?: string | null
          starts_at?: string
          status?: string | null
          tenant_id?: string
          timezone?: string | null
          updated_at?: string
          vod_links?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "scrims_opponent_team_tenant_fkey"
            columns: ["opponent_team_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "scrims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      soloq_daily_snapshots: {
        Row: {
          captured_at: string
          division: string
          id: string
          league_points: number
          losses: number
          player_id: string
          queue_type: string
          snapshot_date: string
          source: string
          tenant_id: string
          tier: string
          wins: number
        }
        Insert: {
          captured_at?: string
          division: string
          id?: string
          league_points: number
          losses: number
          player_id: string
          queue_type?: string
          snapshot_date?: string
          source?: string
          tenant_id: string
          tier: string
          wins: number
        }
        Update: {
          captured_at?: string
          division?: string
          id?: string
          league_points?: number
          losses?: number
          player_id?: string
          queue_type?: string
          snapshot_date?: string
          source?: string
          tenant_id?: string
          tier?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "soloq_daily_snapshots_player_tenant_fkey"
            columns: ["player_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "soloq_daily_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      soloq_recent_matches: {
        Row: {
          assists: number
          champion_id: number
          champion_name: string
          cs: number
          damage_to_champions: number
          deaths: number
          game_duration_seconds: number
          game_version: string | null
          gold_earned: number
          id: string
          items: Json
          kills: number
          match_context: Json
          match_id: string
          played_at: string
          player_id: string
          queue_id: number
          source: string
          synced_at: string
          team_position: string | null
          tenant_id: string
          vision_score: number
          win: boolean
        }
        Insert: {
          assists: number
          champion_id: number
          champion_name: string
          cs: number
          damage_to_champions: number
          deaths: number
          game_duration_seconds: number
          game_version?: string | null
          gold_earned: number
          id?: string
          items?: Json
          kills: number
          match_context?: Json
          match_id: string
          played_at: string
          player_id: string
          queue_id: number
          source?: string
          synced_at?: string
          team_position?: string | null
          tenant_id: string
          vision_score: number
          win: boolean
        }
        Update: {
          assists?: number
          champion_id?: number
          champion_name?: string
          cs?: number
          damage_to_champions?: number
          deaths?: number
          game_duration_seconds?: number
          game_version?: string | null
          gold_earned?: number
          id?: string
          items?: Json
          kills?: number
          match_context?: Json
          match_id?: string
          played_at?: string
          player_id?: string
          queue_id?: number
          source?: string
          synced_at?: string
          team_position?: string | null
          tenant_id?: string
          vision_score?: number
          win?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "soloq_recent_matches_player_tenant_fkey"
            columns: ["player_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "soloq_recent_matches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      soloq_sync_jobs: {
        Row: {
          attempts: number
          available_at: string
          completed_at: string | null
          created_at: string
          id: string
          last_error_code: string | null
          last_error_message: string | null
          locked_at: string | null
          locked_by: string | null
          player_id: string
          priority: number
          run_id: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          locked_at?: string | null
          locked_by?: string | null
          player_id: string
          priority?: number
          run_id: string
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          locked_at?: string | null
          locked_by?: string | null
          player_id?: string
          priority?: number
          run_id?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soloq_sync_jobs_player_tenant_fkey"
            columns: ["player_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "soloq_sync_jobs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "soloq_sync_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soloq_sync_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      soloq_sync_runs: {
        Row: {
          completed_at: string | null
          completed_jobs: number
          created_at: string
          error_message: string | null
          failed_jobs: number
          id: string
          local_date: string | null
          requested_by: string | null
          run_kind: string
          scheduled_at: string
          skipped_jobs: number
          started_at: string | null
          status: string
          succeeded_jobs: number
          tenant_id: string
          timezone: string
          total_jobs: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_jobs?: number
          created_at?: string
          error_message?: string | null
          failed_jobs?: number
          id?: string
          local_date?: string | null
          requested_by?: string | null
          run_kind?: string
          scheduled_at?: string
          skipped_jobs?: number
          started_at?: string | null
          status?: string
          succeeded_jobs?: number
          tenant_id: string
          timezone?: string
          total_jobs?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_jobs?: number
          created_at?: string
          error_message?: string | null
          failed_jobs?: number
          id?: string
          local_date?: string | null
          requested_by?: string | null
          run_kind?: string
          scheduled_at?: string
          skipped_jobs?: number
          started_at?: string | null
          status?: string
          succeeded_jobs?: number
          tenant_id?: string
          timezone?: string
          total_jobs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soloq_sync_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      soloq_sync_state: {
        Row: {
          error_code: string | null
          error_message: string | null
          last_attempt_at: string | null
          last_success_at: string | null
          next_allowed_at: string | null
          player_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          error_code?: string | null
          error_message?: string | null
          last_attempt_at?: string | null
          last_success_at?: string | null
          next_allowed_at?: string | null
          player_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          error_code?: string | null
          error_message?: string | null
          last_attempt_at?: string | null
          last_success_at?: string | null
          next_allowed_at?: string | null
          player_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soloq_sync_state_player_tenant_fkey"
            columns: ["player_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "soloq_sync_state_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_annotations: {
        Row: {
          annotation_type: string
          confidence_level: number | null
          created_at: string
          created_by: string
          description: string | null
          game_phase: string | null
          id: string
          map_coordinates: Json | null
          opponent_team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          annotation_type: string
          confidence_level?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          game_phase?: string | null
          id?: string
          map_coordinates?: Json | null
          opponent_team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          annotation_type?: string
          confidence_level?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          game_phase?: string | null
          id?: string
          map_coordinates?: Json | null
          opponent_team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_annotations_opponent_team_id_fkey"
            columns: ["opponent_team_id"]
            isOneToOne: false
            referencedRelation: "opponent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          trial_end_date: string | null
          trial_expired: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          trial_expired?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          trial_end_date?: string | null
          trial_expired?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_limits: {
        Row: {
          can_export: boolean
          can_use_api: boolean
          max_players_per_team: number
          max_scrims_per_month: number
          max_storage_mb: number
          max_teams: number
          priority_support: boolean
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          can_export?: boolean
          can_use_api?: boolean
          max_players_per_team: number
          max_scrims_per_month: number
          max_storage_mb: number
          max_teams: number
          priority_support?: boolean
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          can_export?: boolean
          can_use_api?: boolean
          max_players_per_team?: number
          max_scrims_per_month?: number
          max_storage_mb?: number
          max_teams?: number
          priority_support?: boolean
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      support_cases: {
        Row: {
          assigned_operator_id: string | null
          created_at: string
          description: string
          id: string
          opened_by: string | null
          priority: string
          resolution: string | null
          resolved_at: string | null
          status: string
          subject: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_operator_id?: string | null
          created_at?: string
          description: string
          id?: string
          opened_by?: string | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_operator_id?: string | null
          created_at?: string
          description?: string
          id?: string
          opened_by?: string | null
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_cases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          delivery_error: string | null
          delivery_status: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          last_sent_at: string | null
          player_id: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          delivery_error?: string | null
          delivery_status?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          last_sent_at?: string | null
          player_id?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          delivery_error?: string | null
          delivery_status?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          last_sent_at?: string | null
          player_id?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_player_tenant_fkey"
            columns: ["player_id", "tenant_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id", "tenant_id"]
          },
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_capture_settings: {
        Row: {
          profile: string
          selected_at: string
          selected_by: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          profile?: string
          selected_at?: string
          selected_by?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          profile?: string
          selected_at?: string
          selected_by?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_capture_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_feature_access: {
        Row: {
          is_enabled: boolean
          module_key: string
          release_state: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          is_enabled?: boolean
          module_key: string
          release_state: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          is_enabled?: boolean
          module_key?: string
          release_state?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_feature_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_riot_integrations: {
        Row: {
          created_at: string
          created_by: string | null
          key_hint: string
          key_kind: string
          last_error_code: string | null
          last_error_message: string | null
          last_success_at: string | null
          last_tested_at: string | null
          secret_id: string
          status: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          key_hint: string
          key_kind?: string
          last_error_code?: string | null
          last_error_message?: string | null
          last_success_at?: string | null
          last_tested_at?: string | null
          secret_id: string
          status?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          key_hint?: string
          key_kind?: string
          last_error_code?: string | null
          last_error_message?: string | null
          last_success_at?: string | null
          last_tested_at?: string | null
          secret_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_riot_integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          custom_domain: string | null
          deployment_status: string | null
          github_repo_url: string | null
          grid_api_key: string | null
          grid_integration_enabled: boolean | null
          grid_team_id: string | null
          id: string
          name: string
          netlify_deploy_url: string | null
          netlify_site_id: string | null
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          vercel_deploy_url: string | null
          vercel_project_id: string | null
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          deployment_status?: string | null
          github_repo_url?: string | null
          grid_api_key?: string | null
          grid_integration_enabled?: boolean | null
          grid_team_id?: string | null
          id?: string
          name: string
          netlify_deploy_url?: string | null
          netlify_site_id?: string | null
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          vercel_deploy_url?: string | null
          vercel_project_id?: string | null
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          deployment_status?: string | null
          github_repo_url?: string | null
          grid_api_key?: string | null
          grid_integration_enabled?: boolean | null
          grid_team_id?: string | null
          id?: string
          name?: string
          netlify_deploy_url?: string | null
          netlify_site_id?: string | null
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          vercel_deploy_url?: string | null
          vercel_project_id?: string | null
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          id: string
          push_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          id?: string
          push_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          dedupe_key: string
          expires_at: string | null
          href: string | null
          id: string
          read_at: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          dedupe_key: string
          expires_at?: string | null
          href?: string | null
          id?: string
          read_at?: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          dedupe_key?: string
          expires_at?: string | null
          href?: string | null
          id?: string
          read_at?: string | null
          tenant_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      archive_scrim_block: {
        Args: { p_restore?: boolean; p_scrim_id: string }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          auto_monitoring_enabled: boolean | null
          created_at: string
          created_by: string
          data_source: string | null
          duration_minutes: number | null
          ends_at: string | null
          external_match_data: Json | null
          format: string | null
          games: Json | null
          grid_match_id: string | null
          id: string
          match_date: string
          monitoring_end_time: string | null
          monitoring_start_time: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          our_score: number | null
          replay_file_url: string | null
          result: string | null
          result_override_reason: string | null
          result_source: string
          review_completed_at: string | null
          review_completed_by: string | null
          review_status: string
          scheduled_time: string | null
          starts_at: string
          status: string | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          vod_links: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "scrims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_trial_expired: { Args: { user_email: string }; Returns: boolean }
      claim_integration_events: {
        Args: { p_limit?: number }
        Returns: {
          aggregate_id: string | null
          aggregate_type: string
          attempt_count: number
          available_at: string
          claimed_at: string | null
          created_at: string
          dedupe_key: string
          delivered_at: string | null
          event_type: string
          id: string
          last_error: string | null
          payload: Json
          status: string
          tenant_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "integration_events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_leaguepedia_draft_sync: {
        Args: { p_cooldown_minutes?: number; p_opponent_team_id: string }
        Returns: Json
      }
      claim_opponent_soloq_sync: {
        Args: { p_opponent_player_id: string }
        Returns: boolean
      }
      claim_soloq_sync: {
        Args: { p_cooldown?: string; p_player_id: string }
        Returns: boolean
      }
      claim_soloq_sync_jobs: {
        Args: { p_limit?: number; p_worker_id: string }
        Returns: {
          attempts: number
          available_at: string
          completed_at: string | null
          created_at: string
          id: string
          last_error_code: string | null
          last_error_message: string | null
          locked_at: string | null
          locked_by: string | null
          player_id: string
          priority: number
          run_id: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "soloq_sync_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      clone_draft_scenarios: {
        Args: {
          p_preferred_side?: string
          p_source_brief_id?: string
          p_source_playbook_id?: string
          p_target_brief_id?: string
          p_target_playbook_id?: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      configure_discord_channel: {
        Args: {
          p_channel_id: string
          p_channel_name: string
          p_event_types: string[]
          p_tenant_id: string
        }
        Returns: undefined
      }
      configure_soloq_cron: {
        Args: { p_project_url: string; p_publishable_key: string }
        Returns: undefined
      }
      coordinate_soloq_daily_runs: { Args: never; Returns: number }
      create_coaching_action: {
        Args: {
          p_assignee_player_id: string
          p_assignee_user_id: string
          p_description: string
          p_due_at: string
          p_feedback_id?: string
          p_follow_up_scrim_id?: string
          p_priority: string
          p_scrim_game_id?: string
          p_scrim_id?: string
          p_tenant_id: string
          p_title: string
        }
        Returns: {
          acknowledged_at: string | null
          archived_at: string | null
          assignee_player_id: string | null
          assignee_user_id: string | null
          completed_at: string | null
          completed_by: string | null
          completion_evidence: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          feedback_id: string | null
          follow_up_scrim_id: string | null
          id: string
          owner_user_id: string
          priority: string
          ready_for_review_at: string | null
          scrim_game_id: string | null
          scrim_id: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "coaching_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_coaching_action_cycle: {
        Args: { p_payload: Json }
        Returns: Database["public"]["Tables"]["coaching_actions"]["Row"]
      }
      check_in_coaching_action: {
        Args: { p_action_id: string; p_check_in: string; p_note?: string }
        Returns: Database["public"]["Tables"]["coaching_actions"]["Row"]
      }
      create_draft_match_plan: {
        Args: {
          p_opponent_team_id: string
          p_patch_label?: string
          p_preferred_side?: string
          p_scheduled_for?: string
          p_scrim_id?: string
          p_series_game_number?: number
          p_source_playbook_id?: string
          p_tenant_id: string
          p_title: string
        }
        Returns: string
      }
      create_draft_playbook: {
        Args: {
          p_composition_identity?: string
          p_description?: string
          p_patch_label?: string
          p_preferred_side?: string
          p_tenant_id: string
          p_title: string
        }
        Returns: string
      }
      create_draft_scenario: {
        Args: {
          p_branch_sequence?: number
          p_brief_id?: string
          p_name?: string
          p_parent_scenario_id?: string
          p_playbook_id?: string
          p_rationale?: string
          p_side?: string
          p_tenant_id: string
        }
        Returns: string
      }
      create_preparation_brief: {
        Args: {
          p_evidence_ids?: string[]
          p_opponent_team_id: string
          p_scheduled_for?: string
          p_summary?: string
          p_tenant_id: string
          p_title: string
        }
        Returns: string
      }
      create_preparation_brief_revision: {
        Args: { p_brief_id: string }
        Returns: string
      }
      create_roster_invitation: {
        Args: {
          p_email: string
          p_player_id: string
          p_role?: Database["public"]["Enums"]["tenant_role"]
          p_tenant_id: string
        }
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      create_scouting_tendency: {
        Args: {
          p_category: string
          p_confidence: number
          p_evidence_ids?: string[]
          p_opponent_team_id: string
          p_summary: string
          p_tenant_id: string
          p_title: string
        }
        Returns: string
      }
      create_scrim_block: {
        Args: {
          p_duration_minutes?: number
          p_format?: string
          p_local_date: string
          p_local_time: string
          p_notes?: string
          p_opponent_name: string
          p_opponent_team_id?: string
          p_tenant_id: string
          p_timezone: string
        }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          auto_monitoring_enabled: boolean | null
          created_at: string
          created_by: string
          data_source: string | null
          duration_minutes: number | null
          ends_at: string | null
          external_match_data: Json | null
          format: string | null
          games: Json | null
          grid_match_id: string | null
          id: string
          match_date: string
          monitoring_end_time: string | null
          monitoring_start_time: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          our_score: number | null
          replay_file_url: string | null
          result: string | null
          result_override_reason: string | null
          result_source: string
          review_completed_at: string | null
          review_completed_by: string | null
          review_status: string
          scheduled_time: string | null
          starts_at: string
          status: string | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          vod_links: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "scrims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_team_invitation: {
        Args: {
          p_email: string
          p_role?: Database["public"]["Enums"]["tenant_role"]
          p_tenant_id: string
        }
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      create_self_service_workspace: {
        Args: { p_name: string; p_timezone?: string }
        Returns: Json
      }
      create_tenant_with_owner: {
        Args: {
          _name: string
          _slug: string
          _subscription_tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Returns: Json
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string }
        Returns: string
      }
      delete_workspace_calendar_event: {
        Args: { p_event_id: string; p_tenant_id: string }
        Returns: undefined
      }
      disconnect_discord_installation: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      draft_sequence_slot: {
        Args: { p_our_side: string; p_sequence: number }
        Returns: Json
      }
      encrypt_sensitive_data: { Args: { data: string }; Returns: string }
      finalize_scrim_block_review: {
        Args: {
          p_opponent_score: number
          p_our_score: number
          p_override_reason: string
          p_result_source: string
          p_scrim_id: string
        }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          auto_monitoring_enabled: boolean | null
          created_at: string
          created_by: string
          data_source: string | null
          duration_minutes: number | null
          ends_at: string | null
          external_match_data: Json | null
          format: string | null
          games: Json | null
          grid_match_id: string | null
          id: string
          match_date: string
          monitoring_end_time: string | null
          monitoring_start_time: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          our_score: number | null
          replay_file_url: string | null
          result: string | null
          result_override_reason: string | null
          result_source: string
          review_completed_at: string | null
          review_completed_by: string | null
          review_status: string
          scheduled_time: string | null
          starts_at: string
          status: string | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          vod_links: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "scrims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finish_leaguepedia_draft_sync: {
        Args: { p_error?: string; p_opponent_team_id: string }
        Returns: undefined
      }
      generate_invitation_token: { Args: never; Returns: string }
      get_all_subscribers_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string
          subscribed: boolean
          subscription_end: string
          subscription_tier: string
          trial_end_date: string
          trial_expired: boolean
          updated_at: string
          user_id: string
        }[]
      }
      get_all_tenant_users_for_admin: {
        Args: never
        Returns: {
          tenant_count: number
          user_id: string
        }[]
      }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          email: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
        }[]
      }
      get_competitive_draft_analytics: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_format?: string
          p_opponent_id?: string
          p_side?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_current_user_email: { Args: never; Returns: string }
      get_draft_workspace: { Args: { p_tenant_id: string }; Returns: Json }
      get_external_draft_tool_decrypted: {
        Args: { p_tenant_id: string; p_tool_id: string }
        Returns: {
          api_endpoint: string
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          last_sync: string
          tenant_id: string
          tool_name: string
          tool_type: string
          updated_at: string
          webhook_url: string
        }[]
      }
      get_public_player_count: { Args: never; Returns: number }
      get_public_scrim_count: { Args: never; Returns: number }
      get_public_tenant_count: { Args: never; Returns: number }
      get_team_analytics_dataset: {
        Args: { p_date_from?: string; p_date_to?: string; p_tenant_id: string }
        Returns: Json
      }
      get_team_performance_summary: {
        Args: { p_date_from?: string; p_date_to?: string; p_tenant_id: string }
        Returns: Json
      }
      get_team_performance_summary_filtered: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_format?: string
          p_opponent_id?: string
          p_side?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      get_tenant_riot_api_key: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_user_tenant_id: { Args: never; Returns: string }
      handle_subscription_cancellation: {
        Args: { user_email: string }
        Returns: undefined
      }
      insert_external_draft_tool: {
        Args: {
          p_api_endpoint?: string
          p_api_key?: string
          p_is_active?: boolean
          p_tenant_id: string
          p_tool_name: string
          p_tool_type: string
          p_webhook_url?: string
        }
        Returns: string
      }
      publish_preparation_brief: { Args: { p_brief_id: string }; Returns: Json }
      reconcile_scrim_participant: {
        Args: {
          p_ignore?: boolean
          p_participant_id: string
          p_player_id: string
        }
        Returns: {
          assists: number | null
          champion_name: string | null
          created_at: string
          cs: number | null
          damage_dealt: number | null
          damage_taken: number | null
          deaths: number | null
          gold: number | null
          id: string
          identity_source: string | null
          identity_status: string
          is_our_team: boolean
          items: Json | null
          kills: number | null
          level: number | null
          player_id: string | null
          region: string | null
          riot_id: string | null
          riot_tag_line: string | null
          role: string | null
          runes: Json | null
          scrim_game_id: string
          summoner_name: string
          summoner_spells: Json | null
          tenant_id: string
          updated_at: string
          vision_score: number | null
        }
        SetofOptions: {
          from: "*"
          to: "scrim_participants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      refresh_soloq_run_progress: {
        Args: { p_run_id: string }
        Returns: undefined
      }
      remove_tenant_riot_api_key: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      reopen_scrim_block_review: {
        Args: { p_scrim_id: string }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          auto_monitoring_enabled: boolean | null
          created_at: string
          created_by: string
          data_source: string | null
          duration_minutes: number | null
          ends_at: string | null
          external_match_data: Json | null
          format: string | null
          games: Json | null
          grid_match_id: string | null
          id: string
          match_date: string
          monitoring_end_time: string | null
          monitoring_start_time: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          our_score: number | null
          replay_file_url: string | null
          result: string | null
          result_override_reason: string | null
          result_source: string
          review_completed_at: string | null
          review_completed_by: string | null
          review_status: string
          scheduled_time: string | null
          starts_at: string
          status: string | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          vod_links: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "scrims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_game_reconciliation: {
        Args: {
          p_accepted_game_id?: string
          p_action: string
          p_notes?: string
          p_reconciliation_id: string
        }
        Returns: {
          accepted_game_id: string | null
          created_at: string
          first_game_id: string
          id: string
          match_reasons: string[]
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          second_game_id: string
          status: string
          tenant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "scrim_game_reconciliations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_workspace_local_time: {
        Args: { p_local_date: string; p_local_time: string; p_timezone: string }
        Returns: string
      }
      revise_draft_item: {
        Args: { p_id: string; p_kind: string }
        Returns: string
      }
      save_draft_sequence_action: {
        Args: {
          p_assigned_role?: string
          p_champion_name: string
          p_rationale?: string
          p_scenario_id: string
          p_sequence: number
          p_tenant_id: string
        }
        Returns: string
      }
      save_scrim_game_review: {
        Args: {
          p_duration_seconds: number
          p_early_game_rating: number
          p_enemy_team_gold: number
          p_enemy_team_kills: number
          p_game_id: string
          p_game_number: number
          p_late_game_rating: number
          p_mid_game_rating: number
          p_notes: string
          p_our_team_gold: number
          p_our_team_kills: number
          p_performance_rating: number
          p_performance_summary: string
          p_result: string
          p_scrim_id: string
          p_side: string
          p_status: string
        }
        Returns: {
          auto_created: boolean | null
          bans: Json | null
          coaching_notes: string | null
          created_at: string
          desktop_session_id: string | null
          draft_mode: Database["public"]["Enums"]["draft_mode"] | null
          draft_url: string | null
          duration_seconds: number | null
          early_game_rating: number | null
          enemy_team_gold: number | null
          enemy_team_kills: number | null
          external_game_data: Json | null
          external_game_id: string | null
          game_end_time: string | null
          game_number: number
          game_start_time: string | null
          grid_series_number: number | null
          id: string
          late_game_rating: number | null
          match_history_url: string | null
          mid_game_rating: number | null
          notes: string | null
          objectives: Json | null
          our_team_gold: number | null
          our_team_kills: number | null
          performance_rating: number | null
          performance_summary: string | null
          replay_url: string | null
          result: string | null
          scrim_id: string
          side: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "scrim_games"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      schedule_scrim_block: {
        Args: {
          p_duration_minutes?: number
          p_format?: string
          p_notes?: string
          p_opponent_name: string
          p_opponent_team_id?: string
          p_starts_at: string
          p_tenant_id: string
          p_timezone: string
        }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          auto_monitoring_enabled: boolean | null
          created_at: string
          created_by: string
          data_source: string | null
          duration_minutes: number | null
          ends_at: string | null
          external_match_data: Json | null
          format: string | null
          games: Json | null
          grid_match_id: string | null
          id: string
          match_date: string
          monitoring_end_time: string | null
          monitoring_start_time: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          our_score: number | null
          replay_file_url: string | null
          result: string | null
          result_override_reason: string | null
          result_source: string
          review_completed_at: string | null
          review_completed_by: string | null
          review_status: string
          scheduled_time: string | null
          starts_at: string
          status: string | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          vod_links: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "scrims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_draft_item_status: {
        Args: { p_id: string; p_kind: string; p_status: string }
        Returns: string
      }
      set_draft_plan_restrictions: {
        Args: { p_brief_id: string; p_champions: string[] }
        Returns: undefined
      }
      set_preparation_brief_evidence: {
        Args: { p_brief_id: string; p_evidence_ids: string[] }
        Returns: undefined
      }
      set_preparation_brief_external_drafts: {
        Args: { p_brief_id: string; p_external_draft_ids: string[] }
        Returns: undefined
      }
      set_roster_player_state: {
        Args: { p_active: boolean; p_player_id: string }
        Returns: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          created_by: string
          discord_username: string | null
          id: string
          is_active: boolean | null
          join_date: string | null
          last_soloq_sync: string | null
          linked_user_id: string | null
          lp: number | null
          main_champions: Json | null
          membership_state: string
          notes: string | null
          puuid: string | null
          rank: string | null
          region: string | null
          riot_id: string | null
          riot_tag_line: string | null
          role: string | null
          summoner_id: string | null
          summoner_name: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_scrim_block_state: {
        Args: { p_action: string; p_scrim_id: string }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          auto_monitoring_enabled: boolean | null
          created_at: string
          created_by: string
          data_source: string | null
          duration_minutes: number | null
          ends_at: string | null
          external_match_data: Json | null
          format: string | null
          games: Json | null
          grid_match_id: string | null
          id: string
          match_date: string
          monitoring_end_time: string | null
          monitoring_start_time: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          our_score: number | null
          replay_file_url: string | null
          result: string | null
          result_override_reason: string | null
          result_source: string
          review_completed_at: string | null
          review_completed_by: string | null
          review_status: string
          scheduled_time: string | null
          starts_at: string
          status: string | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          vod_links: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "scrims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_workspace_capture_profile: {
        Args: { p_profile: string; p_tenant_id: string }
        Returns: {
          profile: string
          selected_at: string
          selected_by: string | null
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tenant_capture_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      store_tenant_riot_api_key: {
        Args: {
          p_actor_id: string
          p_api_key: string
          p_key_kind: string
          p_tenant_id: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          key_hint: string
          key_kind: string
          last_error_code: string | null
          last_error_message: string | null
          last_success_at: string | null
          last_tested_at: string | null
          secret_id: string
          status: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tenant_riot_integrations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      supersede_scouting_evidence: {
        Args: {
          p_confidence: number
          p_evidence_id: string
          p_evidence_type: string
          p_observation: string
          p_reason?: string
          p_sample_context?: string
          p_tenant_id: string
          p_title: string
        }
        Returns: string
      }
      transition_coaching_action: {
        Args: { p_action_id: string; p_next_status: string; p_note?: string }
        Returns: {
          acknowledged_at: string | null
          archived_at: string | null
          assignee_player_id: string | null
          assignee_user_id: string | null
          completed_at: string | null
          completed_by: string | null
          completion_evidence: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          feedback_id: string | null
          follow_up_scrim_id: string | null
          id: string
          owner_user_id: string
          priority: string
          ready_for_review_at: string | null
          scrim_game_id: string | null
          scrim_id: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "coaching_actions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_coaching_action: {
        Args: {
          p_action_id: string
          p_outcome: string
          p_observation: string
          p_evidence?: string
          p_next_action?: string
        }
        Returns: Database["public"]["Tables"]["coaching_actions"]["Row"]
      }
      save_coaching_action_template: {
        Args: { p_payload: Json }
        Returns: Database["public"]["Tables"]["coaching_action_templates"]["Row"]
      }
      update_draft_item_details: {
        Args: { p_id: string; p_kind: string; p_payload: Json }
        Returns: string
      }
      update_roster_player: {
        Args: {
          p_discord_username?: string
          p_main_champions: Json
          p_notes?: string
          p_player_id: string
          p_region: string
          p_riot_id: string
          p_riot_tag_line: string
          p_role: string
          p_summoner_name: string
        }
        Returns: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          created_by: string
          discord_username: string | null
          id: string
          is_active: boolean | null
          join_date: string | null
          last_soloq_sync: string | null
          linked_user_id: string | null
          lp: number | null
          main_champions: Json | null
          membership_state: string
          notes: string | null
          puuid: string | null
          rank: string | null
          region: string | null
          riot_id: string | null
          riot_tag_line: string | null
          role: string | null
          summoner_id: string | null
          summoner_name: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "players"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_scrim_block_schedule: {
        Args: {
          p_duration_minutes?: number
          p_local_date: string
          p_local_time: string
          p_scrim_id: string
          p_status?: string
          p_timezone: string
        }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          auto_monitoring_enabled: boolean | null
          created_at: string
          created_by: string
          data_source: string | null
          duration_minutes: number | null
          ends_at: string | null
          external_match_data: Json | null
          format: string | null
          games: Json | null
          grid_match_id: string | null
          id: string
          match_date: string
          monitoring_end_time: string | null
          monitoring_start_time: string | null
          notes: string | null
          opponent_name: string
          opponent_score: number | null
          opponent_team_id: string | null
          our_score: number | null
          replay_file_url: string | null
          result: string | null
          result_override_reason: string | null
          result_source: string
          review_completed_at: string | null
          review_completed_by: string | null
          review_status: string
          scheduled_time: string | null
          starts_at: string
          status: string | null
          tenant_id: string
          timezone: string | null
          updated_at: string
          vod_links: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "scrims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_draft_champion_pool: {
        Args: {
          p_champion_name: string
          p_comfort_level?: number
          p_player_id: string
          p_priority?: number
          p_role: Database["public"]["Enums"]["champion_role"]
          p_tenant_id: string
        }
        Returns: string
      }
      upsert_workspace_calendar_event: {
        Args: {
          p_description?: string
          p_duration_minutes?: number
          p_event_id: string
          p_event_type: Database["public"]["Enums"]["event_type"]
          p_local_date: string
          p_local_time: string
          p_location?: string
          p_tenant_id: string
          p_timezone: string
          p_title: string
        }
        Returns: {
          attendees: Json | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: string | null
          scrim_id: string | null
          start_time: string
          tenant_id: string
          timezone: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "calendar_events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_belongs_to_tenant: {
        Args: { tenant_uuid: string }
        Returns: boolean
      }
      user_has_tenant_role:
        | {
            Args: {
              required_role: Database["public"]["Enums"]["tenant_role"]
              tenant_uuid: string
            }
            Returns: boolean
          }
        | {
            Args: {
              required_roles: Database["public"]["Enums"]["tenant_role"][]
              tenant_uuid: string
            }
            Returns: boolean
          }
      user_is_tenant_admin: { Args: { tenant_uuid: string }; Returns: boolean }
      verify_soloq_worker_secret: {
        Args: { p_secret: string }
        Returns: boolean
      }
    }
    Enums: {
      champion_role: "top" | "jungle" | "mid" | "adc" | "support"
      draft_action_type: "pick" | "ban"
      draft_mode: "client" | "external" | "manual" | "grid"
      draft_team_side: "blue" | "red"
      event_type:
        | "scrim"
        | "official"
        | "team_practice"
        | "team_meeting"
        | "other"
      subscription_tier: "free" | "pro" | "enterprise" | "elite"
      tenant_role: "owner" | "admin" | "member" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      champion_role: ["top", "jungle", "mid", "adc", "support"],
      draft_action_type: ["pick", "ban"],
      draft_mode: ["client", "external", "manual", "grid"],
      draft_team_side: ["blue", "red"],
      event_type: [
        "scrim",
        "official",
        "team_practice",
        "team_meeting",
        "other",
      ],
      subscription_tier: ["free", "pro", "enterprise", "elite"],
      tenant_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
