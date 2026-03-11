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
      adminscale_scales: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          condition_type: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          condition_type?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          condition_type?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
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
      checkout_requests: {
        Row: {
          course_id: string
          employee_id: string
          id: string
          questions: Json | null
          requested_at: string
          result: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          step_id: string
          supervisor_notes: string | null
        }
        Insert: {
          course_id: string
          employee_id: string
          id?: string
          questions?: Json | null
          requested_at?: string
          result?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          step_id: string
          supervisor_notes?: string | null
        }
        Update: {
          course_id?: string
          employee_id?: string
          id?: string
          questions?: Json | null
          requested_at?: string
          result?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          step_id?: string
          supervisor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      checksheet_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          sections: Json
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          sections?: Json
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          sections?: Json
          title?: string
        }
        Relationships: []
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
      course_supervisors: {
        Row: {
          assigned_at: string
          course_id: string
          employee_id: string
          id: string
          supervisor_user_id: string
        }
        Insert: {
          assigned_at?: string
          course_id: string
          employee_id: string
          id?: string
          supervisor_user_id: string
        }
        Update: {
          assigned_at?: string
          course_id?: string
          employee_id?: string
          id?: string
          supervisor_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_supervisors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_supervisors_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      course_versions: {
        Row: {
          change_note: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_hst_course: boolean | null
          sections: Json | null
          title: string
          version_number: number
        }
        Insert: {
          change_note?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_hst_course?: boolean | null
          sections?: Json | null
          title: string
          version_number?: number
        }
        Update: {
          change_note?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_hst_course?: boolean | null
          sections?: Json | null
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_versions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      extra_assignments: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          course_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          employee_id: string
          id: string
          title: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          title: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          definition: string
          example: string | null
          id: string
          term: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          definition: string
          example?: string | null
          id?: string
          term: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          definition?: string
          example?: string | null
          id?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_terms_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
      program_courses: {
        Row: {
          course_id: string
          id: string
          is_required: boolean | null
          program_id: string
          sort_order: number | null
        }
        Insert: {
          course_id: string
          id?: string
          is_required?: boolean | null
          program_id: string
          sort_order?: number | null
        }
        Update: {
          course_id?: string
          id?: string
          is_required?: boolean | null
          program_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string
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
      step_artifacts: {
        Row: {
          course_id: string
          employee_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          public_url: string | null
          step_id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          course_id: string
          employee_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          public_url?: string | null
          step_id: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          course_id?: string
          employee_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          public_url?: string | null
          step_id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "step_artifacts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_artifacts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      student_answers: {
        Row: {
          answer_html: string
          course_id: string
          created_at: string
          employee_id: string
          id: string
          step_id: string
          updated_at: string
        }
        Insert: {
          answer_html?: string
          course_id: string
          created_at?: string
          employee_id: string
          id?: string
          step_id: string
          updated_at?: string
        }
        Update: {
          answer_html?: string
          course_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      student_badges: {
        Row: {
          badge_id: string
          course_id: string | null
          earned_at: string
          employee_id: string
          id: string
        }
        Insert: {
          badge_id: string
          course_id?: string | null
          earned_at?: string
          employee_id: string
          id?: string
        }
        Update: {
          badge_id?: string
          course_id?: string | null
          earned_at?: string
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_badges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisor_step_comments: {
        Row: {
          comment: string
          course_id: string
          created_at: string
          employee_id: string
          id: string
          step_id: string
          supervisor_user_id: string
        }
        Insert: {
          comment: string
          course_id: string
          created_at?: string
          employee_id: string
          id?: string
          step_id: string
          supervisor_user_id: string
        }
        Update: {
          comment?: string
          course_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          step_id?: string
          supervisor_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_step_comments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_step_comments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      training_messages: {
        Row: {
          course_id: string
          created_at: string
          employee_id: string
          id: string
          message: string
          message_type: string
          sender_id: string
          sender_name: string | null
          step_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          employee_id: string
          id?: string
          message: string
          message_type?: string
          sender_id: string
          sender_name?: string | null
          step_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          message?: string
          message_type?: string
          sender_id?: string
          sender_name?: string | null
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_messages_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      twinning_feedback: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          rating: number
          session_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          rating?: number
          session_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          rating?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "twinning_feedback_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twinning_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "twinning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      twinning_sessions: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          employee_a_id: string
          employee_b_id: string
          id: string
          notes: string | null
          scheduled_at: string | null
          status: string
          step_id: string
          supervisor_user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          employee_a_id: string
          employee_b_id: string
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          status?: string
          step_id: string
          supervisor_user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          employee_a_id?: string
          employee_b_id?: string
          id?: string
          notes?: string | null
          scheduled_at?: string | null
          status?: string
          step_id?: string
          supervisor_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "twinning_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twinning_sessions_employee_a_id_fkey"
            columns: ["employee_a_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "twinning_sessions_employee_b_id_fkey"
            columns: ["employee_b_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      word_clearing_logs: {
        Row: {
          cleared: boolean
          cleared_at: string | null
          course_id: string
          created_at: string
          employee_id: string
          glossary_term_id: string | null
          id: string
          step_id: string
          student_definition: string | null
          student_example: string | null
          term: string
        }
        Insert: {
          cleared?: boolean
          cleared_at?: string | null
          course_id: string
          created_at?: string
          employee_id: string
          glossary_term_id?: string | null
          id?: string
          step_id: string
          student_definition?: string | null
          student_example?: string | null
          term: string
        }
        Update: {
          cleared?: boolean
          cleared_at?: string | null
          course_id?: string
          created_at?: string
          employee_id?: string
          glossary_term_id?: string | null
          id?: string
          step_id?: string
          student_definition?: string | null
          student_example?: string | null
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_clearing_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_clearing_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_clearing_logs_glossary_term_id_fkey"
            columns: ["glossary_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "moderator" | "user" | "supervisor" | "author"
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
      app_role: ["admin", "moderator", "user", "supervisor", "author"],
    },
  },
} as const
