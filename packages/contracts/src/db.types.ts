export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      announcement: {
        Row: {
          audience_type: Database['public']['Enums']['audience_type'];
          body: string;
          cohort_id: string | null;
          created_at: string;
          created_by_user_id: string;
          id: string;
          program_id: string | null;
          published_at: string | null;
          status: Database['public']['Enums']['publication_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          audience_type: Database['public']['Enums']['audience_type'];
          body: string;
          cohort_id?: string | null;
          created_at?: string;
          created_by_user_id: string;
          id?: string;
          program_id?: string | null;
          published_at?: string | null;
          status?: Database['public']['Enums']['publication_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          audience_type?: Database['public']['Enums']['audience_type'];
          body?: string;
          cohort_id?: string | null;
          created_at?: string;
          created_by_user_id?: string;
          id?: string;
          program_id?: string | null;
          published_at?: string | null;
          status?: Database['public']['Enums']['publication_status'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'announcement_cohort_id_fkey';
            columns: ['cohort_id'];
            isOneToOne: false;
            referencedRelation: 'cohort';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'announcement_created_by_user_id_fkey';
            columns: ['created_by_user_id'];
            isOneToOne: false;
            referencedRelation: 'app_user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'announcement_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'program';
            referencedColumns: ['id'];
          },
        ];
      };
      app_user: {
        Row: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          is_active: boolean;
          last_name: string;
          phone: string | null;
          preferred_contact_channel: string | null;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name: string;
          id: string;
          is_active?: boolean;
          last_name: string;
          phone?: string | null;
          preferred_contact_channel?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          is_active?: boolean;
          last_name?: string;
          phone?: string | null;
          preferred_contact_channel?: string | null;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [];
      };
      cohort: {
        Row: {
          capacity: number | null;
          code: string | null;
          created_at: string;
          end_date: string | null;
          id: string;
          name: string;
          program_id: string;
          start_date: string;
          status: Database['public']['Enums']['cohort_status'];
          updated_at: string;
        };
        Insert: {
          capacity?: number | null;
          code?: string | null;
          created_at?: string;
          end_date?: string | null;
          id?: string;
          name: string;
          program_id: string;
          start_date: string;
          status?: Database['public']['Enums']['cohort_status'];
          updated_at?: string;
        };
        Update: {
          capacity?: number | null;
          code?: string | null;
          created_at?: string;
          end_date?: string | null;
          id?: string;
          name?: string;
          program_id?: string;
          start_date?: string;
          status?: Database['public']['Enums']['cohort_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cohort_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'program';
            referencedColumns: ['id'];
          },
        ];
      };
      enrollment: {
        Row: {
          cohort_id: string | null;
          completed_at: string | null;
          created_at: string;
          enrolled_at: string;
          id: string;
          participant_id: string;
          program_id: string;
          status: Database['public']['Enums']['enrollment_status'];
          updated_at: string;
        };
        Insert: {
          cohort_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          enrolled_at?: string;
          id?: string;
          participant_id: string;
          program_id: string;
          status?: Database['public']['Enums']['enrollment_status'];
          updated_at?: string;
        };
        Update: {
          cohort_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          enrolled_at?: string;
          id?: string;
          participant_id?: string;
          program_id?: string;
          status?: Database['public']['Enums']['enrollment_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'enrollment_cohort_id_fkey';
            columns: ['cohort_id'];
            isOneToOne: false;
            referencedRelation: 'cohort';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enrollment_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participant';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'enrollment_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'program';
            referencedColumns: ['id'];
          },
        ];
      };
      notification: {
        Row: {
          body: string;
          channel: Database['public']['Enums']['notification_channel'];
          created_at: string;
          id: string;
          is_read: boolean;
          notification_type: Database['public']['Enums']['notification_type'];
          read_at: string | null;
          source_id: string | null;
          source_type: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body: string;
          channel?: Database['public']['Enums']['notification_channel'];
          created_at?: string;
          id?: string;
          is_read?: boolean;
          notification_type: Database['public']['Enums']['notification_type'];
          read_at?: string | null;
          source_id?: string | null;
          source_type?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          channel?: Database['public']['Enums']['notification_channel'];
          created_at?: string;
          id?: string;
          is_read?: boolean;
          notification_type?: Database['public']['Enums']['notification_type'];
          read_at?: string | null;
          source_id?: string | null;
          source_type?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_user';
            referencedColumns: ['id'];
          },
        ];
      };
      participant: {
        Row: {
          city: string | null;
          country: string | null;
          created_at: string;
          id: string;
          lifecycle_status: Database['public']['Enums']['lifecycle_status'];
          notes: string | null;
          reference_code: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          lifecycle_status?: Database['public']['Enums']['lifecycle_status'];
          notes?: string | null;
          reference_code?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          city?: string | null;
          country?: string | null;
          created_at?: string;
          id?: string;
          lifecycle_status?: Database['public']['Enums']['lifecycle_status'];
          notes?: string | null;
          reference_code?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'participant_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'app_user';
            referencedColumns: ['id'];
          },
        ];
      };
      program: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          slug: string;
          status: Database['public']['Enums']['publication_status'];
          summary: string;
          title: string;
          updated_at: string;
          visibility: Database['public']['Enums']['program_visibility'];
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          slug: string;
          status?: Database['public']['Enums']['publication_status'];
          summary: string;
          title: string;
          updated_at?: string;
          visibility?: Database['public']['Enums']['program_visibility'];
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          slug?: string;
          status?: Database['public']['Enums']['publication_status'];
          summary?: string;
          title?: string;
          updated_at?: string;
          visibility?: Database['public']['Enums']['program_visibility'];
        };
        Relationships: [];
      };
      resource: {
        Row: {
          cohort_id: string | null;
          created_at: string;
          description: string | null;
          file_path: string | null;
          id: string;
          program_id: string | null;
          published_at: string | null;
          resource_type: Database['public']['Enums']['resource_type'];
          status: Database['public']['Enums']['publication_status'];
          title: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          cohort_id?: string | null;
          created_at?: string;
          description?: string | null;
          file_path?: string | null;
          id?: string;
          program_id?: string | null;
          published_at?: string | null;
          resource_type: Database['public']['Enums']['resource_type'];
          status?: Database['public']['Enums']['publication_status'];
          title: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          cohort_id?: string | null;
          created_at?: string;
          description?: string | null;
          file_path?: string | null;
          id?: string;
          program_id?: string | null;
          published_at?: string | null;
          resource_type?: Database['public']['Enums']['resource_type'];
          status?: Database['public']['Enums']['publication_status'];
          title?: string;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_cohort_id_fkey';
            columns: ['cohort_id'];
            isOneToOne: false;
            referencedRelation: 'cohort';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resource_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'program';
            referencedColumns: ['id'];
          },
        ];
      };
      session: {
        Row: {
          cohort_id: string;
          created_at: string;
          description: string | null;
          ends_at: string;
          id: string;
          location_label: string | null;
          location_type: Database['public']['Enums']['location_type'];
          meeting_link: string | null;
          starts_at: string;
          status: Database['public']['Enums']['session_status'];
          title: string;
          trainer_user_id: string | null;
          updated_at: string;
        };
        Insert: {
          cohort_id: string;
          created_at?: string;
          description?: string | null;
          ends_at: string;
          id?: string;
          location_label?: string | null;
          location_type?: Database['public']['Enums']['location_type'];
          meeting_link?: string | null;
          starts_at: string;
          status?: Database['public']['Enums']['session_status'];
          title: string;
          trainer_user_id?: string | null;
          updated_at?: string;
        };
        Update: {
          cohort_id?: string;
          created_at?: string;
          description?: string | null;
          ends_at?: string;
          id?: string;
          location_label?: string | null;
          location_type?: Database['public']['Enums']['location_type'];
          meeting_link?: string | null;
          starts_at?: string;
          status?: Database['public']['Enums']['session_status'];
          title?: string;
          trainer_user_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_cohort_id_fkey';
            columns: ['cohort_id'];
            isOneToOne: false;
            referencedRelation: 'cohort';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_trainer_user_id_fkey';
            columns: ['trainer_user_id'];
            isOneToOne: false;
            referencedRelation: 'app_user';
            referencedColumns: ['id'];
          },
        ];
      };
      support_request: {
        Row: {
          assigned_to_user_id: string | null;
          category: Database['public']['Enums']['support_category'];
          created_at: string;
          id: string;
          message: string;
          participant_id: string | null;
          status: Database['public']['Enums']['support_request_status'];
          subject: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assigned_to_user_id?: string | null;
          category: Database['public']['Enums']['support_category'];
          created_at?: string;
          id?: string;
          message: string;
          participant_id?: string | null;
          status?: Database['public']['Enums']['support_request_status'];
          subject: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assigned_to_user_id?: string | null;
          category?: Database['public']['Enums']['support_category'];
          created_at?: string;
          id?: string;
          message?: string;
          participant_id?: string | null;
          status?: Database['public']['Enums']['support_request_status'];
          subject?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'support_request_assigned_to_user_id_fkey';
            columns: ['assigned_to_user_id'];
            isOneToOne: false;
            referencedRelation: 'app_user';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_request_participant_id_fkey';
            columns: ['participant_id'];
            isOneToOne: false;
            referencedRelation: 'participant';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'support_request_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'app_user';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      audience_type: 'all_participants' | 'program' | 'cohort' | 'custom';
      cohort_status: 'draft' | 'open' | 'active' | 'completed' | 'archived';
      enrollment_status: 'pending' | 'active' | 'completed' | 'cancelled';
      lifecycle_status:
        | 'invited'
        | 'registered'
        | 'active'
        | 'completed'
        | 'inactive';
      location_type: 'online' | 'onsite' | 'hybrid';
      notification_channel: 'in_app' | 'push';
      notification_type:
        | 'announcement'
        | 'session_reminder'
        | 'system'
        | 'support_update';
      program_visibility: 'private' | 'participants' | 'public';
      publication_status: 'draft' | 'published' | 'archived';
      resource_type: 'link' | 'file' | 'video' | 'document';
      session_status: 'scheduled' | 'live' | 'completed' | 'cancelled';
      support_category:
        | 'technical'
        | 'training'
        | 'program'
        | 'session'
        | 'billing'
        | 'project_management'
        | 'immigration'
        | 'business'
        | 'partnership'
        | 'other';
      support_request_status: 'open' | 'in_progress' | 'resolved' | 'closed';
      user_role: 'participant' | 'admin' | 'trainer';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
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

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  SchemaOptions extends { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends
    keyof DatabaseWithoutInternals[SchemaOptions['schema']]['CompositeTypes'],
> = DatabaseWithoutInternals[SchemaOptions['schema']]['CompositeTypes'][CompositeTypeName];

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audience_type: ['all_participants', 'program', 'cohort', 'custom'],
      cohort_status: ['draft', 'open', 'active', 'completed', 'archived'],
      enrollment_status: ['pending', 'active', 'completed', 'cancelled'],
      lifecycle_status: [
        'invited',
        'registered',
        'active',
        'completed',
        'inactive',
      ],
      location_type: ['online', 'onsite', 'hybrid'],
      notification_channel: ['in_app', 'push'],
      notification_type: [
        'announcement',
        'session_reminder',
        'system',
        'support_update',
      ],
      program_visibility: ['private', 'participants', 'public'],
      publication_status: ['draft', 'published', 'archived'],
      resource_type: ['link', 'file', 'video', 'document'],
      session_status: ['scheduled', 'live', 'completed', 'cancelled'],
      support_category: [
        'technical',
        'training',
        'program',
        'session',
        'billing',
        'project_management',
        'immigration',
        'business',
        'partnership',
        'other',
      ],
      support_request_status: ['open', 'in_progress', 'resolved', 'closed'],
      user_role: ['participant', 'admin', 'trainer'],
    },
  },
} as const;
