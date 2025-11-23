export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_id: string;
          email: string;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_id?: string;
          email?: string;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          invite_code: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          invite_code?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          invite_code?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
      };
      fives: {
        Row: {
          id: string;
          group_id: string | null;
          title: string;
          description: string | null;
          location: string | null;
          date: string;
          max_players: number;
          created_by: string;
          share_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          title: string;
          description?: string | null;
          location?: string | null;
          date: string;
          max_players?: number;
          created_by: string;
          share_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string | null;
          title?: string;
          description?: string | null;
          location?: string | null;
          date?: string;
          max_players?: number;
          created_by?: string;
          share_code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      five_participants: {
        Row: {
          id: string;
          five_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          five_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          five_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupMember = Database['public']['Tables']['group_members']['Row'];
export type Five = Database['public']['Tables']['fives']['Row'];
export type FiveParticipant = Database['public']['Tables']['five_participants']['Row'];

export interface GroupWithMembers extends Group {
  memberCount?: number;
  isUserMember?: boolean;
  userRole?: string;
}

export interface FiveWithDetails extends Five {
  participantCount?: number;
  isUserParticipant?: boolean;
  isFull?: boolean;
  isCreator?: boolean;
  group?: Group;
}
