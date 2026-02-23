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
          created_at: string
          created_by: string
          description: string | null
          fandom_links: Json | null
          id: string
          logo_url: string | null
          name: string
          region: string | null
          social_links: Json | null
          strategic_notes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          fandom_links?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          region?: string | null
          social_links?: Json | null
          strategic_notes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          fandom_links?: Json | null
          id?: string
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
      players: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          discord_username: string | null
          id: string
          is_active: boolean | null
          join_date: string | null
          last_soloq_sync: string | null
          lp: number | null
          main_champions: Json | null
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
          avatar_url?: string | null
          created_at?: string
          created_by: string
          discord_username?: string | null
          id?: string
          is_active?: boolean | null
          join_date?: string | null
          last_soloq_sync?: string | null
          lp?: number | null
          main_champions?: Json | null
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
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          discord_username?: string | null
          id?: string
          is_active?: boolean | null
          join_date?: string | null
          last_soloq_sync?: string | null
          lp?: number | null
          main_champions?: Json | null
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
          notes: string | null
          objectives: Json | null
          our_team_gold: number | null
          our_team_kills: number | null
          replay_url: string | null
          result: string | null
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
          notes?: string | null
          objectives?: Json | null
          our_team_gold?: number | null
          our_team_kills?: number | null
          replay_url?: string | null
          result?: string | null
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
          notes?: string | null
          objectives?: Json | null
          our_team_gold?: number | null
          our_team_kills?: number | null
          replay_url?: string | null
          result?: string | null
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
          assists: number | null
          champion_name: string | null
          created_at: string
          cs: number | null
          damage_dealt: number | null
          damage_taken: number | null
          deaths: number | null
          gold: number | null
          id: string
          is_our_team: boolean
          items: Json | null
          kills: number | null
          level: number | null
          player_id: string | null
          role: string | null
          runes: Json | null
          scrim_game_id: string
          summoner_name: string
          summoner_spells: Json | null
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
          is_our_team?: boolean
          items?: Json | null
          kills?: number | null
          level?: number | null
          player_id?: string | null
          role?: string | null
          runes?: Json | null
          scrim_game_id: string
          summoner_name: string
          summoner_spells?: Json | null
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
          is_our_team?: boolean
          items?: Json | null
          kills?: number | null
          level?: number | null
          player_id?: string | null
          role?: string | null
          runes?: Json | null
          scrim_game_id?: string
          summoner_name?: string
          summoner_spells?: Json | null
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
          our_score: number | null
          replay_file_url: string | null
          result: string | null
          scheduled_time: string | null
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
          our_score?: number | null
          replay_file_url?: string | null
          result?: string | null
          scheduled_time?: string | null
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
          our_score?: number | null
          replay_file_url?: string | null
          result?: string | null
          scheduled_time?: string | null
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
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      user_belongs_to_tenant: {
        Args: { tenant_uuid: string }
        Returns: boolean
      }
      user_has_tenant_role: {
        Args: {
          required_role: Database["public"]["Enums"]["tenant_role"]
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
