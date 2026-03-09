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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      candidates: {
        Row: {
          birth_date: string | null
          converted_employee_id: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          email: string | null
          first_name: string
          full_name: string | null
          id: string
          last_name: string
          metadata: Json | null
          middle_name: string | null
          notes: string | null
          phone: string | null
          position: string
          start_date: string | null
          status: string
          telegram: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          converted_employee_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          email?: string | null
          first_name: string
          full_name?: string | null
          id?: string
          last_name: string
          metadata?: Json | null
          middle_name?: string | null
          notes?: string | null
          phone?: string | null
          position?: string
          start_date?: string | null
          status?: string
          telegram?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          converted_employee_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          email?: string | null
          first_name?: string
          full_name?: string | null
          id?: string
          last_name?: string
          metadata?: Json | null
          middle_name?: string | null
          notes?: string | null
          phone?: string | null
          position?: string
          start_date?: string | null
          status?: string
          telegram?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_converted_employee_id_fkey"
            columns: ["converted_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      course_progress: {
        Row: {
          certified: boolean | null
          completed_at: string | null
          completed_sections: Json | null
          course_id: string
          employee_id: string
          id: string
          progress_percent: number | null
          started_at: string | null
        }
        Insert: {
          certified?: boolean | null
          completed_at?: string | null
          completed_sections?: Json | null
          course_id: string
          employee_id: string
          id?: string
          progress_percent?: number | null
          started_at?: string | null
        }
        Update: {
          certified?: boolean | null
          completed_at?: string | null
          completed_sections?: Json | null
          course_id?: string
          employee_id?: string
          id?: string
          progress_percent?: number | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_progress_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_hst_course: boolean | null
          is_published: boolean | null
          sections: Json | null
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_hst_course?: boolean | null
          is_published?: boolean | null
          sections?: Json | null
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_hst_course?: boolean | null
          is_published?: boolean | null
          sections?: Json | null
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      department_diagnostics: {
        Row: {
          created_at: string
          department_id: string
          id: string
          sort_order: number | null
          text: string
          type: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          sort_order?: number | null
          text: string
          type: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          sort_order?: number | null
          text?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_diagnostics_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          color: string | null
          created_at: string
          description: string | null
          full_name: string | null
          goal: string | null
          icon: string | null
          id: string
          long_description: string | null
          main_stat: string | null
          manager_name: string | null
          metadata: Json | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string
          vfp: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          description?: string | null
          full_name?: string | null
          goal?: string | null
          icon?: string | null
          id?: string
          long_description?: string | null
          main_stat?: string | null
          manager_name?: string | null
          metadata?: Json | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          vfp?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          description?: string | null
          full_name?: string | null
          goal?: string | null
          icon?: string | null
          id?: string
          long_description?: string | null
          main_stat?: string | null
          manager_name?: string | null
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          vfp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_attachments: {
        Row: {
          document_category: string | null
          employee_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          public_url: string | null
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_category?: string | null
          employee_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          public_url?: string | null
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_category?: string | null
          employee_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          public_url?: string | null
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_attachments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          actual_address: string | null
          additional_info: string | null
          bank_details: string | null
          bank_name: string | null
          birth_date: string | null
          created_at: string
          created_by: string | null
          crypto_currency: string | null
          crypto_network: string | null
          crypto_wallet: string | null
          custom_fields: Json | null
          department_ids: string[] | null
          email: string | null
          email2: string | null
          emergency_contacts: Json | null
          foreign_passport: string | null
          foreign_passport_date: string | null
          foreign_passport_issuer: string | null
          full_name: string
          id: string
          inn: string | null
          join_date: string | null
          nickname: string | null
          passport_date: string | null
          passport_issuer: string | null
          passport_number: string | null
          phone: string | null
          photo_url: string | null
          position: string
          registration_address: string | null
          subdepartment_ids: string[] | null
          telegram: string | null
          telegram_username: string | null
          updated_at: string
          version: number | null
          whatsapp: string | null
        }
        Insert: {
          actual_address?: string | null
          additional_info?: string | null
          bank_details?: string | null
          bank_name?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          crypto_currency?: string | null
          crypto_network?: string | null
          crypto_wallet?: string | null
          custom_fields?: Json | null
          department_ids?: string[] | null
          email?: string | null
          email2?: string | null
          emergency_contacts?: Json | null
          foreign_passport?: string | null
          foreign_passport_date?: string | null
          foreign_passport_issuer?: string | null
          full_name: string
          id?: string
          inn?: string | null
          join_date?: string | null
          nickname?: string | null
          passport_date?: string | null
          passport_issuer?: string | null
          passport_number?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string
          registration_address?: string | null
          subdepartment_ids?: string[] | null
          telegram?: string | null
          telegram_username?: string | null
          updated_at?: string
          version?: number | null
          whatsapp?: string | null
        }
        Update: {
          actual_address?: string | null
          additional_info?: string | null
          bank_details?: string | null
          bank_name?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          crypto_currency?: string | null
          crypto_network?: string | null
          crypto_wallet?: string | null
          custom_fields?: Json | null
          department_ids?: string[] | null
          email?: string | null
          email2?: string | null
          emergency_contacts?: Json | null
          foreign_passport?: string | null
          foreign_passport_date?: string | null
          foreign_passport_issuer?: string | null
          full_name?: string
          id?: string
          inn?: string | null
          join_date?: string | null
          nickname?: string | null
          passport_date?: string | null
          passport_issuer?: string | null
          passport_number?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string
          registration_address?: string | null
          subdepartment_ids?: string[] | null
          telegram?: string | null
          telegram_username?: string | null
          updated_at?: string
          version?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      onboarding_instances: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          progress_percentage: number | null
          start_date: string
          status: string
          target_completion_date: string | null
          tasks: Json | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          progress_percentage?: number | null
          start_date?: string
          status?: string
          target_completion_date?: string | null
          tasks?: Json | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          progress_percentage?: number | null
          start_date?: string
          status?: string
          target_completion_date?: string | null
          tasks?: Json | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_instances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          created_at: string
          department_id: string | null
          id: string
          name: string
          position: string | null
          stage_structure: Json | null
          tasks: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          id?: string
          name: string
          position?: string | null
          stage_structure?: Json | null
          tasks?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          id?: string
          name?: string
          position?: string | null
          stage_structure?: Json | null
          tasks?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_templates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metrics: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metrics?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metrics?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json | null
          department_id: string | null
          employee_id: string | null
          id: string
          period_end: string
          period_start: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          department_id?: string | null
          employee_id?: string | null
          id?: string
          period_end: string
          period_start: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json | null
          department_id?: string | null
          employee_id?: string | null
          id?: string
          period_end?: string
          period_start?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      statistic_definitions: {
        Row: {
          calculation_method: string | null
          created_at: string
          description: string | null
          id: string
          inverted: boolean | null
          is_double: boolean | null
          is_favorite: boolean | null
          owner_id: string | null
          owner_type: string
          purpose: string | null
          title: string
          updated_at: string
        }
        Insert: {
          calculation_method?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inverted?: boolean | null
          is_double?: boolean | null
          is_favorite?: boolean | null
          owner_id?: string | null
          owner_type: string
          purpose?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          calculation_method?: string | null
          created_at?: string
          description?: string | null
          id?: string
          inverted?: boolean | null
          is_double?: boolean | null
          is_favorite?: boolean | null
          owner_id?: string | null
          owner_type?: string
          purpose?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      statistic_values: {
        Row: {
          condition: string | null
          created_at: string
          created_by: string | null
          date: string
          definition_id: string
          id: string
          notes: string | null
          value: number
          value2: number | null
        }
        Insert: {
          condition?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          definition_id: string
          id?: string
          notes?: string | null
          value?: number
          value2?: number | null
        }
        Update: {
          condition?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          definition_id?: string
          id?: string
          notes?: string | null
          value?: number
          value2?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "statistic_values_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "statistic_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
