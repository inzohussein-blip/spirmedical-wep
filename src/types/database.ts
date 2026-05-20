/**
 * أنواع قاعدة البيانات لـ Supabase
 *
 * مولّد يدوياً ليطابق output `supabase gen types typescript`.
 * لتوليده تلقائياً من Supabase الفعلي:
 *   npx supabase gen types typescript --project-id ioulxemokusfeykjcaxg > src/types/database.ts
 *
 * ✨ مُحدّث ليتضمّن أعمدة V1: service_id, estimated_price, duration_minutes, otp_channel, إلخ.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          full_name: string | null;
          email: string | null;
          role: 'patient' | 'specialist' | 'admin' | 'super_admin' | 'manager' | 'support';
          governorate: string | null;
          medical_info: Json;
          user_settings: Json;
          specialist_type: 'lab_analyst' | 'nurse' | 'doctor' | 'pharmacist' | 'physio' | 'psychologist' | 'nutritionist' | null;
          approval_status: 'pending' | 'approved' | 'rejected';
          rejection_reason: string | null;
          specialist_bio: string | null;
          specialist_certifications: Json;
          specialist_years_exp: number | null;
          specialist_languages: string[];
          auto_reply_message: string;
          is_suspended: boolean;
          suspension_reason: string | null;
          suspended_at: string | null;
          suspended_by: string | null;
          admin_internal_notes: string | null;
          last_active_at: string | null;
          // ✨ V25.6: Nurse Credentials
          nursing_union_id_url: string | null;
          nursing_union_id_number: string | null;
          nursing_union_expires_at: string | null;
          nursing_union_verified: boolean;
          health_ministry_license_url: string | null;
          health_ministry_license_number: string | null;
          health_ministry_expires_at: string | null;
          health_ministry_verified: boolean;
          emergency_kit_confirmed: boolean;
          emergency_kit_confirmed_at: string | null;
          emergency_kit_items: string[] | null;
          years_experience: number | null;
          specializations: string[] | null;
          cv_url: string | null;
          credentials_verified_at: string | null;
          credentials_verified_by: string | null;
          wa_otp_enabled: boolean;
          wa_verified: boolean;
          wa_id: string | null;
          wa_verified_at: string | null;
          preferred_otp_channel: 'whatsapp' | 'telegram' | 'sms';
          created_at: string;
          updated_at: string;
          // ✨ GPS Work Location (V25):
          work_lat: number | null;
          work_lng: number | null;
          work_address: string | null;
        };
        Insert: {
          id?: string;
          phone: string;
          full_name?: string | null;
          email?: string | null;
          role?: 'patient' | 'specialist' | 'admin' | 'super_admin' | 'manager' | 'support';
          governorate?: string | null;
          medical_info?: Json;
          user_settings?: Json;
          specialist_type?: 'lab_analyst' | 'nurse' | 'doctor' | 'pharmacist' | 'physio' | 'psychologist' | 'nutritionist' | null;
          approval_status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          specialist_bio?: string | null;
          specialist_certifications?: Json;
          specialist_years_exp?: number | null;
          specialist_languages?: string[];
          auto_reply_message?: string;
          is_suspended?: boolean;
          suspension_reason?: string | null;
          suspended_at?: string | null;
          suspended_by?: string | null;
          admin_internal_notes?: string | null;
          last_active_at?: string | null;
          wa_otp_enabled?: boolean;
          wa_verified?: boolean;
          wa_id?: string | null;
          wa_verified_at?: string | null;
          preferred_otp_channel?: 'whatsapp' | 'telegram' | 'sms';
          created_at?: string;
          updated_at?: string;
          // ✨ GPS Work Location (V25):
          work_lat?: number | null;
          work_lng?: number | null;
          work_address?: string | null;
        };
        Update: {
          id?: string;
          phone?: string;
          full_name?: string | null;
          email?: string | null;
          role?: 'patient' | 'specialist' | 'admin' | 'super_admin' | 'manager' | 'support';
          governorate?: string | null;
          medical_info?: Json;
          user_settings?: Json;
          specialist_type?: 'lab_analyst' | 'nurse' | 'doctor' | 'pharmacist' | 'physio' | 'psychologist' | 'nutritionist' | null;
          approval_status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          specialist_bio?: string | null;
          specialist_certifications?: Json;
          specialist_years_exp?: number | null;
          specialist_languages?: string[];
          auto_reply_message?: string;
          is_suspended?: boolean;
          suspension_reason?: string | null;
          suspended_at?: string | null;
          suspended_by?: string | null;
          admin_internal_notes?: string | null;
          last_active_at?: string | null;
          wa_otp_enabled?: boolean;
          wa_verified?: boolean;
          wa_id?: string | null;
          wa_verified_at?: string | null;
          preferred_otp_channel?: 'whatsapp' | 'telegram' | 'sms';
          created_at?: string;
          updated_at?: string;
          // ✨ GPS Work Location (V25):
          work_lat?: number | null;
          work_lng?: number | null;
          work_address?: string | null;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          service_type: string;
          scheduled_at: string;
          address: string;
          notes: string | null;
          notes_encrypted: string | null;
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
          // ✨ أعمدة جديدة (V1):
          service_id: string | null;
          estimated_price: number | null;
          final_price: number | null;
          duration_minutes: number | null;
          otp_channel: 'whatsapp' | 'telegram' | 'sms' | null;
          confirmed_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          cancellation_reason: string | null;
          specialist_id: string | null;
          // ✨ أعمدة Specialist System (V21):
          required_specialist_type: 'lab_analyst' | 'nurse' | 'doctor' | 'pharmacist' | 'physio' | 'psychologist' | 'nutritionist' | null;
          assigned_specialist_id: string | null;
          specialist_notes: string | null;
          lab_results_url: string | null;
          lab_results_data: Json | null;
          nursing_actions: Json | null;
          prescription_data: Json | null;
          session_plan: Json | null;
          // ✨ GPS Locations (V25):
          location_lat: number | null;
          location_lng: number | null;
          location_accuracy_m: number | null;
          location_captured_at: string | null;
          // ✨ Reminders (V25.4):
          reminder_sent_at: string | null;
          // ✨ Nursing Enhancements (V25.5):
          nurse_gender_preference: 'male' | 'female' | 'any' | null;
          recurring_schedule: {
            enabled: boolean;
            interval_hours: number;
            end_date?: string;
            auto_confirm?: boolean;
          } | null;
          allergy_form: {
            penicillin?: boolean;
            sulfa?: boolean;
            aspirin?: boolean;
            iodine?: boolean;
            latex?: boolean;
            other?: string;
            filled_at?: string;
          } | null;
          prescription_image_url: string | null;
          prescription_required: boolean;
          infectious_disease_alert: {
            hepatitis_b?: boolean;
            hepatitis_c?: boolean;
            hiv?: boolean;
            covid?: boolean;
            tb?: boolean;
            other?: string;
            notes?: string;
          } | null;
          supplies_request: Array<{
            item: string;
            qty: number;
            added_to_invoice: boolean;
            price?: number;
            notes?: string;
          }> | null;
          supplies_total: number;
          // ✨ V25.8: Family Members
          family_member_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_type: string;
          scheduled_at: string;
          address: string;
          notes?: string | null;
          notes_encrypted?: string | null;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
          // ✨ أعمدة جديدة (V1):
          service_id?: string | null;
          estimated_price?: number | null;
          final_price?: number | null;
          duration_minutes?: number | null;
          otp_channel?: 'whatsapp' | 'telegram' | 'sms' | null;
          confirmed_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          specialist_id?: string | null;
          // ✨ أعمدة Specialist System (V21):
          required_specialist_type?: 'lab_analyst' | 'nurse' | 'doctor' | 'pharmacist' | 'physio' | 'psychologist' | 'nutritionist' | null;
          assigned_specialist_id?: string | null;
          specialist_notes?: string | null;
          lab_results_url?: string | null;
          lab_results_data?: Json | null;
          nursing_actions?: Json | null;
          prescription_data?: Json | null;
          session_plan?: Json | null;
          // ✨ GPS Locations (V25):
          location_lat?: number | null;
          location_lng?: number | null;
          location_accuracy_m?: number | null;
          location_captured_at?: string | null;
          // ✨ Reminders (V25.4):
          reminder_sent_at?: string | null;
          // ✨ Nursing Enhancements (V25.5):
          nurse_gender_preference?: 'male' | 'female' | 'any' | null;
          recurring_schedule?: object | null;
          allergy_form?: object | null;
          prescription_image_url?: string | null;
          prescription_required?: boolean;
          infectious_disease_alert?: object | null;
          supplies_request?: object[] | null;
          supplies_total?: number;
          // ✨ V25.8: Family Members
          family_member_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_type?: string;
          scheduled_at?: string;
          address?: string;
          notes?: string | null;
          notes_encrypted?: string | null;
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
          // ✨ أعمدة جديدة (V1):
          service_id?: string | null;
          estimated_price?: number | null;
          final_price?: number | null;
          duration_minutes?: number | null;
          otp_channel?: 'whatsapp' | 'telegram' | 'sms' | null;
          confirmed_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
          specialist_id?: string | null;
          // ✨ أعمدة Specialist System (V21):
          required_specialist_type?: 'lab_analyst' | 'nurse' | 'doctor' | 'pharmacist' | 'physio' | 'psychologist' | 'nutritionist' | null;
          assigned_specialist_id?: string | null;
          specialist_notes?: string | null;
          lab_results_url?: string | null;
          lab_results_data?: Json | null;
          nursing_actions?: Json | null;
          prescription_data?: Json | null;
          session_plan?: Json | null;
          // ✨ GPS Locations (V25):
          location_lat?: number | null;
          location_lng?: number | null;
          location_accuracy_m?: number | null;
          location_captured_at?: string | null;
          // ✨ Reminders (V25.4):
          reminder_sent_at?: string | null;
          // ✨ Nursing Enhancements (V25.5):
          nurse_gender_preference?: 'male' | 'female' | 'any' | null;
          recurring_schedule?: object | null;
          allergy_form?: object | null;
          prescription_image_url?: string | null;
          prescription_required?: boolean;
          infectious_disease_alert?: object | null;
          supplies_request?: object[] | null;
          supplies_total?: number;
          // ✨ V25.8: Family Members
          family_member_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          changes: Json | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          changes?: Json | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          changes?: Json | null;
          metadata?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      // ✨ جدول جديد: ربط Telegram
      user_telegram_links: {
        Row: {
          id: string;
          user_id: string;
          telegram_chat_id: number;
          telegram_username: string | null;
          linked_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          telegram_chat_id: number;
          telegram_username?: string | null;
          linked_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          telegram_chat_id?: number;
          telegram_username?: string | null;
          linked_at?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      // ✨ جدول جديد: محاولات OTP
      otp_attempts: {
        Row: {
          id: string;
          phone: string;
          channel: 'whatsapp' | 'telegram' | 'sms';
          code_hash: string;
          purpose: 'register' | 'login' | 'appointment' | 'password-reset';
          attempts: number;
          verified: boolean;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          channel: 'whatsapp' | 'telegram' | 'sms';
          code_hash: string;
          purpose: 'register' | 'login' | 'appointment' | 'password-reset';
          attempts?: number;
          verified?: boolean;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          channel?: 'whatsapp' | 'telegram' | 'sms';
          code_hash?: string;
          purpose?: 'register' | 'login' | 'appointment' | 'password-reset';
          attempts?: number;
          verified?: boolean;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      // ✨ جداول الـ Inbox + Payments + Ratings
      chats: {
        Row: {
          id: string;
          patient_id: string;
          specialist_id: string;
          appointment_id: string | null;
          status: 'open' | 'pending' | 'resolved' | 'archived';
          tags: string[];
          priority: 'low' | 'normal' | 'high' | 'urgent';
          last_message: string | null;
          last_message_at: string;
          last_message_by: string | null;
          patient_unread_count: number;
          specialist_unread_count: number;
          total_messages: number;
          is_pinned: boolean;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          specialist_id: string;
          appointment_id?: string | null;
          status?: 'open' | 'pending' | 'resolved' | 'archived';
          tags?: string[];
          priority?: 'low' | 'normal' | 'high' | 'urgent';
          last_message?: string | null;
          last_message_at?: string;
          last_message_by?: string | null;
          patient_unread_count?: number;
          specialist_unread_count?: number;
          total_messages?: number;
          is_pinned?: boolean;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: {
          status?: 'open' | 'pending' | 'resolved' | 'archived';
          tags?: string[];
          priority?: 'low' | 'normal' | 'high' | 'urgent';
          last_message?: string | null;
          last_message_at?: string;
          patient_unread_count?: number;
          specialist_unread_count?: number;
          is_pinned?: boolean;
          is_archived?: boolean;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          type: 'text' | 'image' | 'file' | 'audio' | 'system';
          content: string | null;
          attachment_url: string | null;
          attachment_name: string | null;
          attachment_size: number | null;
          is_read: boolean;
          read_at: string | null;
          is_edited: boolean;
          edited_at: string | null;
          is_deleted: boolean;
          reply_to_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          type?: 'text' | 'image' | 'file' | 'audio' | 'system';
          content?: string | null;
          attachment_url?: string | null;
          attachment_name?: string | null;
          attachment_size?: number | null;
          is_read?: boolean;
          read_at?: string | null;
          is_edited?: boolean;
          edited_at?: string | null;
          is_deleted?: boolean;
          reply_to_id?: string | null;
          created_at?: string;
        };
        Update: {
          content?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          is_edited?: boolean;
          edited_at?: string | null;
          is_deleted?: boolean;
        };
        Relationships: [];
      };
      quick_replies: {
        Row: {
          id: string;
          specialist_id: string;
          shortcut: string;
          content: string;
          category: string;
          use_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          specialist_id: string;
          shortcut: string;
          content: string;
          category?: string;
          use_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          shortcut?: string;
          content?: string;
          category?: string;
          use_count?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          appointment_id: string;
          user_id: string;
          method: 'cash' | 'zain_cash' | 'asia_hawala' | 'visa' | 'mastercard';
          amount: number;
          currency: string;
          status: 'pending' | 'paid' | 'refunded' | 'cancelled';
          transaction_id: string | null;
          notes: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          user_id: string;
          method: 'cash' | 'zain_cash' | 'asia_hawala' | 'visa' | 'mastercard';
          amount: number;
          currency?: string;
          status?: 'pending' | 'paid' | 'refunded' | 'cancelled';
          transaction_id?: string | null;
          notes?: string | null;
          paid_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'paid' | 'refunded' | 'cancelled';
          transaction_id?: string | null;
          notes?: string | null;
          paid_at?: string | null;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          appointment_id: string;
          user_id: string;
          specialist_id: string | null;
          overall_rating: number;
          punctuality_rating: number | null;
          professionalism_rating: number | null;
          cleanliness_rating: number | null;
          review_text: string | null;
          tags: string[];
          is_anonymous: boolean;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          appointment_id: string;
          user_id: string;
          specialist_id?: string | null;
          overall_rating: number;
          punctuality_rating?: number | null;
          professionalism_rating?: number | null;
          cleanliness_rating?: number | null;
          review_text?: string | null;
          tags?: string[];
          is_anonymous?: boolean;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          overall_rating?: number;
          review_text?: string | null;
          is_published?: boolean;
        };
        Relationships: [];
      };
      chat_notes: {
        Row: {
          id: string;
          chat_id: string;
          specialist_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          specialist_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          type: 'medication' | 'appointment' | 'checkup' | 'vaccine';
          title: string;
          description: string | null;
          scheduled_at: string;
          frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
          active: boolean;
          last_triggered: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'medication' | 'appointment' | 'checkup' | 'vaccine';
          title: string;
          description?: string | null;
          scheduled_at: string;
          frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
          active?: boolean;
          last_triggered?: string | null;
        };
        Update: {
          type?: 'medication' | 'appointment' | 'checkup' | 'vaccine';
          title?: string;
          description?: string | null;
          scheduled_at?: string;
          frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
          active?: boolean;
          last_triggered?: string | null;
        };
        Relationships: [];
      };
      prescriptions: {
        Row: {
          id: string;
          user_id: string;
          doctor_name: string;
          doctor_specialty: string | null;
          medication: string;
          dosage: string | null;
          frequency: string | null;
          duration_days: number | null;
          notes: string | null;
          prescribed_at: string;
          appointment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          doctor_name: string;
          doctor_specialty?: string | null;
          medication: string;
          dosage?: string | null;
          frequency?: string | null;
          duration_days?: number | null;
          notes?: string | null;
          prescribed_at?: string;
          appointment_id?: string | null;
        };
        Update: {
          doctor_name?: string;
          doctor_specialty?: string | null;
          medication?: string;
          dosage?: string | null;
          frequency?: string | null;
          duration_days?: number | null;
          notes?: string | null;
          prescribed_at?: string;
        };
        Relationships: [];
      };
      health_vitals: {
        Row: {
          id: string;
          user_id: string;
          vital_type: 'pulse' | 'blood_pressure' | 'blood_sugar' | 'temperature' | 'weight' | 'oxygen' | 'height';
          value: string;
          unit: string | null;
          measured_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vital_type: 'pulse' | 'blood_pressure' | 'blood_sugar' | 'temperature' | 'weight' | 'oxygen' | 'height';
          value: string;
          unit?: string | null;
          measured_at?: string;
          notes?: string | null;
        };
        Update: {
          vital_type?: 'pulse' | 'blood_pressure' | 'blood_sugar' | 'temperature' | 'weight' | 'oxygen' | 'height';
          value?: string;
          unit?: string | null;
          measured_at?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      specialist_schedules: {
        Row: {
          id: string;
          specialist_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          specialist_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
        };
        Update: {
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string;
          action_type: string;
          target_type: string | null;
          target_id: string | null;
          details: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action_type: string;
          target_type?: string | null;
          target_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      patient_tags: {
        Row: {
          id: string;
          patient_id: string;
          tag: string;
          color: string;
          added_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          tag: string;
          color?: string;
          added_by?: string | null;
        };
        Update: { tag?: string; color?: string };
        Relationships: [];
      };
      patient_notes: {
        Row: {
          id: string;
          patient_id: string;
          admin_id: string | null;
          note: string;
          note_type: 'general' | 'warning' | 'vip' | 'follow_up';
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          admin_id?: string | null;
          note: string;
          note_type?: 'general' | 'warning' | 'vip' | 'follow_up';
          is_pinned?: boolean;
        };
        Update: { note?: string; note_type?: 'general' | 'warning' | 'vip' | 'follow_up'; is_pinned?: boolean };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: 'whatsapp' | 'sms' | 'push' | 'email';
          target_segment: Json;
          message_content: string;
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
          scheduled_for: string | null;
          sent_at: string | null;
          recipients_count: number;
          success_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type: 'whatsapp' | 'sms' | 'push' | 'email';
          target_segment?: Json;
          message_content: string;
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
          scheduled_for?: string | null;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          message_content?: string;
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
          scheduled_for?: string | null;
          sent_at?: string | null;
          recipients_count?: number;
          success_count?: number;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          valid_from: string;
          valid_until: string | null;
          max_uses: number | null;
          used_count: number;
          applicable_services: string[];
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: 'percentage' | 'fixed';
          discount_value: number;
          valid_until?: string | null;
          max_uses?: number | null;
          applicable_services?: string[];
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: {
          description?: string | null;
          valid_until?: string | null;
          max_uses?: number | null;
          is_active?: boolean;
          used_count?: number;
        };
        Relationships: [];
      };
      notification_templates: {
        Row: {
          id: string;
          key: string;
          name_ar: string;
          channel: 'whatsapp' | 'sms' | 'push' | 'all';
          body_ar: string;
          variables: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name_ar: string;
          channel: 'whatsapp' | 'sms' | 'push' | 'all';
          body_ar: string;
          variables?: string[];
          is_active?: boolean;
        };
        Update: {
          name_ar?: string;
          channel?: 'whatsapp' | 'sms' | 'push' | 'all';
          body_ar?: string;
          variables?: string[];
          is_active?: boolean;
        };
        Relationships: [];
      };
      notification_queue: {
        Row: {
          id: string;
          recipient_user_id: string | null;
          recipient_phone: string;
          channel: 'whatsapp' | 'sms' | 'push';
          template_key: string | null;
          body: string;
          status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
          attempts: number;
          max_attempts: number;
          scheduled_for: string;
          sent_at: string | null;
          failed_at: string | null;
          error_message: string | null;
          provider: string | null;
          provider_message_id: string | null;
          related_type: string | null;
          related_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_user_id?: string | null;
          recipient_phone: string;
          channel: 'whatsapp' | 'sms' | 'push';
          template_key?: string | null;
          body: string;
          status?: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
          scheduled_for?: string;
          related_type?: string | null;
          related_id?: string | null;
          created_by?: string | null;
        };
        Update: {
          status?: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
          attempts?: number;
          sent_at?: string | null;
          failed_at?: string | null;
          error_message?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
        };
        Relationships: [];
      };
      notification_logs: {
        Row: {
          id: string;
          recipient_phone: string;
          channel: string;
          body_preview: string | null;
          status: string;
          provider: string | null;
          sent_at: string | null;
          related_type: string | null;
          related_id: string | null;
          archived_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      whatsapp_otp: {
        Row: {
          id: string;
          phone: string;
          user_id: string | null;
          otp_hash: string;
          channel: 'whatsapp' | 'telegram' | 'sms';
          status: 'pending' | 'sent' | 'verified' | 'expired' | 'failed';
          provider_message_id: string | null;
          delivered_at: string | null;
          read_at: string | null;
          verify_attempts: number;
          verified_at: string | null;
          purpose: 'login' | 'verify_phone' | 'sensitive_action' | 'register';
          ip_address: string | null;
          user_agent: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          user_id?: string | null;
          otp_hash: string;
          channel: 'whatsapp' | 'telegram' | 'sms';
          status?: 'pending' | 'sent' | 'verified' | 'expired' | 'failed';
          provider_message_id?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          verify_attempts?: number;
          verified_at?: string | null;
          purpose?: 'login' | 'verify_phone' | 'sensitive_action' | 'register';
          ip_address?: string | null;
          user_agent?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          user_id?: string | null;
          otp_hash?: string;
          channel?: 'whatsapp' | 'telegram' | 'sms';
          status?: 'pending' | 'sent' | 'verified' | 'expired' | 'failed';
          provider_message_id?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          verify_attempts?: number;
          verified_at?: string | null;
          purpose?: 'login' | 'verify_phone' | 'sensitive_action' | 'register';
          ip_address?: string | null;
          user_agent?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      app_theme_settings: {
        Row: {
          id: string;
          primary_color: string;
          primary_dark: string;
          primary_soft: string;
          accent_color: string;
          danger_color: string;
          theme_name: string;
          is_active: boolean;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          primary_color?: string;
          primary_dark?: string;
          primary_soft?: string;
          accent_color?: string;
          danger_color?: string;
          theme_name?: string;
          is_active?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          primary_color?: string;
          primary_dark?: string;
          primary_soft?: string;
          accent_color?: string;
          danger_color?: string;
          theme_name?: string;
          is_active?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          title: string;
          icon: string;
          description: string | null;
          href: string;
          color_theme: 'emerald' | 'amber' | 'rose' | 'paper' | 'ink';
          sort_order: number;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          icon: string;
          description?: string | null;
          href?: string;
          color_theme?: 'emerald' | 'amber' | 'rose' | 'paper' | 'ink';
          sort_order?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          icon?: string;
          description?: string | null;
          href?: string;
          color_theme?: 'emerald' | 'amber' | 'rose' | 'paper' | 'ink';
          sort_order?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // ✨ V25.14: Beta Launch System
      launch_checklist: {
        Row: {
          id: string;
          category: 'technical' | 'content' | 'legal' | 'marketing' | 'operations' | 'security';
          title: string;
          description: string | null;
          priority: 'critical' | 'high' | 'medium' | 'low';
          is_completed: boolean;
          completed_at: string | null;
          completed_by: string | null;
          notes: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          description: string | null;
          priority: 'critical' | 'high' | 'medium' | 'low';
          is_completed: boolean;
          notes: string | null;
          order_index: number;
        }> & { category: 'technical' | 'content' | 'legal' | 'marketing' | 'operations' | 'security'; title: string };
        Update: Partial<{
          title: string;
          description: string | null;
          priority: 'critical' | 'high' | 'medium' | 'low';
          is_completed: boolean;
          completed_at: string | null;
          completed_by: string | null;
          notes: string | null;
          order_index: number;
        }>;
        Relationships: [];
      };
      beta_codes: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          max_uses: number;
          used_count: number;
          is_active: boolean;
          expires_at: string | null;
          used_by: string[];
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          description: string | null;
          max_uses: number;
          used_count: number;
          is_active: boolean;
          expires_at: string | null;
          used_by: string[];
        }> & { code: string };
        Update: Partial<{
          description: string | null;
          max_uses: number;
          used_count: number;
          is_active: boolean;
          expires_at: string | null;
          used_by: string[];
        }>;
        Relationships: [];
      };
      user_feedback: {
        Row: {
          id: string;
          user_id: string | null;
          type: 'suggestion' | 'complaint' | 'praise' | 'feature_request' | 'other';
          category: string;
          rating: number | null;
          subject: string | null;
          message: string;
          contact_email: string | null;
          contact_phone: string | null;
          status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'archived';
          admin_notes: string | null;
          page_url: string | null;
          user_agent: string | null;
          created_at: string;
          reviewed_at: string | null;
          resolved_at: string | null;
        };
        Insert: Partial<{
          user_id: string | null;
          rating: number | null;
          subject: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'archived';
          page_url: string | null;
          user_agent: string | null;
        }> & {
          type: 'suggestion' | 'complaint' | 'praise' | 'feature_request' | 'other';
          category: string;
          message: string;
        };
        Update: Partial<{
          status: 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'archived';
          admin_notes: string | null;
          reviewed_at: string | null;
          resolved_at: string | null;
        }>;
        Relationships: [];
      };
      bug_reports: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          description: string;
          steps_to_reproduce: string | null;
          expected_behavior: string | null;
          actual_behavior: string | null;
          severity: 'critical' | 'high' | 'medium' | 'low';
          status: 'open' | 'in_progress' | 'fixed' | 'wont_fix' | 'duplicate';
          page_url: string | null;
          browser: string | null;
          device: string | null;
          screenshot_url: string | null;
          user_agent: string | null;
          admin_notes: string | null;
          fixed_in_version: string | null;
          created_at: string;
          updated_at: string;
          fixed_at: string | null;
        };
        Insert: Partial<{
          user_id: string | null;
          steps_to_reproduce: string | null;
          expected_behavior: string | null;
          actual_behavior: string | null;
          severity: 'critical' | 'high' | 'medium' | 'low';
          status: 'open' | 'in_progress' | 'fixed' | 'wont_fix' | 'duplicate';
          page_url: string | null;
          browser: string | null;
          device: string | null;
          user_agent: string | null;
        }> & { title: string; description: string };
        Update: Partial<{
          status: 'open' | 'in_progress' | 'fixed' | 'wont_fix' | 'duplicate';
          admin_notes: string | null;
          fixed_in_version: string | null;
          fixed_at: string | null;
        }>;
        Relationships: [];
      };
      changelog_entries: {
        Row: {
          id: string;
          version: string;
          release_date: string;
          title: string;
          summary: string | null;
          features: string[];
          improvements: string[];
          fixes: string[];
          breaking_changes: string[];
          is_published: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<{
          summary: string | null;
          features: string[];
          improvements: string[];
          fixes: string[];
          breaking_changes: string[];
          is_published: boolean;
          created_by: string | null;
        }> & { version: string; release_date: string; title: string };
        Update: Partial<{
          version: string;
          release_date: string;
          title: string;
          summary: string | null;
          features: string[];
          improvements: string[];
          fixes: string[];
          breaking_changes: string[];
          is_published: boolean;
        }>;
        Relationships: [];
      };
      // ✨ V25.14: Physio Service
      physio_service_types: {
        Row: {
          id: string;
          slug: string;
          name_ar: string;
          name_en: string | null;
          description: string | null;
          icon: string;
          base_price: number;
          session_duration_minutes: number;
          recommended_sessions: number;
          conditions: string[];
          is_active: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          name_en: string | null;
          description: string | null;
          icon: string;
          base_price: number;
          session_duration_minutes: number;
          recommended_sessions: number;
          conditions: string[];
          is_active: boolean;
          order_index: number;
        }> & { slug: string; name_ar: string };
        Update: Partial<{
          name_ar: string;
          description: string | null;
          base_price: number;
          is_active: boolean;
        }>;
        Relationships: [];
      };
      physio_specialists: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          title: string;
          gender: 'male' | 'female' | null;
          photo_url: string | null;
          bio: string | null;
          years_experience: number;
          specialties: string[];
          certifications: string[];
          languages: string[];
          cities: string[];
          home_visit_price: number;
          clinic_visit_price: number;
          package_discount_pct: number;
          rating_avg: number;
          rating_count: number;
          total_sessions: number;
          is_active: boolean;
          is_verified: boolean;
          available_for_home: boolean;
          available_for_clinic: boolean;
          clinic_name: string | null;
          clinic_address: string | null;
          clinic_city: string | null;
          clinic_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          user_id: string | null;
          title: string;
          gender: 'male' | 'female' | null;
          photo_url: string | null;
          bio: string | null;
          years_experience: number;
          specialties: string[];
          certifications: string[];
          languages: string[];
          cities: string[];
          home_visit_price: number;
          clinic_visit_price: number;
          package_discount_pct: number;
          rating_avg: number;
          rating_count: number;
          total_sessions: number;
          is_active: boolean;
          is_verified: boolean;
          available_for_home: boolean;
          available_for_clinic: boolean;
          clinic_name: string | null;
          clinic_address: string | null;
          clinic_city: string | null;
          clinic_phone: string | null;
        }> & { full_name: string };
        Update: Partial<{
          full_name: string;
          bio: string | null;
          rating_avg: number;
          rating_count: number;
          is_active: boolean;
          is_verified: boolean;
        }>;
        Relationships: [];
      };
      // ✨ V25.10: Analytics Events
      analytics_events: {
        Row: {
          id: number;
          event_name: string;
          user_id: string | null;
          session_id: string | null;
          properties: Record<string, unknown> | null;
          user_agent: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          event_name: string;
          user_id?: string | null;
          session_id?: string | null;
          properties?: Record<string, unknown> | null;
          user_agent?: string | null;
          ip_address?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      // ✨ V25.11: App Settings
      app_settings: {
        Row: {
          key: string;
          value: unknown;
          description: string | null;
          category: 'general' | 'business' | 'features' | 'notifications' | 'security';
          is_public: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: unknown;
          description?: string | null;
          category?: 'general' | 'business' | 'features' | 'notifications' | 'security';
          is_public?: boolean;
        };
        Update: {
          value?: unknown;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      // ✨ V25.11: User Favorites
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          favorite_type: 'doctor' | 'hospital' | 'pharmacy' | 'medication' | 'lab_test';
          reference_id: string;
          display_name: string | null;
          display_subtitle: string | null;
          display_icon: string | null;
          display_meta: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          favorite_type: 'doctor' | 'hospital' | 'pharmacy' | 'medication' | 'lab_test';
          reference_id: string;
          display_name?: string | null;
          display_subtitle?: string | null;
          display_icon?: string | null;
          display_meta?: Record<string, unknown> | null;
        };
        Update: never;
        Relationships: [];
      };
      // ✨ V25.11: Wallet Transactions
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: 'credit' | 'debit' | 'refund' | 'reward' | 'points_redeem';
          amount: number;
          points: number;
          balance_after: number | null;
          points_after: number | null;
          description: string;
          reference_type: string | null;
          reference_id: string | null;
          status: 'pending' | 'completed' | 'failed' | 'cancelled';
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          transaction_type: 'credit' | 'debit' | 'refund' | 'reward' | 'points_redeem';
          amount?: number;
          points?: number;
          balance_after?: number | null;
          points_after?: number | null;
          description: string;
          reference_type?: string | null;
          reference_id?: string | null;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          created_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      // ✨ V25.11: Cosmetic Products
      cosmetic_products: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          brand: string;
          category: 'skincare' | 'haircare' | 'makeup' | 'fragrance' | 'supplements' | 'bodycare' | 'baby_care' | 'mens_care';
          price: number;
          discount_price: number | null;
          description: string | null;
          ingredients: string | null;
          usage_instructions: string | null;
          image_url: string | null;
          image_emoji: string;
          available_at_pharmacies: string[];
          rating_avg: number;
          rating_count: number;
          is_in_stock: boolean;
          stock_quantity: number | null;
          country_of_origin: string | null;
          is_recommended: boolean;
          recommendation_note: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          name_en: string | null;
          price: number;
          discount_price: number | null;
          description: string | null;
          ingredients: string | null;
          usage_instructions: string | null;
          image_url: string | null;
          image_emoji: string;
          available_at_pharmacies: string[];
          rating_avg: number;
          rating_count: number;
          is_in_stock: boolean;
          stock_quantity: number | null;
          country_of_origin: string | null;
          is_recommended: boolean;
          recommendation_note: string | null;
          is_active: boolean;
        }> & { name: string; brand: string; category: 'skincare' | 'haircare' | 'makeup' | 'fragrance' | 'supplements' | 'bodycare' | 'baby_care' | 'mens_care' };
        Update: Partial<{
          name: string;
          name_en: string | null;
          brand: string;
          price: number;
          discount_price: number | null;
          description: string | null;
          image_emoji: string;
          is_in_stock: boolean;
          is_active: boolean;
        }>;
        Relationships: [];
      };
      user_saved_locations: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          icon: string;
          address: string;
          lat: number;
          lng: number;
          governorate: string | null;
          notes: string | null;
          is_pinned: boolean;
          use_count: number;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          icon?: string;
          address: string;
          lat: number;
          lng: number;
          governorate?: string | null;
          notes?: string | null;
          is_pinned?: boolean;
          use_count?: number;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          icon?: string;
          address?: string;
          lat?: number;
          lng?: number;
          governorate?: string | null;
          notes?: string | null;
          is_pinned?: boolean;
          use_count?: number;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_saved_locations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      geocoding_cache: {
        Row: {
          id: string;
          lat_rounded: number;
          lng_rounded: number;
          display_name: string;
          road: string | null;
          suburb: string | null;
          city: string | null;
          governorate: string | null;
          country: string | null;
          raw_data: Json | null;
          hit_count: number;
          last_used_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          lat_rounded: number;
          lng_rounded: number;
          display_name: string;
          road?: string | null;
          suburb?: string | null;
          city?: string | null;
          governorate?: string | null;
          country?: string | null;
          raw_data?: Json | null;
          hit_count?: number;
          last_used_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          lat_rounded?: number;
          lng_rounded?: number;
          display_name?: string;
          road?: string | null;
          suburb?: string | null;
          city?: string | null;
          governorate?: string | null;
          country?: string | null;
          raw_data?: Json | null;
          hit_count?: number;
          last_used_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          device_label: string | null;
          is_active: boolean;
          last_used_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          device_label?: string | null;
          is_active?: boolean;
          last_used_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          device_label?: string | null;
          is_active?: boolean;
          last_used_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          appointment_reminders: boolean;
          test_results: boolean;
          messages: boolean;
          promotions: boolean;
          system_updates: boolean;
          quiet_hours_start: string;
          quiet_hours_end: string;
          quiet_hours_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          appointment_reminders?: boolean;
          test_results?: boolean;
          messages?: boolean;
          promotions?: boolean;
          system_updates?: boolean;
          quiet_hours_start?: string;
          quiet_hours_end?: string;
          quiet_hours_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          appointment_reminders?: boolean;
          test_results?: boolean;
          messages?: boolean;
          promotions?: boolean;
          system_updates?: boolean;
          quiet_hours_start?: string;
          quiet_hours_end?: string;
          quiet_hours_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      nursing_visit_history: {
        Row: {
          id: string;
          user_id: string;
          appointment_id: string | null;
          specialist_id: string | null;
          procedure_type: string;
          procedure_details: Record<string, unknown> | null;
          vital_signs: {
            bp?: string;
            pulse?: number;
            temp?: number;
            spo2?: number;
          } | null;
          notes: string | null;
          complications: string | null;
          follow_up_required: boolean;
          performed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          appointment_id?: string | null;
          specialist_id?: string | null;
          procedure_type: string;
          procedure_details?: Record<string, unknown> | null;
          vital_signs?: Record<string, unknown> | null;
          notes?: string | null;
          complications?: string | null;
          follow_up_required?: boolean;
          performed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          appointment_id?: string | null;
          specialist_id?: string | null;
          procedure_type?: string;
          procedure_details?: Record<string, unknown> | null;
          vital_signs?: Record<string, unknown> | null;
          notes?: string | null;
          complications?: string | null;
          follow_up_required?: boolean;
          performed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      nurse_emergency_logs: {
        Row: {
          id: string;
          specialist_id: string;
          appointment_id: string | null;
          trigger_reason: string | null;
          description: string | null;
          latitude: number | null;
          longitude: number | null;
          accuracy_m: number | null;
          status: 'open' | 'responding' | 'resolved' | 'false_alarm';
          contacted_911: boolean;
          call_center_notified: boolean;
          resolved_at: string | null;
          resolution_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          specialist_id: string;
          appointment_id?: string | null;
          trigger_reason?: string | null;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          accuracy_m?: number | null;
          status?: 'open' | 'responding' | 'resolved' | 'false_alarm';
          contacted_911?: boolean;
          call_center_notified?: boolean;
          resolved_at?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          specialist_id?: string;
          appointment_id?: string | null;
          trigger_reason?: string | null;
          description?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          accuracy_m?: number | null;
          status?: 'open' | 'responding' | 'resolved' | 'false_alarm';
          contacted_911?: boolean;
          call_center_notified?: boolean;
          resolved_at?: string | null;
          resolution_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      // ✨ V25.7: Pharmacy Catalog System
      pharmacies: {
        Row: {
          id: string;
          name: string;
          owner_user_id: string | null;
          license_number: string | null;
          license_image_url: string | null;
          city: string;
          district: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string;
          whatsapp: string | null;
          is_24h: boolean;
          opens_at: string | null;
          closes_at: string | null;
          working_days: string[];
          has_delivery: boolean;
          has_emergency_section: boolean;
          accepts_insurance: boolean;
          is_active: boolean;
          is_verified: boolean;
          verified_at: string | null;
          verified_by: string | null;
          rating_avg: number;
          rating_count: number;
          cover_image_url: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_user_id?: string | null;
          license_number?: string | null;
          license_image_url?: string | null;
          city: string;
          district: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone: string;
          whatsapp?: string | null;
          is_24h?: boolean;
          opens_at?: string | null;
          closes_at?: string | null;
          working_days?: string[];
          has_delivery?: boolean;
          has_emergency_section?: boolean;
          accepts_insurance?: boolean;
          is_active?: boolean;
          is_verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          rating_avg?: number;
          rating_count?: number;
          cover_image_url?: string | null;
          description?: string | null;
        };
        Update: Partial<{
          name: string;
          owner_user_id: string | null;
          license_number: string | null;
          license_image_url: string | null;
          city: string;
          district: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string;
          whatsapp: string | null;
          is_24h: boolean;
          opens_at: string | null;
          closes_at: string | null;
          working_days: string[];
          has_delivery: boolean;
          has_emergency_section: boolean;
          accepts_insurance: boolean;
          is_active: boolean;
          is_verified: boolean;
          verified_at: string | null;
          verified_by: string | null;
          rating_avg: number;
          rating_count: number;
          cover_image_url: string | null;
          description: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      medications: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          generic_name: string | null;
          manufacturer: string | null;
          country_of_origin: string | null;
          category: string;
          form: string | null;
          strength: string | null;
          unit_type: string | null;
          package_size: string | null;
          requires_prescription: boolean;
          is_controlled: boolean;
          side_effects: string | null;
          contraindications: string | null;
          storage_notes: string | null;
          image_url: string | null;
          search_keywords: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string | null;
          generic_name?: string | null;
          manufacturer?: string | null;
          country_of_origin?: string | null;
          category: string;
          form?: string | null;
          strength?: string | null;
          unit_type?: string | null;
          package_size?: string | null;
          requires_prescription?: boolean;
          is_controlled?: boolean;
          side_effects?: string | null;
          contraindications?: string | null;
          storage_notes?: string | null;
          image_url?: string | null;
          search_keywords?: string[] | null;
        };
        Update: Partial<{
          name_ar: string;
          name_en: string | null;
          generic_name: string | null;
          manufacturer: string | null;
          country_of_origin: string | null;
          category: string;
          form: string | null;
          strength: string | null;
          unit_type: string | null;
          package_size: string | null;
          requires_prescription: boolean;
          is_controlled: boolean;
          side_effects: string | null;
          contraindications: string | null;
          storage_notes: string | null;
          image_url: string | null;
          search_keywords: string[] | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      pharmacy_inventory: {
        Row: {
          id: string;
          pharmacy_id: string;
          medication_id: string;
          is_available: boolean;
          custom_price: number | null;
          brand_variant: string | null;
          notes: string | null;
          searched_count: number;
          last_searched_at: string | null;
          added_at: string;
          updated_at: string;
          marked_unavailable_at: string | null;
        };
        Insert: {
          id?: string;
          pharmacy_id: string;
          medication_id: string;
          is_available?: boolean;
          custom_price?: number | null;
          brand_variant?: string | null;
          notes?: string | null;
          searched_count?: number;
          last_searched_at?: string | null;
        };
        Update: Partial<{
          is_available: boolean;
          custom_price: number | null;
          brand_variant: string | null;
          notes: string | null;
          searched_count: number;
          last_searched_at: string | null;
          marked_unavailable_at: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      medication_searches: {
        Row: {
          id: string;
          user_id: string | null;
          search_query: string;
          medication_id: string | null;
          city_filter: string | null;
          results_count: number;
          found_any_available: boolean;
          ip_country: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          search_query: string;
          medication_id?: string | null;
          city_filter?: string | null;
          results_count?: number;
          found_any_available?: boolean;
          ip_country?: string | null;
        };
        Update: Partial<{
          medication_id: string | null;
          results_count: number;
          found_any_available: boolean;
        }>;
        Relationships: [];
      };
      // ✨ V25.8: Family Members
      family_members: {
        Row: {
          id: string;
          owner_user_id: string;
          full_name: string;
          relation: string;
          gender: 'male' | 'female' | null;
          date_of_birth: string | null;
          phone: string | null;
          blood_type: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          chronic_conditions: string[] | null;
          allergies: string[] | null;
          current_medications: string | null;
          notes: string | null;
          avatar_emoji: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          full_name: string;
          relation: string;
          gender?: 'male' | 'female' | null;
          date_of_birth?: string | null;
          phone?: string | null;
          blood_type?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          chronic_conditions?: string[] | null;
          allergies?: string[] | null;
          current_medications?: string | null;
          notes?: string | null;
          avatar_emoji?: string;
          is_active?: boolean;
        };
        Update: Partial<{
          full_name: string;
          relation: string;
          gender: 'male' | 'female' | null;
          date_of_birth: string | null;
          phone: string | null;
          blood_type: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          chronic_conditions: string[] | null;
          allergies: string[] | null;
          current_medications: string | null;
          notes: string | null;
          avatar_emoji: string;
          is_active: boolean;
          updated_at: string;
        }>;
        Relationships: [];
      };
      // ✨ V25.9: Doctors, Hospitals, Consultations
      doctors: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          full_name_en: string | null;
          title: string;
          gender: 'male' | 'female' | null;
          specialty: string;
          sub_specialty: string | null;
          years_experience: number;
          qualifications: string[] | null;
          certifications_url: string | null;
          available_for_home_visit: boolean;
          available_for_video: boolean;
          available_for_clinic: boolean;
          home_visit_price: number;
          video_consult_price: number;
          monthly_subscription_price: number | null;
          yearly_subscription_price: number | null;
          clinic_name: string | null;
          clinic_address: string | null;
          clinic_city: string | null;
          clinic_phone: string | null;
          clinic_lat: number | null;
          clinic_lng: number | null;
          languages: string[];
          rating_avg: number;
          rating_count: number;
          bio: string | null;
          avatar_url: string | null;
          is_active: boolean;
          is_verified: boolean;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          user_id: string | null;
          full_name_en: string | null;
          title: string;
          gender: 'male' | 'female' | null;
          sub_specialty: string | null;
          years_experience: number;
          qualifications: string[] | null;
          certifications_url: string | null;
          available_for_home_visit: boolean;
          available_for_video: boolean;
          available_for_clinic: boolean;
          home_visit_price: number;
          video_consult_price: number;
          monthly_subscription_price: number | null;
          yearly_subscription_price: number | null;
          clinic_name: string | null;
          clinic_address: string | null;
          clinic_city: string | null;
          clinic_phone: string | null;
          clinic_lat: number | null;
          clinic_lng: number | null;
          languages: string[];
          rating_avg: number;
          rating_count: number;
          bio: string | null;
          avatar_url: string | null;
          is_active: boolean;
          is_verified: boolean;
        }> & { full_name: string; specialty: string };
        Update: Partial<{
          full_name: string;
          full_name_en: string | null;
          title: string;
          gender: 'male' | 'female' | null;
          specialty: string;
          sub_specialty: string | null;
          years_experience: number;
          qualifications: string[] | null;
          home_visit_price: number;
          video_consult_price: number;
          monthly_subscription_price: number | null;
          yearly_subscription_price: number | null;
          clinic_name: string | null;
          clinic_address: string | null;
          clinic_city: string | null;
          clinic_phone: string | null;
          clinic_lat: number | null;
          clinic_lng: number | null;
          languages: string[];
          rating_avg: number;
          rating_count: number;
          bio: string | null;
          avatar_url: string | null;
          is_active: boolean;
          is_verified: boolean;
          updated_at: string;
        }>;
        Relationships: [];
      };
      doctor_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          doctor_id: string;
          family_member_id: string | null;
          plan: 'monthly' | 'yearly';
          price: number;
          status: 'active' | 'expired' | 'cancelled' | 'paused';
          starts_at: string;
          expires_at: string;
          cancelled_at: string | null;
          visits_used: number;
          consultations_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          doctor_id: string;
          family_member_id?: string | null;
          plan: 'monthly' | 'yearly';
          price: number;
          status?: 'active' | 'expired' | 'cancelled' | 'paused';
          starts_at?: string;
          expires_at: string;
          visits_used?: number;
          consultations_used?: number;
        };
        Update: Partial<{
          status: 'active' | 'expired' | 'cancelled' | 'paused';
          expires_at: string;
          cancelled_at: string | null;
          visits_used: number;
          consultations_used: number;
          updated_at: string;
        }>;
        Relationships: [];
      };
      hospitals: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          type: 'government' | 'private' | 'health_center' | 'specialized';
          city: string;
          district: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          phone_emergency: string | null;
          whatsapp: string | null;
          website: string | null;
          email: string | null;
          is_24h: boolean;
          visiting_hours: string | null;
          departments: string[] | null;
          has_emergency: boolean;
          has_ambulance: boolean;
          has_pharmacy: boolean;
          has_lab: boolean;
          has_radiology: boolean;
          beds_count: number | null;
          icu_beds_count: number | null;
          rating_avg: number;
          rating_count: number;
          cover_image_url: string | null;
          logo_url: string | null;
          description: string | null;
          is_active: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          name_en: string | null;
          city: string;
          district: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          phone_emergency: string | null;
          whatsapp: string | null;
          website: string | null;
          email: string | null;
          is_24h: boolean;
          visiting_hours: string | null;
          departments: string[] | null;
          has_emergency: boolean;
          has_ambulance: boolean;
          has_pharmacy: boolean;
          has_lab: boolean;
          has_radiology: boolean;
          beds_count: number | null;
          icu_beds_count: number | null;
          rating_avg: number;
          rating_count: number;
          cover_image_url: string | null;
          logo_url: string | null;
          description: string | null;
          is_active: boolean;
          is_verified: boolean;
        }> & {
          name: string;
          type: 'government' | 'private' | 'health_center' | 'specialized';
          city: string;
        };
        Update: Partial<{
          name: string;
          name_en: string | null;
          type: 'government' | 'private' | 'health_center' | 'specialized';
          city: string;
          district: string | null;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          phone_emergency: string | null;
          whatsapp: string | null;
          website: string | null;
          email: string | null;
          is_24h: boolean;
          visiting_hours: string | null;
          departments: string[] | null;
          has_emergency: boolean;
          has_ambulance: boolean;
          has_pharmacy: boolean;
          has_lab: boolean;
          has_radiology: boolean;
          beds_count: number | null;
          icu_beds_count: number | null;
          rating_avg: number;
          rating_count: number;
          cover_image_url: string | null;
          logo_url: string | null;
          description: string | null;
          is_active: boolean;
          is_verified: boolean;
          updated_at: string;
        }>;
        Relationships: [];
      };
      consultations: {
        Row: {
          id: string;
          patient_user_id: string;
          doctor_id: string | null;
          doctor_user_id: string | null;
          family_member_id: string | null;
          consultation_type: 'chat' | 'asynchronous';
          title: string;
          category: string | null;
          shared_medical_data: Record<string, unknown> | null;
          status: 'open' | 'awaiting_doctor' | 'awaiting_patient' | 'closed';
          price: number;
          is_free: boolean;
          subscription_id: string | null;
          expected_response_hours: number;
          responded_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_user_id: string;
          doctor_id?: string | null;
          doctor_user_id?: string | null;
          family_member_id?: string | null;
          consultation_type?: 'chat' | 'asynchronous';
          title: string;
          category?: string | null;
          shared_medical_data?: Record<string, unknown> | null;
          status?: 'open' | 'awaiting_doctor' | 'awaiting_patient' | 'closed';
          price?: number;
          is_free?: boolean;
          subscription_id?: string | null;
          expected_response_hours?: number;
        };
        Update: Partial<{
          doctor_id: string | null;
          doctor_user_id: string | null;
          status: 'open' | 'awaiting_doctor' | 'awaiting_patient' | 'closed';
          shared_medical_data: Record<string, unknown> | null;
          responded_at: string | null;
          closed_at: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      consultation_messages: {
        Row: {
          id: string;
          consultation_id: string;
          sender_id: string;
          sender_role: 'patient' | 'doctor' | 'system';
          message_type: 'text' | 'image' | 'medical_record' | 'voice';
          content: string | null;
          image_url: string | null;
          attached_record_id: string | null;
          attached_record_type: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          consultation_id: string;
          sender_id: string;
          sender_role: 'patient' | 'doctor' | 'system';
          message_type?: 'text' | 'image' | 'medical_record' | 'voice';
          content?: string | null;
          image_url?: string | null;
          attached_record_id?: string | null;
          attached_record_type?: string | null;
        };
        Update: Partial<{
          is_read: boolean;
          read_at: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: {
      appointments_with_users: {
        Row: {
          id: string | null;
          user_id: string | null;
          service_type: string | null;
          scheduled_at: string | null;
          address: string | null;
          notes: string | null;
          notes_encrypted: string | null;
          status:
            | 'pending'
            | 'confirmed'
            | 'in_progress'
            | 'completed'
            | 'cancelled'
            | null;
          created_at: string | null;
          updated_at: string | null;
          user_full_name: string | null;
          user_phone: string | null;
        };
        Relationships: [];
      };
      // ✨ View جديد: حجوزات اليوم
      today_appointments: {
        Row: {
          id: string | null;
          user_id: string | null;
          specialist_id: string | null;
          service_type: string | null;
          scheduled_at: string | null;
          address: string | null;
          estimated_price: number | null;
          duration_minutes: number | null;
          status:
            | 'pending'
            | 'confirmed'
            | 'in_progress'
            | 'completed'
            | 'cancelled'
            | null;
          otp_channel: 'whatsapp' | 'telegram' | 'sms' | null;
          minutes_until: number | null;
          urgency: 'past' | 'imminent' | 'soon' | 'later' | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      cleanup_expired_otps: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      appointment_status:
        | 'pending'
        | 'confirmed'
        | 'in_progress'
        | 'completed'
        | 'cancelled';
      user_role: 'patient' | 'specialist' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── Helper types ───
type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

// ─── Convenience exports ───
export type AppointmentStatus = Database['public']['Enums']['appointment_status'];
export type UserRole = Database['public']['Enums']['user_role'];
export type User = Database['public']['Tables']['users']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
// ✨ exports جديدة:
export type OtpChannel = 'whatsapp' | 'telegram' | 'sms';
export type TelegramLink = Database['public']['Tables']['user_telegram_links']['Row'];
export type OtpAttempt = Database['public']['Tables']['otp_attempts']['Row'];
