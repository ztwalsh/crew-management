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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          display_name: string | null
          avatar_url: string | null
          phone: string | null
          weight_lbs: number | null
          sailing_experience: string | null
          default_roles: string[] | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          weight_lbs?: number | null
          sailing_experience?: string | null
          default_roles?: string[] | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          display_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          weight_lbs?: number | null
          sailing_experience?: string | null
          default_roles?: string[] | null
          timezone?: string
          updated_at?: string
        }
      }
      boats: {
        Row: {
          id: string
          name: string
          boat_type: string | null
          sail_number: string | null
          home_port: string | null
          photo_url: string | null
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          boat_type?: string | null
          sail_number?: string | null
          home_port?: string | null
          photo_url?: string | null
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          boat_type?: string | null
          sail_number?: string | null
          home_port?: string | null
          photo_url?: string | null
          description?: string | null
          updated_at?: string
        }
      }
      crew_memberships: {
        Row: {
          id: string
          boat_id: string
          user_id: string
          role: 'owner' | 'admin' | 'crew'
          sailing_position: 'skipper' | 'helmsman' | 'tactician' | 'trimmer' | 'bowman' | 'pit' | 'grinder' | 'navigator' | 'crew' | null
          joined_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          boat_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'crew'
          sailing_position?: 'skipper' | 'helmsman' | 'tactician' | 'trimmer' | 'bowman' | 'pit' | 'grinder' | 'navigator' | 'crew' | null
          joined_at?: string
          is_active?: boolean
        }
        Update: {
          role?: 'owner' | 'admin' | 'crew'
          sailing_position?: 'skipper' | 'helmsman' | 'tactician' | 'trimmer' | 'bowman' | 'pit' | 'grinder' | 'navigator' | 'crew' | null
          is_active?: boolean
        }
      }
      events: {
        Row: {
          id: string
          boat_id: string
          title: string
          description: string | null
          event_type: 'race' | 'practice' | 'social' | 'maintenance' | 'other'
          location: string | null
          start_time: string
          end_time: string | null
          all_day: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          boat_id: string
          title: string
          description?: string | null
          event_type?: 'race' | 'practice' | 'social' | 'maintenance' | 'other'
          location?: string | null
          start_time: string
          end_time?: string | null
          all_day?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          event_type?: 'race' | 'practice' | 'social' | 'maintenance' | 'other'
          location?: string | null
          start_time?: string
          end_time?: string | null
          all_day?: boolean
          updated_at?: string
        }
      }
      event_assignments: {
        Row: {
          id: string
          event_id: string
          user_id: string
          rsvp_status: 'pending' | 'accepted' | 'declined' | 'tentative'
          sailing_position: 'skipper' | 'helmsman' | 'tactician' | 'trimmer' | 'bowman' | 'pit' | 'grinder' | 'navigator' | 'crew' | null
          notes: string | null
          responded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          rsvp_status?: 'pending' | 'accepted' | 'declined' | 'tentative'
          sailing_position?: 'skipper' | 'helmsman' | 'tactician' | 'trimmer' | 'bowman' | 'pit' | 'grinder' | 'navigator' | 'crew' | null
          notes?: string | null
          responded_at?: string | null
          created_at?: string
        }
        Update: {
          rsvp_status?: 'pending' | 'accepted' | 'declined' | 'tentative'
          sailing_position?: 'skipper' | 'helmsman' | 'tactician' | 'trimmer' | 'bowman' | 'pit' | 'grinder' | 'navigator' | 'crew' | null
          notes?: string | null
          responded_at?: string | null
        }
      }
      invitations: {
        Row: {
          id: string
          boat_id: string
          invited_by: string
          invited_email: string
          role: 'owner' | 'admin' | 'crew'
          token: string
          status: 'pending' | 'accepted' | 'declined' | 'expired'
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          boat_id: string
          invited_by: string
          invited_email: string
          role?: 'owner' | 'admin' | 'crew'
          token?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined' | 'expired'
          accepted_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'invitation_received' | 'invitation_accepted' | 'event_created' | 'event_updated' | 'event_reminder' | 'rsvp_received' | 'todo_assigned' | 'todo_completed'
          title: string
          body: string | null
          data: Json
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'invitation_received' | 'invitation_accepted' | 'event_created' | 'event_updated' | 'event_reminder' | 'rsvp_received' | 'todo_assigned' | 'todo_completed'
          title: string
          body?: string | null
          data?: Json
          is_read?: boolean
          created_at?: string
        }
        Update: {
          is_read?: boolean
        }
      }
    }
    Enums: {
      crew_role: 'owner' | 'admin' | 'crew'
      sailing_position: 'skipper' | 'helmsman' | 'tactician' | 'trimmer' | 'bowman' | 'pit' | 'grinder' | 'navigator' | 'crew'
      event_type: 'race' | 'practice' | 'social' | 'maintenance' | 'other'
      rsvp_status: 'pending' | 'accepted' | 'declined' | 'tentative'
      invitation_status: 'pending' | 'accepted' | 'declined' | 'expired'
      notification_type: 'invitation_received' | 'invitation_accepted' | 'event_created' | 'event_updated' | 'event_reminder' | 'rsvp_received' | 'todo_assigned' | 'todo_completed'
    }
  }
}
