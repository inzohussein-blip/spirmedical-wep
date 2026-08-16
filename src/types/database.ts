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
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          reason: string | null
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          reason?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          reason?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "admin_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "admin_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          id: number
          ip_address: unknown
          properties: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          id?: number
          ip_address?: unknown
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          id?: number
          ip_address?: unknown
          properties?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_theme_settings: {
        Row: {
          accent_color: string
          created_at: string
          danger_color: string
          id: string
          is_active: boolean
          primary_color: string
          primary_dark: string
          primary_soft: string
          theme_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          accent_color?: string
          created_at?: string
          danger_color?: string
          id?: string
          is_active?: boolean
          primary_color?: string
          primary_dark?: string
          primary_soft?: string
          theme_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          accent_color?: string
          created_at?: string
          danger_color?: string
          id?: string
          is_active?: boolean
          primary_color?: string
          primary_dark?: string
          primary_soft?: string
          theme_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_theme_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_theme_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "app_theme_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          address: string
          allergy_form: Json | null
          assigned_specialist_id: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          chief_complaint: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          current_medications: string[] | null
          dental_clinic_id: string | null
          dental_procedure_type: string | null
          doctor_appointment_type: string | null
          doctor_id: string | null
          duration_minutes: number | null
          estimated_price: number | null
          family_member_id: string | null
          hospital_department: string | null
          hospital_id: string | null
          id: string
          infectious_disease_alert: Json | null
          lab_order_id: string | null
          lab_results_data: Json | null
          lab_results_url: string | null
          location_accuracy_m: number | null
          location_captured_at: string | null
          location_lat: number | null
          location_lng: number | null
          mental_specialist_id: string | null
          notes: string | null
          notes_encrypted: string | null
          nurse_gender_preference: string | null
          nursing_actions: Json | null
          nutritionist_id: string | null
          optical_service_type: string | null
          optical_store_id: string | null
          otp_channel: string | null
          physio_service_type_slug: string | null
          physio_specialist_id: string | null
          prescription_data: Json | null
          prescription_image_url: string | null
          prescription_required: boolean
          recurring_schedule: Json | null
          reminder_sent_at: string | null
          required_specialist_type: string | null
          scheduled_at: string
          service_id: string | null
          service_type: string
          session_plan: Json | null
          specialist_id: string | null
          specialist_notes: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          supplies_request: Json | null
          supplies_total: number
          updated_at: string
          user_id: string
          vaccine_clinic_id: string | null
          vaccine_dose_number: number | null
          vaccine_id: string | null
        }
        Insert: {
          address: string
          allergy_form?: Json | null
          assigned_specialist_id?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          chief_complaint?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          current_medications?: string[] | null
          dental_clinic_id?: string | null
          dental_procedure_type?: string | null
          doctor_appointment_type?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          estimated_price?: number | null
          family_member_id?: string | null
          hospital_department?: string | null
          hospital_id?: string | null
          id?: string
          infectious_disease_alert?: Json | null
          lab_order_id?: string | null
          lab_results_data?: Json | null
          lab_results_url?: string | null
          location_accuracy_m?: number | null
          location_captured_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          mental_specialist_id?: string | null
          notes?: string | null
          notes_encrypted?: string | null
          nurse_gender_preference?: string | null
          nursing_actions?: Json | null
          nutritionist_id?: string | null
          optical_service_type?: string | null
          optical_store_id?: string | null
          otp_channel?: string | null
          physio_service_type_slug?: string | null
          physio_specialist_id?: string | null
          prescription_data?: Json | null
          prescription_image_url?: string | null
          prescription_required?: boolean
          recurring_schedule?: Json | null
          reminder_sent_at?: string | null
          required_specialist_type?: string | null
          scheduled_at: string
          service_id?: string | null
          service_type: string
          session_plan?: Json | null
          specialist_id?: string | null
          specialist_notes?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          supplies_request?: Json | null
          supplies_total?: number
          updated_at?: string
          user_id: string
          vaccine_clinic_id?: string | null
          vaccine_dose_number?: number | null
          vaccine_id?: string | null
        }
        Update: {
          address?: string
          allergy_form?: Json | null
          assigned_specialist_id?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          chief_complaint?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          current_medications?: string[] | null
          dental_clinic_id?: string | null
          dental_procedure_type?: string | null
          doctor_appointment_type?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          estimated_price?: number | null
          family_member_id?: string | null
          hospital_department?: string | null
          hospital_id?: string | null
          id?: string
          infectious_disease_alert?: Json | null
          lab_order_id?: string | null
          lab_results_data?: Json | null
          lab_results_url?: string | null
          location_accuracy_m?: number | null
          location_captured_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          mental_specialist_id?: string | null
          notes?: string | null
          notes_encrypted?: string | null
          nurse_gender_preference?: string | null
          nursing_actions?: Json | null
          nutritionist_id?: string | null
          optical_service_type?: string | null
          optical_store_id?: string | null
          otp_channel?: string | null
          physio_service_type_slug?: string | null
          physio_specialist_id?: string | null
          prescription_data?: Json | null
          prescription_image_url?: string | null
          prescription_required?: boolean
          recurring_schedule?: Json | null
          reminder_sent_at?: string | null
          required_specialist_type?: string | null
          scheduled_at?: string
          service_id?: string | null
          service_type?: string
          session_plan?: Json | null
          specialist_id?: string | null
          specialist_notes?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          supplies_request?: Json | null
          supplies_total?: number
          updated_at?: string
          user_id?: string
          vaccine_clinic_id?: string | null
          vaccine_dose_number?: number | null
          vaccine_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_specialist_id_fkey"
            columns: ["assigned_specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_assigned_specialist_id_fkey"
            columns: ["assigned_specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_assigned_specialist_id_fkey"
            columns: ["assigned_specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dental_clinic_id_fkey"
            columns: ["dental_clinic_id"]
            isOneToOne: false
            referencedRelation: "dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "admin_lab_orders_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_mental_specialist_id_fkey"
            columns: ["mental_specialist_id"]
            isOneToOne: false
            referencedRelation: "mental_health_specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_optical_store_id_fkey"
            columns: ["optical_store_id"]
            isOneToOne: false
            referencedRelation: "optical_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_physio_specialist_id_fkey"
            columns: ["physio_specialist_id"]
            isOneToOne: false
            referencedRelation: "physio_specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vaccine_clinic_id_fkey"
            columns: ["vaccine_clinic_id"]
            isOneToOne: false
            referencedRelation: "vaccine_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          used_by: string[] | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_by?: string[] | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_by?: string[] | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "beta_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "beta_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          actual_behavior: string | null
          admin_notes: string | null
          browser: string | null
          created_at: string | null
          description: string
          device: string | null
          expected_behavior: string | null
          fixed_at: string | null
          fixed_in_version: string | null
          id: string
          page_url: string | null
          screenshot_url: string | null
          severity: string
          status: string
          steps_to_reproduce: string | null
          title: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          actual_behavior?: string | null
          admin_notes?: string | null
          browser?: string | null
          created_at?: string | null
          description: string
          device?: string | null
          expected_behavior?: string | null
          fixed_at?: string | null
          fixed_in_version?: string | null
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          actual_behavior?: string | null
          admin_notes?: string | null
          browser?: string | null
          created_at?: string | null
          description?: string
          device?: string | null
          expected_behavior?: string | null
          fixed_at?: string | null
          fixed_in_version?: string | null
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          severity?: string
          status?: string
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "bug_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          message_content: string
          name: string
          recipients_count: number
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          success_count: number
          target_segment: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          message_content: string
          name: string
          recipients_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          success_count?: number
          target_segment?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          message_content?: string
          name?: string
          recipients_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          success_count?: number
          target_segment?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog_entries: {
        Row: {
          breaking_changes: string[] | null
          created_at: string | null
          created_by: string | null
          features: string[] | null
          fixes: string[] | null
          id: string
          improvements: string[] | null
          is_published: boolean
          release_date: string
          summary: string | null
          title: string
          version: string
        }
        Insert: {
          breaking_changes?: string[] | null
          created_at?: string | null
          created_by?: string | null
          features?: string[] | null
          fixes?: string[] | null
          id?: string
          improvements?: string[] | null
          is_published?: boolean
          release_date: string
          summary?: string | null
          title: string
          version: string
        }
        Update: {
          breaking_changes?: string[] | null
          created_at?: string | null
          created_by?: string | null
          features?: string[] | null
          fixes?: string[] | null
          id?: string
          improvements?: string[] | null
          is_published?: boolean
          release_date?: string
          summary?: string | null
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "changelog_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "changelog_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "changelog_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_notes: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          specialist_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          specialist_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_notes_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_notes_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_notes_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "chat_notes_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          appointment_id: string | null
          closed_at: string | null
          created_at: string
          id: string
          is_archived: boolean
          is_pinned: boolean
          last_message: string | null
          last_message_at: string | null
          last_message_by: string | null
          patient_id: string
          patient_unread_count: number
          priority: string
          specialist_id: string
          specialist_unread_count: number
          status: string
          tags: string[] | null
          total_messages: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          last_message?: string | null
          last_message_at?: string | null
          last_message_by?: string | null
          patient_id: string
          patient_unread_count?: number
          priority?: string
          specialist_id: string
          specialist_unread_count?: number
          status?: string
          tags?: string[] | null
          total_messages?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          is_pinned?: boolean
          last_message?: string | null
          last_message_at?: string | null
          last_message_by?: string | null
          patient_id?: string
          patient_unread_count?: number
          priority?: string
          specialist_id?: string
          specialist_unread_count?: number
          status?: string
          tags?: string[] | null
          total_messages?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_last_message_by_fkey"
            columns: ["last_message_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_last_message_by_fkey"
            columns: ["last_message_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "chats_last_message_by_fkey"
            columns: ["last_message_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "chats_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "chats_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_messages: {
        Row: {
          attached_record_id: string | null
          attached_record_type: string | null
          consultation_id: string
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean
          message_type: string
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          attached_record_id?: string | null
          attached_record_type?: string | null
          consultation_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean
          message_type?: string
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          attached_record_id?: string | null
          attached_record_type?: string | null
          consultation_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean
          message_type?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_messages_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "consultation_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          category: string | null
          closed_at: string | null
          consultation_type: string
          created_at: string | null
          doctor_id: string | null
          doctor_user_id: string | null
          expected_response_hours: number
          family_member_id: string | null
          id: string
          is_free: boolean
          patient_user_id: string
          price: number
          responded_at: string | null
          shared_medical_data: Json | null
          status: string
          subscription_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          closed_at?: string | null
          consultation_type?: string
          created_at?: string | null
          doctor_id?: string | null
          doctor_user_id?: string | null
          expected_response_hours?: number
          family_member_id?: string | null
          id?: string
          is_free?: boolean
          patient_user_id: string
          price?: number
          responded_at?: string | null
          shared_medical_data?: Json | null
          status?: string
          subscription_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          closed_at?: string | null
          consultation_type?: string
          created_at?: string | null
          doctor_id?: string | null
          doctor_user_id?: string | null
          expected_response_hours?: number
          family_member_id?: string | null
          id?: string
          is_free?: boolean
          patient_user_id?: string
          price?: number
          responded_at?: string | null
          shared_medical_data?: Json | null
          status?: string
          subscription_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_doctor_user_id_fkey"
            columns: ["doctor_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_doctor_user_id_fkey"
            columns: ["doctor_user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "consultations_doctor_user_id_fkey"
            columns: ["doctor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_user_id_fkey"
            columns: ["patient_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_user_id_fkey"
            columns: ["patient_user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "consultations_patient_user_id_fkey"
            columns: ["patient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "doctor_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetic_product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          effectiveness_rating: number | null
          helpful_count: number
          id: string
          image_url: string | null
          is_public: boolean
          is_verified_purchase: boolean
          product_id: string
          rating: number
          scent_rating: number | null
          title: string | null
          user_id: string
          value_rating: number | null
          would_recommend: boolean
        }
        Insert: {
          comment?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          helpful_count?: number
          id?: string
          image_url?: string | null
          is_public?: boolean
          is_verified_purchase?: boolean
          product_id: string
          rating: number
          scent_rating?: number | null
          title?: string | null
          user_id: string
          value_rating?: number | null
          would_recommend?: boolean
        }
        Update: {
          comment?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          helpful_count?: number
          id?: string
          image_url?: string | null
          is_public?: boolean
          is_verified_purchase?: boolean
          product_id?: string
          rating?: number
          scent_rating?: number | null
          title?: string | null
          user_id?: string
          value_rating?: number | null
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cosmetic_product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "cosmetic_product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetic_products: {
        Row: {
          available_at_pharmacies: string[] | null
          brand: string
          category: string
          country_of_origin: string | null
          created_at: string | null
          description: string | null
          discount_price: number | null
          id: string
          image_emoji: string | null
          image_url: string | null
          ingredients: string | null
          is_active: boolean
          is_in_stock: boolean
          is_recommended: boolean
          name: string
          name_en: string | null
          price: number
          rating_avg: number
          rating_count: number
          recommendation_note: string | null
          stock_quantity: number | null
          updated_at: string | null
          usage_instructions: string | null
        }
        Insert: {
          available_at_pharmacies?: string[] | null
          brand: string
          category: string
          country_of_origin?: string | null
          created_at?: string | null
          description?: string | null
          discount_price?: number | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          ingredients?: string | null
          is_active?: boolean
          is_in_stock?: boolean
          is_recommended?: boolean
          name: string
          name_en?: string | null
          price?: number
          rating_avg?: number
          rating_count?: number
          recommendation_note?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          usage_instructions?: string | null
        }
        Update: {
          available_at_pharmacies?: string[] | null
          brand?: string
          category?: string
          country_of_origin?: string | null
          created_at?: string | null
          description?: string | null
          discount_price?: number | null
          id?: string
          image_emoji?: string | null
          image_url?: string | null
          ingredients?: string | null
          is_active?: boolean
          is_in_stock?: boolean
          is_recommended?: boolean
          name?: string
          name_en?: string | null
          price?: number
          rating_avg?: number
          rating_count?: number
          recommendation_note?: string | null
          stock_quantity?: number | null
          updated_at?: string | null
          usage_instructions?: string | null
        }
        Relationships: []
      }
      cosmetic_wishlist: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetic_wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cosmetic_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetic_wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "cosmetic_wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          applied_at: string | null
          appointment_id: string | null
          coupon_id: string
          discount_amount: number
          id: string
          order_amount: number
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          appointment_id?: string | null
          coupon_id: string
          discount_amount: number
          id?: string
          order_amount: number
          user_id: string
        }
        Update: {
          applied_at?: string | null
          appointment_id?: string | null
          coupon_id?: string
          discount_amount?: number
          id?: string
          order_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "coupon_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          allowed_cities: string[] | null
          applicable_services: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          first_order_only: boolean
          id: string
          is_active: boolean
          max_discount_amount: number | null
          max_uses: number | null
          min_order_amount: number
          per_user_limit: number
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          allowed_cities?: string[] | null
          applicable_services?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          first_order_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number
          per_user_limit?: number
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          allowed_cities?: string[] | null
          applicable_services?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_order_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number
          per_user_limit?: number
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "coupons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_clinics: {
        Row: {
          accepts_insurance: boolean
          address: string | null
          city: string
          cleaning_price_max: number | null
          cleaning_price_min: number | null
          created_at: string | null
          description: string | null
          district: string | null
          doctor_count: number
          doctor_names: string[] | null
          extraction_price_max: number | null
          extraction_price_min: number | null
          filling_price_max: number | null
          filling_price_min: number | null
          id: string
          implant_price_max: number | null
          implant_price_min: number | null
          insurance_providers: string[] | null
          is_active: boolean
          is_featured: boolean
          is_open_24h: boolean
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          name: string
          offers_cleaning: boolean
          offers_cosmetic: boolean
          offers_emergency: boolean
          offers_extraction: boolean
          offers_fillings: boolean
          offers_implants: boolean
          offers_orthodontics: boolean
          offers_pediatric: boolean
          offers_whitening: boolean
          phone: string | null
          rating_avg: number
          rating_count: number
          specialties: string[] | null
          updated_at: string | null
          whatsapp: string | null
          working_hours: string | null
        }
        Insert: {
          accepts_insurance?: boolean
          address?: string | null
          city: string
          cleaning_price_max?: number | null
          cleaning_price_min?: number | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          doctor_count?: number
          doctor_names?: string[] | null
          extraction_price_max?: number | null
          extraction_price_min?: number | null
          filling_price_max?: number | null
          filling_price_min?: number | null
          id?: string
          implant_price_max?: number | null
          implant_price_min?: number | null
          insurance_providers?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          is_open_24h?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          offers_cleaning?: boolean
          offers_cosmetic?: boolean
          offers_emergency?: boolean
          offers_extraction?: boolean
          offers_fillings?: boolean
          offers_implants?: boolean
          offers_orthodontics?: boolean
          offers_pediatric?: boolean
          offers_whitening?: boolean
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          specialties?: string[] | null
          updated_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Update: {
          accepts_insurance?: boolean
          address?: string | null
          city?: string
          cleaning_price_max?: number | null
          cleaning_price_min?: number | null
          created_at?: string | null
          description?: string | null
          district?: string | null
          doctor_count?: number
          doctor_names?: string[] | null
          extraction_price_max?: number | null
          extraction_price_min?: number | null
          filling_price_max?: number | null
          filling_price_min?: number | null
          id?: string
          implant_price_max?: number | null
          implant_price_min?: number | null
          insurance_providers?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          is_open_24h?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          offers_cleaning?: boolean
          offers_cosmetic?: boolean
          offers_emergency?: boolean
          offers_extraction?: boolean
          offers_fillings?: boolean
          offers_implants?: boolean
          offers_orthodontics?: boolean
          offers_pediatric?: boolean
          offers_whitening?: boolean
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          specialties?: string[] | null
          updated_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      dental_ratings: {
        Row: {
          appointment_id: string | null
          comfort_rating: number | null
          comment: string | null
          created_at: string
          dental_clinic_id: string
          expertise_rating: number | null
          hygiene_rating: number | null
          id: string
          is_public: boolean
          price_rating: number | null
          procedure_type: string | null
          rating: number
          user_id: string
          would_recommend: boolean
        }
        Insert: {
          appointment_id?: string | null
          comfort_rating?: number | null
          comment?: string | null
          created_at?: string
          dental_clinic_id: string
          expertise_rating?: number | null
          hygiene_rating?: number | null
          id?: string
          is_public?: boolean
          price_rating?: number | null
          procedure_type?: string | null
          rating: number
          user_id: string
          would_recommend?: boolean
        }
        Update: {
          appointment_id?: string | null
          comfort_rating?: number | null
          comment?: string | null
          created_at?: string
          dental_clinic_id?: string
          expertise_rating?: number | null
          hygiene_rating?: number | null
          id?: string
          is_public?: boolean
          price_rating?: number | null
          procedure_type?: string | null
          rating?: number
          user_id?: string
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dental_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_ratings_dental_clinic_id_fkey"
            columns: ["dental_clinic_id"]
            isOneToOne: false
            referencedRelation: "dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dental_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "dental_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_ratings: {
        Row: {
          appointment_id: string | null
          comment: string | null
          communication_rating: number | null
          consultation_id: string | null
          created_at: string
          doctor_id: string
          empathy_rating: number | null
          expertise_rating: number | null
          id: string
          interaction_type: string | null
          is_public: boolean
          is_verified: boolean
          punctuality_rating: number | null
          rating: number
          user_id: string
          would_recommend: boolean
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          communication_rating?: number | null
          consultation_id?: string | null
          created_at?: string
          doctor_id: string
          empathy_rating?: number | null
          expertise_rating?: number | null
          id?: string
          interaction_type?: string | null
          is_public?: boolean
          is_verified?: boolean
          punctuality_rating?: number | null
          rating: number
          user_id: string
          would_recommend?: boolean
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          communication_rating?: number | null
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string
          empathy_rating?: number | null
          expertise_rating?: number | null
          id?: string
          interaction_type?: string | null
          is_public?: boolean
          is_verified?: boolean
          punctuality_rating?: number | null
          rating?: number
          user_id?: string
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "doctor_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_ratings_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_ratings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_ratings_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "doctor_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_subscriptions: {
        Row: {
          cancelled_at: string | null
          consultations_used: number
          created_at: string | null
          doctor_id: string
          expires_at: string
          family_member_id: string | null
          id: string
          plan: string
          price: number
          starts_at: string
          status: string
          updated_at: string | null
          user_id: string
          visits_used: number
        }
        Insert: {
          cancelled_at?: string | null
          consultations_used?: number
          created_at?: string | null
          doctor_id: string
          expires_at: string
          family_member_id?: string | null
          id?: string
          plan: string
          price: number
          starts_at?: string
          status?: string
          updated_at?: string | null
          user_id: string
          visits_used?: number
        }
        Update: {
          cancelled_at?: string | null
          consultations_used?: number
          created_at?: string | null
          doctor_id?: string
          expires_at?: string
          family_member_id?: string | null
          id?: string
          plan?: string
          price?: number
          starts_at?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          visits_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_subscriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_subscriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_subscriptions_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "doctor_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          available_for_clinic: boolean
          available_for_home_visit: boolean
          available_for_video: boolean
          avatar_url: string | null
          bio: string | null
          certifications_url: string | null
          clinic_address: string | null
          clinic_city: string | null
          clinic_lat: number | null
          clinic_lng: number | null
          clinic_name: string | null
          clinic_phone: string | null
          created_at: string | null
          full_name: string
          full_name_en: string | null
          gender: string | null
          home_visit_price: number | null
          id: string
          is_active: boolean
          is_verified: boolean
          languages: string[] | null
          monthly_subscription_price: number | null
          qualifications: string[] | null
          rating_avg: number
          rating_count: number
          specialty: string
          sub_specialty: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          video_consult_price: number | null
          yearly_subscription_price: number | null
          years_experience: number
        }
        Insert: {
          available_for_clinic?: boolean
          available_for_home_visit?: boolean
          available_for_video?: boolean
          avatar_url?: string | null
          bio?: string | null
          certifications_url?: string | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_lat?: number | null
          clinic_lng?: number | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string | null
          full_name: string
          full_name_en?: string | null
          gender?: string | null
          home_visit_price?: number | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          monthly_subscription_price?: number | null
          qualifications?: string[] | null
          rating_avg?: number
          rating_count?: number
          specialty: string
          sub_specialty?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          video_consult_price?: number | null
          yearly_subscription_price?: number | null
          years_experience?: number
        }
        Update: {
          available_for_clinic?: boolean
          available_for_home_visit?: boolean
          available_for_video?: boolean
          avatar_url?: string | null
          bio?: string | null
          certifications_url?: string | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_lat?: number | null
          clinic_lng?: number | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string | null
          full_name?: string
          full_name_en?: string | null
          gender?: string | null
          home_visit_price?: number | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          monthly_subscription_price?: number | null
          qualifications?: string[] | null
          rating_avg?: number
          rating_count?: number
          specialty?: string
          sub_specialty?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          video_consult_price?: number | null
          yearly_subscription_price?: number | null
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_verification_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_verification_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "email_verification_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          allergies: string[] | null
          avatar_emoji: string | null
          blood_type: string | null
          chronic_conditions: string[] | null
          created_at: string | null
          current_medications: string | null
          date_of_birth: string | null
          full_name: string
          gender: string | null
          height_cm: number | null
          id: string
          is_active: boolean
          notes: string | null
          owner_user_id: string
          phone: string | null
          relation: string
          updated_at: string | null
          weight_kg: number | null
        }
        Insert: {
          allergies?: string[] | null
          avatar_emoji?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          created_at?: string | null
          current_medications?: string | null
          date_of_birth?: string | null
          full_name: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          owner_user_id: string
          phone?: string | null
          relation: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Update: {
          allergies?: string[] | null
          avatar_emoji?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          created_at?: string | null
          current_medications?: string | null
          date_of_birth?: string | null
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          owner_user_id?: string
          phone?: string | null
          relation?: string
          updated_at?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "family_members_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      geocoding_cache: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          display_name: string
          governorate: string | null
          hit_count: number
          id: string
          last_used_at: string | null
          lat_rounded: number
          lng_rounded: number
          raw_data: Json | null
          road: string | null
          suburb: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name: string
          governorate?: string | null
          hit_count?: number
          id?: string
          last_used_at?: string | null
          lat_rounded: number
          lng_rounded: number
          raw_data?: Json | null
          road?: string | null
          suburb?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string
          governorate?: string | null
          hit_count?: number
          id?: string
          last_used_at?: string | null
          lat_rounded?: number
          lng_rounded?: number
          raw_data?: Json | null
          road?: string | null
          suburb?: string | null
        }
        Relationships: []
      }
      health_vitals: {
        Row: {
          created_at: string
          id: string
          measured_at: string
          notes: string | null
          unit: string | null
          user_id: string
          value: string
          vital_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          unit?: string | null
          user_id: string
          value: string
          vital_type: string
        }
        Update: {
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          unit?: string | null
          user_id?: string
          value?: string
          vital_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_vitals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_vitals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "health_vitals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_ratings: {
        Row: {
          appointment_id: string | null
          cleanliness_rating: number | null
          comment: string | null
          created_at: string
          department: string | null
          facilities_rating: number | null
          hospital_id: string
          id: string
          is_public: boolean
          rating: number
          staff_rating: number | null
          user_id: string
          wait_time_rating: number | null
          would_recommend: boolean
        }
        Insert: {
          appointment_id?: string | null
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string
          department?: string | null
          facilities_rating?: number | null
          hospital_id: string
          id?: string
          is_public?: boolean
          rating: number
          staff_rating?: number | null
          user_id: string
          wait_time_rating?: number | null
          would_recommend?: boolean
        }
        Update: {
          appointment_id?: string | null
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string
          department?: string | null
          facilities_rating?: number | null
          hospital_id?: string
          id?: string
          is_public?: boolean
          rating?: number
          staff_rating?: number | null
          user_id?: string
          wait_time_rating?: number | null
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "hospital_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_ratings_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospital_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "hospital_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          beds_count: number | null
          city: string
          cover_image_url: string | null
          created_at: string | null
          departments: string[] | null
          description: string | null
          district: string | null
          email: string | null
          has_ambulance: boolean
          has_emergency: boolean
          has_lab: boolean
          has_pharmacy: boolean
          has_radiology: boolean
          icu_beds_count: number | null
          id: string
          is_24h: boolean
          is_active: boolean
          is_verified: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          name_en: string | null
          phone: string | null
          phone_emergency: string | null
          rating_avg: number
          rating_count: number
          type: string
          updated_at: string | null
          visiting_hours: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          beds_count?: number | null
          city: string
          cover_image_url?: string | null
          created_at?: string | null
          departments?: string[] | null
          description?: string | null
          district?: string | null
          email?: string | null
          has_ambulance?: boolean
          has_emergency?: boolean
          has_lab?: boolean
          has_pharmacy?: boolean
          has_radiology?: boolean
          icu_beds_count?: number | null
          id?: string
          is_24h?: boolean
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          name_en?: string | null
          phone?: string | null
          phone_emergency?: string | null
          rating_avg?: number
          rating_count?: number
          type: string
          updated_at?: string | null
          visiting_hours?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          beds_count?: number | null
          city?: string
          cover_image_url?: string | null
          created_at?: string | null
          departments?: string[] | null
          description?: string | null
          district?: string | null
          email?: string | null
          has_ambulance?: boolean
          has_emergency?: boolean
          has_lab?: boolean
          has_pharmacy?: boolean
          has_radiology?: boolean
          icu_beds_count?: number | null
          id?: string
          is_24h?: boolean
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          name_en?: string | null
          phone?: string | null
          phone_emergency?: string | null
          rating_avg?: number
          rating_count?: number
          type?: string
          updated_at?: string | null
          visiting_hours?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          result: Json | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          key: string
          result?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          result?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idempotency_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "idempotency_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          appointment_id: string | null
          bundle_id: string | null
          created_at: string
          discount: number
          draw_fee: number
          expected_result_at: string | null
          family_member_id: string | null
          fasting_confirmed: boolean
          fasting_hours: number
          id: string
          internal_notes: string | null
          lab_name_snapshot: string | null
          needs_fasting: boolean
          notes: string | null
          partner_lab_id: string | null
          patient_age: number | null
          patient_condition: string | null
          patient_gender: string | null
          status: string
          test_ids: string[]
          tests_total: number
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          bundle_id?: string | null
          created_at?: string
          discount?: number
          draw_fee?: number
          expected_result_at?: string | null
          family_member_id?: string | null
          fasting_confirmed?: boolean
          fasting_hours?: number
          id?: string
          internal_notes?: string | null
          lab_name_snapshot?: string | null
          needs_fasting?: boolean
          notes?: string | null
          partner_lab_id?: string | null
          patient_age?: number | null
          patient_condition?: string | null
          patient_gender?: string | null
          status?: string
          test_ids: string[]
          tests_total?: number
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          bundle_id?: string | null
          created_at?: string
          discount?: number
          draw_fee?: number
          expected_result_at?: string | null
          family_member_id?: string | null
          fasting_confirmed?: boolean
          fasting_hours?: number
          id?: string
          internal_notes?: string | null
          lab_name_snapshot?: string | null
          needs_fasting?: boolean
          notes?: string | null
          partner_lab_id?: string | null
          patient_age?: number | null
          patient_condition?: string | null
          patient_gender?: string | null
          status?: string
          test_ids?: string[]
          tests_total?: number
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_partner_lab_id_fkey"
            columns: ["partner_lab_id"]
            isOneToOne: false
            referencedRelation: "partner_labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "lab_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          created_at: string
          entered_by: string | null
          flag: string | null
          id: string
          lab_order_id: string
          normal_range_max: number | null
          normal_range_min: number | null
          normal_range_text: string | null
          notes: string | null
          pdf_url: string | null
          result_numeric: number | null
          result_value: string | null
          results_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          test_id: string
          test_name: string
          tested_at: string | null
          unit: string | null
          updated_at: string
          user_id: string
          viewed_at: string | null
          viewed_by_patient: boolean
        }
        Insert: {
          created_at?: string
          entered_by?: string | null
          flag?: string | null
          id?: string
          lab_order_id: string
          normal_range_max?: number | null
          normal_range_min?: number | null
          normal_range_text?: string | null
          notes?: string | null
          pdf_url?: string | null
          result_numeric?: number | null
          result_value?: string | null
          results_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          test_id: string
          test_name: string
          tested_at?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
          viewed_at?: string | null
          viewed_by_patient?: boolean
        }
        Update: {
          created_at?: string
          entered_by?: string | null
          flag?: string | null
          id?: string
          lab_order_id?: string
          normal_range_max?: number | null
          normal_range_min?: number | null
          normal_range_text?: string | null
          notes?: string | null
          pdf_url?: string | null
          result_numeric?: number | null
          result_value?: string | null
          results_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          test_id?: string
          test_name?: string
          tested_at?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          viewed_at?: string | null
          viewed_by_patient?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "lab_results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "admin_lab_orders_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "lab_results_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "lab_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      launch_checklist: {
        Row: {
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean
          notes: string | null
          order_index: number
          priority: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          order_index?: number
          priority?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          order_index?: number
          priority?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_checklist_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "launch_checklist_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "launch_checklist_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_milestones: {
        Row: {
          badge_color: string | null
          badge_icon: string | null
          created_at: string | null
          description_ar: string | null
          discount_percent: number
          free_consultations_per_month: number
          free_delivery: boolean
          id: string
          is_active: boolean
          min_points: number
          name_ar: string
          priority_support: boolean
          tier: string
        }
        Insert: {
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string | null
          description_ar?: string | null
          discount_percent?: number
          free_consultations_per_month?: number
          free_delivery?: boolean
          id?: string
          is_active?: boolean
          min_points: number
          name_ar: string
          priority_support?: boolean
          tier: string
        }
        Update: {
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string | null
          description_ar?: string | null
          discount_percent?: number
          free_consultations_per_month?: number
          free_delivery?: boolean
          id?: string
          is_active?: boolean
          min_points?: number
          name_ar?: string
          priority_support?: boolean
          tier?: string
        }
        Relationships: []
      }
      medication_searches: {
        Row: {
          city_filter: string | null
          created_at: string | null
          found_any_available: boolean
          id: string
          ip_country: string | null
          medication_id: string | null
          results_count: number
          search_query: string
          user_id: string | null
        }
        Insert: {
          city_filter?: string | null
          created_at?: string | null
          found_any_available?: boolean
          id?: string
          ip_country?: string | null
          medication_id?: string | null
          results_count?: number
          search_query: string
          user_id?: string | null
        }
        Update: {
          city_filter?: string | null
          created_at?: string | null
          found_any_available?: boolean
          id?: string
          ip_country?: string | null
          medication_id?: string | null
          results_count?: number
          search_query?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_searches_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_searches_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications_with_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "medication_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          category: string
          contraindications: string | null
          country_of_origin: string | null
          created_at: string | null
          form: string | null
          generic_name: string | null
          id: string
          image_url: string | null
          is_controlled: boolean
          manufacturer: string | null
          name_ar: string
          name_en: string | null
          package_size: string | null
          requires_prescription: boolean
          search_keywords: string[] | null
          side_effects: string | null
          storage_notes: string | null
          strength: string | null
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          contraindications?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          form?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          is_controlled?: boolean
          manufacturer?: string | null
          name_ar: string
          name_en?: string | null
          package_size?: string | null
          requires_prescription?: boolean
          search_keywords?: string[] | null
          side_effects?: string | null
          storage_notes?: string | null
          strength?: string | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          contraindications?: string | null
          country_of_origin?: string | null
          created_at?: string | null
          form?: string | null
          generic_name?: string | null
          id?: string
          image_url?: string | null
          is_controlled?: boolean
          manufacturer?: string | null
          name_ar?: string
          name_en?: string | null
          package_size?: string | null
          requires_prescription?: boolean
          search_keywords?: string[] | null
          side_effects?: string | null
          storage_notes?: string | null
          strength?: string | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mental_health_ratings: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          empathy_rating: number | null
          helpfulness_rating: number | null
          id: string
          is_anonymous: boolean
          is_public: boolean
          professionalism_rating: number | null
          rating: number
          session_type: string | null
          specialist_id: string
          user_id: string
          would_recommend: boolean
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          empathy_rating?: number | null
          helpfulness_rating?: number | null
          id?: string
          is_anonymous?: boolean
          is_public?: boolean
          professionalism_rating?: number | null
          rating: number
          session_type?: string | null
          specialist_id: string
          user_id: string
          would_recommend?: boolean
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          empathy_rating?: number | null
          helpfulness_rating?: number | null
          id?: string
          is_anonymous?: boolean
          is_public?: boolean
          professionalism_rating?: number | null
          rating?: number
          session_type?: string | null
          specialist_id?: string
          user_id?: string
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "mental_health_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mental_health_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mental_health_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mental_health_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mental_health_ratings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "mental_health_specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mental_health_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mental_health_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "mental_health_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mental_health_specialists: {
        Row: {
          accepts_emergency: boolean
          address: string | null
          available_in_clinic: boolean
          available_online: boolean
          bio: string | null
          certifications: string[] | null
          cities: string[] | null
          clinic_address: string | null
          clinic_city: string | null
          clinic_name: string | null
          clinic_phone: string | null
          clinic_session_price: number | null
          created_at: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean
          is_verified: boolean
          languages: string[] | null
          latitude: number | null
          longitude: number | null
          online_session_price: number | null
          photo_url: string | null
          rating_avg: number
          rating_count: number
          session_duration_minutes: number
          specialist_type: string
          specialties: string[] | null
          title: string
          total_sessions: number
          updated_at: string | null
          user_id: string | null
          years_experience: number
        }
        Insert: {
          accepts_emergency?: boolean
          address?: string | null
          available_in_clinic?: boolean
          available_online?: boolean
          bio?: string | null
          certifications?: string[] | null
          cities?: string[] | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_session_price?: number | null
          created_at?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          online_session_price?: number | null
          photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          session_duration_minutes?: number
          specialist_type: string
          specialties?: string[] | null
          title?: string
          total_sessions?: number
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number
        }
        Update: {
          accepts_emergency?: boolean
          address?: string | null
          available_in_clinic?: boolean
          available_online?: boolean
          bio?: string | null
          certifications?: string[] | null
          cities?: string[] | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_session_price?: number | null
          created_at?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          online_session_price?: number | null
          photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          session_duration_minutes?: number
          specialist_type?: string
          specialties?: string[] | null
          title?: string
          total_sessions?: number
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "mental_health_specialists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mental_health_specialists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "mental_health_specialists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_url: string | null
          chat_id: string
          content: string | null
          created_at: string
          edited_at: string | null
          id: string
          is_deleted: boolean
          is_edited: boolean
          is_read: boolean
          read_at: string | null
          reply_to_id: string | null
          sender_id: string
          type: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          chat_id: string
          content?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          is_read?: boolean
          read_at?: string | null
          reply_to_id?: string | null
          sender_id: string
          type?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          chat_id?: string
          content?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          is_read?: boolean
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          archived_at: string | null
          body_preview: string | null
          channel: string
          id: string
          provider: string | null
          recipient_phone: string
          related_id: string | null
          related_type: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          archived_at?: string | null
          body_preview?: string | null
          channel: string
          id?: string
          provider?: string | null
          recipient_phone: string
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status: string
        }
        Update: {
          archived_at?: string | null
          body_preview?: string | null
          channel?: string
          id?: string
          provider?: string | null
          recipient_phone?: string
          related_id?: string | null
          related_type?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          appointment_reminders: boolean
          messages: boolean
          promotions: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          system_updates: boolean
          test_results: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_reminders?: boolean
          messages?: boolean
          promotions?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_updates?: boolean
          test_results?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_reminders?: boolean
          messages?: boolean
          promotions?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          system_updates?: boolean
          test_results?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number
          body: string
          channel: string
          created_at: string | null
          created_by: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          max_attempts: number
          provider: string | null
          provider_message_id: string | null
          recipient_phone: string
          recipient_user_id: string | null
          related_id: string | null
          related_type: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          template_key: string | null
        }
        Insert: {
          attempts?: number
          body: string
          channel: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          max_attempts?: number
          provider?: string | null
          provider_message_id?: string | null
          recipient_phone: string
          recipient_user_id?: string | null
          related_id?: string | null
          related_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          template_key?: string | null
        }
        Update: {
          attempts?: number
          body?: string
          channel?: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          max_attempts?: number
          provider?: string | null
          provider_message_id?: string | null
          recipient_phone?: string
          recipient_user_id?: string | null
          related_id?: string | null
          related_type?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          template_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "notification_queue_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "notification_queue_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_ar: string
          channel: string
          created_at: string | null
          id: string
          is_active: boolean
          key: string
          name_ar: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body_ar: string
          channel: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          key: string
          name_ar: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body_ar?: string
          channel?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name_ar?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nurse_emergency_logs: {
        Row: {
          accuracy_m: number | null
          appointment_id: string | null
          call_center_notified: boolean
          contacted_911: boolean
          created_at: string | null
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          resolution_notes: string | null
          resolved_at: string | null
          specialist_id: string
          status: string | null
          trigger_reason: string | null
        }
        Insert: {
          accuracy_m?: number | null
          appointment_id?: string | null
          call_center_notified?: boolean
          contacted_911?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          specialist_id: string
          status?: string | null
          trigger_reason?: string | null
        }
        Update: {
          accuracy_m?: number | null
          appointment_id?: string | null
          call_center_notified?: boolean
          contacted_911?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          specialist_id?: string
          status?: string | null
          trigger_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nurse_emergency_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_emergency_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_emergency_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_emergency_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_emergency_logs_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_emergency_logs_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "nurse_emergency_logs_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nurse_ratings: {
        Row: {
          appointment_id: string | null
          attitude_rating: number | null
          comment: string | null
          created_at: string
          expertise_rating: number | null
          hygiene_rating: number | null
          id: string
          is_public: boolean
          punctuality_rating: number | null
          rating: number
          specialist_id: string
          user_id: string
          visit_id: string | null
          would_recommend: boolean
        }
        Insert: {
          appointment_id?: string | null
          attitude_rating?: number | null
          comment?: string | null
          created_at?: string
          expertise_rating?: number | null
          hygiene_rating?: number | null
          id?: string
          is_public?: boolean
          punctuality_rating?: number | null
          rating: number
          specialist_id: string
          user_id: string
          visit_id?: string | null
          would_recommend?: boolean
        }
        Update: {
          appointment_id?: string | null
          attitude_rating?: number | null
          comment?: string | null
          created_at?: string
          expertise_rating?: number | null
          hygiene_rating?: number | null
          id?: string
          is_public?: boolean
          punctuality_rating?: number | null
          rating?: number
          specialist_id?: string
          user_id?: string
          visit_id?: string | null
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "nurse_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_ratings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_ratings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "nurse_ratings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "nurse_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_ratings_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "nursing_visit_history"
            referencedColumns: ["id"]
          },
        ]
      }
      nursing_visit_history: {
        Row: {
          appointment_id: string | null
          complications: string | null
          created_at: string | null
          family_member_id: string | null
          follow_up_required: boolean
          id: string
          notes: string | null
          performed_at: string | null
          procedure_details: Json | null
          procedure_type: string
          specialist_id: string | null
          user_id: string
          vital_signs: Json | null
        }
        Insert: {
          appointment_id?: string | null
          complications?: string | null
          created_at?: string | null
          family_member_id?: string | null
          follow_up_required?: boolean
          id?: string
          notes?: string | null
          performed_at?: string | null
          procedure_details?: Json | null
          procedure_type: string
          specialist_id?: string | null
          user_id: string
          vital_signs?: Json | null
        }
        Update: {
          appointment_id?: string | null
          complications?: string | null
          created_at?: string | null
          family_member_id?: string | null
          follow_up_required?: boolean
          id?: string
          notes?: string | null
          performed_at?: string | null
          procedure_details?: Json | null
          procedure_type?: string
          specialist_id?: string | null
          user_id?: string
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "nursing_visit_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_visit_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_visit_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_visit_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_visit_history_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_visit_history_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_visit_history_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "nursing_visit_history_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_visit_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_visit_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "nursing_visit_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutritionist_ratings: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          id: string
          is_public: boolean
          nutritionist_id: string
          package_type: string | null
          plan_quality_rating: number | null
          rating: number
          responsiveness_rating: number | null
          results_rating: number | null
          user_id: string
          would_recommend: boolean
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          nutritionist_id: string
          package_type?: string | null
          plan_quality_rating?: number | null
          rating: number
          responsiveness_rating?: number | null
          results_rating?: number | null
          user_id: string
          would_recommend?: boolean
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          nutritionist_id?: string
          package_type?: string | null
          plan_quality_rating?: number | null
          rating?: number
          responsiveness_rating?: number | null
          results_rating?: number | null
          user_id?: string
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "nutritionist_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutritionist_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutritionist_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutritionist_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutritionist_ratings_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutritionist_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutritionist_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "nutritionist_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutritionists: {
        Row: {
          address: string | null
          available_in_clinic: boolean
          available_online: boolean
          bio: string | null
          certifications: string[] | null
          cities: string[] | null
          clinic_address: string | null
          clinic_city: string | null
          clinic_name: string | null
          clinic_phone: string | null
          created_at: string | null
          follow_up_price: number | null
          full_name: string
          gender: string | null
          id: string
          initial_consultation_price: number | null
          is_active: boolean
          is_verified: boolean
          languages: string[] | null
          latitude: number | null
          longitude: number | null
          monthly_plan_price: number | null
          photo_url: string | null
          rating_avg: number
          rating_count: number
          specialties: string[] | null
          success_rate: number
          title: string
          total_clients: number
          updated_at: string | null
          user_id: string | null
          years_experience: number
        }
        Insert: {
          address?: string | null
          available_in_clinic?: boolean
          available_online?: boolean
          bio?: string | null
          certifications?: string[] | null
          cities?: string[] | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string | null
          follow_up_price?: number | null
          full_name: string
          gender?: string | null
          id?: string
          initial_consultation_price?: number | null
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          monthly_plan_price?: number | null
          photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          specialties?: string[] | null
          success_rate?: number
          title?: string
          total_clients?: number
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number
        }
        Update: {
          address?: string | null
          available_in_clinic?: boolean
          available_online?: boolean
          bio?: string | null
          certifications?: string[] | null
          cities?: string[] | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string | null
          follow_up_price?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          initial_consultation_price?: number | null
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          monthly_plan_price?: number | null
          photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          specialties?: string[] | null
          success_rate?: number
          title?: string
          total_clients?: number
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "nutritionists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutritionists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "nutritionists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      optical_ratings: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          id: string
          is_public: boolean
          optical_store_id: string
          price_rating: number | null
          quality_rating: number | null
          rating: number
          selection_rating: number | null
          service_rating: number | null
          service_type: string | null
          user_id: string
          would_recommend: boolean
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          optical_store_id: string
          price_rating?: number | null
          quality_rating?: number | null
          rating: number
          selection_rating?: number | null
          service_rating?: number | null
          service_type?: string | null
          user_id: string
          would_recommend?: boolean
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          optical_store_id?: string
          price_rating?: number | null
          quality_rating?: number | null
          rating?: number
          selection_rating?: number | null
          service_rating?: number | null
          service_type?: string | null
          user_id?: string
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "optical_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_ratings_optical_store_id_fkey"
            columns: ["optical_store_id"]
            isOneToOne: false
            referencedRelation: "optical_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "optical_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "optical_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      optical_stores: {
        Row: {
          address: string | null
          brands: string[] | null
          city: string
          created_at: string | null
          description: string | null
          district: string | null
          exam_price: number | null
          frame_price_max: number | null
          frame_price_min: number | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_verified: boolean
          latitude: number | null
          lens_price_max: number | null
          lens_price_min: number | null
          longitude: number | null
          name: string
          offers_contact_lenses: boolean
          offers_eye_exam: boolean
          offers_eye_surgery_referral: boolean
          offers_prescription_lenses: boolean
          offers_sunglasses: boolean
          phone: string | null
          rating_avg: number
          rating_count: number
          updated_at: string | null
          whatsapp: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          brands?: string[] | null
          city: string
          created_at?: string | null
          description?: string | null
          district?: string | null
          exam_price?: number | null
          frame_price_max?: number | null
          frame_price_min?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_verified?: boolean
          latitude?: number | null
          lens_price_max?: number | null
          lens_price_min?: number | null
          longitude?: number | null
          name: string
          offers_contact_lenses?: boolean
          offers_eye_exam?: boolean
          offers_eye_surgery_referral?: boolean
          offers_prescription_lenses?: boolean
          offers_sunglasses?: boolean
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          brands?: string[] | null
          city?: string
          created_at?: string | null
          description?: string | null
          district?: string | null
          exam_price?: number | null
          frame_price_max?: number | null
          frame_price_min?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_verified?: boolean
          latitude?: number | null
          lens_price_max?: number | null
          lens_price_min?: number | null
          longitude?: number | null
          name?: string
          offers_contact_lenses?: boolean
          offers_eye_exam?: boolean
          offers_eye_surgery_referral?: boolean
          offers_prescription_lenses?: boolean
          offers_sunglasses?: boolean
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          updated_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      otp_attempts: {
        Row: {
          attempts: number
          blocked_until: string | null
          id: string
          last_attempt_at: string
          phone: string
        }
        Insert: {
          attempts?: number
          blocked_until?: string | null
          id?: string
          last_attempt_at?: string
          phone: string
        }
        Update: {
          attempts?: number
          blocked_until?: string | null
          id?: string
          last_attempt_at?: string
          phone?: string
        }
        Relationships: []
      }
      partner_labs: {
        Row: {
          accepts_home_draw: boolean
          address: string | null
          city: string
          created_at: string
          description: string | null
          governorate: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name_ar: string
          name_en: string | null
          phone: string | null
          rating_avg: number
          rating_count: number
          slug: string | null
          specialties: string[] | null
          total_orders: number
          updated_at: string
          website: string | null
          whatsapp: string | null
          working_hours: Json | null
        }
        Insert: {
          accepts_home_draw?: boolean
          address?: string | null
          city: string
          created_at?: string
          description?: string | null
          governorate?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name_ar: string
          name_en?: string | null
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string | null
          specialties?: string[] | null
          total_orders?: number
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          working_hours?: Json | null
        }
        Update: {
          accepts_home_draw?: boolean
          address?: string | null
          city?: string
          created_at?: string
          description?: string | null
          governorate?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name_ar?: string
          name_en?: string | null
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string | null
          specialties?: string[] | null
          total_orders?: number
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      patient_notes: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          is_pinned: boolean
          note: string
          note_type: string | null
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean
          note: string
          note_type?: string | null
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean
          note?: string
          note_type?: string | null
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "patient_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_tags: {
        Row: {
          added_by: string | null
          color: string | null
          created_at: string | null
          id: string
          patient_id: string
          tag: string
        }
        Insert: {
          added_by?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          patient_id: string
          tag: string
        }
        Update: {
          added_by?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          patient_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_tags_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tags_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "patient_tags_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tags_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_tags_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "patient_tags_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          currency: string
          id: string
          method: string
          notes: string | null
          paid_at: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string
          currency?: string
          id?: string
          method: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          currency?: string
          id?: string
          method?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          accepts_insurance: boolean
          address: string | null
          city: string
          closes_at: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          district: string
          has_delivery: boolean
          has_emergency_section: boolean
          id: string
          is_24h: boolean
          is_active: boolean
          is_verified: boolean
          latitude: number | null
          license_image_url: string | null
          license_number: string | null
          longitude: number | null
          name: string
          opens_at: string | null
          owner_user_id: string | null
          phone: string
          rating_avg: number
          rating_count: number
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          whatsapp: string | null
          working_days: string[] | null
        }
        Insert: {
          accepts_insurance?: boolean
          address?: string | null
          city: string
          closes_at?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          district: string
          has_delivery?: boolean
          has_emergency_section?: boolean
          id?: string
          is_24h?: boolean
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          license_image_url?: string | null
          license_number?: string | null
          longitude?: number | null
          name: string
          opens_at?: string | null
          owner_user_id?: string | null
          phone: string
          rating_avg?: number
          rating_count?: number
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          whatsapp?: string | null
          working_days?: string[] | null
        }
        Update: {
          accepts_insurance?: boolean
          address?: string | null
          city?: string
          closes_at?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          district?: string
          has_delivery?: boolean
          has_emergency_section?: boolean
          id?: string
          is_24h?: boolean
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          license_image_url?: string | null
          license_number?: string | null
          longitude?: number | null
          name?: string
          opens_at?: string | null
          owner_user_id?: string | null
          phone?: string
          rating_avg?: number
          rating_count?: number
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          whatsapp?: string | null
          working_days?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacies_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacies_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "pharmacies_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacies_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacies_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "pharmacies_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_favorites: {
        Row: {
          created_at: string
          id: string
          pharmacy_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pharmacy_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pharmacy_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_favorites_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_favorites_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_inventory_stats"
            referencedColumns: ["pharmacy_id"]
          },
          {
            foreignKeyName: "pharmacy_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "pharmacy_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_inventory: {
        Row: {
          added_at: string | null
          brand_variant: string | null
          custom_price: number | null
          id: string
          is_available: boolean
          last_searched_at: string | null
          marked_unavailable_at: string | null
          medication_id: string
          notes: string | null
          pharmacy_id: string
          searched_count: number
          updated_at: string | null
        }
        Insert: {
          added_at?: string | null
          brand_variant?: string | null
          custom_price?: number | null
          id?: string
          is_available?: boolean
          last_searched_at?: string | null
          marked_unavailable_at?: string | null
          medication_id: string
          notes?: string | null
          pharmacy_id: string
          searched_count?: number
          updated_at?: string | null
        }
        Update: {
          added_at?: string | null
          brand_variant?: string | null
          custom_price?: number | null
          id?: string
          is_available?: boolean
          last_searched_at?: string | null
          marked_unavailable_at?: string | null
          medication_id?: string
          notes?: string | null
          pharmacy_id?: string
          searched_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_inventory_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications_with_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_inventory_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_inventory_stats"
            referencedColumns: ["pharmacy_id"]
          },
        ]
      }
      pharmacy_ratings: {
        Row: {
          availability_rating: number | null
          comment: string | null
          created_at: string
          id: string
          is_public: boolean
          pharmacy_id: string
          price_rating: number | null
          rating: number
          reservation_id: string | null
          service_rating: number | null
          user_id: string
          would_recommend: boolean
        }
        Insert: {
          availability_rating?: number | null
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          pharmacy_id: string
          price_rating?: number | null
          rating: number
          reservation_id?: string | null
          service_rating?: number | null
          user_id: string
          would_recommend?: boolean
        }
        Update: {
          availability_rating?: number | null
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          pharmacy_id?: string
          price_rating?: number | null
          rating?: number
          reservation_id?: string | null
          service_rating?: number | null
          user_id?: string
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_ratings_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_ratings_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_inventory_stats"
            referencedColumns: ["pharmacy_id"]
          },
          {
            foreignKeyName: "pharmacy_ratings_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "pharmacy_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_reservations: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_notes: string | null
          expected_pickup_at: string | null
          expires_at: string | null
          family_member_id: string | null
          id: string
          items: Json
          pharmacy_id: string
          pharmacy_notes: string | null
          picked_up_at: string | null
          prescription_id: string | null
          prescription_image_url: string | null
          status: string
          total_estimated_price: number | null
          total_final_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_notes?: string | null
          expected_pickup_at?: string | null
          expires_at?: string | null
          family_member_id?: string | null
          id?: string
          items: Json
          pharmacy_id: string
          pharmacy_notes?: string | null
          picked_up_at?: string | null
          prescription_id?: string | null
          prescription_image_url?: string | null
          status?: string
          total_estimated_price?: number | null
          total_final_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_notes?: string | null
          expected_pickup_at?: string | null
          expires_at?: string | null
          family_member_id?: string | null
          id?: string
          items?: Json
          pharmacy_id?: string
          pharmacy_notes?: string | null
          picked_up_at?: string | null
          prescription_id?: string | null
          prescription_image_url?: string | null
          status?: string
          total_estimated_price?: number | null
          total_final_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_reservations_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_reservations_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_reservations_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_inventory_stats"
            referencedColumns: ["pharmacy_id"]
          },
          {
            foreignKeyName: "pharmacy_reservations_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "pharmacy_reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      physio_ratings: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          id: string
          improvement_rating: number | null
          is_public: boolean
          punctuality_rating: number | null
          rating: number
          service_type_slug: string | null
          session_type: string | null
          skill_rating: number | null
          specialist_id: string
          user_id: string
          would_recommend: boolean
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          improvement_rating?: number | null
          is_public?: boolean
          punctuality_rating?: number | null
          rating: number
          service_type_slug?: string | null
          session_type?: string | null
          skill_rating?: number | null
          specialist_id: string
          user_id: string
          would_recommend?: boolean
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          improvement_rating?: number | null
          is_public?: boolean
          punctuality_rating?: number | null
          rating?: number
          service_type_slug?: string | null
          session_type?: string | null
          skill_rating?: number | null
          specialist_id?: string
          user_id?: string
          would_recommend?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "physio_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physio_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physio_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physio_ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physio_ratings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "physio_specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physio_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physio_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "physio_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      physio_service_types: {
        Row: {
          base_price: number
          conditions: string[] | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          order_index: number
          recommended_sessions: number
          session_duration_minutes: number
          slug: string
        }
        Insert: {
          base_price?: number
          conditions?: string[] | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          order_index?: number
          recommended_sessions?: number
          session_duration_minutes?: number
          slug: string
        }
        Update: {
          base_price?: number
          conditions?: string[] | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          order_index?: number
          recommended_sessions?: number
          session_duration_minutes?: number
          slug?: string
        }
        Relationships: []
      }
      physio_specialists: {
        Row: {
          available_for_clinic: boolean
          available_for_home: boolean
          bio: string | null
          certifications: string[] | null
          cities: string[] | null
          clinic_address: string | null
          clinic_city: string | null
          clinic_name: string | null
          clinic_phone: string | null
          clinic_visit_price: number | null
          created_at: string | null
          full_name: string
          gender: string | null
          home_visit_price: number | null
          id: string
          is_active: boolean
          is_verified: boolean
          languages: string[] | null
          package_discount_pct: number
          photo_url: string | null
          rating_avg: number
          rating_count: number
          specialties: string[] | null
          title: string
          total_sessions: number
          updated_at: string | null
          user_id: string | null
          years_experience: number
        }
        Insert: {
          available_for_clinic?: boolean
          available_for_home?: boolean
          bio?: string | null
          certifications?: string[] | null
          cities?: string[] | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_visit_price?: number | null
          created_at?: string | null
          full_name: string
          gender?: string | null
          home_visit_price?: number | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          package_discount_pct?: number
          photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          specialties?: string[] | null
          title?: string
          total_sessions?: number
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number
        }
        Update: {
          available_for_clinic?: boolean
          available_for_home?: boolean
          bio?: string | null
          certifications?: string[] | null
          cities?: string[] | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          clinic_visit_price?: number | null
          created_at?: string | null
          full_name?: string
          gender?: string | null
          home_visit_price?: number | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          languages?: string[] | null
          package_discount_pct?: number
          photo_url?: string | null
          rating_avg?: number
          rating_count?: number
          specialties?: string[] | null
          title?: string
          total_sessions?: number
          updated_at?: string | null
          user_id?: string | null
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "physio_specialists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physio_specialists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "physio_specialists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          appointment_id: string | null
          created_at: string
          doctor_name: string
          doctor_specialty: string | null
          dosage: string | null
          duration_days: number | null
          frequency: string | null
          id: string
          medication: string
          notes: string | null
          prescribed_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          doctor_name: string
          doctor_specialty?: string | null
          dosage?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          medication: string
          notes?: string | null
          prescribed_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          doctor_name?: string
          doctor_specialty?: string | null
          dosage?: string | null
          duration_days?: number | null
          frequency?: string | null
          id?: string
          medication?: string
          notes?: string | null
          prescribed_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "prescriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          device_label: string | null
          endpoint: string
          id: string
          is_active: boolean
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          device_label?: string | null
          endpoint: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          device_label?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_replies: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          shortcut: string
          specialist_id: string
          updated_at: string
          use_count: number
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          shortcut: string
          specialist_id: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          shortcut?: string
          specialist_id?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "quick_replies_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_replies_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "quick_replies_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          bucket_key: string
          count: number
          created_at: string
          reset_at: string
        }
        Insert: {
          bucket_key: string
          count?: number
          created_at?: string
          reset_at: string
        }
        Update: {
          bucket_key?: string
          count?: number
          created_at?: string
          reset_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          appointment_id: string
          cleanliness_rating: number | null
          created_at: string
          id: string
          is_anonymous: boolean
          is_published: boolean
          overall_rating: number
          professionalism_rating: number | null
          punctuality_rating: number | null
          review_text: string | null
          specialist_id: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          appointment_id: string
          cleanliness_rating?: number | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_published?: boolean
          overall_rating: number
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          review_text?: string | null
          specialist_id?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          appointment_id?: string
          cleanliness_rating?: number | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_published?: boolean
          overall_rating?: number
          professionalism_rating?: number | null
          punctuality_rating?: number | null
          review_text?: string | null
          specialist_id?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "ratings_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          successful_referrals: number
          total_earned: number
          total_referrals: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          successful_referrals?: number
          total_earned?: number
          total_referrals?: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          successful_referrals?: number
          total_earned?: number
          total_referrals?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          qualified_at: string | null
          referral_code: string
          referred_bonus: number
          referred_id: string
          referrer_id: string
          referrer_reward: number
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          qualified_at?: string | null
          referral_code: string
          referred_bonus?: number
          referred_id: string
          referrer_id: string
          referrer_reward?: number
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          qualified_at?: string | null
          referral_code?: string
          referred_bonus?: number
          referred_id?: string
          referrer_id?: string
          referrer_reward?: number
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          frequency: string
          id: string
          last_triggered: string | null
          scheduled_at: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          last_triggered?: string | null
          scheduled_at: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          last_triggered?: string | null
          scheduled_at?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_favorites: {
        Row: {
          created_at: string
          id: string
          service_id: string
          service_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          service_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          service_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "service_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_applications: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          documents: Json | null
          id: string
          professional_data: Json | null
          rejection_reason: string | null
          status: string | null
          step_1_completed_at: string | null
          step_2_completed_at: string | null
          step_3_completed_at: string | null
          step_4_completed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          professional_data?: Json | null
          rejection_reason?: string | null
          status?: string | null
          step_1_completed_at?: string | null
          step_2_completed_at?: string | null
          step_3_completed_at?: string | null
          step_4_completed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          documents?: Json | null
          id?: string
          professional_data?: Json | null
          rejection_reason?: string | null
          status?: string | null
          step_1_completed_at?: string | null
          step_2_completed_at?: string | null
          step_3_completed_at?: string | null
          step_4_completed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "specialist_applications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "specialist_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_credentials_log: {
        Row: {
          action: string
          created_at: string | null
          document_type: string
          document_url: string | null
          id: string
          notes: string | null
          reviewed_by: string | null
          specialist_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          document_type: string
          document_url?: string | null
          id?: string
          notes?: string | null
          reviewed_by?: string | null
          specialist_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          document_type?: string
          document_url?: string | null
          id?: string
          notes?: string | null
          reviewed_by?: string | null
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_credentials_log_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_credentials_log_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "specialist_credentials_log_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_credentials_log_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_credentials_log_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "specialist_credentials_log_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_schedules: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          specialist_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          specialist_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          specialist_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_schedules_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_schedules_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "specialist_schedules_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          color_theme: string
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          href: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          color_theme?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          href?: string
          icon: string
          id?: string
          is_active?: boolean
          sort_order?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          color_theme?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          href?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "stories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string | null
          display_icon: string | null
          display_meta: Json | null
          display_name: string | null
          display_subtitle: string | null
          favorite_type: string
          id: string
          reference_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_icon?: string | null
          display_meta?: Json | null
          display_name?: string | null
          display_subtitle?: string | null
          favorite_type: string
          id?: string
          reference_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_icon?: string | null
          display_meta?: Json | null
          display_name?: string | null
          display_subtitle?: string | null
          favorite_type?: string
          id?: string
          reference_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          admin_notes: string | null
          category: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          message: string
          page_url: string | null
          rating: number | null
          resolved_at: string | null
          reviewed_at: string | null
          status: string
          subject: string | null
          type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          message: string
          page_url?: string | null
          rating?: number | null
          resolved_at?: string | null
          reviewed_at?: string | null
          status?: string
          subject?: string | null
          type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          message?: string
          page_url?: string | null
          rating?: number | null
          resolved_at?: string | null
          reviewed_at?: string | null
          status?: string
          subject?: string | null
          type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_medications: {
        Row: {
          created_at: string
          custom_name: string | null
          dosage: string | null
          enable_reminders: boolean
          end_date: string | null
          family_member_id: string | null
          frequency: string | null
          id: string
          is_active: boolean
          is_chronic: boolean
          medication_id: string | null
          notes: string | null
          prescription_id: string | null
          start_date: string | null
          timing: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_name?: string | null
          dosage?: string | null
          enable_reminders?: boolean
          end_date?: string | null
          family_member_id?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          is_chronic?: boolean
          medication_id?: string | null
          notes?: string | null
          prescription_id?: string | null
          start_date?: string | null
          timing?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_name?: string | null
          dosage?: string | null
          enable_reminders?: boolean
          end_date?: string | null
          family_member_id?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean
          is_chronic?: boolean
          medication_id?: string | null
          notes?: string | null
          prescription_id?: string | null
          start_date?: string | null
          timing?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_medications_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications_with_availability"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_medications_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_medications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_medications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "user_medications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_locations: {
        Row: {
          address: string
          created_at: string | null
          governorate: string | null
          icon: string | null
          id: string
          is_pinned: boolean
          label: string
          last_used_at: string | null
          lat: number
          lng: number
          notes: string | null
          updated_at: string | null
          use_count: number
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          governorate?: string | null
          icon?: string | null
          id?: string
          is_pinned?: boolean
          label: string
          last_used_at?: string | null
          lat: number
          lng: number
          notes?: string | null
          updated_at?: string | null
          use_count?: number
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          governorate?: string | null
          icon?: string | null
          id?: string
          is_pinned?: boolean
          label?: string
          last_used_at?: string | null
          lat?: number
          lng?: number
          notes?: string | null
          updated_at?: string | null
          use_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "user_saved_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_telegram_links: {
        Row: {
          id: string
          is_active: boolean
          linked_at: string
          telegram_user_id: number
          telegram_username: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          linked_at?: string
          telegram_user_id: number
          telegram_username?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          linked_at?: string
          telegram_user_id?: number
          telegram_username?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_telegram_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_telegram_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "user_telegram_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          admin_internal_notes: string | null
          approval_status: string | null
          auto_reply_message: string | null
          bio: string | null
          clinic_address: string | null
          clinic_city: string | null
          clinic_latitude: number | null
          clinic_longitude: number | null
          clinic_name: string | null
          clinic_phone: string | null
          created_at: string
          credentials_verified_at: string | null
          credentials_verified_by: string | null
          cv_url: string | null
          email: string | null
          email_verified: boolean
          email_verified_at: string | null
          emergency_kit_confirmed: boolean
          emergency_kit_confirmed_at: string | null
          emergency_kit_items: Json | null
          full_name: string | null
          governorate: string | null
          health_ministry_expires_at: string | null
          health_ministry_license_number: string | null
          health_ministry_license_url: string | null
          health_ministry_verified: boolean
          id: string
          is_suspended: boolean
          last_active_at: string | null
          last_seen_at: string | null
          license_number: string | null
          loyalty_points: number
          loyalty_tier: string | null
          medical_info: Json | null
          notification_preferences: Json | null
          nursing_union_expires_at: string | null
          nursing_union_id_number: string | null
          nursing_union_id_url: string | null
          nursing_union_verified: boolean
          password_hash: string | null
          phone: string
          preferred_otp_channel: string | null
          profile_completed: boolean
          rejection_reason: string | null
          role: Database["public"]["Enums"]["user_role"]
          signup_method: string | null
          specialist_bio: string | null
          specialist_certifications: Json | null
          specialist_languages: string[] | null
          specialist_type: string | null
          specialist_years_exp: number | null
          specializations: string[] | null
          specialty: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          user_settings: Json | null
          wa_id: string | null
          wa_otp_enabled: boolean
          wa_verified: boolean
          wa_verified_at: string | null
          wallet_balance: number
          work_address: string | null
          work_lat: number | null
          work_lng: number | null
          years_experience: number | null
        }
        Insert: {
          admin_internal_notes?: string | null
          approval_status?: string | null
          auto_reply_message?: string | null
          bio?: string | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          credentials_verified_at?: string | null
          credentials_verified_by?: string | null
          cv_url?: string | null
          email?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
          emergency_kit_confirmed?: boolean
          emergency_kit_confirmed_at?: string | null
          emergency_kit_items?: Json | null
          full_name?: string | null
          governorate?: string | null
          health_ministry_expires_at?: string | null
          health_ministry_license_number?: string | null
          health_ministry_license_url?: string | null
          health_ministry_verified?: boolean
          id: string
          is_suspended?: boolean
          last_active_at?: string | null
          last_seen_at?: string | null
          license_number?: string | null
          loyalty_points?: number
          loyalty_tier?: string | null
          medical_info?: Json | null
          notification_preferences?: Json | null
          nursing_union_expires_at?: string | null
          nursing_union_id_number?: string | null
          nursing_union_id_url?: string | null
          nursing_union_verified?: boolean
          password_hash?: string | null
          phone: string
          preferred_otp_channel?: string | null
          profile_completed?: boolean
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_method?: string | null
          specialist_bio?: string | null
          specialist_certifications?: Json | null
          specialist_languages?: string[] | null
          specialist_type?: string | null
          specialist_years_exp?: number | null
          specializations?: string[] | null
          specialty?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_settings?: Json | null
          wa_id?: string | null
          wa_otp_enabled?: boolean
          wa_verified?: boolean
          wa_verified_at?: string | null
          wallet_balance?: number
          work_address?: string | null
          work_lat?: number | null
          work_lng?: number | null
          years_experience?: number | null
        }
        Update: {
          admin_internal_notes?: string | null
          approval_status?: string | null
          auto_reply_message?: string | null
          bio?: string | null
          clinic_address?: string | null
          clinic_city?: string | null
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          credentials_verified_at?: string | null
          credentials_verified_by?: string | null
          cv_url?: string | null
          email?: string | null
          email_verified?: boolean
          email_verified_at?: string | null
          emergency_kit_confirmed?: boolean
          emergency_kit_confirmed_at?: string | null
          emergency_kit_items?: Json | null
          full_name?: string | null
          governorate?: string | null
          health_ministry_expires_at?: string | null
          health_ministry_license_number?: string | null
          health_ministry_license_url?: string | null
          health_ministry_verified?: boolean
          id?: string
          is_suspended?: boolean
          last_active_at?: string | null
          last_seen_at?: string | null
          license_number?: string | null
          loyalty_points?: number
          loyalty_tier?: string | null
          medical_info?: Json | null
          notification_preferences?: Json | null
          nursing_union_expires_at?: string | null
          nursing_union_id_number?: string | null
          nursing_union_id_url?: string | null
          nursing_union_verified?: boolean
          password_hash?: string | null
          phone?: string
          preferred_otp_channel?: string | null
          profile_completed?: boolean
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_method?: string | null
          specialist_bio?: string | null
          specialist_certifications?: Json | null
          specialist_languages?: string[] | null
          specialist_type?: string | null
          specialist_years_exp?: number | null
          specializations?: string[] | null
          specialty?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_settings?: Json | null
          wa_id?: string | null
          wa_otp_enabled?: boolean
          wa_verified?: boolean
          wa_verified_at?: string | null
          wallet_balance?: number
          work_address?: string | null
          work_lat?: number | null
          work_lng?: number | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_credentials_verified_by_fkey"
            columns: ["credentials_verified_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_credentials_verified_by_fkey"
            columns: ["credentials_verified_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "users_credentials_verified_by_fkey"
            columns: ["credentials_verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "users_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccination_records: {
        Row: {
          administered_at: string
          administered_by: string | null
          batch_number: string | null
          certificate_url: string | null
          clinic_id: string | null
          clinic_name: string | null
          created_at: string
          dose_number: number
          expiry_date: string | null
          family_member_id: string | null
          id: string
          notes: string | null
          side_effects: string | null
          source: string | null
          user_id: string
          vaccine_id: string
        }
        Insert: {
          administered_at: string
          administered_by?: string | null
          batch_number?: string | null
          certificate_url?: string | null
          clinic_id?: string | null
          clinic_name?: string | null
          created_at?: string
          dose_number?: number
          expiry_date?: string | null
          family_member_id?: string | null
          id?: string
          notes?: string | null
          side_effects?: string | null
          source?: string | null
          user_id: string
          vaccine_id: string
        }
        Update: {
          administered_at?: string
          administered_by?: string | null
          batch_number?: string | null
          certificate_url?: string | null
          clinic_id?: string | null
          clinic_name?: string | null
          created_at?: string
          dose_number?: number
          expiry_date?: string | null
          family_member_id?: string | null
          id?: string
          notes?: string | null
          side_effects?: string | null
          source?: string | null
          user_id?: string
          vaccine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "vaccine_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "vaccination_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_clinics: {
        Row: {
          address: string | null
          city: string
          closes_at: string | null
          created_at: string
          district: string | null
          home_visit_price: number | null
          id: string
          is_active: boolean
          is_verified: boolean
          latitude: number | null
          longitude: number | null
          name: string
          offers_adult: boolean
          offers_covid: boolean
          offers_home_visit: boolean
          offers_pediatric: boolean
          offers_travel: boolean
          opens_at: string | null
          phone: string | null
          rating_avg: number
          rating_count: number
          type: string
          updated_at: string
          whatsapp: string | null
          works_friday: boolean
        }
        Insert: {
          address?: string | null
          city: string
          closes_at?: string | null
          created_at?: string
          district?: string | null
          home_visit_price?: number | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          offers_adult?: boolean
          offers_covid?: boolean
          offers_home_visit?: boolean
          offers_pediatric?: boolean
          offers_travel?: boolean
          opens_at?: string | null
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          type: string
          updated_at?: string
          whatsapp?: string | null
          works_friday?: boolean
        }
        Update: {
          address?: string | null
          city?: string
          closes_at?: string | null
          created_at?: string
          district?: string | null
          home_visit_price?: number | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          offers_adult?: boolean
          offers_covid?: boolean
          offers_home_visit?: boolean
          offers_pediatric?: boolean
          offers_travel?: boolean
          opens_at?: string | null
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          type?: string
          updated_at?: string
          whatsapp?: string | null
          works_friday?: boolean
        }
        Relationships: []
      }
      vaccines: {
        Row: {
          category: string
          contraindications: string | null
          created_at: string
          description: string | null
          diseases: string[] | null
          display_order: number
          dose_interval_days: number | null
          doses_required: number
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_free: boolean
          is_mandatory: boolean
          manufacturer: string | null
          name_ar: string
          name_en: string | null
          price: number
          recommended_age_months: number | null
          recommended_age_months_max: number | null
          side_effects: string | null
          updated_at: string
        }
        Insert: {
          category: string
          contraindications?: string | null
          created_at?: string
          description?: string | null
          diseases?: string[] | null
          display_order?: number
          dose_interval_days?: number | null
          doses_required?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_free?: boolean
          is_mandatory?: boolean
          manufacturer?: string | null
          name_ar: string
          name_en?: string | null
          price?: number
          recommended_age_months?: number | null
          recommended_age_months_max?: number | null
          side_effects?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          contraindications?: string | null
          created_at?: string
          description?: string | null
          diseases?: string[] | null
          display_order?: number
          dose_interval_days?: number | null
          doses_required?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_free?: boolean
          is_mandatory?: boolean
          manufacturer?: string | null
          name_ar?: string
          name_en?: string | null
          price?: number
          recommended_age_months?: number | null
          recommended_age_months_max?: number | null
          side_effects?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      video_sessions: {
        Row: {
          appointment_id: string | null
          consultation_id: string | null
          created_at: string
          doctor_user_id: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          patient_user_id: string
          recording_url: string | null
          room_name: string
          scheduled_at: string
          started_at: string | null
          status: string
        }
        Insert: {
          appointment_id?: string | null
          consultation_id?: string | null
          created_at?: string
          doctor_user_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          patient_user_id: string
          recording_url?: string | null
          room_name: string
          scheduled_at: string
          started_at?: string | null
          status?: string
        }
        Update: {
          appointment_id?: string | null
          consultation_id?: string | null
          created_at?: string
          doctor_user_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          patient_user_id?: string
          recording_url?: string | null
          room_name?: string
          scheduled_at?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_target"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "today_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_doctor_user_id_fkey"
            columns: ["doctor_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_doctor_user_id_fkey"
            columns: ["doctor_user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "video_sessions_doctor_user_id_fkey"
            columns: ["doctor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_patient_user_id_fkey"
            columns: ["patient_user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_sessions_patient_user_id_fkey"
            columns: ["patient_user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "video_sessions_patient_user_id_fkey"
            columns: ["patient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          points: number
          points_after: number | null
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          points?: number
          points_after?: number | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          points?: number
          points_after?: number | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "wallet_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_otp: {
        Row: {
          channel: string
          created_at: string
          delivered_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          otp_hash: string
          phone: string
          provider_message_id: string | null
          purpose: string | null
          read_at: string | null
          status: string
          user_agent: string | null
          user_id: string | null
          verified_at: string | null
          verify_attempts: number
        }
        Insert: {
          channel: string
          created_at?: string
          delivered_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          otp_hash: string
          phone: string
          provider_message_id?: string | null
          purpose?: string | null
          read_at?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
          verified_at?: string | null
          verify_attempts?: number
        }
        Update: {
          channel?: string
          created_at?: string
          delivered_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          otp_hash?: string
          phone?: string
          provider_message_id?: string | null
          purpose?: string | null
          read_at?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
          verified_at?: string | null
          verify_attempts?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_otp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_otp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "whatsapp_otp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_lab_orders_summary: {
        Row: {
          bundle_id: string | null
          created_at: string | null
          id: string | null
          lab_name: string | null
          partner_lab_id: string | null
          patient_name: string | null
          patient_phone: string | null
          results_count: number | null
          status: string | null
          test_count: number | null
          test_ids: string[] | null
          total_price: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_partner_lab_id_fkey"
            columns: ["partner_lab_id"]
            isOneToOne: false
            referencedRelation: "partner_labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "lab_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_summary: {
        Row: {
          event_date: string | null
          event_name: string | null
          total: number | null
          unique_sessions: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      appointments_with_target: {
        Row: {
          address: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number | null
          estimated_price: number | null
          family_member_id: string | null
          id: string | null
          notes: string | null
          notes_encrypted: string | null
          otp_channel: string | null
          scheduled_at: string | null
          service_id: string | null
          service_type: string | null
          specialist_id: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          target_age: number | null
          target_allergies: string[] | null
          target_avatar: string | null
          target_chronic_conditions: string[] | null
          target_gender: string | null
          target_name: string | null
          target_relation: string | null
          target_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments_with_users: {
        Row: {
          address: string | null
          allergy_form: Json | null
          assigned_specialist_id: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          chief_complaint: string | null
          completed_at: string | null
          created_at: string | null
          current_medications: string[] | null
          dental_clinic_id: string | null
          dental_procedure_type: string | null
          doctor_appointment_type: string | null
          doctor_id: string | null
          duration_minutes: number | null
          estimated_price: number | null
          family_member_id: string | null
          hospital_department: string | null
          hospital_id: string | null
          id: string | null
          infectious_disease_alert: Json | null
          lab_order_id: string | null
          lab_results_data: Json | null
          lab_results_url: string | null
          location_accuracy_m: number | null
          location_captured_at: string | null
          location_lat: number | null
          location_lng: number | null
          mental_specialist_id: string | null
          notes: string | null
          notes_encrypted: string | null
          nurse_gender_preference: string | null
          nursing_actions: Json | null
          nutritionist_id: string | null
          optical_service_type: string | null
          optical_store_id: string | null
          otp_channel: string | null
          patient_governorate: string | null
          patient_name: string | null
          patient_phone: string | null
          physio_service_type_slug: string | null
          physio_specialist_id: string | null
          prescription_data: Json | null
          prescription_image_url: string | null
          prescription_required: boolean | null
          recurring_schedule: Json | null
          reminder_sent_at: string | null
          required_specialist_type: string | null
          scheduled_at: string | null
          service_id: string | null
          service_type: string | null
          session_plan: Json | null
          specialist_id: string | null
          specialist_name: string | null
          specialist_notes: string | null
          specialist_specialty: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          supplies_request: Json | null
          supplies_total: number | null
          updated_at: string | null
          user_id: string | null
          vaccine_clinic_id: string | null
          vaccine_dose_number: number | null
          vaccine_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_assigned_specialist_id_fkey"
            columns: ["assigned_specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_assigned_specialist_id_fkey"
            columns: ["assigned_specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_assigned_specialist_id_fkey"
            columns: ["assigned_specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dental_clinic_id_fkey"
            columns: ["dental_clinic_id"]
            isOneToOne: false
            referencedRelation: "dental_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "admin_lab_orders_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lab_order_id_fkey"
            columns: ["lab_order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_mental_specialist_id_fkey"
            columns: ["mental_specialist_id"]
            isOneToOne: false
            referencedRelation: "mental_health_specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_optical_store_id_fkey"
            columns: ["optical_store_id"]
            isOneToOne: false
            referencedRelation: "optical_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_physio_specialist_id_fkey"
            columns: ["physio_specialist_id"]
            isOneToOne: false
            referencedRelation: "physio_specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vaccine_clinic_id_fkey"
            columns: ["vaccine_clinic_id"]
            isOneToOne: false
            referencedRelation: "vaccine_clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_revenue: {
        Row: {
          currency: string | null
          date: string | null
          method: string | null
          total_amount: number | null
          total_payments: number | null
        }
        Relationships: []
      }
      doctors_with_stats: {
        Row: {
          active_subscribers_count: number | null
          available_for_clinic: boolean | null
          available_for_home_visit: boolean | null
          available_for_video: boolean | null
          avatar_url: string | null
          bio: string | null
          certifications_url: string | null
          clinic_address: string | null
          clinic_city: string | null
          clinic_lat: number | null
          clinic_lng: number | null
          clinic_name: string | null
          clinic_phone: string | null
          created_at: string | null
          full_name: string | null
          full_name_en: string | null
          gender: string | null
          home_visit_price: number | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          monthly_subscription_price: number | null
          open_consultations_count: number | null
          qualifications: string[] | null
          rating_avg: number | null
          rating_count: number | null
          specialty: string | null
          sub_specialty: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          video_consult_price: number | null
          yearly_subscription_price: number | null
          years_experience: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expiring_credentials: {
        Row: {
          full_name: string | null
          health_ministry_expires_at: string | null
          id: string | null
          nearest_expiry: string | null
          nursing_union_expires_at: string | null
          phone: string | null
          specialist_type: string | null
          status: string | null
        }
        Insert: {
          full_name?: string | null
          health_ministry_expires_at?: string | null
          id?: string | null
          nearest_expiry?: never
          nursing_union_expires_at?: string | null
          phone?: string | null
          specialist_type?: string | null
          status?: never
        }
        Update: {
          full_name?: string | null
          health_ministry_expires_at?: string | null
          id?: string | null
          nearest_expiry?: never
          nursing_union_expires_at?: string | null
          phone?: string | null
          specialist_type?: string | null
          status?: never
        }
        Relationships: []
      }
      medications_with_availability: {
        Row: {
          available_count: number | null
          category: string | null
          contraindications: string | null
          country_of_origin: string | null
          created_at: string | null
          form: string | null
          generic_name: string | null
          id: string | null
          image_url: string | null
          is_controlled: boolean | null
          manufacturer: string | null
          name_ar: string | null
          name_en: string | null
          package_size: string | null
          requires_prescription: boolean | null
          search_keywords: string[] | null
          side_effects: string | null
          storage_notes: string | null
          strength: string | null
          total_pharmacies_count: number | null
          unit_type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      pharmacy_inventory_stats: {
        Row: {
          available_medications: number | null
          pharmacy_id: string | null
          pharmacy_name: string | null
          total_medications: number | null
          total_searches: number | null
          unavailable_medications: number | null
        }
        Relationships: []
      }
      platform_stats: {
        Row: {
          completed_appointments: number | null
          pending_appointments: number | null
          platform_avg_rating: number | null
          today_new_appointments: number | null
          today_new_users: number | null
          today_revenue: number | null
          total_patients: number | null
          total_specialists: number | null
        }
        Relationships: []
      }
      specialist_stats: {
        Row: {
          average_rating: number | null
          completed_appointments: number | null
          full_name: string | null
          specialist_id: string | null
          specialty: string | null
          total_ratings: number | null
          unique_patients: number | null
        }
        Relationships: []
      }
      today_appointments: {
        Row: {
          address: string | null
          id: string | null
          patient_name: string | null
          patient_phone: string | null
          scheduled_at: string | null
          service_type: string | null
          specialist_id: string | null
          specialist_name: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "appointments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vitals_trends: {
        Row: {
          blood_pressure: string | null
          blood_sugar: number | null
          notes: string | null
          oxygen_saturation: number | null
          performed_at: string | null
          procedure_type: string | null
          pulse: number | null
          temperature: number | null
          user_id: string | null
          visit_date: string | null
        }
        Insert: {
          blood_pressure?: never
          blood_sugar?: never
          notes?: string | null
          oxygen_saturation?: never
          performed_at?: string | null
          procedure_type?: string | null
          pulse?: never
          temperature?: never
          user_id?: string | null
          visit_date?: never
        }
        Update: {
          blood_pressure?: never
          blood_sugar?: never
          notes?: string | null
          oxygen_saturation?: never
          performed_at?: string | null
          procedure_type?: string | null
          pulse?: never
          temperature?: never
          user_id?: string | null
          visit_date?: never
        }
        Relationships: [
          {
            foreignKeyName: "nursing_visit_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "expiring_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nursing_visit_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "specialist_stats"
            referencedColumns: ["specialist_id"]
          },
          {
            foreignKeyName: "nursing_visit_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_wallet_transaction: {
        Args: {
          p_amount?: number
          p_description?: string
          p_points?: number
          p_reference_id?: string
          p_reference_type?: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      calculate_health_score: {
        Args: { p_profile_id: string }
        Returns: number
      }
      cleanup_expired_idempotency: { Args: never; Returns: number }
      cleanup_expired_otps: { Args: never; Returns: number }
      cleanup_expired_rate_limits: { Args: never; Returns: number }
      cleanup_expired_verification_tokens: { Args: never; Returns: undefined }
      cleanup_expired_whatsapp_otp: { Args: never; Returns: number }
      create_prescription_from_order: {
        Args: {
          p_diagnosis: string
          p_instructions?: string
          p_medications: Json
          p_order_id: string
        }
        Returns: string
      }
      determine_specialist_type: {
        Args: { service_id: string }
        Returns: string
      }
      find_pharmacies_with_medication: {
        Args: {
          p_max_distance_km?: number
          p_medication_id: string
          p_user_lat: number
          p_user_lng: number
        }
        Returns: {
          delivers: boolean
          delivery_fee_iqd: number
          distance_km: number
          in_stock: boolean
          last_confirmed_at: string
          pharmacy_address: string
          pharmacy_id: string
          pharmacy_name: string
          pharmacy_phone: string
          price_iqd: number
        }[]
      }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      get_lab_id_by_slug: { Args: { p_slug: string }; Returns: string }
      get_unread_count: { Args: { for_order_id: string }; Returns: number }
      increment_rate_limit: {
        Args: { p_bucket_key: string; p_max: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          remaining: number
          retry_after_seconds: number
        }[]
      }
      mark_message_read: { Args: { message_id: string }; Returns: undefined }
      validate_coupon_for_user: {
        Args: {
          p_code: string
          p_order_amount: number
          p_user_city?: string
          p_user_id: string
        }
        Returns: {
          coupon_id: string
          discount_amount: number
          error_message: string
          is_valid: boolean
        }[]
      }
      verify_end_otp: {
        Args: { p_order_id: string; p_otp: string }
        Returns: boolean
      }
      verify_start_otp: {
        Args: { p_order_id: string; p_otp: string }
        Returns: boolean
      }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      consultation_kind: "video" | "audio" | "chat"
      family_relation:
        | "self"
        | "spouse"
        | "child"
        | "parent"
        | "sibling"
        | "other"
      gender_type: "male" | "female"
      order_status:
        | "pending"
        | "searching"
        | "accepted"
        | "on_the_way"
        | "arrived"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "failed"
      payment_method:
        | "cash_on_delivery"
        | "zain_cash"
        | "fast_pay"
        | "card"
        | "usdt"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      service_type:
        | "blood_test"
        | "consultation_video"
        | "consultation_audio"
        | "consultation_chat"
        | "pharmacy_search"
        | "pharmacy_delivery"
      subscription_status: "active" | "cancelled" | "expired" | "trial"
      user_role:
        | "patient"
        | "specialist"
        | "admin"
        | "super_admin"
        | "manager"
        | "support"
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
      appointment_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      consultation_kind: ["video", "audio", "chat"],
      family_relation: [
        "self",
        "spouse",
        "child",
        "parent",
        "sibling",
        "other",
      ],
      gender_type: ["male", "female"],
      order_status: [
        "pending",
        "searching",
        "accepted",
        "on_the_way",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
        "failed",
      ],
      payment_method: [
        "cash_on_delivery",
        "zain_cash",
        "fast_pay",
        "card",
        "usdt",
      ],
      payment_status: ["pending", "paid", "refunded", "failed"],
      service_type: [
        "blood_test",
        "consultation_video",
        "consultation_audio",
        "consultation_chat",
        "pharmacy_search",
        "pharmacy_delivery",
      ],
      subscription_status: ["active", "cancelled", "expired", "trial"],
      user_role: [
        "patient",
        "specialist",
        "admin",
        "super_admin",
        "manager",
        "support",
      ],
    },
  },
} as const
