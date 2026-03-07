'use client'

import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { toCSV, downloadCSV } from '@/lib/csv-export'

interface EventForExport {
  title: string
  event_type: string
  start_time: string
  end_time: string | null
  location: string | null
  all_day: boolean
  description: string | null
}

interface ExportEventsButtonProps {
  events: EventForExport[]
  boatName: string
}

export function ExportEventsButton({ events, boatName }: ExportEventsButtonProps) {
  function handleExport() {
    const headers = ['title', 'event_type', 'start_time', 'end_time', 'location', 'all_day', 'description']
    const rows = events.map((e) => [
      e.title,
      e.event_type,
      e.start_time,
      e.end_time || '',
      e.location || '',
      String(e.all_day),
      e.description || '',
    ])

    const csv = toCSV(headers, rows)
    const safeName = boatName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    downloadCSV(`${safeName}-events.csv`, csv)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleExport}>
      <Download className="size-4" />
      Export
    </Button>
  )
}
