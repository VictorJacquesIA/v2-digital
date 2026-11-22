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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      crm_atividades: {
        Row: {
          created_at: string
          descricao: string
          id: string
          metadados: Json
          oportunidade_id: string
          tipo: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          metadados?: Json
          oportunidade_id: string
          tipo: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          metadados?: Json
          oportunidade_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_atividades_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_metas: {
        Row: {
          created_at: string
          id: string
          mes: string
          meta_fechados: number
          meta_novos: number
          meta_propostas: number
          meta_receita: number
        }
        Insert: {
          created_at?: string
          id?: string
          mes: string
          meta_fechados?: number
          meta_novos?: number
          meta_propostas?: number
          meta_receita?: number
        }
        Update: {
          created_at?: string
          id?: string
          mes?: string
          meta_fechados?: number
          meta_novos?: number
          meta_propostas?: number
          meta_receita?: number
        }
        Relationships: []
      }
      crm_oportunidades: {
        Row: {
          created_at: string
          etapa: string
          etapa_desde: string
          fechado_em: string | null
          id: string
          lead_diagnostico_id: string | null
          maps_place_id: string | null
          motivo_perda: string | null
          nicho: string | null
          nome_contato: string | null
          nome_empresa: string
          origem: string
          regiao: string | null
          score_oportunidade: number
          servicos_interesse: string[]
          updated_at: string
          valor_mensal: number
          whatsapp: string | null
          whatsapp_norm: string | null
        }
        Insert: {
          created_at?: string
          etapa?: string
          etapa_desde?: string
          fechado_em?: string | null
          id?: string
          lead_diagnostico_id?: string | null
          maps_place_id?: string | null
          motivo_perda?: string | null
          nicho?: string | null
          nome_contato?: string | null
          nome_empresa: string
          origem?: string
          regiao?: string | null
          score_oportunidade?: number
          servicos_interesse?: string[]
          updated_at?: string
          valor_mensal?: number
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          etapa?: string
          etapa_desde?: string
          fechado_em?: string | null
          id?: string
          lead_diagnostico_id?: string | null
          maps_place_id?: string | null
          motivo_perda?: string | null
          nicho?: string | null
          nome_contato?: string | null
          nome_empresa?: string
          origem?: string
          regiao?: string | null
          score_oportunidade?: number
          servicos_interesse?: string[]
          updated_at?: string
          valor_mensal?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_oportunidades_lead_diagnostico_id_fkey"
            columns: ["lead_diagnostico_id"]
            isOneToOne: false
            referencedRelation: "leads_diagnostico"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sugestoes_ia: {
        Row: {
          acao: string
          conteudo: Json
          created_at: string
          id: string
          oportunidade_id: string
          papel: string
          status: string
        }
        Insert: {
          acao: string
          conteudo?: Json
          created_at?: string
          id?: string
          oportunidade_id: string
          papel: string
          status?: string
        }
        Update: {
          acao?: string
          conteudo?: Json
          created_at?: string
          id?: string
          oportunidade_id?: string
          papel?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sugestoes_ia_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tarefas: {
        Row: {
          concluida_em: string | null
          created_at: string
          criada_por_ia: boolean
          descricao: string
          id: string
          oportunidade_id: string
          tipo: string
          vence_em: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          criada_por_ia?: boolean
          descricao: string
          id?: string
          oportunidade_id: string
          tipo: string
          vence_em: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          criada_por_ia?: boolean
          descricao?: string
          id?: string
          oportunidade_id?: string
          tipo?: string
          vence_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tarefas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "crm_oportunidades"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos_cache: {
        Row: {
          created_at: string
          place_id: string
          relatorio: Json
        }
        Insert: {
          created_at?: string
          place_id: string
          relatorio: Json
        }
        Update: {
          created_at?: string
          place_id?: string
          relatorio?: Json
        }
        Relationships: []
      }
      leads_diagnostico: {
        Row: {
          atendido: boolean
          business_name: string | null
          created_at: string
          dados: Json | null
          estrategia: Json | null
          estrategia_expira: string | null
          estrategia_token: string | null
          id: string
          indice: number | null
          interacoes: number
          maps_url: string | null
          nome_contato: string | null
          notas: string | null
          place_id: string | null
          posicao: string | null
          resumo: string | null
          status: string
          ultima_interacao: string
          whatsapp: string
        }
        Insert: {
          atendido?: boolean
          business_name?: string | null
          created_at?: string
          dados?: Json | null
          estrategia?: Json | null
          estrategia_expira?: string | null
          estrategia_token?: string | null
          id?: string
          indice?: number | null
          interacoes?: number
          maps_url?: string | null
          nome_contato?: string | null
          notas?: string | null
          place_id?: string | null
          posicao?: string | null
          resumo?: string | null
          status?: string
          ultima_interacao?: string
          whatsapp: string
        }
        Update: {
          atendido?: boolean
          business_name?: string | null
          created_at?: string
          dados?: Json | null
          estrategia?: Json | null
          estrategia_expira?: string | null
          estrategia_token?: string | null
          id?: string
          indice?: number | null
          interacoes?: number
          maps_url?: string | null
          nome_contato?: string | null
          notas?: string | null
          place_id?: string | null
          posicao?: string | null
          resumo?: string | null
          status?: string
          ultima_interacao?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      estrategia_publica: {
        Args: { _token: string }
        Returns: {
          business_name: string
          estrategia: Json
          expira: string
          expirada: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
    },
  },
} as const
