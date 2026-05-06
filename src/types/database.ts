/**
 * أنواع قاعدة البيانات لـ Supabase
 *
 * 💡 لتوليد هذا الملف تلقائياً من Supabase الفعلي:
 * npx supabase gen types typescript --project-id ioulxemokusfeykjcaxg > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type UserRole = 'patient' | 'specialist' | 'admin';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          full_name: string | null;
          email: string | null;
          role: UserRole;
          governorate: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          full_name?: string | null;
          email?: string | null;
          role?: UserRole;
          governorate?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          full_name?: string | null;
          email?: string | null;
          role?: UserRole;
          governorate?: string | null;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          service_type: string;
          scheduled_at: string;
          address: string;
          notes: string | null;
          status: AppointmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_type: string;
          scheduled_at: string;
          address: string;
          notes?: string | null;
          status?: AppointmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_type?: string;
          scheduled_at?: string;
          address?: string;
          notes?: string | null;
          status?: AppointmentStatus;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      appointment_status: AppointmentStatus;
      user_role: UserRole;
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Appointment = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];
