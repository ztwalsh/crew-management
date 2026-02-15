import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AcceptInvitationButton } from '@/components/auth/accept-invitation-button'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Check if the user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Look up the invitation by token
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select(
      `
      id,
      token,
      role,
      status,
      expires_at,
      invited_email,
      boats:boat_id (id, name),
      profiles:invited_by (id, full_name, avatar_url)
    `
    )
    .eq('token', token)
    .single()

  // Handle not found or query error
  if (error || !invitation) {
    return (
      <Card className="border-destructive/20">
        <CardHeader className="text-center">
          <CardTitle>Invitation Not Found</CardTitle>
          <CardDescription>
            This invitation link is invalid or has been removed.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Go to login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Check if invitation is expired
  const isExpired =
    invitation.status === 'expired' ||
    new Date(invitation.expires_at) < new Date()

  if (isExpired) {
    return (
      <Card className="border-destructive/20">
        <CardHeader className="text-center">
          <CardTitle>Invitation Expired</CardTitle>
          <CardDescription>
            This invitation has expired. Please ask the boat owner to send a new
            one.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Go to login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Check if already accepted
  if (invitation.status === 'accepted') {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Already Accepted</CardTitle>
          <CardDescription>
            This invitation has already been accepted.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link
            href="/boats"
            className="text-sm text-primary hover:underline"
          >
            Go to your boats
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Type assertions for the joined data
  const boat = invitation.boats as unknown as { id: string; name: string }
  const inviter = invitation.profiles as unknown as {
    id: string
    full_name: string
    avatar_url: string | null
  }

  // Format role for display
  const roleLabel =
    invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)

  return (
    <Card>
      <CardHeader className="text-center">
        <CardDescription className="text-xs uppercase tracking-wider text-muted-foreground">
          You&apos;ve been invited to join
        </CardDescription>
        <CardTitle className="text-xl">{boat.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invited by</span>
            <span className="font-medium">{inviter.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{roleLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{invitation.invited_email}</span>
          </div>
        </div>

        {user ? (
          <AcceptInvitationButton token={token} />
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Sign in or create an account to accept this invitation.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href={`/signup?invite=${token}`}
                className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign up to join
              </Link>
              <Link
                href={`/login?invite=${token}`}
                className="inline-flex h-9 w-full items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Already have an account? Log in
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
