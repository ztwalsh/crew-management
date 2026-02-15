import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { User } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { AvatarUpload } from '@/components/profile/avatar-upload'
import { ProfileForm } from '@/components/profile/profile-form'
import { ChangePasswordForm } from '@/components/profile/change-password-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9]">
          <User className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and personal information
          </p>
        </div>
      </div>

      <Separator />

      {/* Avatar upload */}
      <AvatarUpload
        avatarUrl={profile.avatar_url}
        fullName={profile.full_name}
      />

      {/* Profile form */}
      <ProfileForm profile={profile} />

      <Separator />

      {/* Change password */}
      <ChangePasswordForm />
    </div>
  )
}
