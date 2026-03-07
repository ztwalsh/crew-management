import type { CrewRole } from '@/types'

export type BoatAction =
  | 'delete_boat'
  | 'edit_boat'
  | 'invite_crew'
  | 'remove_crew'
  | 'remove_admin'
  | 'promote_to_admin'
  | 'create_event'
  | 'edit_event'
  | 'delete_event'
  | 'rsvp'
  | 'view'
  | 'import'
  | 'export'

const permissions: Record<BoatAction, CrewRole[]> = {
  delete_boat: ['owner'],
  edit_boat: ['owner', 'admin'],
  invite_crew: ['owner', 'admin'],
  remove_crew: ['owner', 'admin'],
  remove_admin: ['owner'],
  promote_to_admin: ['owner'],
  create_event: ['owner', 'admin'],
  edit_event: ['owner', 'admin'],
  delete_event: ['owner', 'admin'],
  rsvp: ['owner', 'admin', 'crew'],
  view: ['owner', 'admin', 'crew'],
  import: ['owner', 'admin'],
  export: ['owner', 'admin', 'crew'],
}

export function can(role: CrewRole, action: BoatAction): boolean {
  return permissions[action]?.includes(role) ?? false
}

export function isOwnerOrAdmin(role: CrewRole): boolean {
  return role === 'owner' || role === 'admin'
}
