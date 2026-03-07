import {
  Users,
  Calendar,
  Mail,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react'

interface ToolResultCardProps {
  toolName: string
  result: any
}

export function ToolResultCard({ toolName, result }: ToolResultCardProps) {
  if (result?.error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
        Error: {result.error}
      </div>
    )
  }

  switch (toolName) {
    case 'list_crew':
      return (
        <ResultWrapper icon={Users} label={`${result.total} crew member${result.total !== 1 ? 's' : ''}`}>
          <div className="space-y-1">
            {result.crew?.slice(0, 8).map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{m.name}</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="capitalize">{m.position}</span>
                  <span className="rounded bg-[#1A1D27] px-1.5 py-0.5 text-[10px] capitalize">{m.role}</span>
                </div>
              </div>
            ))}
            {result.total > 8 && (
              <p className="text-[10px] text-muted-foreground">+{result.total - 8} more</p>
            )}
          </div>
        </ResultWrapper>
      )

    case 'list_events':
      return (
        <ResultWrapper icon={Calendar} label={`${result.total} event${result.total !== 1 ? 's' : ''}`}>
          <div className="space-y-1">
            {result.events?.slice(0, 6).map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{e.title}</span>
                <span className="text-muted-foreground">
                  {new Date(e.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
            {result.total > 6 && (
              <p className="text-[10px] text-muted-foreground">+{result.total - 6} more</p>
            )}
          </div>
        </ResultWrapper>
      )

    case 'create_event':
      return (
        <ResultWrapper icon={CheckCircle2} label="Event created" variant="success">
          <p className="text-xs text-foreground">{result.event?.title}</p>
        </ResultWrapper>
      )

    case 'create_recurring_events':
      return (
        <ResultWrapper icon={Calendar} label={`${result.created} event${result.created !== 1 ? 's' : ''} created`} variant="success">
          {result.errors?.length > 0 && (
            <p className="text-[10px] text-red-400">{result.errors.length} error(s)</p>
          )}
        </ResultWrapper>
      )

    case 'invite_crew':
      return (
        <ResultWrapper icon={Mail} label={`${result.invited} invitation${result.invited !== 1 ? 's' : ''} sent`} variant="success">
          {result.skipped > 0 && (
            <p className="text-[10px] text-muted-foreground">{result.skipped} skipped (duplicates)</p>
          )}
        </ResultWrapper>
      )

    case 'delete_event':
      return (
        <ResultWrapper icon={Trash2} label={`Deleted "${result.deleted}"`} variant="success" />
      )

    case 'update_rsvp':
      return (
        <ResultWrapper icon={CheckCircle2} label={`RSVP updated: ${result.status}`} variant="success">
          <p className="text-xs text-muted-foreground">{result.event}</p>
        </ResultWrapper>
      )

    case 'import_crew_csv':
    case 'import_events_csv':
      return (
        <ResultWrapper icon={FileSpreadsheet} label="Import complete" variant="success">
          <p className="text-xs text-muted-foreground">
            {result.data?.invited !== undefined && `${result.data.invited} invited`}
            {result.data?.created !== undefined && `${result.data.created} created`}
            {result.data?.skipped ? `, ${result.data.skipped} skipped` : ''}
          </p>
        </ResultWrapper>
      )

    case 'get_event_availability':
      return (
        <ResultWrapper icon={Users} label={`Availability for ${result.event}`}>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <Stat label="Accepted" value={result.availability?.accepted?.length ?? 0} color="text-emerald-400" />
            <Stat label="Declined" value={result.availability?.declined?.length ?? 0} color="text-red-400" />
            <Stat label="Tentative" value={result.availability?.tentative?.length ?? 0} color="text-yellow-400" />
            <Stat label="Pending" value={result.availability?.pending?.length ?? 0} color="text-muted-foreground" />
          </div>
        </ResultWrapper>
      )

    default:
      return (
        <div className="rounded-lg border border-border/50 bg-[#1A1D27] px-3 py-2 text-xs text-muted-foreground">
          Tool: {toolName}
        </div>
      )
  }
}

function ResultWrapper({
  icon: Icon,
  label,
  variant,
  children,
}: {
  icon: React.ElementType
  label: string
  variant?: 'success'
  children?: React.ReactNode
}) {
  const borderColor = variant === 'success' ? 'border-emerald-500/20' : 'border-border/50'
  const iconColor = variant === 'success' ? 'text-emerald-400' : 'text-[#0EA5E9]'

  return (
    <div className={`rounded-lg border ${borderColor} bg-[#1A1D27] p-3 space-y-2`}>
      <div className="flex items-center gap-2">
        <Icon className={`size-3.5 ${iconColor}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={color}>{value}</span>
    </div>
  )
}
