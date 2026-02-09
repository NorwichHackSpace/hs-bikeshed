export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string | null
          end_time: string
          equipment_id: string
          id: string
          notes: string | null
          start_time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          equipment_id: string
          id?: string
          notes?: string | null
          start_time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          start_time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          induction_required: boolean | null
          metadata: Json | null
          model: string | null
          name: string
          require_booking: boolean | null
          risk_level: string | null
          status: Database["public"]["Enums"]["equipment_status"] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          induction_required?: boolean | null
          metadata?: Json | null
          model?: string | null
          name: string
          require_booking?: boolean | null
          risk_level?: string | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          induction_required?: boolean | null
          metadata?: Json | null
          model?: string | null
          name?: string
          require_booking?: boolean | null
          risk_level?: string | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_maintainers: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          equipment_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          equipment_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          equipment_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintainers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintainers_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintainers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_usage_log: {
        Row: {
          id: string
          equipment_id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_minutes: number | null
          source: "booking" | "manual" | "check_in"
          notes: string | null
          booking_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          equipment_id: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          source?: "booking" | "manual" | "check_in"
          notes?: string | null
          booking_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          equipment_id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          source?: "booking" | "manual" | "check_in"
          notes?: string | null
          booking_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_usage_log_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_usage_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_usage_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      induction_requests: {
        Row: {
          equipment_id: string
          id: string
          notes: string | null
          requested_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          equipment_id: string
          id?: string
          notes?: string | null
          requested_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          equipment_id?: string
          id?: string
          notes?: string | null
          requested_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "induction_requests_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "induction_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inductions: {
        Row: {
          created_at: string | null
          equipment_id: string
          id: string
          inducted_at: string | null
          inducted_by: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          id?: string
          inducted_at?: string | null
          inducted_by: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          id?: string
          inducted_at?: string | null
          inducted_by?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inductions_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inductions_inducted_by_fkey"
            columns: ["inducted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inductions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          name: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          // Address
          address_line1: string | null
          address_line2: string | null
          city: string | null
          county: string | null
          postcode: string | null
          country: string | null
          // Interests & Experience
          interests_skills: string | null
          had_tour: boolean | null
          hackspace_goals: string | null
          // Privacy
          share_details_with_members: string | null
          // Policy agreements
          accepted_policies: boolean | null
          accepted_safety_responsibility: boolean | null
          is_over_18: boolean | null
          standing_order_confirmed: boolean | null
          // Medical
          has_medical_conditions: boolean | null
          medical_conditions_details: string | null
          // Emergency contact
          emergency_contact_name: string | null
          emergency_contact_relationship: string | null
          emergency_contact_mobile: string | null
          emergency_contact_landline: string | null
          // Referral & Marketing
          referral_source: string | null
          opt_in_communications: boolean | null
          opt_in_marketing: boolean | null
          // Membership
          membership_status: Database["public"]["Enums"]["membership_status"] | null
          join_date: string | null
          created_at: string | null
          updated_at: string | null
          // Payment matching
          payment_reference: string | null
        }
        Insert: {
          id: string
          name: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          county?: string | null
          postcode?: string | null
          country?: string | null
          interests_skills?: string | null
          had_tour?: boolean | null
          hackspace_goals?: string | null
          share_details_with_members?: string | null
          accepted_policies?: boolean | null
          accepted_safety_responsibility?: boolean | null
          is_over_18?: boolean | null
          standing_order_confirmed?: boolean | null
          has_medical_conditions?: boolean | null
          medical_conditions_details?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relationship?: string | null
          emergency_contact_mobile?: string | null
          emergency_contact_landline?: string | null
          referral_source?: string | null
          opt_in_communications?: boolean | null
          opt_in_marketing?: boolean | null
          membership_status?: Database["public"]["Enums"]["membership_status"] | null
          join_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          payment_reference?: string | null
        }
        Update: {
          id?: string
          name?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          county?: string | null
          postcode?: string | null
          country?: string | null
          interests_skills?: string | null
          had_tour?: boolean | null
          hackspace_goals?: string | null
          share_details_with_members?: string | null
          accepted_policies?: boolean | null
          accepted_safety_responsibility?: boolean | null
          is_over_18?: boolean | null
          standing_order_confirmed?: boolean | null
          has_medical_conditions?: boolean | null
          medical_conditions_details?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relationship?: string | null
          emergency_contact_mobile?: string | null
          emergency_contact_landline?: string | null
          referral_source?: string | null
          opt_in_communications?: boolean | null
          opt_in_marketing?: boolean | null
          membership_status?: Database["public"]["Enums"]["membership_status"] | null
          join_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          payment_reference?: string | null
        }
        Relationships: []
      }
      project_equipment: {
        Row: {
          equipment_id: string
          id: string
          project_id: string
        }
        Insert: {
          equipment_id: string
          id?: string
          project_id: string
        }
        Update: {
          equipment_id?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_equipment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          visibility: 'public' | 'hackspace' | 'private'
          status: 'active' | 'completed' | 'on_hold' | 'archived'
          cover_image_url: string | null
          tags: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          visibility?: 'public' | 'hackspace' | 'private'
          status?: 'active' | 'completed' | 'on_hold' | 'archived'
          cover_image_url?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          visibility?: 'public' | 'hackspace' | 'private'
          status?: 'active' | 'completed' | 'on_hold' | 'archived'
          cover_image_url?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          id: string
          project_id: string
          user_id: string
          title: string | null
          content: string
          images: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          title?: string | null
          content: string
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          title?: string | null
          content?: string
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          transaction_date: string
          description: string
          amount: number
          reference: string | null
          balance: number | null
          user_id: string | null
          match_confidence: 'auto' | 'manual' | 'unmatched' | null
          matched_by: string | null
          matched_at: string | null
          import_batch_id: string
          raw_data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          transaction_date: string
          description: string
          amount: number
          reference?: string | null
          balance?: number | null
          user_id?: string | null
          match_confidence?: 'auto' | 'manual' | 'unmatched' | null
          matched_by?: string | null
          matched_at?: string | null
          import_batch_id: string
          raw_data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          transaction_date?: string
          description?: string
          amount?: number
          reference?: string | null
          balance?: number | null
          user_id?: string | null
          match_confidence?: 'auto' | 'manual' | 'unmatched' | null
          matched_by?: string | null
          matched_at?: string | null
          import_batch_id?: string
          raw_data?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_matched_by_fkey"
            columns: ["matched_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "transaction_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_imports: {
        Row: {
          id: string
          filename: string
          uploaded_by: string
          uploaded_at: string | null
          row_count: number | null
          matched_count: number | null
          status: 'pending' | 'processing' | 'completed' | null
        }
        Insert: {
          id?: string
          filename: string
          uploaded_by: string
          uploaded_at?: string | null
          row_count?: number | null
          matched_count?: number | null
          status?: 'pending' | 'processing' | 'completed' | null
        }
        Update: {
          id?: string
          filename?: string
          uploaded_by?: string
          uploaded_at?: string | null
          row_count?: number | null
          matched_count?: number | null
          status?: 'pending' | 'processing' | 'completed' | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_imports_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_equipment_links: {
        Row: {
          document_id: string
          equipment_id: string
          linked_by: string
          linked_at: string
        }
        Insert: {
          document_id: string
          equipment_id: string
          linked_by: string
          linked_at?: string
        }
        Update: {
          document_id?: string
          equipment_id?: string
          linked_by?: string
          linked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_equipment_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_equipment_links_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_equipment_links_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_project_links: {
        Row: {
          document_id: string
          project_id: string
          linked_by: string
          linked_at: string
        }
        Insert: {
          document_id: string
          project_id: string
          linked_by: string
          linked_at?: string
        }
        Update: {
          document_id?: string
          project_id?: string
          linked_by?: string
          linked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_project_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_project_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_project_links_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          id: string
          equipment_id: string | null
          filename: string
          storage_path: string
          file_size: number
          mime_type: string
          title: string
          description: string | null
          tags: string[]
          is_public: boolean
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          equipment_id?: string | null
          filename: string
          storage_path: string
          file_size: number
          mime_type: string
          title: string
          description?: string | null
          tags?: string[]
          is_public?: boolean
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          filename?: string
          storage_path?: string
          file_size?: number
          mime_type?: string
          title?: string
          description?: string | null
          tags?: string[]
          is_public?: boolean
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Args: { check_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_inducted_on: { Args: { equip_id: string }; Returns: boolean }
      is_maintainer_of: { Args: { equip_id: string }; Returns: boolean }
    }
    Enums: {
      equipment_status: "operational" | "out_of_service" | "retired"
      membership_status: "active" | "inactive" | "lapsed"
      user_role: "member" | "equipment_maintainer" | "administrator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Equipment = Database["public"]["Tables"]["equipment"]["Row"]
export type Booking = Database["public"]["Tables"]["bookings"]["Row"]
export type Induction = Database["public"]["Tables"]["inductions"]["Row"]
export type InductionRequest = Database["public"]["Tables"]["induction_requests"]["Row"]
export type Project = Database["public"]["Tables"]["projects"]["Row"]
export type ProjectUpdate = Database["public"]["Tables"]["project_updates"]["Row"]
export type EquipmentMaintainer = Database["public"]["Tables"]["equipment_maintainers"]["Row"]
export type UserRoleRecord = Database["public"]["Tables"]["user_roles"]["Row"]

export type MembershipStatus = Database["public"]["Enums"]["membership_status"]
export type EquipmentStatus = Database["public"]["Enums"]["equipment_status"]
export type UserRole = Database["public"]["Enums"]["user_role"]

// Transaction types
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"]
export type TransactionImport = Database["public"]["Tables"]["transaction_imports"]["Row"]

// Document types
export type Document = Database["public"]["Tables"]["documents"]["Row"]
export type DocumentEquipmentLink = Database["public"]["Tables"]["document_equipment_links"]["Row"]
export type DocumentProjectLink = Database["public"]["Tables"]["document_project_links"]["Row"]

// Usage log types
export type EquipmentUsageLog = Database["public"]["Tables"]["equipment_usage_log"]["Row"]
export type UsageSource = EquipmentUsageLog["source"]

// Usage log with joined equipment details
export interface UsageLogWithEquipment extends EquipmentUsageLog {
  equipment?: Equipment | null
}

// Usage summary for equipment detail page
export interface EquipmentUsageSummary {
  totalSessions: number
  totalMinutes: number
  sessionsThisMonth: number
  uniqueUsers: number
}

// Document with link counts for library view
export interface DocumentWithLinkCounts extends Document {
  equipment_count?: number
  project_count?: number
}

// Transaction with joined user profile
export interface TransactionWithUser extends Transaction {
  profiles?: Profile | null
  matched_by_profile?: Profile | null
}

// Payment summary for a user
export interface PaymentSummary {
  totalPaid: number
  lastPaymentDate: string | null
  paymentCount: number
  transactions: Transaction[]
}
