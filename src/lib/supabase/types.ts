export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      labs: {
        Row: {
          id: string
          name: string
          slug: string
          institution: string | null
          settings: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          institution?: string | null
          settings?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          institution?: string | null
          settings?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_lab_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["lab_id"]
          },
          {
            foreignKeyName: "locations_lab_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["lab_id"]
          },
          {
            foreignKeyName: "inventory_items_lab_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["lab_id"]
          },
          {
            foreignKeyName: "grants_lab_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["lab_id"]
          },
          {
            foreignKeyName: "activity_log_lab_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "activity_log"
            referencedColumns: ["lab_id"]
          },
        ]
      }
      members: {
        Row: {
          id: string
          user_id: string
          lab_id: string
          role: "owner" | "admin" | "member"
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lab_id: string
          role?: "owner" | "admin" | "member"
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lab_id?: string
          role?: "owner" | "admin" | "member"
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          id: string
          lab_id: string
          parent_id: string | null
          name: string
          type: "room" | "bench" | "freezer" | "shelf" | "cabinet" | "other"
          created_at: string
        }
        Insert: {
          id?: string
          lab_id: string
          parent_id?: string | null
          name: string
          type: "room" | "bench" | "freezer" | "shelf" | "cabinet" | "other"
          created_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          parent_id?: string | null
          name?: string
          type?: "room" | "bench" | "freezer" | "shelf" | "cabinet" | "other"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          id: string
          lab_id: string
          created_by: string
          name: string
          description: string | null
          type: "equipment" | "reagent" | "consumable" | "chemical"
          quantity: number
          unit: string
          min_threshold: number
          location_id: string | null
          catalog_number: string | null
          lot_number: string | null
          manufacturer: string | null
          supplier: string | null
          expiration_date: string | null
          conductscience_product_id: string | null
          barcode: string | null
          status: "in_stock" | "low_stock" | "out_of_stock" | "expired"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lab_id: string
          created_by: string
          name: string
          description?: string | null
          type: "equipment" | "reagent" | "consumable" | "chemical"
          quantity?: number
          unit: string
          min_threshold?: number
          location_id?: string | null
          catalog_number?: string | null
          lot_number?: string | null
          manufacturer?: string | null
          supplier?: string | null
          expiration_date?: string | null
          conductscience_product_id?: string | null
          barcode?: string | null
          status?: "in_stock" | "low_stock" | "out_of_stock" | "expired"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          created_by?: string
          name?: string
          description?: string | null
          type?: "equipment" | "reagent" | "consumable" | "chemical"
          quantity?: number
          unit?: string
          min_threshold?: number
          location_id?: string | null
          catalog_number?: string | null
          lot_number?: string | null
          manufacturer?: string | null
          supplier?: string | null
          expiration_date?: string | null
          conductscience_product_id?: string | null
          barcode?: string | null
          status?: "in_stock" | "low_stock" | "out_of_stock" | "expired"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          id: string
          inventory_item_id: string
          serial_number: string | null
          model_number: string | null
          purchase_date: string | null
          purchase_price: number | null
          warranty_expires: string | null
          calibration_interval_days: number | null
          last_calibrated: string | null
          status: "active" | "maintenance" | "decommissioned"
          created_at: string
        }
        Insert: {
          id?: string
          inventory_item_id: string
          serial_number?: string | null
          model_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          warranty_expires?: string | null
          calibration_interval_days?: number | null
          last_calibrated?: string | null
          status?: "active" | "maintenance" | "decommissioned"
          created_at?: string
        }
        Update: {
          id?: string
          inventory_item_id?: string
          serial_number?: string | null
          model_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          warranty_expires?: string | null
          calibration_interval_days?: number | null
          last_calibrated?: string | null
          status?: "active" | "maintenance" | "decommissioned"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: true
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          id: string
          equipment_id: string
          performed_by: string
          date: string
          type: "calibration" | "repair" | "inspection" | "cleaning"
          description: string | null
          cost: number | null
          next_due: string | null
          created_at: string
        }
        Insert: {
          id?: string
          equipment_id: string
          performed_by: string
          date: string
          type: "calibration" | "repair" | "inspection" | "cleaning"
          description?: string | null
          cost?: number | null
          next_due?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          equipment_id?: string
          performed_by?: string
          date?: string
          type?: "calibration" | "repair" | "inspection" | "cleaning"
          description?: string | null
          cost?: number | null
          next_due?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          id: string
          lab_id: string
          created_by: string
          name: string
          funder: string | null
          grant_number: string | null
          total_amount: number
          start_date: string | null
          end_date: string | null
          categories: Json
          created_at: string
        }
        Insert: {
          id?: string
          lab_id: string
          created_by: string
          name: string
          funder?: string | null
          grant_number?: string | null
          total_amount: number
          start_date?: string | null
          end_date?: string | null
          categories?: Json
          created_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          created_by?: string
          name?: string
          funder?: string | null
          grant_number?: string | null
          total_amount?: number
          start_date?: string | null
          end_date?: string | null
          categories?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grants_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          grant_id: string
          inventory_item_id: string | null
          amount: number
          date: string
          description: string | null
          category: string | null
          receipt_url: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          grant_id: string
          inventory_item_id?: string | null
          amount: number
          date: string
          description?: string | null
          category?: string | null
          receipt_url?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          grant_id?: string
          inventory_item_id?: string | null
          amount?: number
          date?: string
          description?: string | null
          category?: string | null
          receipt_url?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          id: string
          lab_id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          lab_id: string
          user_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          lab_id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_lab_with_owner: {
        Args: {
          p_name: string
          p_slug: string
          p_institution?: string | null
        }
        Returns: string
      }
    }
    Enums: {
      member_role: "owner" | "admin" | "member"
      item_type: "equipment" | "reagent" | "consumable" | "chemical"
      item_status: "in_stock" | "low_stock" | "out_of_stock" | "expired"
      location_type: "room" | "bench" | "freezer" | "shelf" | "cabinet" | "other"
      equipment_status: "active" | "maintenance" | "decommissioned"
      maintenance_type: "calibration" | "repair" | "inspection" | "cleaning"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type InsertTables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]

// Per-table row type shortcuts
export type Lab = Tables<"labs">
export type Member = Tables<"members">
export type Location = Tables<"locations">
export type InventoryItem = Tables<"inventory_items">
export type Equipment = Tables<"equipment">
export type MaintenanceLog = Tables<"maintenance_logs">
export type Grant = Tables<"grants">
export type Transaction = Tables<"transactions">
export type ActivityLog = Tables<"activity_log">
