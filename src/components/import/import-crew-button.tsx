'use client'

import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CSVImportDialog } from '@/components/import/csv-import-dialog'
import { importCrew } from '@/actions/import'

interface ImportCrewButtonProps {
  boatId: string
}

export function ImportCrewButton({ boatId }: ImportCrewButtonProps) {
  return (
    <CSVImportDialog
      trigger={
        <Button variant="outline" size="sm">
          <Upload className="size-4" />
          Import
        </Button>
      }
      title="Import crew from CSV"
      description="Paste or upload a CSV file with crew member emails. Each person will receive an invitation to join this boat."
      templateHint={`email,role,position\njane@example.com,crew,bowman\nbob@example.com,admin,skipper`}
      onImport={(csvText) => importCrew(boatId, csvText)}
    />
  )
}
