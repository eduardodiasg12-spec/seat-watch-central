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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cinema_chains: {
        Row: {
          base_url: string | null
          created_at: string
          discovery_strategy: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          parser_key: string | null
          slug: string
        }
        Insert: {
          base_url?: string | null
          created_at?: string
          discovery_strategy?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          parser_key?: string | null
          slug: string
        }
        Update: {
          base_url?: string | null
          created_at?: string
          discovery_strategy?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          parser_key?: string | null
          slug?: string
        }
        Relationships: []
      }
      cinemas: {
        Row: {
          address: string | null
          chain_id: string | null
          city: string
          country: string
          created_at: string
          external_cinema_id: string | null
          id: string
          is_active: boolean
          name: string
          state: string | null
        }
        Insert: {
          address?: string | null
          chain_id?: string | null
          city: string
          country?: string
          created_at?: string
          external_cinema_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          state?: string | null
        }
        Update: {
          address?: string | null
          chain_id?: string | null
          city?: string
          country?: string
          created_at?: string
          external_cinema_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cinemas_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "cinema_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_snapshots: {
        Row: {
          cinema_id: string | null
          competitor_confidence_avg: number | null
          competitor_movie_id: string | null
          competitor_occupied_estimated: number | null
          created_at: string
          id: string
          primary_confidence_avg: number | null
          primary_movie_id: string | null
          primary_occupied_estimated: number | null
          screening_date: string
        }
        Insert: {
          cinema_id?: string | null
          competitor_confidence_avg?: number | null
          competitor_movie_id?: string | null
          competitor_occupied_estimated?: number | null
          created_at?: string
          id?: string
          primary_confidence_avg?: number | null
          primary_movie_id?: string | null
          primary_occupied_estimated?: number | null
          screening_date: string
        }
        Update: {
          cinema_id?: string | null
          competitor_confidence_avg?: number | null
          competitor_movie_id?: string | null
          competitor_occupied_estimated?: number | null
          created_at?: string
          id?: string
          primary_confidence_avg?: number | null
          primary_movie_id?: string | null
          primary_occupied_estimated?: number | null
          screening_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_snapshots_cinema_id_fkey"
            columns: ["cinema_id"]
            isOneToOne: false
            referencedRelation: "cinemas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_snapshots_competitor_movie_id_fkey"
            columns: ["competitor_movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_snapshots_primary_movie_id_fkey"
            columns: ["primary_movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          movie_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          movie_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          movie_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_events_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_runs: {
        Row: {
          chain_id: string | null
          cinemas_found: number | null
          created_at: string
          id: string
          notes: string | null
          query_movie_title: string
          raw_payload_json: Json | null
          run_timestamp: string
          screenings_found: number | null
          status: string
        }
        Insert: {
          chain_id?: string | null
          cinemas_found?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          query_movie_title: string
          raw_payload_json?: Json | null
          run_timestamp?: string
          screenings_found?: number | null
          status?: string
        }
        Update: {
          chain_id?: string | null
          cinemas_found?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          query_movie_title?: string
          raw_payload_json?: Json | null
          run_timestamp?: string
          screenings_found?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovery_runs_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "cinema_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_targets: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_run_at: string | null
          monitoring_frequency_minutes: number
          screening_id: string
          target_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          monitoring_frequency_minutes?: number
          screening_id: string
          target_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          monitoring_frequency_minutes?: number
          screening_id?: string
          target_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_targets_screening_id_fkey"
            columns: ["screening_id"]
            isOneToOne: false
            referencedRelation: "screenings"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          created_at: string
          id: string
          is_primary_title: boolean
          normalized_title: string
          release_date: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary_title?: boolean
          normalized_title: string
          release_date?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary_title?: boolean
          normalized_title?: string
          release_date?: string | null
          title?: string
        }
        Relationships: []
      }
      occupancy_results: {
        Row: {
          anomaly_flag: boolean
          available_seats_estimated: number
          confidence_reason: string | null
          confidence_score: number
          created_at: string
          extraction_type: string | null
          id: string
          occupancy_rate: number | null
          occupied_seats_estimated: number
          scrape_run_id: string
          total_seats_estimated: number
        }
        Insert: {
          anomaly_flag?: boolean
          available_seats_estimated?: number
          confidence_reason?: string | null
          confidence_score?: number
          created_at?: string
          extraction_type?: string | null
          id?: string
          occupancy_rate?: number | null
          occupied_seats_estimated?: number
          scrape_run_id: string
          total_seats_estimated?: number
        }
        Update: {
          anomaly_flag?: boolean
          available_seats_estimated?: number
          confidence_reason?: string | null
          confidence_score?: number
          created_at?: string
          extraction_type?: string | null
          id?: string
          occupancy_rate?: number | null
          occupied_seats_estimated?: number
          scrape_run_id?: string
          total_seats_estimated?: number
        }
        Relationships: [
          {
            foreignKeyName: "occupancy_results_scrape_run_id_fkey"
            columns: ["scrape_run_id"]
            isOneToOne: false
            referencedRelation: "scrape_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      parser_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          log_level: string
          message: string
          scrape_run_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          log_level?: string
          message: string
          scrape_run_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          log_level?: string
          message?: string
          scrape_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parser_logs_scrape_run_id_fkey"
            columns: ["scrape_run_id"]
            isOneToOne: false
            referencedRelation: "scrape_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_runs: {
        Row: {
          created_at: string
          id: string
          monitoring_target_id: string
          parser_key: string | null
          parser_version: string | null
          raw_html_reference: string | null
          raw_payload_json: Json | null
          run_timestamp: string
          screenshot_reference: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          monitoring_target_id: string
          parser_key?: string | null
          parser_version?: string | null
          raw_html_reference?: string | null
          raw_payload_json?: Json | null
          run_timestamp?: string
          screenshot_reference?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          monitoring_target_id?: string
          parser_key?: string | null
          parser_version?: string | null
          raw_html_reference?: string | null
          raw_payload_json?: Json | null
          run_timestamp?: string
          screenshot_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_runs_monitoring_target_id_fkey"
            columns: ["monitoring_target_id"]
            isOneToOne: false
            referencedRelation: "monitoring_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      screenings: {
        Row: {
          auditorium_type: string | null
          booking_url: string | null
          cinema_id: string
          created_at: string
          discovered_at: string | null
          external_screening_id: string | null
          format: string
          id: string
          is_active: boolean
          movie_id: string
          screening_date: string
          screening_time: string
          source_url: string | null
        }
        Insert: {
          auditorium_type?: string | null
          booking_url?: string | null
          cinema_id: string
          created_at?: string
          discovered_at?: string | null
          external_screening_id?: string | null
          format?: string
          id?: string
          is_active?: boolean
          movie_id: string
          screening_date: string
          screening_time: string
          source_url?: string | null
        }
        Update: {
          auditorium_type?: string | null
          booking_url?: string | null
          cinema_id?: string
          created_at?: string
          discovered_at?: string | null
          external_screening_id?: string | null
          format?: string
          id?: string
          is_active?: boolean
          movie_id?: string
          screening_date?: string
          screening_time?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screenings_cinema_id_fkey"
            columns: ["cinema_id"]
            isOneToOne: false
            referencedRelation: "cinemas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenings_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_settings: {
        Row: {
          created_at: string
          default_chain_id: string | null
          default_monitoring_interval_minutes: number
          high_confidence_threshold: number
          id: string
          medium_confidence_threshold: number
          primary_movie_title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_chain_id?: string | null
          default_monitoring_interval_minutes?: number
          high_confidence_threshold?: number
          id?: string
          medium_confidence_threshold?: number
          primary_movie_title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_chain_id?: string | null
          default_monitoring_interval_minutes?: number
          high_confidence_threshold?: number
          id?: string
          medium_confidence_threshold?: number
          primary_movie_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_settings_default_chain_id_fkey"
            columns: ["default_chain_id"]
            isOneToOne: false
            referencedRelation: "cinema_chains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
