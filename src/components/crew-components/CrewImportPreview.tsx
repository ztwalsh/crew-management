'use client'

import { Check, AlertTriangle, Upload } from 'lucide-react'

interface CrewImportPreviewProps {
  data: Record<string, unknown>
}

export function CrewImportPreview({ data }: CrewImportPreviewProps) {
  const invited = (data.invited as number) || 0
  const skipped = (data.skipped as number) || 0
  const errors = (data.errors as string[]) || []
  const created = (data.created as number) || 0

  // This handles both crew import and events import results
  const total = invited + skipped + errors.length + created
  const isEventImport = created > 0

  return (
    <div className="
      glass-card rounded-2xl
      bg-white/[0.03] border border-white/[0.08]
      backdrop-blur-md overflow-hidden
    ">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <span className="size-2 rounded-full bg-[#3b82f6]" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/30">
          Import Results
        </span>
      </div>

      {/* Summary */}
      <div className="p-4 space-y-3">
        {/* Success count */}
        {(invited > 0 || created > 0) && (
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="size-3 text-green-400" />
            </div>
            <span className="text-sm text-[#e8e9ed]">
              {isEventImport
                ? `${created} event${created !== 1 ? 's' : ''} created`
                : `${invited} invitation${invited !== 1 ? 's' : ''} sent`
              }
            </span>
          </div>
        )}

        {/* Skipped */}
        {skipped > 0 && (
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="size-3 text-yellow-400" />
            </div>
            <span className="text-sm text-white/50">
              {skipped} already existed (skipped)
            </span>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="size-6 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="size-3 text-red-400" />
              </div>
              <span className="text-sm text-red-300/70">
                {errors.length} error{errors.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="ml-8 space-y-1">
              {errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-[11px] text-red-300/40">{err}</p>
              ))}
              {errors.length > 5 && (
                <p className="text-[11px] text-white/20">
                  ...and {errors.length - 5} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <div className="text-center py-4">
            <Upload className="size-6 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/25">No data was imported</p>
          </div>
        )}
      </div>
    </div>
  )
}
