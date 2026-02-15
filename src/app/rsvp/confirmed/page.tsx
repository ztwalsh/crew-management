import { CheckCircle2, XCircle, HelpCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function RsvpConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; event?: string; boat?: string; error?: string }>
}) {
  const { status, event, boat, error } = await searchParams

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <CardTitle className="mt-4">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error === 'invalid'
                ? 'This RSVP link is invalid or has expired.'
                : 'Failed to update your RSVP. Please try again.'}
            </p>
            <Button asChild>
              <Link href="/login">Sign in to respond</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const config = {
    accepted: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      title: "You're in!",
      message: `You've confirmed your attendance`,
    },
    tentative: {
      icon: HelpCircle,
      iconColor: 'text-amber-500',
      title: "You're a maybe",
      message: `We've noted you as tentative`,
    },
    declined: {
      icon: XCircle,
      iconColor: 'text-red-500',
      title: "We'll miss you",
      message: `We've noted that you can't make it`,
    },
  }

  const c = config[status as keyof typeof config] || config.accepted
  const Icon = c.icon

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <Icon className={`mx-auto h-12 w-12 ${c.iconColor}`} />
          <CardTitle className="mt-4">{c.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {c.message}
            {event ? ` for ${event}` : ''}
            {boat ? ` on ${boat}` : ''}.
          </p>
          <Button asChild variant="outline">
            <Link href="/login">Sign in for more details</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
