/**
 * Tipos manuais do schema em supabase/sql/001_initial_schema.sql
 * supabase/sql/002_quote_requests.sql, supabase/sql/003_registration_forms.sql
 * supabase/sql/004_partner_companies.sql e supabase/sql/005_technology.sql.
 * Não foram gerados por CLI para não consultar o projeto remoto.
 * Os arquivos ficam nos buckets privados catalog-pdfs e catalog-covers.
 */

export type UserRole = "comprador" | "fornecedor" | "administrador";

export type ApprovalStatus = "pendente" | "aprovado" | "rejeitado" | "suspenso";

export type ApprovalSubject =
  | "perfil"
  | "comprador"
  | "fornecedor"
  | "catalogo"
  | "arquivo";

export type CatalogVisibility = "publico" | "restrito";

export type CatalogFileKind = "pdf" | "capa";

export type CorrectionState = "aberta" | "atendida" | "cancelada";

export type QuoteState = "aberta" | "encerrada";

export type RegistrationParty = "comprador" | "fornecedor";

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          role: UserRole;
          status: ApprovalStatus;
          full_name: string;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          role?: UserRole;
          status?: ApprovalStatus;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          role?: UserRole;
          status?: ApprovalStatus;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      buyers: Table<
        {
          id: string;
          profile_id: string;
          company_name: string;
          cnpj: string;
          job_title: string;
          segment: string;
          whatsapp: string;
          status: ApprovalStatus;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          profile_id: string;
          company_name: string;
          cnpj: string;
          job_title: string;
          segment: string;
          whatsapp: string;
          status?: ApprovalStatus;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          profile_id?: string;
          company_name?: string;
          cnpj?: string;
          job_title?: string;
          segment?: string;
          whatsapp?: string;
          status?: ApprovalStatus;
          created_at?: string;
          updated_at?: string;
        }
      >;
      suppliers: Table<
        {
          id: string;
          profile_id: string;
          legal_name: string;
          trade_name: string;
          cnpj: string;
          segment: string;
          description: string;
          logo: string;
          commercial_contact: string;
          contact_email: string;
          whatsapp: string;
          status: ApprovalStatus;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          profile_id: string;
          legal_name: string;
          trade_name: string;
          cnpj: string;
          segment: string;
          description: string;
          logo: string;
          commercial_contact: string;
          contact_email: string;
          whatsapp: string;
          status?: ApprovalStatus;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          profile_id?: string;
          legal_name?: string;
          trade_name?: string;
          cnpj?: string;
          segment?: string;
          description?: string;
          logo?: string;
          commercial_contact?: string;
          contact_email?: string;
          whatsapp?: string;
          status?: ApprovalStatus;
          created_at?: string;
          updated_at?: string;
        }
      >;
      approval_decisions: Table<
        {
          id: string;
          actor_id: string | null;
          subject_type: ApprovalSubject;
          subject_id: string;
          previous_status: ApprovalStatus | null;
          new_status: ApprovalStatus | null;
          previous_role: UserRole | null;
          new_role: UserRole | null;
          note: string | null;
          created_at: string;
        },
        {
          id?: string;
          actor_id?: string | null;
          subject_type: ApprovalSubject;
          subject_id: string;
          previous_status?: ApprovalStatus | null;
          new_status?: ApprovalStatus | null;
          previous_role?: UserRole | null;
          new_role?: UserRole | null;
          note?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          actor_id?: string | null;
          subject_type?: ApprovalSubject;
          subject_id?: string;
          previous_status?: ApprovalStatus | null;
          new_status?: ApprovalStatus | null;
          previous_role?: UserRole | null;
          new_role?: UserRole | null;
          note?: string | null;
          created_at?: string;
        }
      >;
      catalog_categories: Table<
        {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          parent_id?: string | null;
          name?: string;
          slug?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      catalogs: Table<
        {
          id: string;
          supplier_id: string;
          category_id: string;
          title: string;
          slug: string | null;
          description: string | null;
          visibility: CatalogVisibility;
          status: ApprovalStatus;
          published_at: string | null;
          published_pdf_id: string | null;
          published_cover_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          supplier_id: string;
          category_id: string;
          title: string;
          slug?: string | null;
          description?: string | null;
          visibility?: CatalogVisibility;
          status?: ApprovalStatus;
          published_at?: string | null;
          published_pdf_id?: string | null;
          published_cover_id?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          supplier_id?: string;
          category_id?: string;
          title?: string;
          slug?: string | null;
          description?: string | null;
          visibility?: CatalogVisibility;
          status?: ApprovalStatus;
          published_at?: string | null;
          published_pdf_id?: string | null;
          published_cover_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      catalog_files: Table<
        {
          id: string;
          catalog_id: string;
          supplier_id: string;
          kind: CatalogFileKind;
          bucket_id: string;
          storage_path: string;
          mime_type: string;
          byte_size: number;
          status: ApprovalStatus;
          published_at: string | null;
          superseded_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          catalog_id: string;
          supplier_id: string;
          kind: CatalogFileKind;
          bucket_id: string;
          storage_path: string;
          mime_type: string;
          byte_size: number;
          status?: ApprovalStatus;
          published_at?: string | null;
          superseded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          catalog_id?: string;
          supplier_id?: string;
          kind?: CatalogFileKind;
          bucket_id?: string;
          storage_path?: string;
          mime_type?: string;
          byte_size?: number;
          status?: ApprovalStatus;
          published_at?: string | null;
          superseded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      catalog_downloads: Table<
        {
          id: string;
          catalog_id: string;
          file_id: string;
          downloaded_by: string | null;
          downloaded_at: string;
        },
        {
          id?: string;
          catalog_id: string;
          file_id: string;
          downloaded_by?: string | null;
          downloaded_at?: string;
        },
        {
          id?: string;
          catalog_id?: string;
          file_id?: string;
          downloaded_by?: string | null;
          downloaded_at?: string;
        }
      >;
      correction_requests: Table<
        {
          id: string;
          subject_type: ApprovalSubject;
          subject_id: string;
          requested_by: string;
          reason: string;
          state: CorrectionState;
          response: string | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        },
        {
          id?: string;
          subject_type: ApprovalSubject;
          subject_id: string;
          requested_by: string;
          reason: string;
          state?: CorrectionState;
          response?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        },
        {
          id?: string;
          subject_type?: ApprovalSubject;
          subject_id?: string;
          requested_by?: string;
          reason?: string;
          state?: CorrectionState;
          response?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        }
      >;
      quote_requests: Table<
        {
          id: string;
          buyer_id: string;
          catalog_id: string;
          supplier_id: string;
          message: string;
          state: QuoteState;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        },
        {
          id?: string;
          buyer_id: string;
          catalog_id: string;
          supplier_id: string;
          message: string;
          state?: QuoteState;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        },
        {
          id?: string;
          buyer_id?: string;
          catalog_id?: string;
          supplier_id?: string;
          message?: string;
          state?: QuoteState;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        }
      >;
      registration_forms: Table<
        {
          id: string;
          profile_id: string;
          party: RegistrationParty;
          legal_name: string;
          tax_id: string;
          address: string;
          phone: string;
          email: string;
          responsible_name: string;
          segment: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          profile_id: string;
          party: RegistrationParty;
          legal_name: string;
          tax_id: string;
          address: string;
          phone: string;
          email: string;
          responsible_name: string;
          segment: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          profile_id?: string;
          party?: RegistrationParty;
          legal_name?: string;
          tax_id?: string;
          address?: string;
          phone?: string;
          email?: string;
          responsible_name?: string;
          segment?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      technology_profile: Table<
        {
          id: boolean;
          summary: string | null;
          logo_url: string | null;
          published: boolean;
          updated_at: string;
        },
        {
          id?: boolean;
          summary?: string | null;
          logo_url?: string | null;
          published?: boolean;
          updated_at?: string;
        },
        {
          id?: boolean;
          summary?: string | null;
          logo_url?: string | null;
          published?: boolean;
          updated_at?: string;
        }
      >;
      technology_solutions: Table<
        {
          id: string;
          title: string;
          description: string;
          image_url: string | null;
          icon: string | null;
          link_url: string | null;
          sort_order: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          title: string;
          description: string;
          image_url?: string | null;
          icon?: string | null;
          link_url?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          title?: string;
          description?: string;
          image_url?: string | null;
          icon?: string | null;
          link_url?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      record_catalog_download: {
        Args: { target_file: string };
        Returns: string;
      };
      partner_companies: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          trade_name: string;
          description: string;
          logo: string;
          segment: string;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      approval_status: ApprovalStatus;
      approval_subject: ApprovalSubject;
      catalog_visibility: CatalogVisibility;
      catalog_file_kind: CatalogFileKind;
      correction_state: CorrectionState;
      quote_state: QuoteState;
      registration_party: RegistrationParty;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
