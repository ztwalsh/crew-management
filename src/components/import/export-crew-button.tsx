'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toCSV, downloadCSV } from '@/lib/csv-export'
import type { CrewMemberWithProfile } from '@/types'

interface ExportCrewButtonProps {
  members: CrewMemberWithProfile[]
  boatName: string
}

export function ExportCrewButton({ members, boatName }: ExportCrewButtonProps) {
  function handleExport() {
    const headers = ['name', 'email', 'role', 'position', 'joined']
    const rows = members.map((m) => [
      m.profiles.full_name || '',
      m.profiles.email || '',
      m.role,
      m.sailing_position || '',
      m.joined_at ? new Date(m.joined_at).toISOString().split('T')[0] : '',
    ])

    const csv = toCSV(headers, rows)
    const safeName = boatName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    downloadCSV(`${safeName}-crew.csv`, csv)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleExport}>
      <Download className="size-4" />
      Export
    </Button>
  )
}
