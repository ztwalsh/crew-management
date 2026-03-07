'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Ship,
  Users,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createBoat } from '@/actions/boats'
import { importCrew } from '@/actions/import'
import { importEvents } from '@/actions/import'

type Step = 'boat' | 'crew' | 'events' | 'complete'

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'boat', label: 'Create boat', icon: Ship },
  { key: 'crew', label: 'Add crew', icon: Users },
  { key: 'events', label: 'Import events', icon: Calendar },
  { key: 'complete', label: 'All set', icon: Check },
]

export function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('boat')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Boat form state
  const [boatName, setBoatName] = useState('')
  const [boatType, setBoatType] = useState('')
  const [sailNumber, setSailNumber] = useState('')
  const [homePort, setHomePort] = useState('')
  const [createdBoatId, setCreatedBoatId] = useState<string | null>(null)

  // Crew import state
  const [crewText, setCrewText] = useState('')
  const [crewResult, setCrewResult] = useState<{ invited: number; skipped: number } | null>(null)

  // Events import state
  const [eventsText, setEventsText] = useState('')
  const [eventsResult, setEventsResult] = useState<{ created: number } | null>(null)

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep)

  async function handleCreateBoat() {
    if (!boatName.trim()) {
      toast.error('Boat name is required')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set('name', boatName.trim())
      if (boatType) formData.set('boatType', boatType)
      if (sailNumber) formData.set('sailNumber', sailNumber)
      if (homePort) formData.set('homePort', homePort)

      const result = await createBoat(formData)
      if (result.error) {
        toast.error(result.error)
        return
      }

      setCreatedBoatId(result.data.id)
      toast.success('Boat created!')
      setCurrentStep('crew')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleImportCrew() {
    if (!crewText.trim() || !createdBoatId) {
      setCurrentStep('events')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await importCrew(createdBoatId, crewText)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setCrewResult({ invited: result.data!.invited, skipped: result.data!.skipped })
      toast.success(`${result.data!.invited} invitation(s) sent`)
      setCurrentStep('events')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleImportEvents() {
    if (!eventsText.trim() || !createdBoatId) {
      setCurrentStep('complete')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await importEvents(createdBoatId, eventsText)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setEventsResult({ created: result.data!.created })
      toast.success(`${result.data!.created} event(s) created`)
      setCurrentStep('complete')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleFinish() {
    if (createdBoatId) {
      router.push(`/boats/${createdBoatId}`)
      router.refresh()
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isActive = step.key === currentStep
          const isDone = i < stepIndex
          return (
            <div key={step.key} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 ${isDone ? 'bg-[#0EA5E9]' : 'bg-border/50'}`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0EA5E9]/15 text-[#0EA5E9]'
                    : isDone
                      ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]/70'
                      : 'bg-[#22252F] text-muted-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border/50 bg-[#22252F] p-6">
        {currentStep === 'boat' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#0EA5E9]/10">
                  <Ship className="size-6 text-[#0EA5E9]" />
                </div>
              </div>
              <h2 className="text-lg font-semibold">Create your boat</h2>
              <p className="text-sm text-muted-foreground">
                Start by adding your boat. You can always update these details later.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Boat name *</label>
                <Input
                  placeholder="e.g. Windchaser"
                  value={boatName}
                  onChange={(e) => setBoatName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Boat type</label>
                  <Input
                    placeholder="e.g. J/70"
                    value={boatType}
                    onChange={(e) => setBoatType(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Sail number</label>
                  <Input
                    placeholder="e.g. USA 1234"
                    value={sailNumber}
                    onChange={(e) => setSailNumber(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Home port</label>
                <Input
                  placeholder="e.g. San Francisco, CA"
                  value={homePort}
                  onChange={(e) => setHomePort(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreateBoat} disabled={isSubmitting || !boatName.trim()}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Create & Continue
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'crew' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#0EA5E9]/10">
                  <Users className="size-6 text-[#0EA5E9]" />
                </div>
              </div>
              <h2 className="text-lg font-semibold">Add your crew</h2>
              <p className="text-sm text-muted-foreground">
                Paste email addresses to invite your crew. One per line, or use CSV format with roles.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-md bg-[#1A1D27] border border-border/50 p-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Format options:
                </p>
                <code className="text-[11px] text-muted-foreground/80 whitespace-pre-wrap">
                  {`email,role,position\njane@example.com,crew,bowman\nbob@example.com,admin,skipper\n\nOr just emails, one per line:\njane@example.com\nbob@example.com`}
                </code>
              </div>
              <Textarea
                placeholder={`jane@example.com\nbob@example.com\n...`}
                value={crewText}
                onChange={(e) => setCrewText(e.target.value)}
                rows={6}
                className="font-mono text-xs bg-[#1A1D27]"
              />
              {crewText && (
                <p className="text-xs text-muted-foreground">
                  {crewText.trim().split('\n').filter(Boolean).length} line(s) entered
                </p>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep('events')}>
                Skip
              </Button>
              <Button onClick={handleImportCrew} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {crewText.trim() ? 'Invite & Continue' : 'Continue'}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'events' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#0EA5E9]/10">
                  <Calendar className="size-6 text-[#0EA5E9]" />
                </div>
              </div>
              <h2 className="text-lg font-semibold">Import events</h2>
              <p className="text-sm text-muted-foreground">
                Paste a CSV of your upcoming races, practices, and events. Or skip and add them later.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-md bg-[#1A1D27] border border-border/50 p-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Expected CSV format:
                </p>
                <code className="text-[11px] text-muted-foreground/80 whitespace-pre-wrap">
                  {`title,event_type,start_time,end_time,location\nTuesday Practice,practice,2026-03-03T18:00:00,,Marina\nSpring Race 1,race,2026-03-07T10:00:00,2026-03-07T16:00:00,Bay`}
                </code>
              </div>
              <Textarea
                placeholder="Paste CSV data here..."
                value={eventsText}
                onChange={(e) => setEventsText(e.target.value)}
                rows={6}
                className="font-mono text-xs bg-[#1A1D27]"
              />
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep('complete')}>
                Skip
              </Button>
              <Button onClick={handleImportEvents} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {eventsText.trim() ? 'Import & Finish' : 'Finish'}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Check className="size-6 text-emerald-400" />
                </div>
              </div>
              <h2 className="text-lg font-semibold">You're all set!</h2>
              <p className="text-sm text-muted-foreground">
                <strong>{boatName}</strong> is ready to go.
              </p>

              {/* Summary */}
              <div className="text-sm text-muted-foreground space-y-1 pt-2">
                {crewResult && crewResult.invited > 0 && (
                  <p>{crewResult.invited} crew invitation{crewResult.invited !== 1 ? 's' : ''} sent</p>
                )}
                {eventsResult && eventsResult.created > 0 && (
                  <p>{eventsResult.created} event{eventsResult.created !== 1 ? 's' : ''} created</p>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleFinish} size="lg">
                Go to Dashboard
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
