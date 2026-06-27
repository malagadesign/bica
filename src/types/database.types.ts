/**
 * Tipos de base de datos — actualizar con Supabase CLI tras migraciones:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
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
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      regulatory_authorities: {
        Row: {
          id: string;
          name: string;
          code: string;
          country: string | null;
          region: string | null;
          description: string | null;
          website_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["regulatory_authorities"]["Row"]
        > & {
          name: string;
          code: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["regulatory_authorities"]["Row"]
        >;
      };
      regulatory_documents: {
        Row: {
          id: string;
          authority_id: string;
          title: string;
          document_type: string;
          document_number: string | null;
          publication_date: string | null;
          effective_date: string | null;
          source_url: string | null;
          file_path: string | null;
          language: string | null;
          summary: string | null;
          status: string;
          mercosur_reference: string | null;
          source_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["regulatory_documents"]["Row"]
        > & {
          authority_id: string;
          title: string;
          document_type: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["regulatory_documents"]["Row"]
        >;
      };
      regulatory_lists: {
        Row: {
          id: string;
          authority_id: string;
          name: string;
          code: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["regulatory_lists"]["Row"]
        > & {
          authority_id: string;
          name: string;
          code: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["regulatory_lists"]["Row"]
        >;
      };
      ingredients: {
        Row: {
          id: string;
          inci_name: string | null;
          chemical_name: string | null;
          cas_number: string | null;
          einecs: string | null;
          color_index: string | null;
          function: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ingredients"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["ingredients"]["Row"]>;
      };
      ingredient_synonyms: {
        Row: {
          id: string;
          ingredient_id: string;
          synonym: string;
          synonym_type: string;
          source: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["ingredient_synonyms"]["Row"]
        > & {
          ingredient_id: string;
          synonym: string;
          synonym_type: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["ingredient_synonyms"]["Row"]
        >;
      };
      ingredient_rules: {
        Row: {
          id: string;
          ingredient_id: string;
          authority_id: string;
          list_id: string;
          document_id: string;
          rule_status: string;
          source_record_id: string;
          source_sheet: string | null;
          source_row_start: number | null;
          source_row_end: number | null;
          entry_number_ar: string | null;
          entry_number_eu: string | null;
          conditions_raw: string | null;
          needs_review: boolean;
          review_reason: string | null;
          import_batch_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["ingredient_rules"]["Row"]
        > & {
          ingredient_id: string;
          authority_id: string;
          list_id: string;
          document_id: string;
          rule_status: string;
          source_record_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["ingredient_rules"]["Row"]
        >;
      };
      restrictions: {
        Row: {
          id: string;
          ingredient_rule_id: string;
          application_area: string | null;
          max_concentration: number | null;
          concentration_unit: string | null;
          expressed_as: string | null;
          limitation_text: string | null;
          warning_text: string | null;
          condition_text: string | null;
          notes: string | null;
          extended_conditions: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["restrictions"]["Row"]> & {
          ingredient_rule_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["restrictions"]["Row"]>;
      };
      rule_versions: {
        Row: {
          id: string;
          ingredient_rule_id: string;
          version_number: string;
          schema_version: number;
          data_snapshot: Json;
          change_description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["rule_versions"]["Row"]
        > & {
          ingredient_rule_id: string;
          data_snapshot: Json;
        };
        Update: Partial<Database["public"]["Tables"]["rule_versions"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

export type Ingredient = Database["public"]["Tables"]["ingredients"]["Row"];
export type IngredientRule =
  Database["public"]["Tables"]["ingredient_rules"]["Row"];
export type Restriction = Database["public"]["Tables"]["restrictions"]["Row"];
export type RegulatoryList =
  Database["public"]["Tables"]["regulatory_lists"]["Row"];
export type RegulatoryDocument =
  Database["public"]["Tables"]["regulatory_documents"]["Row"];
