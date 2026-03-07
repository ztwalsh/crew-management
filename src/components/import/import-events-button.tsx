'use client'

import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CSVImportDialog } from '@/components/import/csv-import-dialog'
import { importEvents } from '@/actions/import'

interface ImportEventsButtonProps {
  boatId: string
}

export function ImportEventsButton({ boatId }: ImportEventsButtonProps) {
  return (
    <CSVImportDialog
      trigger={
        <Button variant="outline" size="sm">
          <Upload className="size-4" />
          Import
        </Button>
      }
      title="Import events from CSV"
      description="Paste or upload a CSV file with event details. All active crew members will be auto-assigned to each event."
      templateHint={`title,event_type,start_time,end_time,location,all_day\nTuesday Practice,practice,2026-03-03T18:00:00,,Marina,false\nSpring Race 1,race,2026-03-07T10:00:00,2026-03-07T16:00:00,Bay,false`}
      onImport={(csvText) => importEvents(boatId, csvText)}
    />
  )
}
