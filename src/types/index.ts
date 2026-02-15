import type { Database } from './database'

// Base table types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Boat = Database['public']['Tables']['boats']['Row']
export type CrewMembership = Database['public']['Tables']['crew_memberships']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type EventAssignment = Database['public']['Tables']['event_assignments']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

// Enum types
export type CrewRole = Database['public']['Enums']['crew_role']
export type SailingPosition = Database['public']['Enums']['sailing_position']
export type EventType = Database['public']['Enums']['event_type']
export type RsvpStatus = Database['public']['Enums']['rsvp_status']
export type InvitationStatus = Database['public']['Enums']['invitation_status']
export type NotificationType = Database['public']['Enums']['notification_type']

// Insert/Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type BoatInsert = Database['public']['Tables']['boats']['Insert']
export type BoatUpdate = Database['public']['Tables']['boats']['Update']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']
export type EventAssignmentInsert = Database['public']['Tables']['event_assignments']['Insert']
export type EventAssignmentUpdate = Database['public']['Tables']['event_assignments']['Update']
export type InvitationInsert = Database['public']['Tables']['invitations']['Insert']

// Join types (for queries with nested data)
export type BoatWithRole = {
  role: CrewRole
  sailing_position: SailingPosition | null
  boats: Boat
}

export type CrewMemberWithProfile = CrewMembership & {
  profiles: Profile
}

export type EventWithAssignments = Event & {
  event_assignments: (EventAssignment & {
    profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  })[]
}

export type InvitationWithInviter = Invitation & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>
  boats: Pick<Boat, 'id' | 'name'>
}

export { type Database } from './database'
