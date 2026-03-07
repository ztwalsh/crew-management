'use client'

import { useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Upload,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CSVImportDialogProps {
  trigger: ReactNode
  title: string
  description: string
  templateHint: string
  onImport: (csvText: string) => Promise<{
    data?: { created?: number; invited?: number; skipped?: number; errors: string[] }
    error?: string
  }>
}

type Step = 'input' | 'importing' | 'result'

export function CSVImportDialog({
  trigger,
  title,
  description,
  templateHint,
  onImport,
}: CSVImportDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [result, setResult] = useState<{
    created?: number
    invited?: number
    skipped?: number
    errors: string[]
  } | null>(null)

  function reset() {
    setCsvText('')
    setStep('input')
    setResult(null)
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) reset()
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (text) setCsvText(text)
    }
    reader.readAsText(file)
    // Reset file input so the same file can be re-uploaded
    e.target.value = ''
  }

  async function handleImport() {
    if (!csvText.trim()) {
      toast.error('Please paste or upload CSV data')
      return
    }

    setStep('importing')

    try {
      const res = await onImport(csvText)

      if (res.error) {
        toast.error(res.error)
        setStep('input')
        return
      }

      setResult(res.data ?? null)
      setStep('result')
      router.refresh()
    } catch {
      toast.error('Something went wrong during import')
      setStep('input')
    }
  }

  const successCount = result?.created ?? result?.invited ?? 0
  const hasErrors = (result?.errors?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <>
            <div className="space-y-3">
              {/* Template hint */}
              <div className="rounded-md bg-[#1A1D27] border border-border/50 p-3">
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Expected CSV format:
                </p>
                <code className="text-[11px] text-muted-foreground/80 whitespace-pre-wrap">
                  {templateHint}
                </code>
              </div>

              {/* Textarea for paste */}
              <Textarea
                placeholder="Paste CSV data here..."
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                className="font-mono text-xs bg-[#1A1D27]"
              />

              {/* File upload */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="size-3.5" />
                  Upload CSV file
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                {csvText && (
                  <span className="text-xs text-muted-foreground">
                    {csvText.trim().split('\n').length - 1} row(s) detected
                  </span>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!csvText.trim()}>
                <FileSpreadsheet className="size-4" />
                Import
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin text-[#0EA5E9] mb-3" />
            <p className="text-sm text-muted-foreground">Importing...</p>
          </div>
        )}

        {step === 'result' && result && (
          <>
            <div className="space-y-4">
              {/* Success summary */}
              <div className="flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-400">Import complete</p>
                  <p className="text-muted-foreground mt-0.5">
                    {result.invited !== undefined && (
                      <>{result.invited} invitation{result.invited !== 1 ? 's' : ''} sent</>
                    )}
                    {result.created !== undefined && (
                      <>{result.created} event{result.created !== 1 ? 's' : ''} created</>
                    )}
                    {(result.skipped ?? 0) > 0 && (
                      <>, {result.skipped} skipped (duplicates)</>
                    )}
                  </p>
                </div>
              </div>

              {/* Errors */}
              {hasErrors && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="size-4 text-red-400" />
                    <p className="text-xs font-medium text-red-400">
                      {result.errors.length} warning{result.errors.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
