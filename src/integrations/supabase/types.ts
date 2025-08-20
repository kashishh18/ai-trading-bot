export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_predictions: {
        Row: {
          confidence_score: number
          created_at: string
          expires_at: string
          id: string
          model_version: string
          predicted_price: number
          prediction_date: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          symbol: string
          technical_indicators: Json | null
        }
        Insert: {
          confidence_score: number
          created_at?: string
          expires_at: string
          id?: string
          model_version: string
          predicted_price: number
          prediction_date: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          symbol: string
          technical_indicators?: Json | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          expires_at?: string
          id?: string
          model_version?: string
          predicted_price?: number
          prediction_date?: string
          signal_type?: Database["public"]["Enums"]["signal_type"]
          symbol?: string
          technical_indicators?: Json | null
        }
        Relationships: []
      }
      custom_indicators: {
        Row: {
          created_at: string
          description: string | null
          formula_config: Json
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          formula_config: Json
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          formula_config?: Json
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_positions: {
        Row: {
          average_buy_price: number
          closed_at: string | null
          created_at: string
          current_price: number | null
          id: string
          position_status: Database["public"]["Enums"]["position_status"]
          shares_owned: number
          stop_loss_price: number | null
          symbol: string
          take_profit_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          average_buy_price: number
          closed_at?: string | null
          created_at?: string
          current_price?: number | null
          id?: string
          position_status?: Database["public"]["Enums"]["position_status"]
          shares_owned: number
          stop_loss_price?: number | null
          symbol: string
          take_profit_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          average_buy_price?: number
          closed_at?: string | null
          created_at?: string
          current_price?: number | null
          id?: string
          position_status?: Database["public"]["Enums"]["position_status"]
          shares_owned?: number
          stop_loss_price?: number | null
          symbol?: string
          take_profit_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_summary: {
        Row: {
          cash_balance: number
          daily_change: number
          daily_change_percent: number
          id: string
          invested_amount: number
          max_position_size: number
          risk_tolerance: number
          total_profit_loss: number
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cash_balance?: number
          daily_change?: number
          daily_change_percent?: number
          id?: string
          invested_amount?: number
          max_position_size?: number
          risk_tolerance?: number
          total_profit_loss?: number
          total_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cash_balance?: number
          daily_change?: number
          daily_change_percent?: number
          id?: string
          invested_amount?: number
          max_position_size?: number
          risk_tolerance?: number
          total_profit_loss?: number
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_prices: {
        Row: {
          adjusted_close: number | null
          close_price: number
          created_at: string
          date: string
          high_price: number
          id: string
          low_price: number
          open_price: number
          symbol: string
          volume: number
        }
        Insert: {
          adjusted_close?: number | null
          close_price: number
          created_at?: string
          date: string
          high_price: number
          id?: string
          low_price: number
          open_price: number
          symbol: string
          volume: number
        }
        Update: {
          adjusted_close?: number | null
          close_price?: number
          created_at?: string
          date?: string
          high_price?: number
          id?: string
          low_price?: number
          open_price?: number
          symbol?: string
          volume?: number
        }
        Relationships: []
      }
      trading_history: {
        Row: {
          commission: number | null
          executed_at: string
          id: string
          price: number
          profit_loss: number | null
          shares: number
          signal_id: string | null
          symbol: string
          total_amount: number
          trade_type: Database["public"]["Enums"]["trade_type"]
          user_id: string
        }
        Insert: {
          commission?: number | null
          executed_at?: string
          id?: string
          price: number
          profit_loss?: number | null
          shares: number
          signal_id?: string | null
          symbol: string
          total_amount: number
          trade_type: Database["public"]["Enums"]["trade_type"]
          user_id: string
        }
        Update: {
          commission?: number | null
          executed_at?: string
          id?: string
          price?: number
          profit_loss?: number | null
          shares?: number
          signal_id?: string | null
          symbol?: string
          total_amount?: number
          trade_type?: Database["public"]["Enums"]["trade_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_history_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "trading_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_signals: {
        Row: {
          confidence_score: number
          created_at: string
          expires_at: string
          id: string
          is_executed: boolean
          reasoning: string | null
          risk_score: number
          signal_type: Database["public"]["Enums"]["signal_type"]
          symbol: string
          target_price: number
        }
        Insert: {
          confidence_score: number
          created_at?: string
          expires_at: string
          id?: string
          is_executed?: boolean
          reasoning?: string | null
          risk_score: number
          signal_type: Database["public"]["Enums"]["signal_type"]
          symbol: string
          target_price: number
        }
        Update: {
          confidence_score?: number
          created_at?: string
          expires_at?: string
          id?: string
          is_executed?: boolean
          reasoning?: string | null
          risk_score?: number
          signal_type?: Database["public"]["Enums"]["signal_type"]
          symbol?: string
          target_price?: number
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          added_at: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      position_status: "active" | "closed" | "pending"
      signal_type: "buy" | "sell" | "hold"
      trade_type: "market" | "limit" | "stop_loss" | "take_profit"
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
      position_status: ["active", "closed", "pending"],
      signal_type: ["buy", "sell", "hold"],
      trade_type: ["market", "limit", "stop_loss", "take_profit"],
    },
  },
} as const
