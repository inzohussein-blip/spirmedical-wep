/**
 * أنواع قاعدة البيانات لـ Supabase
 *
 * مولّد يدوياً ليطابق output `supabase gen types typescript`.
 * لتوليده تلقائياً من Supabase الفعلي:
 *   npx supabase gen types typescript --project-id ioulxemokusfeykjcaxg > src/types/database.ts
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
          role: 'patient' | 'specialist' | 'admin';
          governorate: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          full_name?: string | null;
          email?: string | null;
          role?: 'patient' | 'specialist' | 'admin';
          governorate?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          full_name?: string | null;
          email?: string | null;
          role?: 'patient' | 'specialist' | 'admin';
          governorate?: string | null;
          created_at?: string;
          updated_at?: string;
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
    };
    Functions: {
      [_ in never]: never;
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
