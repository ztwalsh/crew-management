import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const safeProfile = profile ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name ?? user.email ?? '',
    display_name: null,
    avatar_url: null,
    phone: null,
    weight_lbs: null,
    sailing_experience: null,
    default_roles: null,
    timezone: 'UTC',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: boatMemberships } = await supabase
    .from('crew_memberships')
    .select('role, sailing_position, boats(id, name, boat_type, photo_url)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const boats = (boatMemberships ?? []).map((m: any) => ({
    ...m.boats,
    role: m.role,
  }))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={safeProfile} boats={boats} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={safeProfile} boats={boats} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <MobileNav boats={boats} />
    </div>
  )
}
