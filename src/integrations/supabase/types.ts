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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      draft_scenarios: {
        Row: {
          brief_id: string
          contingency_notes: string
          created_at: string
          created_by: string
          id: string
          name: string
          parent_scenario_id: string | null
          rationale: string
          side: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          brief_id: string
          contingency_notes?: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          parent_scenario_id?: string | null
          rationale?: string
          side: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          brief_id?: string
          contingency_notes?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          parent_scenario_id?: string | null
          rationale?: string
          side?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
      integration_events: {
        Row: {
          aggregate_id: string | null
          aggregate_type: string
          attempt_count: number
          available_at: string
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      preparation_briefs: {
        Row: {
          created_at: string
          created_by: string
          executive_summary: string
          id: string
          opponent_team_id: string
          parent_brief_id: string | null
          patch_label: string | null
          priorities: Json
          published_at: string | null
          revision: number
          scheduled_for: string | null
          scrim_id: string | null
          snapshot: Json | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          executive_summary?: string
          id?: string
          opponent_team_id: string
          parent_brief_id?: string | null
          patch_label?: string | null
          priorities?: Json
          published_at?: string | null
          revision?: number
          scheduled_for?: string | null
          scrim_id?: string | null
          snapshot?: Json | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          executive_summary?: string
          id?: string
          opponent_team_id?: string
          parent_brief_id?: string | null
          patch_label?: string | null
          priorities?: Json
          published_at?: string | null
          revision?: number
          scheduled_for?: string | null
          scrim_id?: string | null
          snapshot?: Json | null
          status?: string
          tenant_id?: string
          title?: string
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
        Relationships: []
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
        Relationships: []
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
      opponent_soloq_sync_state: {
        Row: {
          opponent_player_id: string
          opponent_team_id: string
          tenant_id: string
          status: string
          last_attempt_at: string | null
          last_success_at: string | null
          next_allowed_at: string | null
          error_code: string | null
          error_message: string | null
          updated_at: string
        }
        Insert: {
          opponent_player_id: string
          opponent_team_id: string
          tenant_id: string
          status?: string
          last_attempt_at?: string | null
          last_success_at?: string | null
          next_allowed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          updated_at?: string
        }
        Update: {
          opponent_player_id?: string
          opponent_team_id?: string
          tenant_id?: string
          status?: string
          last_attempt_at?: string | null
          last_success_at?: string | null
          next_allowed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      opponent_soloq_daily_snapshots: {
        Row: {
          id: string
          opponent_player_id: string
          opponent_team_id: string
          tenant_id: string
          snapshot_date: string
          queue_type: string
          tier: string
          division: string
          league_points: number
          wins: number
          losses: number
          captured_at: string
        }
        Insert: {
          id?: string
          opponent_player_id: string
          opponent_team_id: string
          tenant_id: string
          snapshot_date?: string
          queue_type?: string
          tier: string
          division: string
          league_points: number
          wins: number
          losses: number
          captured_at?: string
        }
        Update: {
          id?: string
          opponent_player_id?: string
          opponent_team_id?: string
          tenant_id?: string
          snapshot_date?: string
          queue_type?: string
          tier?: string
          division?: string
          league_points?: number
          wins?: number
          losses?: number
          captured_at?: string
        }
        Relationships: []
      }
      opponent_soloq_recent_matches: {
        Row: {
          id: string
          opponent_player_id: string
          opponent_team_id: string
          tenant_id: string
          match_id: string
          played_at: string
          game_duration_seconds: number
          queue_id: number
          game_version: string | null
          champion_id: number
          champion_name: string
          team_position: string | null
          win: boolean
          kills: number
          deaths: number
          assists: number
          cs: number
          gold_earned: number | null
          damage_to_champions: number | null
          vision_score: number | null
          synced_at: string
        }
        Insert: {
          id?: string
          opponent_player_id: string
          opponent_team_id: string
          tenant_id: string
          match_id: string
          played_at: string
          game_duration_seconds: number
          queue_id: number
          game_version?: string | null
          champion_id: number
          champion_name: string
          team_position?: string | null
          win: boolean
          kills: number
          deaths: number
          assists: number
          cs: number
          gold_earned?: number | null
          damage_to_champions?: number | null
          vision_score?: number | null
          synced_at?: string
        }
        Update: {
          id?: string
          opponent_player_id?: string
          opponent_team_id?: string
          tenant_id?: string
          match_id?: string
          played_at?: string
          game_duration_seconds?: number
          queue_id?: number
          game_version?: string | null
          champion_id?: number
          champion_name?: string
          team_position?: string | null
          win?: boolean
          kills?: number
          deaths?: number
          assists?: number
          cs?: number
          gold_earned?: number | null
          damage_to_champions?: number | null
          vision_score?: number | null
          synced_at?: string
        }
        Relationships: []
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
      soloq_sync_runs: {
        Row: {
          id: string
          tenant_id: string
          run_kind: string
          local_date: string | null
          timezone: string
          status: string
          total_jobs: number
          completed_jobs: number
          succeeded_jobs: number
          skipped_jobs: number
          failed_jobs: number
          requested_by: string | null
          scheduled_at: string
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          run_kind?: string
          local_date?: string | null
          timezone?: string
          status?: string
          total_jobs?: number
          completed_jobs?: number
          succeeded_jobs?: number
          skipped_jobs?: number
          failed_jobs?: number
          requested_by?: string | null
          scheduled_at?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          run_kind?: string
          local_date?: string | null
          timezone?: string
          status?: string
          total_jobs?: number
          completed_jobs?: number
          succeeded_jobs?: number
          skipped_jobs?: number
          failed_jobs?: number
          requested_by?: string | null
          scheduled_at?: string
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      soloq_sync_jobs: {
        Row: {
          id: string
          run_id: string
          tenant_id: string
          player_id: string
          status: string
          priority: number
          attempts: number
          available_at: string
          locked_at: string | null
          locked_by: string | null
          last_error_code: string | null
          last_error_message: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          run_id: string
          tenant_id: string
          player_id: string
          status?: string
          priority?: number
          attempts?: number
          available_at?: string
          locked_at?: string | null
          locked_by?: string | null
          last_error_code?: string | null
          last_error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          run_id?: string
          tenant_id?: string
          player_id?: string
          status?: string
          priority?: number
          attempts?: number
          available_at?: string
          locked_at?: string | null
          locked_by?: string | null
          last_error_code?: string | null
          last_error_message?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      soloq_sync_state: {
        Row: {
          tenant_id: string
          player_id: string
          status: string
          last_attempt_at: string | null
          last_success_at: string | null
          next_allowed_at: string | null
          error_code: string | null
          error_message: string | null
          updated_at: string
        }
        Insert: {
          tenant_id: string
          player_id: string
          status?: string
          last_attempt_at?: string | null
          last_success_at?: string | null
          next_allowed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          player_id?: string
          status?: string
          last_attempt_at?: string | null
          last_success_at?: string | null
          next_allowed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      soloq_daily_snapshots: {
        Row: {
          id: string
          tenant_id: string
          player_id: string
          snapshot_date: string
          queue_type: string
          tier: string
          division: string
          league_points: number
          wins: number
          losses: number
          captured_at: string
          source: string
        }
        Insert: {
          id?: string
          tenant_id: string
          player_id: string
          snapshot_date?: string
          queue_type?: string
          tier: string
          division: string
          league_points: number
          wins: number
          losses: number
          captured_at?: string
          source?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          player_id?: string
          snapshot_date?: string
          queue_type?: string
          tier?: string
          division?: string
          league_points?: number
          wins?: number
          losses?: number
          captured_at?: string
          source?: string
        }
        Relationships: []
      }
      soloq_recent_matches: {
        Row: {
          id: string
          tenant_id: string
          player_id: string
          match_id: string
          played_at: string
          game_duration_seconds: number
          queue_id: number
          game_version: string | null
          champion_id: number
          champion_name: string
          team_position: string | null
          win: boolean
          kills: number
          deaths: number
          assists: number
          cs: number
          gold_earned: number
          damage_to_champions: number
          vision_score: number
          items: Json
          match_context: Json
          synced_at: string
          source: string
        }
        Insert: {
          id?: string
          tenant_id: string
          player_id: string
          match_id: string
          played_at: string
          game_duration_seconds: number
          queue_id: number
          game_version?: string | null
          champion_id: number
          champion_name: string
          team_position?: string | null
          win: boolean
          kills: number
          deaths: number
          assists: number
          cs: number
          gold_earned: number
          damage_to_champions: number
          vision_score: number
          items?: Json
          match_context?: Json
          synced_at?: string
          source?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          player_id?: string
          match_id?: string
          played_at?: string
          game_duration_seconds?: number
          queue_id?: number
          game_version?: string | null
          champion_id?: number
          champion_name?: string
          team_position?: string | null
          win?: boolean
          kills?: number
          deaths?: number
          assists?: number
          cs?: number
          gold_earned?: number
          damage_to_champions?: number
          vision_score?: number
          items?: Json
          match_context?: Json
          synced_at?: string
          source?: string
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
        ]
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
          lp: number | null
          linked_user_id: string | null
          main_champions: Json | null
          membership_state: string
          notes: string | null
          puuid: string | null
          rank: string | null
          region: string | null
          riot_id: string | null
          riot_tag_line: string | null
          role: string | null
          role_assigned_at: string | null
          role_assigned_by: string | null
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
          lp?: number | null
          linked_user_id?: string | null
          main_champions?: Json | null
          membership_state?: string
          notes?: string | null
          puuid?: string | null
          rank?: string | null
          region?: string | null
          riot_id?: string | null
          riot_tag_line?: string | null
          role?: string | null
          role_assigned_at?: string | null
          role_assigned_by?: string | null
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
          lp?: number | null
          linked_user_id?: string | null
          main_champions?: Json | null
          membership_state?: string
          notes?: string | null
          puuid?: string | null
          rank?: string | null
          region?: string | null
          riot_id?: string | null
          riot_tag_line?: string | null
          role?: string | null
          role_assigned_at?: string | null
          role_assigned_by?: string | null
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
          enemy_team_gold: number | null
          enemy_team_kills: number | null
          external_game_data: Json | null
          external_game_id: string | null
          game_end_time: string | null
          game_number: number
          game_start_time: string | null
          grid_series_number: number | null
          id: string
          match_history_url: string | null
          late_game_rating: number | null
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
          early_game_rating: number | null
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
          enemy_team_gold?: number | null
          enemy_team_kills?: number | null
          external_game_data?: Json | null
          external_game_id?: string | null
          game_end_time?: string | null
          game_number: number
          game_start_time?: string | null
          grid_series_number?: number | null
          id?: string
          match_history_url?: string | null
          late_game_rating?: number | null
          mid_game_rating?: number | null
          notes?: string | null
          objectives?: Json | null
          our_team_gold?: number | null
          our_team_kills?: number | null
          performance_rating?: number | null
          performance_summary?: string | null
          replay_url?: string | null
          result?: string | null
          scrim_id: string
          side?: string | null
          status?: string
          early_game_rating?: number | null
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
          enemy_team_gold?: number | null
          enemy_team_kills?: number | null
          external_game_data?: Json | null
          external_game_id?: string | null
          game_end_time?: string | null
          game_number?: number
          game_start_time?: string | null
          grid_series_number?: number | null
          id?: string
          match_history_url?: string | null
          late_game_rating?: number | null
          mid_game_rating?: number | null
          notes?: string | null
          objectives?: Json | null
          our_team_gold?: number | null
          our_team_kills?: number | null
          performance_rating?: number | null
          performance_summary?: string | null
          replay_url?: string | null
          result?: string | null
          scrim_id?: string
          side?: string | null
          status?: string
          early_game_rating?: number | null
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
        Insert: {
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
          opponent_team_id: string | null
          opponent_score: number | null
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
          opponent_team_id?: string | null
          opponent_score?: number | null
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
          opponent_team_id?: string | null
          opponent_score?: number | null
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
            foreignKeyName: "scrims_tenant_id_fkey"
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
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          player_id: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          player_id?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          player_id?: string | null
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
      tenant_riot_integrations: {
        Row: {
          tenant_id: string
          secret_id: string
          key_kind: string
          key_hint: string
          status: string
          last_tested_at: string | null
          last_success_at: string | null
          last_error_code: string | null
          last_error_message: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          secret_id: string
          key_kind?: string
          key_hint: string
          status?: string
          last_tested_at?: string | null
          last_success_at?: string | null
          last_error_code?: string | null
          last_error_message?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          secret_id?: string
          key_kind?: string
          key_hint?: string
          status?: string
          last_tested_at?: string | null
          last_success_at?: string | null
          last_error_code?: string | null
          last_error_message?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
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
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finalize_scrim_block_review: {
        Args: {
          p_opponent_score: number | null
          p_our_score: number | null
          p_override_reason: string | null
          p_result_source: string
          p_scrim_id: string
        }
        Returns: Database["public"]["Tables"]["scrims"]["Row"]
      }
      reopen_scrim_block_review: {
        Args: { p_scrim_id: string }
        Returns: Database["public"]["Tables"]["scrims"]["Row"]
      }
      save_scrim_game_review: {
        Args: {
          p_duration_seconds: number | null
          p_early_game_rating: number | null
          p_enemy_team_gold: number | null
          p_enemy_team_kills: number | null
          p_game_id: string | null
          p_game_number: number
          p_late_game_rating: number | null
          p_mid_game_rating: number | null
          p_notes: string | null
          p_our_team_gold: number | null
          p_our_team_kills: number | null
          p_performance_rating: number | null
          p_performance_summary: string | null
          p_result: string | null
          p_scrim_id: string
          p_side: string | null
          p_status: string
        }
        Returns: Database["public"]["Tables"]["scrim_games"]["Row"]
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
        Returns: Database["public"]["Tables"]["scrims"]["Row"]
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
        Returns: Database["public"]["Tables"]["scrims"]["Row"]
      }
      delete_workspace_calendar_event: {
        Args: { p_event_id: string; p_tenant_id: string }
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
      create_preparation_brief_revision: {
        Args: { p_brief_id: string }
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
      disconnect_discord_installation: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      get_team_performance_summary: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_tenant_id: string
        }
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
      get_team_analytics_dataset: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      set_workspace_capture_profile: {
        Args: {
          p_profile: string
          p_tenant_id: string
        }
        Returns: Database["public"]["Tables"]["tenant_capture_settings"]["Row"]
      }
      resolve_game_reconciliation: {
        Args: {
          p_action: string
          p_accepted_game_id?: string
          p_notes?: string
          p_reconciliation_id: string
        }
        Returns: Database["public"]["Tables"]["scrim_game_reconciliations"]["Row"]
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
      publish_preparation_brief: {
        Args: { p_brief_id: string }
        Returns: Json
      }
      set_preparation_brief_external_drafts: {
        Args: { p_brief_id: string; p_external_draft_ids: string[] }
        Returns: undefined
      }
      set_preparation_brief_evidence: {
        Args: {
          p_brief_id: string
          p_evidence_ids: string[]
        }
        Returns: undefined
      }
      accept_team_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      check_trial_expired: {
        Args: { user_email: string }
        Returns: boolean
      }
      create_tenant_with_owner: {
        Args: {
          _name: string
          _slug: string
          _subscription_tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Returns: Json
      }
      create_team_invitation: {
        Args: {
          p_email: string
          p_role: Database["public"]["Enums"]["tenant_role"]
          p_tenant_id: string
        }
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      create_roster_invitation: {
        Args: {
          p_email: string
          p_player_id: string
          p_role: Database["public"]["Enums"]["tenant_role"]
          p_tenant_id: string
        }
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      decrypt_sensitive_data: {
        Args: { encrypted_data: string }
        Returns: string
      }
      encrypt_sensitive_data: {
        Args: { data: string }
        Returns: string
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_subscribers_for_admin: {
        Args: Record<PropertyKey, never>
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
        Args: Record<PropertyKey, never>
        Returns: {
          tenant_count: number
          user_id: string
        }[]
      }
      get_all_users_for_admin: {
        Args: Record<PropertyKey, never>
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
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
      get_public_player_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_public_scrim_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_public_tenant_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
      reconcile_scrim_participant: {
        Args: {
          p_ignore?: boolean
          p_participant_id: string
          p_player_id?: string
        }
        Returns: Database["public"]["Tables"]["scrim_participants"]["Row"]
      }
      resolve_workspace_local_time: {
        Args: {
          p_local_date: string
          p_local_time: string
          p_timezone: string
        }
        Returns: string
      }
      set_roster_player_state: {
        Args: { p_active: boolean; p_player_id: string }
        Returns: Database["public"]["Tables"]["players"]["Row"]
      }
      set_scrim_block_state: {
        Args: { p_action: string; p_scrim_id: string }
        Returns: Database["public"]["Tables"]["scrims"]["Row"]
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
        Returns: Database["public"]["Tables"]["players"]["Row"]
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
        Returns: Database["public"]["Tables"]["scrims"]["Row"]
      }
      upsert_workspace_calendar_event: {
        Args: {
          p_description?: string
          p_duration_minutes?: number
          p_event_id?: string
          p_event_type: Database["public"]["Enums"]["event_type"]
          p_local_date: string
          p_local_time: string
          p_location?: string
          p_tenant_id: string
          p_timezone: string
          p_title: string
        }
        Returns: Database["public"]["Tables"]["calendar_events"]["Row"]
      }
      user_belongs_to_tenant: {
        Args: { tenant_uuid: string }
        Returns: boolean
      }
      user_has_tenant_role: {
        Args: {
          required_roles: Database["public"]["Enums"]["tenant_role"][]
          tenant_uuid: string
        }
        Returns: boolean
      }
      user_is_tenant_admin: {
        Args: { tenant_uuid: string }
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
